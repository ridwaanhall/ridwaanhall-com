import { HeartIcon } from "@/components/site/home-intro";

/**
 * The "Support My Work" panel, shown on the homepage and the about page.
 *
 * The two decorative circles are `hidden md:block` -- at narrow widths they
 * would sit on top of the text rather than behind it.
 */
export function SponsorMe({ sponsorUrl }: { sponsorUrl: string }) {
  if (!sponsorUrl) return null;

  return (
    <div className="relative mt-4 sm:mt-6 rounded-2xl overflow-hidden border bg-gradient-to-tr border-pink-400/50 from-pink-950 to-pink-800 transition-all duration-300 hover:border-pink-500">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg sm:text-xl mb-2 text-pink-300">Support My Work</h3>
          <p className="text-pink-100 text-sm sm:text-base mb-4">
            Help me continue creating open source projects and sharing knowledge with the community!
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 mt-2">
            <a
              href={sponsorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-pink-700 bg-pink-950/60 hover:border-pink-400 hover:bg-pink-800/30 transition-all duration-300 text-sm text-pink-200"
            >
              <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-pulse" />
              Support
            </a>
          </div>

          <div className="absolute top-0 right-0 -mt-4 -mr-4 hidden md:block">
            <div className="w-20 h-20 rounded-full bg-pink-400/10" />
          </div>
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 hidden md:block">
            <div className="w-16 h-16 rounded-full bg-pink-500/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
