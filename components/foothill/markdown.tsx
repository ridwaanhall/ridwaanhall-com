"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { CopyButton, RetryButton, Seg } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";
import { Bar } from "@/components/foothill/skeleton";
import { useLockedPage } from "@/lib/motion/use-locked-page";
import { notify } from "@/lib/notify";
import { twinOf } from "@/lib/site/twins";

/*
 * Every page has a Markdown twin at its own path plus ".md" -- `/about` is
 * `/about.md`, the home page is `/index.md` -- and `/llms.txt` lists them
 * all. A reader finds them here: two quiet chips under every page title, and
 * a viewer that shows exactly the text an agent receives.
 */

const SITE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ridwaanhall.com";
const OPEN = "fh-markdown";

export const openMarkdown = (file: string) => window.dispatchEvent(new CustomEvent(OPEN, { detail: file }));

const fetchText = (file: string) =>
  fetch(file, { headers: { accept: "text/markdown, text/plain" } }).then((response) =>
    response.ok ? response.text() : Promise.reject(new Error(String(response.status))),
  );

export const copyMarkdown = (file: string) =>
  fetchText(file)
    .then((text) => navigator.clipboard.writeText(text))
    .then(
      () => notify("Page copied as Markdown", "success"),
      () => notify("The page could not be copied", "error"),
    );

/** The twin's path, which opens it, and Copy as Markdown, for pasting a page into a chat. */
export function MarkdownChips({ path }: { path: string }) {
  const file = twinOf(path);
  return (
    <div className="page-md">
      <button
        type="button"
        className="md-chip"
        onClick={() => openMarkdown(file)}
        title="The same page as plain Markdown, for language models and anything that wants text"
      >
        <Icon name="md" size={15} />
        <span className="mono">{file}</span>
      </button>
      <button type="button" className="md-chip" onClick={() => copyMarkdown(file)}>
        <Icon name="copy" size={14} />
        Copy as Markdown
      </button>
    </div>
  );
}

/** A link inside a twin is relative to that twin, as it is on the site. */
const resolve = (from: string, to: string) => {
  if (to.startsWith("/")) return to;
  const at = from.split("/").slice(0, -1);
  for (const part of to.split("/")) {
    if (part === "..") at.pop();
    else if (part !== ".") at.push(part);
  }
  return at.join("/") || "/";
};

/** The path of an address on this site, or null for anywhere else. Compared by origin: a prefix test passes ridwaanhall.com.evil.example. */
function sameSite(href: string): string | null {
  try {
    const url = new URL(href);
    return url.origin === new URL(SITE).origin ? url.pathname : null;
  } catch {
    return null;
  }
}

const LINK = /(\[[^\]]+\]\([^)\s]+\))/g;
const ONE_LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

function Line({ text, kind, file, go }: { text: string; kind: string; file: string; go: (to: string) => void }) {
  return (
    <span className={kind || undefined}>
      {text.split(LINK).map((part, index) => {
        const link = part.match(ONE_LINK);
        if (!link) return part;
        const [, , href] = link;
        if (/^https?:/.test(href)) {
          const local = sameSite(href);
          if (local && /\.(md|txt)$/.test(local))
            return (
              <button key={index} type="button" className="lk" onClick={() => go(local)}>
                {part}
              </button>
            );
          return (
            <a key={index} className="lk" href={href} target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          );
        }
        return (
          <button key={index} type="button" className="lk" onClick={() => go(resolve(file, href))}>
            {part}
          </button>
        );
      })}
      {"\n"}
    </span>
  );
}

