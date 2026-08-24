import { GitHubMark, GoogleMark } from "@/components/icons/provider-marks";
import { signInWith } from "@/lib/actions/auth";

/**
 * The pair of provider buttons, wherever a sign-in is offered as a page.
 *
 * A server component, and each button is a real `<form>` posting a server
 * action -- so the page signs somebody in before any JavaScript arrives, and
 * `scripts/check-account-panel.mjs` can find both forms in the server body.
 *
 * The two are given equal width rather than sized to their labels: "GitHub" is
 * two characters longer than "Google", and a pair that differs by that much
 * reads as one being the intended answer.
 *
 * `redirectTo` is where a *successful* sign-in lands, and it differs by
 * surface: the admin's gate returns to `/admin`, the public page to the home
 * page. It is closed over rather than posted as a hidden field, so it never
 * makes the round trip through the browser at all -- and `signInWith` sanitises
 * it regardless, because a redirect target that came from a request is an open
 * redirect otherwise.
 */
const PROVIDER_CLASS =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

export function ProviderButtons({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="space-y-2">
      <form
        action={async () => {
          "use server";
          await signInWith("google", redirectTo);
        }}
      >
        <button type="submit" className={PROVIDER_CLASS}>
          <GoogleMark />
          Continue with Google
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await signInWith("github", redirectTo);
        }}
      >
        <button type="submit" className={PROVIDER_CLASS}>
          <GitHubMark />
          Continue with GitHub
        </button>
      </form>
    </div>
  );
}
