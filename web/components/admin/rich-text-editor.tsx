"use client";

import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useState, useSyncExternalStore } from "react";

import type { ClientField } from "@/lib/admin/form";
import { cn } from "@/lib/utils/cn";

/**
 * The blog body and the project description, as rich text.
 *
 * These were authored as JSONB blocks carrying hand-typed Tailwind classes, and
 * are HTML now, styled by `styles/prose.css`. This is what writes that HTML.
 *
 * **The editor is configured down to the sanitiser's vocabulary**, not up from
 * the default. `lib/utils/sanitize.ts` drops anything outside its allow-list, so
 * an editor able to produce more would silently lose it on the way to the page:
 * headings start at 2 because `h1` is the page title and is not allowed through,
 * and the extensions here are the ones the stored content actually uses. What is
 * left out is deliberate -- across all 84 rows of stored HTML there is not one
 * `img`, `sub`, `sup` or `mark`, and an image in the body would need its own
 * upload flow inside the editor rather than the gallery inline beside it.
 *
 * The sanitiser still runs on save. This keeps the two in step for the writer;
 * the server keeps them in step for everyone.
 */
const TOOLBAR_BUTTON =
  "rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent";

const ACTIVE = "bg-zinc-800 text-indigo-400";

/** Never changes after hydration, so there is nothing to subscribe to. */
const subscribeNever = () => () => {};

export function RichTextEditor({
  name,
  field,
  value,
}: {
  name: string;
  field: ClientField;
  value: string;
}) {
  const [html, setHtml] = useState(value);

  /*
   * The editor is shown only once hydrated, and the server renders a
   * placeholder of the same shape.
   *
   * `immediatelyRender: false` stops Tiptap rendering during the server pass,
   * but `EditorContent` still hydrated with attributes React had not put there
   * -- ProseMirror sets `contenteditable`, `translate` and its own class on the
   * element it takes over. Waiting means the server HTML and the first client
   * render are the same markup, and ProseMirror only touches the DOM after that.
   *
   * `useSyncExternalStore` rather than a `setState` in an effect, which is the
   * pattern `components/layout/theme-toggle.tsx` already uses here and which
   * React 19 flags for triggering a cascading render.
   */
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // `h1` belongs to the page, not the body: the sanitiser allows h2-h6.
        heading: { levels: [2, 3, 4, 5, 6] },
        link: { openOnClick: false, autolink: false },
      }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: value,
    // Without this the server render and the first client render disagree, and
    // React reports a hydration mismatch on every load of the form.
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => setHtml(current.getHTML()),
    editorProps: {
      attributes: {
        /*
         * The site's own prose stylesheet, not a separate editor theme. What is
         * being typed is what the page renders, so styling it any other way
         * would make the editor a preview of something else -- and it costs no
         * CSS, since `styles/prose.css` is already in the bundle.
         */
        class:
          "prose-content admin-editor min-h-64 rounded-b-md border border-t-0 border-zinc-800 bg-zinc-900 px-3 py-2 focus:outline-none",
      },
    },
  });

  return (
    <div className="min-w-0">
      {/*
        One named control carrying the document, the same shape the JSON editors
        use. Rendered before the editor mounts as well, so a save issued while
        the page is still hydrating posts the stored value rather than nothing.
      */}
      <input type="hidden" name={name} value={html} />
      {mounted && editor ? (
        <>
          <Toolbar editor={editor} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <div className="min-h-64 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-500">
          Loading the editor…
        </div>
      )}
      {field.help && <p className="mt-1 text-xs text-zinc-500">{field.help}</p>}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const button = (
    label: string,
    title: string,
    run: () => void,
    active?: boolean,
    disabled?: boolean,
  ) => (
    <button
      key={title}
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={run}
      className={cn(TOOLBAR_BUTTON, active && ACTIVE)}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-zinc-800 bg-zinc-900/60 px-1.5 py-1">
      {button("H2", "Heading 2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      {button("H3", "Heading 3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
      {button("H4", "Heading 4", () => editor.chain().focus().toggleHeading({ level: 4 }).run(), editor.isActive("heading", { level: 4 }))}
      <Divider />
      {button("B", "Bold", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {button("I", "Italic", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {button("S", "Strikethrough", () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}
      {button("‹›", "Inline code", () => editor.chain().focus().toggleCode().run(), editor.isActive("code"))}
      <Divider />
      {button("•", "Bullet list", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {button("1.", "Numbered list", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {button("❝", "Quote", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {button("{ }", "Code block", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
      <Divider />
      <LinkButton editor={editor} />
      {button("⊞", "Insert table", () =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      )}
      {button("⊟", "Delete table", () => editor.chain().focus().deleteTable().run(), false, !editor.isActive("table"))}
      <Divider />
      {button("—", "Horizontal rule", () => editor.chain().focus().setHorizontalRule().run())}
      <Divider />
      {button("↺", "Undo", () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
      {button("↻", "Redo", () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-zinc-800" aria-hidden="true" />;
}

/**
 * The one control that needs a value rather than a toggle.
 *
 * `window.prompt` rather than a popover: it is one string, it is keyboard
 * accessible without any focus-trap work, and the alternative is a small
 * floating form that has to be built, positioned and dismissed correctly for
 * a control used a handful of times per post.
 */
function LinkButton({ editor }: { editor: Editor }) {
  const active = editor.isActive("link");

  return (
    <button
      type="button"
      title={active ? "Edit or remove link" : "Add link"}
      aria-label={active ? "Edit or remove link" : "Add link"}
      aria-pressed={active}
      onClick={() => {
        const current = String(editor.getAttributes("link").href ?? "");
        const next = window.prompt("Link address (leave empty to remove)", current);
        if (next === null) return;
        if (next === "") {
          editor.chain().focus().unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: next }).run();
      }}
      className={cn(TOOLBAR_BUTTON, active && ACTIVE)}
    >
      🔗
    </button>
  );
}
