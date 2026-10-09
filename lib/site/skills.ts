import type { SkillIcon } from "@/components/foothill/ui";
import type { Skill } from "@/lib/data/about";

/** A skill as a chip draws it: its name, its icon, and which theme it vanishes on. */
export const skillIcon = (skill: Pick<Skill, "name" | "icon_svg" | "tone">): SkillIcon => ({
  name: skill.name,
  icon: skill.icon_svg || null,
  tone: skill.tone,
});

/**
 * "2,495 hrs 49 mins" to 2495: WakaTime writes its all-time figure as words,
 * and a capsule counts whole hours.
 */
export function wholeHours(text: string | null | undefined): number {
  const match = (text ?? "").match(/([\d,]+)\s*hr/);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

/** A stored tone, as the type: the database only allows these two, but a column is a string. */
export const toTone = (value: string | null | undefined): "dark" | "light" | null =>
  value === "dark" || value === "light" ? value : null;
