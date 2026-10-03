import { GitHubMark, GoogleMark } from "@/components/icons/provider-marks";
import { BUTTON_SECONDARY, ButtonContent } from "@/components/site/ui";
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
const PROVIDER_CLASS = `${BUTTON_SECONDARY} flex w-full`;

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
          <ButtonContent label="Continue with Google" fill leading={<GoogleMark />} />
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await signInWith("github", redirectTo);
        }}
      >
        <button type="submit" className={PROVIDER_CLASS}>
          <ButtonContent label="Continue with GitHub" fill leading={<GitHubMark />} />
        </button>
      </form>
    </div>
  );
}
