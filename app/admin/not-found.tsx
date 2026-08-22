import { NothingHere } from "@/components/admin/nothing-here";

/**
 * The admin's own not-found, for a URL the router rejects -- an unbuilt screen,
 * a key that is not in the registry. These get a real 404 status, unlike a
 * `notFound()` thrown after a dynamic route has committed its response.
 *
 * A reader who mistyped a record id is mid-task and wants the admin, not the
 * site's public 404 with a link to the blog.
 */
export default function AdminNotFound() {
  return (
    <NothingHere message="That screen does not exist, or it has not been built yet. Pick a model from the sidebar to carry on." />
  );
}
