"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { AboutData } from "@/lib/data/about";
import { EASE, gsap, MOTION_OK } from "@/lib/motion/gsap";
import { NAV_ITEMS } from "@/lib/nav";
import { socialLinks } from "@/lib/site/display";
import { cn } from "@/lib/utils/cn";
import { startPageLoading } from "@/lib/utils/page-loading";

type Entry = {
  id: string;
  label: string;
  hint: string;
  href: string;
  external: boolean;
  keywords: string;
};

type Section = { title: string; entries: Entry[] };

type SearchPayload = {
  data: {
    posts: { title: string; slug: string; keywords: string }[];
    projects: { title: string; slug: string; keywords: string }[];
  };
};

type PaletteApi = { open: () => void; close: () => void };

const PaletteContext = createContext<PaletteApi>({ open: () => {}, close: () => {} });

export const usePalette = () => useContext(PaletteContext);

function staticSections(about: AboutData): Section[] {
  const pages: Entry[] = [
    ...NAV_ITEMS.map(({ label, href }) => ({ label, href: href as string })),
    { label: "Privacy policy", href: "/privacy-policy" },
    { label: "Terms", href: "/terms" },
  ].map(({ label, href }) => ({
    id: `page:${href}`,
    label,
    hint: href,
    href,
    external: false,
    keywords: `${label} ${href}`.toLowerCase(),
  }));

  const socials: Entry[] = socialLinks(about).map(({ label, href }) => ({
    id: `social:${label}`,
    label,
    hint: href.replace(/^https?:\/\//, ""),
    href,
    external: true,
    keywords: `${label} ${href}`.toLowerCase(),
  }));
  if (about.social_media.email) {
    socials.unshift({
      id: "social:email",
      label: "Email",
      hint: about.social_media.email,
      href: `mailto:${about.social_media.email}`,
      external: true,
      keywords: `email mail ${about.social_media.email}`,
    });
  }

  const links: Entry[] = [
    { label: "CV", href: "/cv", hint: "The full CV" },
    { label: "CV, latest", href: "/cv-latest", hint: "The most recent edit" },
    { label: "CV, make a copy", href: "/cv-copy", hint: "A copy you can edit" },
  ].map((entry) => ({
    id: `link:${entry.href}`,
    external: false,
    keywords: `${entry.label} cv resume ${entry.hint}`.toLowerCase(),
    ...entry,
  }));
  const support = about.donate[2];
  if (support?.url) {
    links.push({
      id: "link:support",
      label: "Support my work",
      hint: support.platform,
      href: support.url,
      external: true,
      keywords: `support donate sponsor ${support.platform}`.toLowerCase(),
    });
  }

  return [
    { title: "Pages", entries: pages },
    { title: "Socials", entries: socials },
    { title: "Links", entries: links },
  ];
}

/**
 * The command palette, and the context that opens it.
 *
 * ⌘K or Ctrl+K from anywhere on the site. Posts and projects come from
 * `/api/search` the first time it opens rather than in every page's payload:
 * eighty-odd titles most readers never ask for.
 *
 * The ids, the `highlighted` class on the active row and the uppercase
 * section titles are what `scripts/check-ui-state.mjs` drives it by.
 */
export function PaletteProvider({ about, children }: { about: AboutData; children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, open, close]);

  const api = useMemo(() => ({ open, close }), [open, close]);

  return (
    <PaletteContext.Provider value={api}>
      {children}
      {isOpen && <Palette about={about} onClose={close} />}
    </PaletteContext.Provider>
  );
}

// Fetched once per document, shared by every opening after the first.
let contentCache: Section[] | null = null;