/** Lines as an agent reads them, marked up only by weight and grey. */
function classify(text: string) {
  let frontMatter = 0;
  let code = false;
  return text
    .replace(/\n$/, "")
    .split("\n")
    .map((line, index) => {
      if (index === 0 && line === "---") {
        frontMatter = 1;
        return { line, kind: "fm" };
      }
      if (frontMatter === 1) {
        if (line === "---") frontMatter = 2;
        return { line, kind: "fm" };
      }
      if (line.startsWith("```")) {
        code = !code;
        return { line, kind: "code" };
      }
      if (code) return { line, kind: "code" };
      if (/^#{1,6} /.test(line)) return { line, kind: "h" };
      if (line.startsWith(">") || line.startsWith("<!--")) return { line, kind: "q" };
      return { line, kind: "" };
    });
}

/**
 * The viewer: the CV's dialog frame, holding the text as served, with its
 * size in kilobytes and tokens. A switch shows both ways to ask for it, by
 * the `.md` address and by `Accept: text/markdown` on the page's own URL.
 * Links inside a twin open the next twin in place.
 */
export function MarkdownViewer() {
  const [file, setFile] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);
  const [via, setVia] = useState<"url" | "accept">("url");
  const body = useRef<HTMLDivElement>(null);

  // Opening a file resets what the last one left behind, here rather than in
  // the effect that fetches it.
  const show = (next: string) => {
    setFile(next);
    setText(null);
    setFailed(false);
  };

  useEffect(() => {
    const onOpen = (event: Event) => show((event as CustomEvent<string>).detail);
    window.addEventListener(OPEN, onOpen);
    return () => window.removeEventListener(OPEN, onOpen);
  }, []);

  useLockedPage(Boolean(file), () => setFile(null));

  useEffect(() => {
    if (!file) return;
    let live = true;
    body.current?.scrollTo(0, 0);
    fetchText(file).then(
      (value) => live && setText(value),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [file, tries]);

  const index = file === "/llms.txt";
  const full = file === "/llms-full.txt";
  const page = file && !index && !full ? SITE + (file === "/index.md" ? "/" : file.replace(/\.md$/, "")) : null;
  const command = via === "accept" && page ? `curl -H "Accept: text/markdown" ${page}` : `curl ${SITE}${file ?? ""}`;
  const size = text ? (new Blob([text]).size / 1024).toFixed(1) : null;

  return (
    <AnimatePresence>
      {file && (
        <>
          <motion.div
            key="md-backdrop"
            className="backdrop"
            style={{ zIndex: 82 }}
            onClick={() => setFile(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            key="md"
            className="cv-view md-view"
            role="dialog"
            aria-modal="true"
            aria-label={`Markdown, ${file}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="cv-bar">
              <div style={{ minWidth: 0 }}>
                <b>{index ? "llms.txt, the index for language models" : full ? "llms-full.txt, every page in one file" : "This page as Markdown"}</b>
                <span className="meta mono">
                  {file}
                  {text && size ? ` · ${size} KB · about ${Math.round(text.length / 4).toLocaleString("en-US")} tokens` : ""}
                </span>
              </div>
              <div className="cv-tools">
                {text && <CopyButton sm text={text} label="Copy" />}
                {!index && (
                  <button type="button" className="btn ghost sm" onClick={() => show("/llms.txt")}>
                    <Icon name="list" />
                    llms.txt
                  </button>
                )}
                {index && (
                  <button type="button" className="btn ghost sm" onClick={() => show("/llms-full.txt")}>
                    <Icon name="layers" />
                    Full text
                  </button>
                )}
                <a className="btn ghost sm" href={file} target="_blank" rel="noopener">
                  <Icon name="out" />
                  Raw
                </a>
              </div>
              <button type="button" className="ib cv-close" onClick={() => setFile(null)} aria-label="Close the Markdown">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="md-body" ref={body}>
              <div className="md-req">
                {page && (
                  <Seg
                    id="md-via"
                    value={via}
                    onChange={setVia}
                    items={[
                      ["url", "By URL"],
                      ["accept", "By header"],
                    ]}
                  />
                )}
                <code aria-label="How an agent asks for this">{command}</code>
              </div>
              {failed ? (
                <div style={{ maxWidth: 560, margin: "40px auto" }}>
                  <div className="empty">
                    <span className="empty-ic">
                      <Icon name="file" className="draw" />
                    </span>
                    <div style={{ display: "grid", gap: 4 }}>
                      <b>The Markdown did not load</b>
                      <span className="meta">The page itself is fine. Open the raw file in a new tab, or try again.</span>
                    </div>
                    <div className="empty-act">
                      <RetryButton
                        onRetry={() => {
                          setFailed(false);
                          setTries((count) => count + 1);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : text == null ? (
                <div className="md-sk" aria-busy="true">
                  {[46, 88, 72, 94, 30, 84, 66, 91, 58, 40, 86, 74, 92, 52].map((width, i) => (
                    <Bar key={i} w={`${width}%`} h={i === 0 ? 20 : 13} />
                  ))}
                </div>
              ) : (
                <pre className="md-src">
                  {classify(text).map(({ line, kind }, i) => (
                    <Line key={i} text={line} kind={kind} file={file} go={show} />
                  ))}
                </pre>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
