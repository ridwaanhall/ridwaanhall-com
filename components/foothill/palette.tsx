"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Route } from "next";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { SPRING } from "@/components/foothill/controls";
import { openCv } from "@/components/foothill/cv";
import { Brand, Icon, type IconName } from "@/components/foothill/icons";
import { copyMarkdown, openMarkdown } from "@/components/foothill/markdown";
import { PAGE_ICON } from "@/components/foothill/navbar";
import type { AboutData } from "@/lib/data/about";
import { useLockedPage } from "@/lib/motion/use-locked-page";
import { visibleNavItems } from "@/lib/nav";
import { socialLinks } from "@/lib/site/display";
import { hasTwin, twinOf } from "@/lib/site/twins";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils/cn";
import { startPageLoading } from "@/lib/utils/page-loading";

type Row = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon?: IconName;
  brand?: string;
  /** Where it goes; an action has `run` instead. */
  href?: string;
  external?: boolean;
  run?: () => void;
  keywords: string;
};

type SearchPayload = {
  data: {
    posts: { title: string; slug: string; keywords: string }[];
    projects: { title: string; slug: string; keywords: string }[];
  };
};

type PaletteApi = { open: () => void; close: () => void; help: () => void };

const PaletteContext = createContext<PaletteApi>({ open: () => {}, close: () => {}, help: () => {} });

export const usePalette = () => useContext(PaletteContext);

/*
 * The palette remembers the last four things opened from it, in this browser
 * only; a reader who has opened nothing sees actions and suggestions instead.
 */
const RECENT_KEY = "fh-recent";
type Recent = Pick<Row, "id" | "label" | "hint" | "icon" | "brand" | "href" | "external">;
const readRecent = (): Recent[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as Recent[];
  } catch {
    return [];
  }
};
const remember = (row: Row) => {
  if (row.run || !row.href) return;
  try {
    const entry: Recent = { id: row.id, label: row.label, hint: row.hint, icon: row.icon, brand: row.brand, href: row.href, external: row.external };
    localStorage.setItem(RECENT_KEY, JSON.stringify([entry, ...readRecent().filter((r) => r.id !== row.id)].slice(0, 4)));
  } catch {
    // Storage refused (a private window): the palette simply forgets.
  }
};

/**
 * The search palette, the shortcuts dialog, and the keys that open them.
 *
 * Ctrl or Cmd K, or `/`, from anywhere on the site; `?` for the shortcuts.
 * Posts and projects come from `/api/search` the first time it opens rather
 * than in every page's payload: eighty-odd titles most readers never ask for.
 *
 * The ids, the `highlighted` class on the marked row and the section names are
 * what `scripts/check-ui-state.mjs` drives it by.
 */
export function PaletteProvider({ about, children }: { about: AboutData; children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setHelp(false);
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus?.();
  }, []);
  const showHelp = useCallback(() => {
    setOpen(false);
    setHelp(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) close();
        else open();
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "/") {
        event.preventDefault();
        open();
      } else if (event.key === "?") {
        event.preventDefault();
        showHelp();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, open, close, showHelp]);

  const api = useMemo(() => ({ open, close, help: showHelp }), [open, close, showHelp]);

  return (
    <PaletteContext.Provider value={api}>
      {children}
      <AnimatePresence>{isOpen && <Palette key="palette" about={about} onClose={close} onHelp={showHelp} />}</AnimatePresence>
      <Shortcuts open={help} onClose={() => setHelp(false)} />
    </PaletteContext.Provider>
  );
}

// Fetched once per document, shared by every opening after the first.
let contentCache: Row[] | null = null;

