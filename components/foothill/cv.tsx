"use client";

import { AnimatePresence, motion } from "motion/react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

import { RetryButton } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";
import { useLockedPage } from "@/lib/motion/use-locked-page";
import { CV_FILE } from "@/lib/site/cv";

/*
 * The CV, shown inside the page.
 *
 * It is a PDF generated from the About page (`app/cv.pdf/route.tsx`), drawn
 * here with pdf.js, which paints each page itself -- so it works where a
 * browser's own PDF viewer is blocked or hands the file to a download. pdf.js
 * is loaded the first time a CV is asked for, never with the page, and its
 * worker is served from this origin like any other script.
 */

const OPEN = "fh-cv";

export const openCv = () => window.dispatchEvent(new Event(OPEN));

let library: Promise<typeof import("pdfjs-dist")> | null = null;
const loadPdf = () =>
  (library ??= import("pdfjs-dist").then((pdf) => {
    pdf.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    return pdf;
  })).catch((error) => {
    library = null;
    throw error;
  });

let documentPromise: Promise<PDFDocumentProxy> | null = null;
const loadCv = () =>
  (documentPromise ??= loadPdf().then((pdf) => pdf.getDocument({ url: CV_FILE }).promise)).catch((error) => {
    documentPromise = null;
    throw error;
  });

