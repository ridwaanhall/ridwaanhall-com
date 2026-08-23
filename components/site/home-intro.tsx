import Link from "next/link";

import { StatusChip } from "@/components/layout/status-badges";
import type { AboutData } from "@/lib/data/about";

/**
 * The homepage hero.
 *
 * The third action button is conditional and the order matters: "Hireable" when
 * open to work, otherwise "Support" if a sponsor link exists, otherwise a
 * second "Contact". Ported as-is.
 */
export function HomeIntro({ about, sponsorUrl }: { about: AboutData; sponsorUrl: string }) {
  return (
    <section className="py-0">
      <div className="mx-auto lg:mx-0">
        <div className="text-left">
          <h1 className="text-2xl lg:text-3xl font-medium mb-2">
            Hi, I&apos;m {about.first_name}
            {/* Explicit: JSX drops whitespace between elements when it spans a
                newline, so without this the hand sits flush against the last
                letter. */}{" "}
            <WavingHand />
          </h1>

          <div className="flex flex-wrap items-center justify-start my-3">
            <span>{about.role}</span>
            <span className="mx-2">•</span>
            <span>
              {about.location.residency}, {about.location.country} {about.location.flag}
            </span>
            {/* The wording and the hover colour come from `AVAILABILITY`, so the
                hero, the rail, the drawer and the about intro cannot drift apart
                again -- they used to give four answers for three booleans. */}
            {(about.is_open_to_work || about.is_hiring) && (
              <Link href="/openhire" className="inline-flex gap-1 mx-1">
                {about.is_open_to_work && <StatusChip flag="open" className={HERO_CHIP} />}
                {about.is_hiring && <StatusChip flag="hiring" className={HERO_CHIP} />}
              </Link>
            )}
            {about.is_sick && <StatusChip flag="sick" className={`${HERO_CHIP} mx-1`} />}
          </div>

          <p className="mt-1 sm:mt-2 text-base sm:text-lg leading-relaxed mb-4">
            {about.short_description.length > 0
              ? about.short_bio
              : "Coding by day, memorizing Quran by heart—who else but me? I'm a passionate Python developer and DevOps engineer crafting digital solutions that matter."}
          </p>

          <div className="flex flex-row mb-6 sm:mb-6 md:mb-8 justify-start gap-2 sm:gap-3">
            <Link href="/about" className="action-btn group bg-indigo-800 hover:bg-indigo-700">
              <PersonIcon />
              <span>About</span>
            </Link>
            <Link href="/contact" className="action-btn group bg-zinc-800 hover:bg-zinc-700">
              <ChatIcon />
              <span>Contact</span>
            </Link>

            {about.is_open_to_work ? (
              <Link href="/openhire" className="action-btn group bg-green-800 hover:bg-green-700">
                <FireIcon />
                <span>Hireable</span>
              </Link>
            ) : sponsorUrl ? (
              <a
                href={sponsorUrl}
                className="action-btn group bg-pink-800 hover:bg-pink-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-pulse group-hover:animate-bounce group-hover:-rotate-12 transition-transform duration-300" />
                <span>Support</span>
              </a>
            ) : (
              <Link href="/contact" className="action-btn group bg-zinc-800 hover:bg-zinc-700">
                <ChatIcon />
                <span>Contact</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The hero sits on one line of running text, so its chips match its scale. */
const HERO_CHIP = "px-2 py-1 text-xs";

function WavingHand() {
  return (
    <svg
      className="inline w-6 h-6 -ml-1 animate-pulse"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.41377 17.859C4.77159 17.6504 5.23081 17.7713 5.43947 18.1291C6.26633 19.5471 7.53043 20.6193 9.0893 21.3151C9.46755 21.4839 9.63733 21.9274 9.46851 22.3057C9.29969 22.6839 8.85621 22.8537 8.47796 22.6849C6.66645 21.8764 5.14664 20.6046 4.14369 18.8847C3.93503 18.5269 4.05595 18.0677 4.41377 17.859Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.9058 3.92194C17.8919 2.88646 16.4459 2.50452 15.0303 2.9073C14.6319 3.02066 14.2171 2.78959 14.1037 2.39119C13.9904 1.99279 14.2214 1.57792 14.6198 1.46456C16.558 0.913072 18.5745 1.43959 19.9775 2.8725C20.2673 3.16846 20.2623 3.64331 19.9664 3.9331C19.6704 4.2229 19.1956 4.2179 18.9058 3.92194Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.1901 3.30839C10.9761 2.94131 10.3523 2.7187 9.71858 3.08085C9.08722 3.44168 8.97618 4.07772 9.18651 4.4384L11.7122 8.76952C11.9208 9.12734 11.7999 9.58656 11.4421 9.79522C11.0843 10.0039 10.6251 9.88296 10.4164 9.52514L7.04885 3.75032C6.83479 3.38324 6.21098 3.16063 5.57731 3.52278C4.94595 3.88361 4.83491 4.51965 5.04525 4.88033L8.83373 11.377C9.04239 11.7348 8.92147 12.1941 8.56365 12.4027C8.20583 12.6114 7.74661 12.4905 7.53795 12.1326L5.85418 9.24522C5.64012 8.87814 5.01631 8.65553 4.38264 9.01768C3.75128 9.37851 3.64024 10.0145 3.85058 10.3752L7.63906 16.8719C9.248 19.631 13.2184 20.5264 16.5853 18.6021C19.95 16.6792 21.146 12.8377 19.5408 10.085L17.0152 5.75387C16.8011 5.38679 16.1773 5.16418 15.5436 5.52633C14.9123 5.88716 14.8012 6.5232 15.0116 6.88389L16.6953 9.7713C16.7961 9.94411 16.8237 10.15 16.7719 10.3432C16.7201 10.5365 16.5933 10.701 16.4196 10.8003C14.8771 11.6818 14.4044 13.3863 15.0797 14.5443C15.2884 14.9022 15.1675 15.3614 14.8096 15.57C14.4518 15.7787 13.9926 15.6578 13.7839 15.3C12.8712 13.7348 13.24 11.8501 14.4189 10.5181C14.7485 10.1457 14.8613 9.60396 14.6108 9.17438L11.1901 3.30839Z"
        fill="currentColor"
      />
    </svg>
  );
}

const ACTION_ICON =
  "w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 group-hover:animate-pulse group-hover:-rotate-12 transition-transform duration-300";

function PersonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={ACTION_ICON}
      fill="currentColor"
      viewBox="0 0 48 48"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M24 3a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 4a6 6 0 1 0 0 12.00A6 6 0 0 0 24 7Zm0 19c10.3 0 16.67 6.99 17 17 .02.55-.43 1-1 1h-2c-.54 0-.98-.45-1-1-.3-7.84-4.9-13-13-13s-12.7 5.16-13 13c-.02.55-.46 1-1.02 1h-2c-.55 0-1-.45-.98-1 .33-10.01 6.7-17 17-17Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={ACTION_ICON}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-pulse group-hover:-rotate-12 transition-transform duration-300 group-hover:text-orange-500"
      aria-hidden="true"
    >
      <path
        d="M5.926 20.574a7.26 7.26 0 0 0 3.039 1.511c.107.035.179-.105.107-.175-2.395-2.285-1.079-4.758-.107-5.873.693-.796 1.68-2.107 1.608-3.865 0-.176.18-.317.322-.211 1.359.703 2.288 2.25 2.538 3.515.394-.386.537-.984.537-1.511 0-.176.214-.317.393-.176 1.287 1.16 3.503 5.097-.072 8.19-.071.071 0 .212.072.177a8.761 8.761 0 0 0 3.003-1.442c5.827-4.5 2.037-12.48-.43-15.116-.321-.317-.893-.106-.893.351-.036.95-.322 2.004-1.072 2.707-.572-2.39-2.478-5.105-5.195-6.441-.357-.176-.786.105-.75.492.07 3.27-2.063 5.352-3.922 8.059-1.645 2.425-2.717 6.89.822 9.808z"
        fill="currentColor"
        className="group-hover:fill-orange-500 transition-colors duration-300"
      />
    </svg>
  );
}

export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
