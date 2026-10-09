"use client";

import Link from "next/link";

import { Icon } from "@/components/foothill/icons";
import { usePalette } from "@/components/foothill/palette";

/*
 * The pages that say there is no page: an address that leads nowhere, a
 * project or post that is not out yet, and the site itself failing. Each says
 * what happened in plain words and offers the way on -- never a dead end.
 */

/** Search, from a page that has nothing else to offer. */
function SearchButton() {
  const palette = usePalette();
  return (
    <button type="button" className="btn ghost" onClick={palette.open}>
      <Icon name="search" />
      Search
    </button>
  );
}

export function NotHere() {
  return (
    <section className="wrap nothing">
      <span className="mono mute">404</span>
      <h1 className="t1" data-fh-split="">
        Nothing lives here.
      </h1>
      <p className="lead" style={{ maxWidth: "44ch" }}>
        The address may be old, or a link may be wrong. Search, or start from the top.
      </p>
      <div className="acts">
        <Link className="btn" href="/">
          <Icon name="home" />
          Home
        </Link>
        <SearchButton />
      </div>
    </section>
  );
}

export function Unpublished({ kind }: { kind: "project" | "post" }) {
  const back = kind === "project" ? (["/projects", "All work", "grid"] as const) : (["/blog", "All writing", "book"] as const);
  return (
    <section className="wrap nothing">
      <span className="mono mute">Not published</span>
      <h1 className="t1" data-fh-split="">
        {kind === "project" ? "This project is not out yet." : "This post is not out yet."}
      </h1>
      <p className="lead" style={{ maxWidth: "48ch" }}>
        It may still be a draft, or the link may be old. Everything that is published is one step away.
      </p>
      <div className="acts">
        <Link className="btn" href={back[0]}>
          <Icon name={back[2]} />
          {back[1]}
        </Link>
        <Link className="btn ghost" href="/">
          <Icon name="home" />
          Home
        </Link>
      </div>
    </section>
  );
}

/**
 * The site failed. Try again reloads the page rather than re-rendering the
 * segment: the failure this site actually has is a database that did not
 * answer, and a fresh request is what gives it another chance. The reference
 * is the error's digest, which the server logged with the same value.
 */
export function Broke({ digest }: { digest?: string }) {
  const when = new Date().toLocaleString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
  return (
    <section className="wrap nothing">
      <span className="mono mute">500</span>
      <h1 className="t1">Something broke on this side.</h1>
      <p className="lead" style={{ maxWidth: "48ch" }}>
        Nothing you did. The page could not be put together just now; trying again usually works. If it keeps happening, a note helps.
      </p>
      <div className="acts">
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          <Icon name="refresh" />
          Try again
        </button>
        <Link className="btn ghost" href="/">
          <Icon name="home" />
          Home
        </Link>
        <Link className="btn ghost" href="/contact">
          <Icon name="mail" />
          Tell me
        </Link>
      </div>
      <p className="mono mute" style={{ fontSize: 12 }}>
        {digest ? `Reference ${digest} · ` : ""}
        {when} GMT+7
      </p>
    </section>
  );
}