/** Draw one page into a canvas at `width` CSS pixels, sharp on a dense screen. */
async function draw(doc: PDFDocumentProxy, number: number, canvas: HTMLCanvasElement, width: number) {
  const page = await doc.getPage(number);
  const base = page.getViewport({ scale: 1 });
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: (width / base.width) * ratio });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(viewport.width / ratio)}px`;
  canvas.style.height = `${Math.floor(viewport.height / ratio)}px`;
  await page.render({ canvas, viewport }).promise;
}

/**
 * The viewer: zoom from 50% to 200% (also with + and -), a page count that
 * follows the scroll, Open the PDF, and Escape to close.
 */
export function CvViewer({ generated }: { generated?: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(1);
  const [pages, setPages] = useState(2);
  const [tries, setTries] = useState(0);
  const [available, setAvailable] = useState(900);
  const body = useRef<HTMLDivElement>(null);
  const doc = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setState("loading");
      setCurrent(1);
    };
    window.addEventListener(OPEN, onOpen);
    return () => window.removeEventListener(OPEN, onOpen);
  }, []);

  useLockedPage(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "+" || event.key === "=") setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)));
      if (event.key === "-") setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The column the pages are drawn into, measured rather than read during render.
  useEffect(() => {
    const box = body.current;
    if (!open || !box) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(box);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let dead = false;
    loadCv().then(
      (loaded) => {
        if (dead) return;
        doc.current = loaded;
        setPages(loaded.numPages);
        setState("ready");
      },
      () => !dead && setState("error"),
    );
    return () => {
      dead = true;
    };
  }, [open, tries]);

  useEffect(() => {
    if (state !== "ready" || !body.current || !doc.current) return;
    let dead = false;
    const width = Math.min(body.current.clientWidth - 32, 860) * zoom;
    (async () => {
      for (let n = 1; n <= doc.current!.numPages; n++) {
        const canvas = body.current?.querySelector<HTMLCanvasElement>(`canvas[data-p="${n}"]`);
        if (!canvas || dead) return;
        await draw(doc.current!, n, canvas, width);
        canvas.parentElement?.classList.add("ready");
      }
    })().catch(() => !dead && setState("error"));
    return () => {
      dead = true;
    };
  }, [state, zoom, pages]);

  const onScroll = () => {
    const box = body.current;
    if (!box) return;
    const sheets = Array.from(box.querySelectorAll<HTMLElement>(".cv-page"));
    const middle = box.scrollTop + box.clientHeight / 2;
    const at = sheets.findIndex((sheet) => sheet.offsetTop + sheet.offsetHeight > middle);
    setCurrent(at < 0 ? sheets.length : at + 1);
  };

  const sheetWidth = Math.min(available, 860) * zoom;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cv-backdrop"
            className="backdrop"
            style={{ zIndex: 82 }}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            key="cv"
            className="cv-view"
            role="dialog"
            aria-modal="true"
            aria-label="Curriculum vitae, PDF"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="cv-bar">
              <div style={{ minWidth: 0 }}>
                <b>Curriculum vitae</b>
                <span className="meta">
                  {pages} pages, A4{generated ? ` · generated from About on ${generated}` : " · generated from About"}
                </span>
              </div>
              <div className="cv-tools">
                <span className="seg cv-zoom">
                  <button type="button" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label="Zoom out" disabled={zoom <= 0.5}>
                    <Icon name="minus" size={14} />
                  </button>
                  <button type="button" onClick={() => setZoom(1)} aria-label="Fit to width" className="mono">
                    {Math.round(zoom * 100)}%
                  </button>
                  <button type="button" onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))} aria-label="Zoom in" disabled={zoom >= 2}>
                    <Icon name="plus" size={14} />
                  </button>
                </span>
                <span className="mono mute cv-pg" aria-live="polite">
                  {current} / {pages}
                </span>
                <a className="btn ghost sm" href={CV_FILE} target="_blank" rel="noopener">
                  <Icon name="out" />
                  Open the PDF
                </a>
              </div>
              <button type="button" className="ib cv-close" onClick={() => setOpen(false)} aria-label="Close the CV">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="cv-body" ref={body} onScroll={onScroll}>
              {state === "error" ? (
                <div style={{ maxWidth: 560, margin: "40px auto" }}>
                  <div className="empty">
                    <span className="empty-ic">
                      <Icon name="file" className="draw" />
                    </span>
                    <div style={{ display: "grid", gap: 4 }}>
                      <b>The CV could not be shown here</b>
                      <span className="meta">The PDF itself is fine; this viewer could not load. Open it in a new tab instead, or try again.</span>
                    </div>
                    <div className="empty-act">
                      <a className="btn sm" href={CV_FILE} target="_blank" rel="noopener">
                        <Icon name="out" />
                        Open the PDF
                      </a>
                      <RetryButton
                        onRetry={() => {
                          setState("loading");
                          setTries((n) => n + 1);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                Array.from({ length: pages }, (_, i) => (
                  <div key={i} className="cv-page" style={{ width: sheetWidth }}>
                    <canvas data-p={i + 1} aria-label={`Page ${i + 1} of ${pages}`} role="img" />
                    <span className="skb cv-sk" />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Page one of the CV, drawn small, for About. pdf.js loads once it is near the screen. */
export function CvThumb() {
  const box = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"wait" | "ready" | "error">("wait");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        try {
          const loaded = await loadCv();
          const canvas = el.querySelector("canvas");
          if (canvas) await draw(loaded, 1, canvas, el.clientWidth);
          setState("ready");
        } catch {
          setState("error");
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button type="button" className={`cv-thumb ${state}`} onClick={openCv} aria-label="Read the CV here">
      <span ref={box} className="cv-thumb-in">
        <canvas aria-hidden="true" />
        {state !== "ready" && <span className="skb" />}
      </span>
      <span className="cv-thumb-cta">
        <Icon name="eye" size={15} />
        Read it here
      </span>
    </button>
  );
}

/** A button that opens the viewer, for a server page that cannot pass a handler. */
export function CvButton({ ghost, sm, label = "Read the CV", icon = "file" }: { ghost?: boolean; sm?: boolean; label?: string; icon?: "file" | "eye" }) {
  return (
    <button type="button" className={`btn${ghost ? " ghost" : ""}${sm ? " sm" : ""}`} onClick={openCv}>
      <Icon name={icon} />
      {label}
    </button>
  );
}

/** "Read it here", as a row in About's contents column. */
export function CvTocAction() {
  return (
    <button type="button" className="toc-act" onClick={openCv}>
      <Icon name="eye" size={14} />
      Read it here
    </button>
  );
}
