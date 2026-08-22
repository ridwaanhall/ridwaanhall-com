import { blogBlogimage, blogBlogpost } from "@/lib/db/schema";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The `blog` changelist, from `BlogPostAdmin` in `apps/blog/admin.py`.
 *
 * `list_display`, `list_filter`, `search_fields` and the model's own
 * `ordering = ["-created_at"]` are carried across unchanged -- including the
 * fact that `description` and `author` are searchable but not shown, which is
 * deliberate: a post is far easier to find by a phrase from its summary than by
 * guessing its title.
 */
export type BlogPostRow = {
  id: number;
  title: string;
  slug: string;
  isFeatured: boolean;
  views: number;
  createdAt: string;
};

export const blogPostList: AdminListModel<BlogPostRow> = {
  key: "blog-post",
  from: blogBlogpost,
  pk: blogBlogpost.id,
  select: {
    id: blogBlogpost.id,
    title: blogBlogpost.title,
    slug: blogBlogpost.slug,
    isFeatured: blogBlogpost.isFeatured,
    views: blogBlogpost.views,
    createdAt: blogBlogpost.createdAt,
  },
  columns: [
    { key: "title", label: "Title", sort: blogBlogpost.title, value: (row) => row.title },
    { key: "slug", label: "Slug", kind: "code", sort: blogBlogpost.slug, value: (row) => row.slug },
    {
      key: "is_featured",
      label: "Featured",
      kind: "bool",
      sort: blogBlogpost.isFeatured,
      value: (row) => row.isFeatured,
    },
    {
      key: "views",
      label: "Views",
      kind: "number",
      sort: blogBlogpost.views,
      value: (row) => row.views,
    },
    {
      key: "created_at",
      label: "Created",
      kind: "date",
      sort: blogBlogpost.createdAt,
      value: (row) => row.createdAt,
    },
  ],
  filters: [
    { key: "is_featured", label: "Featured", kind: "boolean", column: blogBlogpost.isFeatured },
    // Django listed the categories present rather than a fixed vocabulary --
    // `category` is a plain CharField with no `choices` -- so a post that
    // introduces a new one adds its own filter option.
    {
      key: "category",
      label: "Category",
      kind: "choice",
      column: blogBlogpost.category,
      choices: "distinct",
    },
    { key: "created_at", label: "Created", kind: "date", column: blogBlogpost.createdAt },
  ],
  search: {
    fields: [blogBlogpost.title, blogBlogpost.description, blogBlogpost.author],
    placeholder: "Search title, description or author",
  },
  defaultSort: { key: "created_at", dir: "desc" },
  rowId: (row) => row.id,
};

export const blogPostForm: AdminFormModel = {
  key: "blog-post",
  from: blogBlogpost,
  pk: blogBlogpost.id,
  label: (values) => String(values.title ?? "Post"),
  deleteWarning: "The images attached to this post are deleted with it.",
  /*
   * `content` is the original JSONB block array and `views` counts readers, and
   * neither is on this form: the body is edited as HTML in `content_html`, and a
   * view count is not something to type. Both columns are `NOT NULL` with no
   * database default -- Django's `default=list` and `default=0` are Python -- so
   * a create that omitted them would fail.
   *
   * A post created here therefore has an empty `content`, which means the Django
   * admin shows it with no body. That is accepted: `content` exists only until
   * cutover drops it, and everything the site renders comes from `content_html`.
   */
  insertDefaults: () => ({
    content: [],
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: blogBlogpost.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "slug",
          column: blogBlogpost.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 255,
          slugFrom: "title",
          help: "Part of the published URL. Changing it moves the post, and existing links stop working.",
        },
        {
          name: "description",
          column: blogBlogpost.description,
          label: "Description",
          kind: "textarea",
          help: "The summary on the cards, and the page's meta description.",
        },
        {
          name: "category",
          column: blogBlogpost.category,
          label: "Category",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "tags",
          column: blogBlogpost.tags,
          label: "Tags",
          kind: "string-list",
          itemLabel: "tag",
          help: "Rendered slugified, so #Commit Style shows as #commit-style.",
        },
        {
          name: "isFeatured",
          column: blogBlogpost.isFeatured,
          label: "Featured",
          kind: "checkbox",
          help: "Featured posts head the blog page in the slider.",
        },
        {
          name: "readTime",
          column: blogBlogpost.readTime,
          label: "Read time",
          kind: "number",
          min: 0,
          help: "In minutes.",
        },
      ],
    },
    {
      title: "Body",
      fields: [
        {
          name: "contentHtml",
          column: blogBlogpost.contentHtml,
          label: "Body",
          kind: "rich-text",
          help: "Styled by the site's own prose stylesheet. Anything outside the allowed vocabulary is dropped on save.",
        },
      ],
    },
    {
      title: "Author",
      help: "Shown in the byline. The photo is shared with the profile and every other post.",
      fields: [
        {
          name: "author",
          column: blogBlogpost.author,
          label: "Name",
          kind: "text",
          required: true,
          maxLength: 100,
        },
        {
          name: "username",
          column: blogBlogpost.username,
          label: "Username",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "authorImage",
          column: blogBlogpost.authorImage,
          label: "Photo",
          kind: "image",
          prefix: "profile",
          // Twenty-one rows name the same file. Uploading a new one here gives
          // this post its own; the shared one stays where it is, because
          // something still references it.
          help: "Replacing this gives only this post a new photo.",
        },
      ],
    },
    {
      title: "Recorded",
      fields: [
        {
          name: "views",
          column: blogBlogpost.views,
          label: "Views",
          kind: "number",
          readOnly: true,
          help: "Counted in the browser, so a crawler and the prerender are not counted.",
        },
        {
          name: "createdAt",
          column: blogBlogpost.createdAt,
          label: "Published",
          kind: "datetime",
        },
        {
          name: "updatedAt",
          column: blogBlogpost.updatedAt,
          label: "Updated",
          kind: "datetime",
        },
      ],
    },
  ],
  inlines: [
    {
      name: "images",
      table: blogBlogimage,
      pk: blogBlogimage.id,
      parent: blogBlogimage.blogId,
      title: "Images",
      help: "The gallery under the post, in this order.",
      itemLabel: "image",
      orderColumn: blogBlogimage.order,
      fields: [
        {
          name: "image",
          column: blogBlogimage.image,
          label: "File",
          kind: "image",
          prefix: "blog",
          required: true,
        },
        {
          name: "originalFilename",
          column: blogBlogimage.originalFilename,
          label: "Caption",
          kind: "text",
          maxLength: 255,
        },
      ],
    },
  ],
};
