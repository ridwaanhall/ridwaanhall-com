"use client";

import Link from "next/link";

import { Icon } from "@/components/foothill/icons";

/**
 * The page shown when there is no page and no site chrome to show it in: an
 * address that matches no route at all, or a failure outside the site's own
 * layout -- the admin's missing routes land here too -- so it carries its own
 * frame, the username as a wordmark, and says nothing that is only true of
 * the public site.
 *
 * Inside the site a 404 or a failure is drawn in the site's chrome instead
 * (`app/(site)/not-found.tsx` and `app/(site)/error.tsx`).
 */
export function ErrorPage({
  code = 404,
  title = "Nothing lives here.",
  message = "The address may be old, or a link may be wrong. Start from the top.",
  digest,
}: {
  code?: number | string;
  title?: string;
  message?: string;
  digest?: string;
}) {
  return (
    <div className="fh-site fh-error">
      <header className="nav">
        <div className="wrap nav-in">
          <Link className="brand" href="/">
            <span className="roll">
              <span>ridwaanhall</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="fh-main" data-quiet="">
        <section className="wrap nothing">
          <span className="mono mute">{code}</span>
          <h1 className="t1">{title}</h1>
          <p className="lead" style={{ maxWidth: "46ch" }}>
            <span className="sr">Error {code}. </span>
            {message}
          </p>
          <div className="acts">
            {code !== 404 && (
              <button type="button" className="btn" onClick={() => window.location.reload()}>
                <Icon name="refresh" />
                Try again
              </button>
            )}
            <Link className={code === 404 ? "btn" : "btn ghost"} href="/">
              <Icon name="home" />
              Home
            </Link>
            <button type="button" className="btn ghost" onClick={() => window.history.back()}>
              <Icon name="back" />
              Go back
            </button>
          </div>
          {digest && (
            <p className="mono mute" style={{ fontSize: 12 }}>
              Reference {digest}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
