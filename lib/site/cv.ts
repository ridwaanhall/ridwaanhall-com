/**
 * Where the CV is served. A plain module because server pages link to it and
 * the client viewer fetches it: a constant exported from a `"use client"`
 * module reaches a server component as a client reference, not as the string.
 */
export const CV_FILE = "/cv.pdf";
export const CV_MARKDOWN = "/cv.md";
