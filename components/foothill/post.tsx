"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { Disclosure, SPRING } from "@/components/foothill/controls";
import { notify } from "@/lib/notify";

type Entry = { id: string; label: string };

const LINK_PATH =
  "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7";

/**
 * A post's contents: beside the text on a wide screen, folded above it on a
 * phone. The marker slides to the section being read.
 */
export function PostContents({ entries }: { entries: Entry[] }) {
  const [current, setCurrent] = useState(entries[0]?.id ?? "");
  const reduce = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (seen) => seen.forEach((entry) => entry.isIntersecting && setCurrent(entry.target.id)),
      { rootMargin: "-20% 0px -70% 0px" },
    );
    entries.forEach(({ id }) => {
      const heading = document.getElementById(id);
      if (heading) observer.observe(heading);
    });
    return () => observer.disconnect();
  }, [entries]);

  const go = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 90, behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  const list = (group: string) => (
    <LayoutGroup id={group}>
      {entries.map(({ id, label }) => (
        <a key={id} href={`#${id}`} className={current === id ? "on" : undefined} onClick={go(id)}>
          {current === id && <motion.span className="mark" layoutId={`${group}-mark`} transition={SPRING} />}
          {label}
        </a>
      ))}
    </LayoutGroup>
  );

  return (
    <>
      <div className="ptoc-m">
        <Disclosure
          label={
            <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span>On this page</span>
              <span className="mono mute">{entries.length}</span>
            </span>
          }
        >
          <nav className="ptoc" aria-label="On this page">
            {list("ptoc-m")}
          </nav>
        </Disclosure>
      </div>
      <aside className="ptoc-d">
        <nav className="ptoc" aria-label="On this page">
          <span className="mono mute" style={{ padding: "0 12px 8px", fontSize: 11.5 }}>
            On this page
          </span>
          {list("ptoc-d")}
        </nav>
      </aside>
    </>
  );
}

/**
 * The article's own tools, added to the rendered body once it is on the
 * page: a button beside each section heading that copies a link to it, and
 * Copy on every code block. The body is stored HTML rendered once by the
 * server, so these are added to it rather than rendered into it.
 */
export function ArticleTools({ target, url }: { target: string; url: string }) {
  useEffect(() => {
    const root = document.querySelector(target);
    if (!root) return;
    const added: HTMLElement[] = [];

    root.querySelectorAll<HTMLHeadingElement>("h2[id]").forEach((heading) => {
      if (heading.querySelector(".hanchor")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hanchor";
      button.setAttribute("aria-label", `Copy a link to “${heading.textContent?.trim()}”`);
      button.innerHTML = `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${LINK_PATH}"/></svg>`;
      button.onclick = () =>
        navigator.clipboard?.writeText(`${url}#${heading.id}`).then(
          () => notify("Link to this section copied", "success"),
          () => notify("The clipboard is not available here", "error"),
        );
      heading.appendChild(button);
      added.push(button);
    });

    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.parentElement?.classList.contains("codewrap")) return;
      const wrap = document.createElement("div");
      wrap.className = "codewrap";
      pre.before(wrap);
      wrap.appendChild(pre);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copycode";
      button.textContent = "Copy";
      button.onclick = () =>
        navigator.clipboard?.writeText(pre.textContent ?? "").then(() => {
          button.textContent = "Copied";
          notify("Code copied", "success");
          setTimeout(() => (button.textContent = "Copy"), 1600);
        });
      wrap.appendChild(button);
      added.push(wrap);
    });

    return () => {
      added.forEach((el) => {
        if (el.classList.contains("codewrap")) {
          const pre = el.querySelector("pre");
          if (pre) el.before(pre);
        }
        el.remove();
      });
    };
  }, [target, url]);

  return null;
}
