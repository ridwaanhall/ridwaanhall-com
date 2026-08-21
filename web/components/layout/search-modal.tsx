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
import { isActive, NAV_ITEMS } from "@/lib/nav";
import type { AboutData } from "@/lib/data/about";
import { cn } from "@/lib/utils/cn";

type Section = "Pages" | "Socials" | "Links";

type SearchEntry = {
  label: string;
  /** Extra words the entry should match on, beyond its label. */
  keywords: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  section: Section;
  /** Whether a nested path still counts as this page -- see `NavItem`. */
  matchNested?: boolean;
} & (
  // An internal destination is a typed route, so a link that stops existing is
  // a build error rather than a 404 someone finds later. External ones are
  // arbitrary URLs out of the database and cannot be checked.
  { external: true; href: string } | { external?: false; href: Route }
);

/** Must match the `duration-300` on the root and the panel. */
const EXIT_MS = 300;

/** No row marked -- the pointer left the list and is not on anything. */
const NO_HIGHLIGHT = -1;

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
      matchNested: item.matchNested,
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
  const pathname = usePathname();

  /**
   * Is this entry the page being viewed?
   *
   * Only the Pages section can be, and only its internal destinations -- the
   * socials and the CV links go somewhere else entirely. `isActive` is the same
   * predicate the sidebar's nav uses, so `/blog/<slug>/` marks Blog here for
   * the same reason it highlights Blog there; Django expressed that as
   * `url_name not in 'blog blog_detail'` in both places.
   */
  const isHere = useCallback(
    (entry: SearchEntry) =>
      !entry.external &&
      entry.section === "Pages" &&
      isActive({ href: entry.href, matchNested: entry.matchNested }, pathname),
    [pathname],
  );
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

  /*
   * The rows the keyboard can land on.
   *
   * The highlight is a promise about what Enter will do, so it skips the page
   * you are already on -- that row does nothing when clicked and nothing when
   * entered. Without this the palette opened on the homepage with the "You are
   * here" row wearing the highlight wash, advertising a keystroke that had no
   * effect. The original had no initial highlight at all, so the question did
   * not arise for it.
   */
  const navigable = useMemo(() => matches.filter((entry) => !isHere(entry)), [matches, isHere]);

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

  /*
   * The open and close transitions.
   *
   * `sidebarSearch.js` drove these through modalDialog.js: reveal the root,
   * then one tick later swap `backdrop-blur-none` for `backdrop-blur-md` and
   * the panel's `scale-95 opacity-0` for `scale-100 opacity-100`; on close,
   * reverse both and only apply `hidden` once the 300ms has elapsed. This port
   * had the transition classes on the markup but nothing ever changed, so the
   * palette simply appeared and vanished.
   *
   * `mounted` keeps the modal in the tree for the length of the exit, and
   * `shown` is what the classes read. The `requestAnimationFrame` is the same
   * beat as the original's 10ms timeout: the browser has to paint the closed
   * state once before there is anything to transition from.
   */
  const [mounted, setMounted] = useState(isOpen);
  const [shown, setShown] = useState(false);

  // Both entry points into a transition are adjustments during render, the
  // same pattern the query reset above uses: opening must put the modal in the
  // tree on this render, and closing must start the exit on this one. Setting
  // either from the effect body would be a cascading render, which React 19's
  // lint rejects. What genuinely belongs in an effect is the *timing* -- the
  // frame to paint the closed state before transitioning, and the wait for the
  // exit to finish -- so only those remain there.
  if (isOpen && !mounted) setMounted(true);
  if (!isOpen && shown) setShown(false);

  useEffect(() => {
    if (isOpen) {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // The page must not scroll behind the palette, as it did not before.
  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  // Focusing the field is a real DOM side effect, so it stays in an effect.
  // It waits on `mounted` rather than `isOpen`: the input does not exist on
  // the render that opens the modal.
  useEffect(() => {
    if (mounted && isOpen) inputRef.current?.focus();
  }, [mounted, isOpen]);

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
      if (navigable.length === 0) return;
      // Wraps at both ends, as the original did. `NO_HIGHLIGHT` is handled
      // explicitly rather than left to the modulo: `-1 - 1 + n` lands on the
      // second-to-last row, and the first press of Up from nothing should
      // reach the last.
      setHighlighted((current) => {
        if (current === NO_HIGHLIGHT) {
          return event.key === "ArrowDown" ? 0 : navigable.length - 1;
        }
        return event.key === "ArrowDown"
          ? (current + 1) % navigable.length
          : (current - 1 + navigable.length) % navigable.length;
      });
    } else if (event.key === "Enter") {
      const entry = navigable[highlighted];
      if (entry) activate(entry);
    }
  };

  if (!mounted) return null;

  // The keyboard highlight walks one flat list across all three sections, so
  // each entry needs its position in `matches`. Computed up front rather than
  // by incrementing a counter while rendering, which React 19 rejects as
  // reassignment after render completes.
  const indexOf = new Map(navigable.map((entry, index) => [entry, index]));

  return (
    <div
      id="search-modal"
      className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
        shown ? "backdrop-blur-md" : "backdrop-blur-none pointer-events-none"
      }`}
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
          className={`relative mx-auto max-w-xl w-full overflow-hidden rounded-xl border-2 border-zinc-800 bg-black ring-1 ring-black/5 transition-all duration-300 ease-out ${
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
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

          {/*
           * Taking the pointer off the list clears the highlight outright.
           *
           * Each row's `onMouseEnter` moves the keyboard highlight, and nothing
           * used to move it back -- so a hovered row wore two marks (the inner
           * div's `hover:bg-zinc-800` and the `li`'s `.highlighted` wash from
           * sidebarSearch.css), and leaving dropped only the first. The wash
           * that outlived it read as a stuck hover.
           *
           * An earlier version returned to index 0 instead, on the reasoning
           * that it is the state the palette opens in and keeps Enter pointing
           * somewhere. In use that is worse: moving the mouse away makes the
           * mark *jump to Home*, which looks like the palette selecting a row
           * on its own. Nothing highlighted is the honest answer -- the pointer
           * is not on anything.
           *
           * The highlight on *open* is untouched, so Ctrl+K, type, Enter still
           * works for anyone who never reaches for the mouse; typing resets it
           * to 0 as well. Only a deliberate hover-then-leave clears it, and an
           * arrow key brings it straight back.
           *
           * One handler on the container, not per row, so it fires when the
           * pointer leaves the list rather than on every row-to-row move.
           */}
          <div
            className="max-h-80 overflow-y-auto px-1 py-2"
            onMouseLeave={() => setHighlighted(NO_HIGHLIGHT)}
          >
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
                      /*
                       * The page you are already on is marked and inert. The
                       * original dropped the entry's `data-url`, which left the
                       * click handler with nowhere to go; here there is simply
                       * no handler. It also keeps the row's `cursor-pointer`,
                       * which the port does not -- the sidebar's own current
                       * item is a `role="button"` with no href and therefore no
                       * pointer cursor, and this was asked to match it.
                       */
                      const here = isHere(entry);
                      return (
                        <li
                          key={`${entry.section}-${entry.label}`}
                          className={cn(
                            SECTION_CLASS[section],
                            // `index >= 0` is load-bearing: a row that is not
                            // navigable -- the "You are here" one -- has no
                            // place in `navigable` and falls back to -1, which
                            // is the same value `NO_HIGHLIGHT` uses. Without
                            // this, clearing the highlight lit up the one row
                            // that leads nowhere.
                            index >= 0 && index === highlighted && "highlighted",
                          )}
                          onMouseEnter={here ? undefined : () => setHighlighted(index)}
                          onClick={here ? undefined : () => activate(entry)}
                          aria-current={here ? "page" : undefined}
                        >
                          <div
                            className={cn(
                              "text-zinc-300 group mx-2 flex items-center justify-between gap-3 rounded-md px-4 py-2",
                              here
                                ? "cursor-default bg-zinc-800"
                                : "cursor-pointer hover:bg-zinc-800",
                            )}
                          >
                            <div className="flex items-center gap-5">
                              <div
                                className={cn(
                                  "transition-all duration-300 group-hover:-rotate-12",
                                  here && "-rotate-12",
                                )}
                              >
                                <Icon />
                              </div>
                              <span>{entry.label}</span>
                            </div>
                            {here ? (
                              <span className="animate-pulse text-xs text-zinc-400">
                                You are here
                              </span>
                            ) : (
                              <div className="rounded-md border border-zinc-500 px-1.5 py-0.5 text-xs text-zinc-400">
                                {section === "Pages" ? "Pages" : "Link"}
                              </div>
                            )}
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
