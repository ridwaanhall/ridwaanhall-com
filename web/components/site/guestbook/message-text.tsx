import { Fragment } from "react";

/**
 * A message's body, rendered as the `linkify_message` filter did.
 *
 * The rule is narrow on purpose and is copied rather than improved: a message
 * that *starts* with `https://` becomes one link to the whole trimmed string,
 * and anything else is plain text with newlines preserved. It is not a general
 * URL detector, and making it one here would render existing messages
 * differently from the way they have always appeared.
 *
 * There is no `dangerouslySetInnerHTML`: Django needed `escape()` before
 * `linebreaksbr()` because it was assembling HTML, and React escapes by
 * construction. `rel="nofollow"` stays -- these are visitor-supplied links.
 */
export function MessageText({ text }: { text: string }) {
  const trimmed = text.trim();

  if (trimmed.toLowerCase().startsWith("https://")) {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-indigo-400 underline break-all hover:text-indigo-300"
      >
        {trimmed}
      </a>
    );
  }

  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
