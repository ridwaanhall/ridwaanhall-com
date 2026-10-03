"use client";

import { useEffect, useRef, useState } from "react";

import { LineText } from "@/components/motion/interactive";
import { MessageText } from "@/components/site/guestbook/message-text";
import { AvatarFallback, PinIcon, RoleBadge } from "@/components/site/guestbook/role-badge";
import type { PinnedMessage } from "@/lib/data/guestbook-tree";

/**
 * One pinned-message card.
 *
 * The only definition of this markup. The client used to build the card itself
 * from JSON, which is what `addPinnedCard()`, `buildPinnedAvatarHtml()`,
 * `buildRoleBadgeHtml()` and a JS copy of the `linkify_message` filter all
 * existed for.
 *
 * The body is `line-clamp-2` with a "Read more" toggle rather than `truncate`,
 * so the whole message stays reachable from the card -- and the toggle appears
 * **only when the text is actually clamped**, which cannot be known from the
 * markup and is why this measures.
 */
export function PinnedCard({
  pinned,
  canPin,
  busy,
  onUnpin,
}: {
  pinned: PinnedMessage;
  canPin: boolean;
  busy: boolean;
  onUnpin: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    // Only meaningful while clamped; measuring an expanded element always says
    // it fits.
    if (expanded) return;
    setClamped(node.scrollHeight > node.clientHeight + 1);
  }, [expanded, pinned.message]);

  return (
    <div className="flex items-start gap-2.5">
      {pinned.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- see message.tsx
        <img
          src={pinned.profileImage}
          alt={pinned.fullName}
          width={28}
          height={28}
          loading="lazy"
          className="w-7 h-7 rounded-full bg-zinc-900 flex-shrink-0 object-cover"
        />
      ) : (
        <AvatarFallback className="w-7 h-7" glyph="w-3.5 h-3.5" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-medium text-zinc-300">{pinned.fullName}</span>
          <RoleBadge role={pinned.role} small />
        </div>
        <div
          ref={bodyRef}
          className={`font-serif text-sm text-zinc-400 ${expanded ? "" : "line-clamp-2"}`}
        >
          <MessageText text={pinned.message} />
        </div>
        {(clamped || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="type-meta mt-0.5 cursor-pointer rounded-full text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <LineText>{expanded ? "Show less" : "Read more"}</LineText>
          </button>
        )}
      </div>

      {canPin && (
        <button
          type="button"
          onClick={() => onUnpin(pinned.id)}
          disabled={busy}
          className="flex-shrink-0 rounded-full p-1.5 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          title="Unpin this message"
        >
          <PinIcon className="w-3.5 h-3.5 text-zinc-100" filled />
        </button>
      )}
    </div>
  );
}
