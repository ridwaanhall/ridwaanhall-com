import type { JsonLd } from "@/lib/seo/schema";

/**
 * Structured data, emitted inline in the page.
 *
 * `JSON.stringify` output goes through `dangerouslySetInnerHTML` because that
 * is the only way to put a raw script body in React. The value is ours, built
 * from typed objects rather than from user input -- but `<` is escaped anyway,
 * since a string in the data containing `</script>` would otherwise close the
 * tag and let the remainder be parsed as markup. Blog tags and project
 * descriptions are editable through the admin, so that is not hypothetical.
 */
export function JsonLdScript({ schemas }: { schemas: JsonLd[] }) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          // The list is fixed per page and never reordered, so the index is a
          // stable key here.
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
