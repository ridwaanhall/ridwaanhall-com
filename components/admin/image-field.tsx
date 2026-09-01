import { useState } from "react";

import { BOXED_LABEL, CONTROL, INVALID } from "@/components/admin/control-classes";
import { clearFieldName, linkFieldName, type ClientField } from "@/lib/admin/form";
import { IMAGE_TYPES } from "@/lib/storage/keys";
import { cn } from "@/lib/utils/cn";
import { useHydrated } from "@/lib/utils/use-popover";

/**
 * An image field, which takes bytes from either of two places.
 *
 * A file the browser posts, or a link the server fetches on save. The link is a
 * *source* of bytes and not a place the site points at: what comes back is
 * stored in the bucket under a content-addressed key, so a linked image and an
 * uploaded one are the same thing by the time anything renders it.
 *
 * **Its own component because it owns state.** `Field` is a plain function
 * called once per field and its branches return before one another, so a
 * `useState` at the top of it would be a hook whose position depends on `kind`.
 * The same reason `ValueHolder` exists beside it.
 */

/**
 * Both inputs are real, both render on the server, and the switch is an
 * enhancement over them -- the rule every drawn control in this admin follows.
 * Before the bundle arrives they are stacked with a word between them and
 * either one saves; `check-admin-controls.mjs` drives exactly that state.
 *
 * Once hydrated, the input the switch is not showing is hidden **and disabled**.
 * The second half is the part that is easy to leave out and impossible to see:
 * a hidden form control still submits, and only a disabled one does not -- so
 * hiding alone would post a file that was chosen before the reader changed
 * their mind and pasted a link, and `imageSourceFor` would refuse the save for
 * supplying both.
 */
type Mode = "upload" | "link";

export function ImageField({
  field,
  name,
  id,
  describedBy,
  invalid,
  storedKey,
  previewUrl,
}: {
  field: ClientField;
  /** The input's `name`, already carrying an inline row's prefix. */
  name: string;
  id: string;
  describedBy: string;
  invalid: boolean;
  /** The storage key the record holds, or `""`. */
  storedKey: string;
  /** Built on the server: the host is not a `NEXT_PUBLIC_` variable. */
  previewUrl: string;
}) {
  const hydrated = useHydrated();
  const [mode, setMode] = useState<Mode>("upload");

  // Unhydrated, neither is inactive: both are on screen and both may post.
  const inactive = (which: Mode) => hydrated && mode !== which;

  return (
    <div className="space-y-2">
      {storedKey ? (
        <div className="flex items-start gap-3">
          {/*
            A plain `img`, not `next/image`. The optimizer would cache a
            derivative of a file that is about to be replaced, and the point
            of this control is to show what is stored right now.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="h-16 w-16 rounded-md border border-zinc-800 object-contain"
          />
          <div className="min-w-0 flex-1">
            <code className="block truncate text-xs break-all text-zinc-500">{storedKey}</code>
            {!field.required && (
              <label className={cn(BOXED_LABEL, "mt-1.5 text-xs text-zinc-400")}>
                <input
                  type="checkbox"
                  name={clearFieldName(name)}
                  className="admin-check admin-check-sm"
                />
                Remove this image
              </label>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">No image.</p>
      )}

      {/*
        The switch itself, and only once there is something for it to switch.
        Rendering it unhydrated would draw two buttons that do nothing while
        both inputs are visible anyway, which reads as a broken control rather
        than as one still waking up.
      */}
      {hydrated && (
        <div
          role="group"
          aria-label={`How to supply ${field.label.toLowerCase()}`}
          className="inline-flex rounded-full border border-zinc-800 p-0.5"
        >
          <ModeButton current={mode} value="upload" onSelect={setMode}>
            Upload
          </ModeButton>
          <ModeButton current={mode} value="link" onSelect={setMode}>
            Link
          </ModeButton>
        </div>
      )}

      <div className="space-y-2">
        <input
          type="file"
          id={id}
          name={name}
          accept={Object.keys(IMAGE_TYPES).join(",")}
          aria-describedby={describedBy || undefined}
          hidden={inactive("upload")}
          disabled={inactive("upload")}
          className="admin-file block w-full text-xs text-zinc-400"
        />

        {/*
          The word between them, unhydrated only. With the switch on screen it
          would be describing a choice the reader has already made.
        */}
        {!hydrated && <p className="text-xs text-zinc-600">or</p>}

        <div hidden={inactive("link")}>
          <label
            htmlFor={`${id}-link`}
            className="mb-1 block w-fit text-xs text-zinc-400"
          >
            Image link
          </label>
          <input
            /*
              `type="url"`, where an ordinary `url` *field* in this admin takes
              `type="text"`. That rule exists because several of those hold
              site-relative paths, which a browser's URL validation rejects --
              and none of them is this box, which is always an absolute link to
              somewhere else. So the validation is worth having here, along with
              the keyboard a phone offers for it.
            */
            type="url"
            inputMode="url"
            id={`${id}-link`}
            name={linkFieldName(name)}
            placeholder="https://example.com/image.png"
            aria-describedby={describedBy || undefined}
            aria-invalid={invalid ? true : undefined}
            disabled={inactive("link")}
            className={cn(CONTROL, invalid && INVALID)}
          />
          {/*
            Worth saying, because it is not what "link" usually means: the file
            is copied in, so the page never depends on the other server.
          */}
          <p className="mt-1 text-xs text-zinc-500">
            Fetched and stored with your other media when you save.
          </p>
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: Mode;
  value: Mode;
  onSelect: (next: Mode) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      // Without this a button inside a form is a submit button, so choosing
      // "Link" would save the record.
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(value)}
      className={cn(
        "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
        active
          ? "bg-indigo-500/15 text-indigo-300"
          : "text-zinc-500 hover:text-zinc-300",
      )}
    >
      {children}
    </button>
  );
}
