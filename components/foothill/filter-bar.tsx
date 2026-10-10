"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";

import { EASE, SPRING } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";

/**
 * The controls over a filtered list: one line, and the filters behind a button.
 *
 * Work had five rows of chips between the heading and the first project -- on
 * a phone, 610px of them, so the first screen was filters and nothing else.
 * What a reader reaches for every time stays on the line (search, sort, view);
 * the groups that narrow the list open from **Filters**, which carries how many
 * are applied. What is applied is also drawn outside the panel as removable
 * chips, so a closed menu never hides why the list is short, and a filter that
 * arrived in the address (`?status=`, `?skill=`) is visible and one press from
 * gone without opening anything.
 *
 * The panel starts closed on the server and the client alike. A list that
 * opened itself because of what was in the address would paint differently
 * from the page the server sent.
 */

export type ActiveFilter = {
  /** Unique among the applied filters. */
  key: string;
  /** "Kind: API" -- the group as well as the value, since the chip stands alone. */
  label: string;
  onRemove: () => void;
};

export function FilterBar({
  search,
  sort,
  view,
  active,
  onClear,
  children,
}: {
  /** The search form, drawn as the bar's first control. */
  search: React.ReactNode;
  /** The sort switch, without its label: the bar writes it. */
  sort?: React.ReactNode;
  view?: React.ReactNode;
  active: ActiveFilter[];
  onClear: () => void;
  /** The `FilterGroup`s that make up the panel. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="fbar">
        {search}
        <button
          ref={button}
          type="button"
          className="fbtn"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          <Icon name="sliders" size={14} />
          <span>Filters</span>
          {active.length > 0 && (
            <span className="n" aria-label={`${active.length} applied`}>
              {active.length}
            </span>
          )}
          <motion.span className="car" animate={{ rotate: open ? 180 : 0 }} transition={SPRING} aria-hidden="true">
            <Icon name="chev" size={13} />
          </motion.span>
        </button>
        {sort && (
          <span className="fb-sort">
            <span className="meta">Sort</span>
            {sort}
          </span>
        )}
        {view && <span className="fb-view">{view}</span>}
      </div>

      {active.length > 0 && (
        <div className="fsum" role="group" aria-label="Applied filters">
          <AnimatePresence initial={false}>
            {active.map((filter) => (
              <motion.button
                key={filter.key}
                type="button"
                className="chip rm"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2 }}
                onClick={filter.onRemove}
                aria-label={`Remove the filter ${filter.label}`}
              >
                <span>{filter.label}</span>
                <Icon name="x" size={12} />
              </motion.button>
            ))}
          </AnimatePresence>
          <button type="button" className="fclear" onClick={onClear}>
            Clear all
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            className="fpanel"
            role="group"
            aria-label="Filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.stopPropagation();
              setOpen(false);
              button.current?.focus();
            }}
          >
            <div className="fpanel-in">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** One heading and the chips under it, inside the panel. */
export function FilterGroup({ label, note, children }: { label: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="fgroup">
      <span className="meta">{label}</span>
      <div className="fgroup-body">
        {children}
        {note}
      </div>
    </div>
  );
}