function staticRows(about: AboutData): Row[] {
  const pages: Row[] = [
    ...visibleNavItems().map(({ label, href }) => ({ label, href: href as string })),
    ...(about.is_open_to_work || about.is_hiring ? [{ label: "Open-hire", href: "/openhire" }] : []),
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
  ].map(({ label, href }) => ({
    id: `page:${href}`,
    group: "Pages",
    icon: PAGE_ICON[href] ?? "file",
    label,
    hint: href,
    href,
    keywords: `${label} ${href}`.toLowerCase(),
  }));

  const socials: Row[] = socialLinks(about).map(({ label, href }) => ({
    id: `social:${label}`,
    group: "Elsewhere",
    brand: label === "RoneAI" ? "website" : label,
    label,
    hint: href.replace(/^https?:\/\//, ""),
    href,
    external: true,
    keywords: `${label} ${href}`.toLowerCase(),
  }));

  const links: Row[] = [
    { label: "The CV, as a PDF", href: "/cv.pdf", hint: "Generated from About" },
    { label: "The CV in Google Docs", href: about.cv.latest || "/cv-latest", hint: "The editable version" },
  ].map((entry) => ({
    id: `link:${entry.href}`,
    group: "Links",
    icon: "file" as const,
    external: true,
    keywords: `${entry.label} cv resume ${entry.hint}`.toLowerCase(),
    ...entry,
  }));

  return [...pages, ...socials, ...links];
}

function Palette({ about, onClose, onHelp }: { about: AboutData; onClose: () => void; onHelp: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [content, setContent] = useState<Row[] | null>(contentCache);
  const [recent] = useState<Recent[]>(readRecent);
  const list = useRef<HTMLUListElement>(null);
  const openedAt = useRef(pathname);

  useLockedPage(true, onClose);

  useEffect(() => {
    if (contentCache) return;
    let live = true;
    fetch("/api/search")
      .then((response) => (response.ok ? (response.json() as Promise<SearchPayload>) : null))
      .then((payload) => {
        if (!payload || !live) return;
        contentCache = [
          ...payload.data.posts.map((post) => ({
            id: `post:${post.slug}`,
            group: "Posts",
            icon: "pen" as const,
            label: post.title,
            hint: "Writing",
            href: `/blog/${post.slug}`,
            keywords: `${post.title} ${post.keywords}`.toLowerCase(),
          })),
          ...payload.data.projects.map((project) => ({
            id: `project:${project.slug}`,
            group: "Projects",
            icon: "grid" as const,
            label: project.title,
            hint: "Work",
            href: `/projects/${project.slug}`,
            keywords: `${project.title} ${project.keywords}`.toLowerCase(),
          })),
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

  const email = about.social_media.email;
  const twin = hasTwin(pathname) ? twinOf(pathname) : null;
  const dark = resolvedTheme !== "light";
  const actions: Row[] = [
    ...(email
      ? [
          {
            id: "act:email",
            group: "Actions",
            label: "Copy email address",
            hint: email,
            icon: "copy" as const,
            run: () =>
              navigator.clipboard?.writeText(email).then(
                () => notify("Email address copied", "success"),
                () => notify("The clipboard is not available here", "error"),
              ),
            keywords: `copy email address ${email}`,
          },
        ]
      : []),
    {
      id: "act:theme",
      group: "Actions",
      label: dark ? "Switch to the light theme" : "Switch to the dark theme",
      icon: dark ? "sun" : "moon",
      run: () => setTheme(dark ? "light" : "dark"),
      keywords: "theme light dark mode",
    },
    { id: "act:cv", group: "Actions", label: "Read the CV", hint: "PDF", icon: "file", run: openCv, keywords: "read cv resume pdf" },
    ...(twin
      ? [
          { id: "act:md", group: "Actions", label: "View this page as Markdown", hint: twin, icon: "md" as const, run: () => openMarkdown(twin), keywords: "markdown md view page" },
          { id: "act:md-copy", group: "Actions", label: "Copy this page as Markdown", hint: "For a chat or an agent", icon: "copy" as const, run: () => copyMarkdown(twin), keywords: "markdown md copy page" },
        ]
      : []),
    { id: "act:llms", group: "Actions", label: "Open llms.txt", hint: "Every page, listed for language models", icon: "md", run: () => openMarkdown("/llms.txt"), keywords: "llms txt markdown index" },
    { id: "act:keys", group: "Actions", label: "Keyboard shortcuts", hint: "?", icon: "list", run: onHelp, keywords: "keyboard shortcuts keys help" },
  ];

  const rows = useMemo(() => {
    const everything = [...staticRows(about), ...(content ?? [])];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length) return [...actions, ...everything].filter((row) => terms.every((term) => row.keywords.includes(term))).slice(0, 60);
    const recents: Row[] = recent.map((r) => ({ ...r, group: "Recent", keywords: "" }));
    return [...recents, ...actions, ...everything];
    // Actions are rebuilt each render from the theme and the page; their
    // identity changing is not a reason to recompute the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [about, content, query, recent, dark, twin]);

  useEffect(() => {
    list.current?.querySelector("li.highlighted")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (row: Row) => {
    if (row.run) {
      onClose();
      row.run();
      return;
    }
    if (!row.href) return;
    remember(row);
    if (row.external) {
      window.open(row.href, "_blank", "noopener,noreferrer");
      onClose();
      return;
    }
    startPageLoading();
    router.push(row.href as Route);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (rows.length ? Math.min(index + 1, rows.length - 1) : -1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const row = rows[active];
      if (row) {
        event.preventDefault();
        go(row);
      }
    } else if (event.key === "Tab") {
      // The dialog holds focus: the input is the only stop in it.
      event.preventDefault();
    }
  };

  let group = "";

  return (
    <div id="search-modal" className="fh-site" role="dialog" aria-modal="true" aria-label="Search the site">
      <motion.div className="backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        className="palette"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={SPRING}
      >
        <label className="field">
          <Icon name="search" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(event.target.value.trim() ? 0 : -1);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, work, writing and actions"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-list"
            aria-activedescendant={rows[active] ? `pal-${active}` : undefined}
          />
          <kbd>Esc</kbd>
        </label>
        <ul id="pal-list" role="listbox" ref={list} aria-label="Results">
          {rows.length === 0 && (
            <li className="grp mute" role="presentation" style={{ padding: 20 }}>
              Nothing matches &ldquo;{query}&rdquo;. Try fewer words.
            </li>
          )}
          {rows.map((row, index) => {
            const head = row.group !== group ? ((group = row.group), row.group) : null;
            return (
              <Fragment key={`${row.group}:${row.id}`}>
                {head && (
                  <li className="grp mono mute" role="presentation">
                    {head}
                  </li>
                )}
                <li
                  role="option"
                  id={`pal-${index}`}
                  aria-selected={index === active}
                  className={cn(index === active && "highlighted")}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(-1)}
                  onClick={() => go(row)}
                >
                  <a
                    href={row.href ?? "#"}
                    onClick={(event) => event.preventDefault()}
                    tabIndex={-1}
                  >
                    {index === active && <motion.span className="hl" layoutId="pal-hl" transition={{ type: "spring", stiffness: 600, damping: 40 }} />}
                    {row.brand ? <Brand name={row.brand} /> : <Icon name={row.icon ?? "right"} />}
                    <span className="t">{row.label}</span>
                    <span className="mono mute">
                      {row.hint ?? ""}
                      {row.external && <Icon name="out" size={12} className="out-mark" />}
                    </span>
                  </a>
                </li>
              </Fragment>
            );
          })}
          {!content && !query && (
            <li className="grp mute" role="presentation">
              Loading writing and work…
            </li>
          )}
        </ul>
        <div className="foot-hint">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
            <kbd style={{ display: "inline-grid", placeItems: "center" }}>
              <Icon name="up" size={10} />
            </kbd>
            <kbd style={{ display: "inline-grid", placeItems: "center" }}>
              <Icon name="down" size={10} />
            </kbd>
            to move
          </span>
          <span>
            <kbd>Enter</kbd>to open
          </span>
          <span>
            <kbd>Esc</kbd>to close
          </span>
          <span style={{ marginLeft: "auto" }}>
            <kbd>?</kbd>shortcuts
          </span>
        </div>
      </motion.div>
    </div>
  );
}

const KEYS: [string[], string][] = [
  [["Ctrl", "K"], "Open search"],
  [["/"], "Open search"],
  [["?"], "Show these shortcuts"],
  [["Esc"], "Close search, the menu or a dialog"],
  [["Up", "Down"], "Move through search results"],
  [["Enter"], "Open the highlighted result"],
  [["Tab"], "Move between links and buttons"],
];

/** The shortcuts, in a small dialog that Escape and the close button dismiss. */
function Shortcuts({ open, onClose }: { open: boolean; onClose: () => void }) {
  useLockedPage(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fh-site" key="keys">
          <motion.div className="backdrop" style={{ zIndex: 80 }} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="keys-title"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={SPRING}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="keys-title" className="t3">
                Keyboard shortcuts
              </h2>
              <button type="button" className="ib" onClick={onClose} aria-label="Close" autoFocus>
                <Icon name="x" size={18} />
              </button>
            </div>
            <dl className="keys">
              {KEYS.map(([keys, label]) => (
                <div key={label + keys.join()}>
                  <dt>
                    {keys.map((key) => (
                      <kbd key={key}>{key}</kbd>
                    ))}
                  </dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