function Palette({ about, onClose }: { about: AboutData; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [content, setContent] = useState<Section[] | null>(contentCache);
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const openedAt = useRef(pathname);

  useEffect(() => {
    input.current?.focus();
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from(backdrop.current, { autoAlpha: 0, duration: 0.25 });
      gsap.from(panel.current, { y: -12, autoAlpha: 0, duration: 0.35, ease: EASE });
    });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      mm.revert();
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (contentCache) return;
    let live = true;
    fetch("/api/search")
      .then((response) => (response.ok ? (response.json() as Promise<SearchPayload>) : null))
      .then((payload) => {
        if (!payload || !live) return;
        contentCache = [
          {
            title: "Posts",
            entries: payload.data.posts.map((post) => ({
              id: `post:${post.slug}`,
              label: post.title,
              hint: "Writing",
              href: `/blog/${post.slug}`,
              external: false,
              keywords: `${post.title} ${post.keywords}`.toLowerCase(),
            })),
          },
          {
            title: "Projects",
            entries: payload.data.projects.map((project) => ({
              id: `project:${project.slug}`,
              label: project.title,
              hint: "Work",
              href: `/projects/${project.slug}`,
              external: false,
              keywords: `${project.title} ${project.keywords}`.toLowerCase(),
            })),
          },
        ];
        setContent(contentCache);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // A navigation closes the palette: it has done its job.
  useEffect(() => {
    if (pathname !== openedAt.current) onClose();
  }, [pathname, onClose]);

  const sections = useMemo(() => {
    const [pages, socials, links] = staticSections(about);
    const all = [pages, ...(content ?? []), socials, links];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return all;
    return all
      .map((section) => ({
        ...section,
        entries: section.entries.filter((entry) => terms.every((term) => entry.keywords.includes(term))),
      }))
      .filter((section) => section.entries.length > 0);
  }, [about, content, query]);

  const flat = useMemo(() => sections.flatMap((section) => section.entries), [sections]);

  const go = useCallback(
    (entry: Entry) => {
      if (entry.external) {
        window.open(entry.href, "_blank", "noopener,noreferrer");
        onClose();
        return;
      }
      startPageLoading();
      router.push(entry.href as Route);
    },
    [router, onClose],
  );

  useEffect(() => {
    list.current?.querySelector("li.highlighted")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (flat.length ? (index + 1) % flat.length : -1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (flat.length ? (index <= 0 ? flat.length - 1 : index - 1) : -1));
    } else if (event.key === "Enter") {
      const entry = flat[active];
      if (entry) {
        event.preventDefault();
        go(entry);
      }
    } else if (event.key === "Tab") {
      // The dialog holds focus: the input is the only stop in it.
      event.preventDefault();
    }
  };

  let index = -1;

  return (
    <div
      id="search-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Search the site"
      className="fh-site fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]"
      onKeyDown={onKeyDown}
    >
      <div
        id="search-modal-backdrop"
        ref={backdrop}
        className="absolute inset-0 bg-[var(--fh-scrim)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        id="search-modal-content"
        ref={panel}
        className="relative flex max-h-[70vh] w-full max-w-[620px] flex-col overflow-hidden rounded-lg border border-line bg-paper text-ink"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-mute" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5 L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(event.target.value.trim() ? 0 : -1);
            }}
            placeholder="Search pages, writing, work…"
            aria-label="Search"
            className="h-14 w-full bg-transparent text-[17px] text-ink outline-none placeholder:text-mute"
          />
          <kbd className="fh-mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-mute">ESC</kbd>
        </div>
        <div ref={list} className="overflow-y-auto overscroll-contain px-2 py-2">
          {sections.length === 0 && (
            <p className="px-3 py-10 text-center text-[15px] text-mute">
              Nothing matches &ldquo;{query}&rdquo;. Try fewer words.
            </p>
          )}
          {sections.map((section) => (
            <div key={section.title} className="py-1.5">
              <h2 className="fh-mono px-3 pt-2 pb-1.5 text-[10px] tracking-[0.16em] text-mute uppercase">
                {section.title}
              </h2>
              <ul>
                {section.entries.map((entry) => {
                  index += 1;
                  const mine = index;
                  return (
                    <li
                      key={entry.id}
                      onMouseEnter={() => setActive(mine)}
                      onClick={() => go(entry)}
                      className={cn(
                        "flex cursor-pointer items-baseline justify-between gap-4 rounded-md px-3 py-2.5 text-[15px]",
                        mine === active && "highlighted bg-raise",
                      )}
                    >
                      <span className="truncate">{entry.label}</span>
                      <span className="fh-mono shrink-0 truncate text-[11px] text-mute">
                        {entry.external ? `${entry.hint} ↗` : entry.hint}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {!content && !query && (
            <p className="fh-mono px-3 py-3 text-[11px] text-mute">Loading writing and work…</p>
          )}
        </div>
      </div>
    </div>
  );
}
