"use client";

import { useState } from "react";

import { EYEBROW } from "@/components/foothill/classes";
import { notify } from "@/lib/notify";

/**
 * Pass a post on: copy its link, or hand it to a network. Plain links rather
 * than share widgets, so nothing third-party loads with the page.
 */
export function Share({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const targets = [
    { label: "X", href: `https://x.com/intent/post?url=${encoded}&text=${text}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "Email", href: `mailto:?subject=${text}&body=${encoded}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("The link could not be copied. Select it from the address bar instead.", "error");
    }
  };

  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
      <p className={EYEBROW}>Share</p>
      <button type="button" onClick={copy} className="cursor-pointer text-[15px] text-ink">
        <span className="fh-link">{copied ? "Link copied" : "Copy link"}</span>
      </button>
      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[15px] text-mute transition-colors hover:text-ink"
        >
          {target.label}
        </a>
      ))}
    </div>
  );
}
