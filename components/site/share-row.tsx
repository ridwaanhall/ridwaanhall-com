"use client";

import { useState } from "react";

/**
 * Share row for a post.
 *
 * The labels are plain `title` attributes, not absolutely-positioned
 * group-hover chips. A chip is hover-only, so on a phone none of these five
 * buttons said what they did; `title` is upgraded by the tooltip handler and
 * works on touch. It also drops five copies of the same long class string.
 *
 * The copy button keeps its own success chip: that is *feedback* rather than a
 * label, it is driven by state and so already worked on touch, and it wants the
 * green treatment a tooltip should not have.
 */
export function ShareRow({
  url,
  title,
  description,
}: {
  url: string;
  title: string;
  description: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access is refused in some contexts; the chip would then be a
      // lie, so it is only shown on success.
      return;
    }
    setCopied(true);
    // Raise the same event copyToClipboard.js did, so an open tooltip closes --
    // the chip occupies the same spot as the "Copy link" label, which on touch
    // is on a timer.
    document.dispatchEvent(new CustomEvent("tooltip:hide"));
    window.setTimeout(() => setCopied(false), 2000);
  };

  const e = encodeURIComponent;

  return (
    <>
      <ShareLink
        href={`https://twitter.com/intent/tweet?url=${e(url)}&text=${e(title)}`}
        label="Share on Twitter/X"
        tooltip="Share on Twitter"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </ShareLink>

      <ShareLink
        href={`https://www.facebook.com/sharer/sharer.php?u=${e(url)}`}
        label="Share on Facebook"
        tooltip="Share on Facebook"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </ShareLink>

      <ShareLink
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`}
        label="Share on LinkedIn"
        tooltip="Share on LinkedIn"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </ShareLink>

      <ShareLink
        href={`mailto:?subject=${e(title)}&body=${e(description)}%0A%0A${e(url)}`}
        label="Share via Email"
        tooltip="Share via Email"
        external={false}
      >
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
      </ShareLink>

      <button
        type="button"
        onClick={copy}
        className="icon-btn group relative cursor-pointer"
        aria-label="Copy link to clipboard"
        title="Copy link"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="text-zinc-300 group-hover:text-white"
          aria-hidden="true"
        >
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </svg>
        {copied && (
          <span
            className="absolute left-1/2 -translate-x-1/2 -bottom-7 whitespace-nowrap rounded bg-green-900/90 px-2 py-0.5 text-xs text-green-300"
            role="status"
          >
            Copied
          </span>
        )}
      </button>
    </>
  );
}

function ShareLink({
  href,
  label,
  tooltip,
  external = true,
  children,
}: {
  href: string;
  label: string;
  tooltip: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="icon-btn group"
      aria-label={label}
      title={tooltip}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        fill="currentColor"
        viewBox="0 0 24 24"
        className="text-zinc-300 group-hover:text-white"
        aria-hidden="true"
      >
        {children}
      </svg>
    </a>
  );
}
