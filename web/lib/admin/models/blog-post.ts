import { blogBlogpost } from "@/lib/db/schema";

import type { AdminListModel } from "@/lib/admin/list";

/**
 * The blog changelist, from `BlogPostAdmin` in `apps/blog/admin.py`.
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
