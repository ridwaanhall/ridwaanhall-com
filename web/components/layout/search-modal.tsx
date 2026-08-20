"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";

import {
  CvCopyIcon,
  CvPdfIcon,
  CvWordIcon,
  EmailIcon,
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  ModalSearchIcon,
  PrivacyIcon,
  SupportIcon,
  TermsIcon,
  XIcon,
} from "@/components/icons/link-icons";
import { NAV_ITEMS } from "@/lib/nav";
import type { AboutData } from "@/lib/data/about";
import { cn } from "@/lib/utils/cn";

type Section = "Pages" | "Socials" | "Links";

type SearchEntry = {
  label: string;
  /** Extra words the entry should match on, beyond its label. */
  keywords: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  section: Section;
} & (
  // An internal destination is a typed route, so a link that stops existing is
  // a build error rather than a 404 someone finds later. External ones are
  // arbitrary URLs out of the database and cannot be checked.
  { external: true; href: string } | { external?: false; href: Route }
);

const SearchModalContext = createContext<{ open: () => void; close: () => void } | null>(null);

export function useSearchModal() {
  const ctx = useContext(SearchModalContext);
  if (!ctx) throw new Error("useSearchModal must be used inside <SearchModalProvider>");
  return ctx;
}

/**
 * The ⌘K search palette.
 *
 * Django rendered nineteen hand-written `<li>` blocks -- about 380 lines --
 * with the filtering, section headers and keyboard navigation driven from
 * sidebarSearch.js by class name. Here the entries are data and the list is
 * derived, but the class names (`search-item`, `social-item`, `external-item`,
 * `highlighted`, and the `#search-modal` id) are kept exactly, because
 * styles/sidebarSearch.css targets them for the highlight wash and the modal's
 * custom scrollbar.
 */
export function SearchModalProvider({
  about,
  children,
}: {
  about: AboutData;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  // ⌘K / Ctrl+K toggles from anywhere. Escape closes; both are registered on
  // document so they work regardless of what has focus.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((wasOpen) => !wasOpen);
      } else if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SearchModalContext.Provider value={value}>
      {children}
      <SearchModal about={about} isOpen={isOpen} onClose={close} />
    </SearchModalContext.Provider>
  );
}

function buildEntries(about: AboutData): SearchEntry[] {
  const social = about.social_media;
  const entries: SearchEntry[] = [];

  for (const item of NAV_ITEMS) {
    entries.push({
      label: item.label,
      keywords: item.label.toLowerCase(),
      href: item.href,
      icon: item.icon,
      section: "Pages",
    });
  }

  entries.push(
    {
      label: "Privacy Policy",
      keywords: "privacy policy",
      href: "/privacy-policy",
      icon: PrivacyIcon,
      section: "Pages",
    },
    {
      label: "Terms of Service",
      keywords: "terms of service",
      href: "/terms",
      icon: TermsIcon,
      section: "Pages",
    },
  );

  const socials: [string, string, string, ComponentType<SVGProps<SVGSVGElement>>][] = [
    ["Email", "email", social.email ? `mailto:${social.email}` : "", EmailIcon],
    ["GitHub", "github", social.github, GitHubIcon],
    ["LinkedIn", "linkedin", social.linkedin, LinkedInIcon],
    ["Instagram", "instagram", social.instagram, InstagramIcon],
    ["X (Twitter)", "x twitter", social.x, XIcon],
  ];
  for (const [label, keywords, href, icon] of socials) {
    if (href) entries.push({ label, keywords, href, icon, section: "Socials", external: true });
  }

  // The third donate link is the sponsor URL the homepage also reads.
  const sponsor = about.donate[2]?.url;
  if (sponsor) {
    entries.push({
      label: "Support",
      keywords: "support github sponsor",
      href: sponsor,
      icon: SupportIcon,
      section: "Links",
      external: true,
    });
  }

  entries.push(
    {
      label: "CV PDF",
      keywords: "curriculum vitae cv resume pdf",
      href: "/cv",
      icon: CvPdfIcon,
      section: "Links",
    },
    {
      label: "CV Word",
      keywords: "curriculum vitae cv resume word",
      href: "/cv-latest",
      icon: CvWordIcon,
      section: "Links",
    },
    {
      label: "CV Copy",
      keywords: "curriculum vitae cv resume copy template",
      href: "/cv-copy",
      icon: CvCopyIcon,
      section: "Links",
    },
  );

  return entries;
}

