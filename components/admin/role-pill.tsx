import { ROLE_BLURB, ROLE_LABEL, type SiteRole } from "@/lib/auth/roles";

/**
 * What role somebody holds, said once, in the admin's own voice.
 *
 * The topbar used to carry a comment explaining why there was no such badge:
 * "there is one privilege, so a badge every staff account carries would mark
 * nobody out". That was true when `is_staff` was the whole permission system.
 * It stopped being true when `is_superuser` and per-screen grants shipped --
 * there are two roles now, they reach very different things, and the admin was
 * the only place that never said which one you were.
 *
 * No `"use client"` and no hooks, so the server topbar and the client rail can
 * both render it. That matters: a component that needed to be a client one
 * would make `admin-topbar.tsx` a client file, and the sign-out server action
 * lives inline in that file.
 *
 * **Every class written out.** Tailwind emits only what it can see in the
 * source, so a variant built by composing a hue produces no rule at all -- the
 * same reason `status-badges.tsx` and `account-panel.tsx` spell theirs out.
 * Zinc and indigo only, which `styles/theme-light.css` remaps wholesale, so
 * light mode needs nothing here.
 */
const SHAPE =
  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.6875rem] leading-tight";

/**
 * Indigo for the role that answers yes to everything; zinc for the floor.
 *
 * `public` has an entry because the type demands one, and it is never drawn
 * here: reaching this admin means the account is at least staff.
 */
const TONE: Record<SiteRole, string> = {
  superuser: "border-indigo-800/60 text-indigo-400",
  staff: "border-zinc-800 text-zinc-500",
  public: "border-zinc-800 text-zinc-500",
};

export function RolePill({ role, className }: { role: SiteRole; className?: string }) {
  return (
    <span className={`${SHAPE} ${TONE[role]}${className ? ` ${className}` : ""}`} title={ROLE_BLURB[role]}>
      {ROLE_LABEL[role]}
    </span>
  );
}
