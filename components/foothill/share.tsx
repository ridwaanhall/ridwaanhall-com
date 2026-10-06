"use client";

import { useState } from "react";

import { Brand, Icon } from "@/components/foothill/icons";
import { notify } from "@/lib/notify";

const ROUND =
  "group flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line text-ink transition-[border-color,background-color,color] duration-300 hover:border-ink hover:bg-ink hover:text-paper";

/**
 * Pass a post on: copy its link, or hand it to a network. Plain links rather
 * than share widgets, so nothing third-party loads with the page.
 */
export function Share({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const targets = [
    { label: "X", mark: "x", href: `https://x.com/intent/post?url=${encoded}&text=${text}` },
    { label: "LinkedIn", mark: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { label: "Facebook", mark: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "Email", mark: "email", href: `mailto:?subject=${text}&body=${encoded}` },
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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <p className="text-[15px] font-medium text-ink">Share this</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="group inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-[14px] text-ink transition-colors hover:border-ink"
          aria-live="polite"
        >
          <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
          {copied ? "Link copied" : "Copy link"}
        </button>
        {targets.map((target) => (
          <a
            key={target.label}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={target.label === "Email" ? "Share by email" : `Share on ${target.label}`}
            title={target.label}
            className={ROUND}
          >
            <Brand name={target.mark} className="h-4 w-4 transition-transform duration-500 group-hover:scale-110" />
          </a>
        ))}
      </div>
    </div>
  );
}
