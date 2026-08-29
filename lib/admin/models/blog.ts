import { eq } from "drizzle-orm";

import {
  blogImage,
  blogPost,
  blogTag,
  category,
  tag,
} from "@/lib/db/app-schema";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The `blog` changelist.
 *
 * `list_display`, `list_filter`, `search_fields` and the model's own
 * `ordering = ["-created_at"]` are carried across unchanged -- including the
 * fact that `description` and `author` are searchable but not shown, which is
 * deliberate: a post is far easier to find by a phrase from its summary than by
 * guessing its title.
 */
export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  isFeatured: boolean;
  views: number;
  createdAt: string;
};

export const blogPostList: AdminListModel<BlogPostRow> = {
  key: "blog-post",
  from: blogPost,
  pk: blogPost.id,
  select: {
    id: blogPost.id,
    title: blogPost.title,
    slug: blogPost.slug,
    isFeatured: blogPost.isFeatured,
    views: blogPost.views,
    createdAt: blogPost.publishedAt,
  },
  columns: [
    { key: "title", label: "Title", sort: blogPost.title, value: (row) => row.title },
    { key: "slug", label: "Slug", kind: "code", sort: blogPost.slug, value: (row) => row.slug },
    {
      key: "is_featured",
      label: "Featured",
      kind: "bool",
      sort: blogPost.isFeatured,
      value: (row) => row.isFeatured,
    },
    {
      key: "views",
      label: "Views",
      kind: "number",
      sort: blogPost.views,
      value: (row) => row.views,
    },
    {
      key: "created_at",
      label: "Created",
      kind: "date",
      sort: blogPost.publishedAt,
      value: (row) => row.createdAt,
    },
  ],
  filters: [
    { key: "is_featured", label: "Featured", kind: "boolean", column: blogPost.isFeatured },
    // The categories actually present, not a fixed vocabulary, so a post that
    // introduces a new one adds its own filter option with nothing to update.
    {
      key: "category",
      label: "Category",
      kind: "choice",
      column: blogPost.categoryId,
      choices: { table: category, value: category.id, label: category.label },
    },
    { key: "created_at", label: "Created", kind: "date", column: blogPost.publishedAt },
  ],
  search: {
    fields: [blogPost.title, blogPost.description, blogPost.authorName],
    placeholder: "Search title, description or author",
  },
  defaultSort: { key: "created_at", dir: "desc" },
  rowId: (row) => row.id,
};

export const blogPostForm: AdminFormModel = {
  key: "blog-post",
  from: blogPost,
  pk: blogPost.id,
  label: (values) => String(values.title ?? "Post"),
  deleteWarning: "The images attached to this post are deleted with it.",
  /*
   * `views` counts readers and is not something to type, but the column is
   * `NOT NULL` with no database default, so a create that omitted it would
   * fail.
   */
  insertDefaults: () => ({
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: blogPost.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "slug",
          column: blogPost.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 255,
          slugFrom: "title",
          help: "Part of the published URL. Changing it moves the post, and existing links stop working.",
        },
        {
          name: "description",
          column: blogPost.description,
          label: "Description",
          kind: "textarea",
          help: "The summary on the cards, and the page's meta description.",
        },
        {
          name: "categoryId",
          column: blogPost.categoryId,
          label: "Category",
          kind: "reference",
          reference: {
            table: category,
            value: category.id,
            label: category.label,
            where: eq(category.kind, "blog"),
          },
        },
        {
          name: "tags",
          column: blogPost.id,
          label: "Tags",
          kind: "many-to-many",
          help: "Shared with projects, so a tag means the same thing on both.",
          manyToMany: {
            join: blogTag,
            ownerFk: blogTag.postId,
            targetFk: blogTag.tagId,
            options: { table: tag, value: tag.id, label: tag.label },
          },
        },
        {
          name: "isFeatured",
          column: blogPost.isFeatured,
          label: "Featured",
          kind: "checkbox",
          help: "Featured posts head the blog page in the slider.",
        },
        {
          name: "readTime",
          column: blogPost.readTime,
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
          column: blogPost.contentHtml,
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
          column: blogPost.authorName,
          label: "Name",
          kind: "text",
          required: true,
          maxLength: 100,
        },
        {
          name: "username",
          column: blogPost.authorUsername,
          label: "Username",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "authorImage",
          column: blogPost.authorImageId,
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
          column: blogPost.views,
          label: "Views",
          kind: "number",
          readOnly: true,
          help: "Counted in the browser, so a crawler and the prerender are not counted.",
        },
        {
          name: "createdAt",
          column: blogPost.publishedAt,
          label: "Published",
          kind: "datetime",
        },
        {
          name: "updatedAt",
          column: blogPost.updatedAt,
          label: "Updated",
          kind: "datetime",
        },
      ],
    },
  ],
  inlines: [
    {
      name: "images",
      table: blogImage,
      pk: blogImage.id,
      parent: blogImage.postId,
      title: "Images",
      help: "The gallery under the post, in this order.",
      itemLabel: "image",
      orderColumn: blogImage.position,
      fields: [
        {
          name: "mediaId",
          column: blogImage.mediaId,
          label: "File",
          kind: "image",
          prefix: "blog",
          required: true,
        },
      ],
    },
  ],
};