const SECTION_ORDER: Section[] = ["Pages", "Socials", "Links"];
const SECTION_CLASS: Record<Section, string> = {
  Pages: "search-item",
  Socials: "social-item",
  Links: "external-item",
};

function SearchModal({
  about,
  isOpen,
  onClose,
}: {
  about: AboutData;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const entries = useMemo(() => buildEntries(about), [about]);

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter(
      (entry) => entry.keywords.includes(q) || entry.label.toLowerCase().includes(q),
    );
  }, [entries, query]);

  // Reset the query when the modal closes, and the highlight whenever the
  // query changes, by adjusting state during render. React supports this and
  // it avoids the extra render pass that setting state from an effect costs --
  // which React 19's lint rules now flag.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setQuery("");
    setHighlighted(0);
  }

  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setHighlighted(0);
  }

  // Focusing the field is a real DOM side effect, so it stays in an effect.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const activate = useCallback(
    (entry: SearchEntry) => {
      onClose();
      if (entry.href.startsWith("mailto:")) {
        window.location.href = entry.href;
      } else if (entry.external) {
        window.open(entry.href, "_blank", "noopener,noreferrer");
      } else {
        router.push(entry.href);
      }
    },
    [onClose, router],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (matches.length === 0) return;
      // Wraps at both ends, as the original did.
      setHighlighted((current) =>
        event.key === "ArrowDown"
          ? (current + 1) % matches.length
          : (current - 1 + matches.length) % matches.length,
      );
    } else if (event.key === "Enter") {
      const entry = matches[highlighted];
      if (entry) activate(entry);
    }
  };

  if (!isOpen) return null;

  // The keyboard highlight walks one flat list across all three sections, so
  // each entry needs its position in `matches`. Computed up front rather than
  // by incrementing a counter while rendering, which React 19 rejects as
  // reassignment after render completes.
  const indexOf = new Map(matches.map((entry, index) => [entry, index]));

  return (
    <div
      id="search-modal"
      className="fixed inset-0 z-50 transition-all duration-300 ease-out"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        id="search-modal-backdrop"
        className="flex min-h-full items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          id="search-modal-content"
          className="relative mx-auto max-w-xl w-full overflow-hidden rounded-xl border-2 border-zinc-800 bg-black ring-1 ring-black/5 transition-all duration-300 ease-out"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
            <ModalSearchIcon />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              className="h-14 w-full border-0 bg-transparent placeholder-zinc-400 focus:outline-none focus:ring-0"
              placeholder="Search pages, socials, or links..."
              type="text"
              autoComplete="off"
            />
          </div>

          <div className="max-h-80 overflow-y-auto px-1 py-2">
            {SECTION_ORDER.map((section) => {
              const sectionMatches = matches.filter((entry) => entry.section === section);
              if (sectionMatches.length === 0) return null;

              return (
                <div className="py-1" key={section}>
                  <div className="my-2 px-5 text-xs font-medium text-zinc-500">
                    {section.toUpperCase()}
                  </div>
                  <ul className="space-y-1">
                    {sectionMatches.map((entry) => {
                      const index = indexOf.get(entry) ?? -1;
                      const Icon = entry.icon;
                      return (
                        <li
                          key={`${entry.section}-${entry.label}`}
                          className={cn(
                            SECTION_CLASS[section],
                            index === highlighted && "highlighted",
                          )}
                          onMouseEnter={() => setHighlighted(index)}
                          onClick={() => activate(entry)}
                        >
                          <div className="text-zinc-300 group mx-2 flex cursor-pointer items-center justify-between gap-3 rounded-md px-4 py-2 hover:bg-zinc-800">
                            <div className="flex items-center gap-5">
                              <div className="transition-all duration-300 group-hover:-rotate-12">
                                <Icon />
                              </div>
                              <span>{entry.label}</span>
                            </div>
                            <div className="rounded-md border border-zinc-500 px-1.5 py-0.5 text-xs text-zinc-400">
                              {section === "Pages" ? "Pages" : "Link"}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {matches.length === 0 && (
              <div className="py-8 text-center">
                <div className="text-base">No results found</div>
                <div className="text-sm text-zinc-400 mt-1">Try searching for something else</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
