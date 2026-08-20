import type { AboutData, Certification, Education, Experience } from "@/lib/data/about";
import { getAwards, getCertifications, getEducation, getExperiences } from "@/lib/data/about";
import type { BlogPost, BlogSummary, Project, ProjectSummary } from "@/lib/data/content";
import type { LegalDocument } from "@/lib/data/legal";

import { AUTHOR, SITE_NAME, SITE_URL } from "./config";

/**
 * JSON-LD structured data.
 *
 * A port of apps/seo/schema.py. The rules that module learned the hard way are
 * kept, and each is noted where it applies:
 *
 * - **Every date must be ISO 8601.** schema.org Date and DateTime properties
 *   are validated, and Google drops a property whose value it cannot parse --
 *   silently. That is why the data layer carries `*_iso` fields alongside the
 *   display month/year.
 * - **`sameAs` holds absolute URLs only.** The email address was once in there
 *   as a bare string, which browsers resolve against the current page; Google
 *   recorded "https://ridwaanhall.com/about/hi@ridwaanhall.com" as a profile
 *   link. It is published through `email` instead.
 * - **No `SearchAction`.** Advertising one made Google crawl
 *   "/search?q={search_term_string}" literally and log a 404. The sidebar
 *   search filters a fixed list client-side; there is no query URL to point at.
 */

export type JsonLd = Record<string, unknown>;

/** When the site first went live. `dateCreated` is a DateTime, so a bare date is invalid. */
const SITE_CREATED_ISO = "2025-03-16T00:00:00+07:00";

/**
 * Stand-in for `dateModified` where nothing real is tracked.
 *
 * Django used the current clock here, which is wrong twice over: it claims the
 * page changed on every request -- a page that always reports "just modified"
 * tells a crawler nothing -- and reading the clock inside a prerendered tree is
 * rejected outright under Cache Components. The build time is stable, honest
 * about when the page was actually generated, and known before prerendering
 * starts. Pages that *do* track a real modification date (legal documents, blog
 * posts, projects) use theirs instead.
 */
const BUILD_TIME_ISO = process.env.NEXT_PUBLIC_BUILD_TIME ?? SITE_CREATED_ISO;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Absolute profile URLs for `sameAs`, excluding the email address. */
function profileLinks(social: AboutData["social_media"]): string[] {
  return Object.entries(social)
    .filter(([platform, url]) => url && platform !== "email" && url.includes("://"))
    .map(([, url]) => url);
}

/**
 * ISO 8601 in the form Python's `datetime.isoformat()` produces for a
 * UTC-aware value: `2026-01-23T13:55:00+00:00`.
 *
 * `Date.prototype.toISOString()` gives `…T13:55:00.000Z` instead. Both are
 * valid ISO 8601 and denote the same instant, and schema.org accepts either --
 * but matching the existing output exactly keeps the comparison harness free of
 * noise, so that a *real* difference in a date stands out instead of being lost
 * among two hundred formatting diffs.
 */
const iso = (value: Date | string | null | undefined): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  const base =
    `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}` +
    `T${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`;
  // Python only prints a fractional part when it is non-zero.
  const ms = value.getUTCMilliseconds();
  return `${base}${ms ? `.${pad(ms, 3)}000` : ""}+00:00`;
};

/**
 * The date an education entry concluded, as ISO 8601.
 *
 * Newer rows carry real dates and give a year-month. Older ones only have a
 * free-text range like "2018 - 2021" -- the end year alone is valid ISO 8601
 * while the range itself is not.
 */
function educationEndIso(education: Education): string | null {
  const end = education.date?.end;
  if (end?.year) {
    const index = MONTHS.indexOf(end.month);
    return index >= 0
      ? `${end.year}-${String(index + 1).padStart(2, "0")}`
      : String(end.year);
  }
  const candidate = (education.years ?? "").split("-").pop()?.trim() ?? "";
  return /^\d{4}$/.test(candidate) ? candidate : null;
}

/**
 * The Person entity.
 *
 * Async because it needs the education and experience lists; both come from the
 * cache, so this costs nothing beyond the first build.
 */
export async function personSchema(about: AboutData): Promise<JsonLd> {
  const [education, experiences] = await Promise.all([getEducation(), getExperiences()]);

  const alumniOf = education.map((edu) => {
    const entry: JsonLd = {
      "@type": "EducationalOrganization",
      name: edu.institution,
      url: edu.website,
    };
    if (edu.degree) {
      entry.hasCredential = {
        "@type": "EducationalOccupationalCredential",
        name: edu.degree,
        dateReceived: educationEndIso(edu),
      };
    }
    return entry;
  });

  const workExperience = experiences.map((exp: Experience) => {
    const entry: JsonLd = {
      "@type": "OrganizationRole",
      roleName: exp.title,
      worksFor: { "@type": "Organization", name: exp.company, url: exp.website },
      description: exp.responsibilities.join(" "),
      employmentType: exp.employment_type,
      workLocation: exp.location,
    };
    if (exp.period.start_iso) entry.startDate = exp.period.start_iso;
    // A current role has no endDate at all, rather than an empty one.
    if (exp.period.end !== "Present" && exp.period.end_iso) entry.endDate = exp.period.end_iso;
    return entry;
  });

  const current = experiences.find((exp) => exp.is_current);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: about.name,
    url: SITE_URL,
    image: about.image_url,
    sameAs: profileLinks(about.social_media),
    jobTitle: current?.title ?? about.role ?? "Software Developer",
    worksFor: current
      ? { "@type": "Organization", name: current.company, url: current.website }
      : { "@type": "Organization", name: "Freelance" },
    description: about.short_description,
    email: about.social_media.email || "hi@ridwaanhall.com",
    alumniOf,
    knowsAbout: about.skills,
    workExperience,
  };
}

export function websiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    author: { "@type": "Person", name: AUTHOR },
    description:
      "Personal portfolio and blog showcasing software development projects, technical insights, and professional journey",
    inLanguage: "en-US",
    keywords: [
      "ridwaanhall", "ridwan halim", "software developer", "web development",
      "python", "django", "machine learning", "portfolio",
    ],
    // Deliberately no SearchAction -- see the module note.
    potentialAction: [
      { "@type": "ReadAction", target: `${SITE_URL}/blog/` },
      { "@type": "ViewAction", target: `${SITE_URL}/projects/` },
    ],
    mainEntity: {
      "@type": "Person",
      name: AUTHOR,
      url: SITE_URL,
      sameAs: [
        "https://github.com/ridwaanhall",
        "https://linkedin.com/in/ridwaanhall",
        "https://twitter.com/ridwaanhall",
      ],
    },
  };
}

export function blogSchema(about: AboutData, blogs?: (BlogPost | BlogSummary)[]): JsonLd {
  const schema: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${AUTHOR}'s Blog`,
    url: `${SITE_URL}/blog/`,
    author: { "@type": "Person", name: AUTHOR },
  };

  if (blogs?.length) {
    schema.blogPost = blogs.slice(0, 10).map((blog) => ({
      "@type": "BlogPosting",
      headline: blog.title,
      description: blog.description,
      image: blog.image_url ?? "",
      datePublished: iso(blog.created_at),
      dateModified: iso(blog.updated_at),
      author: { "@type": "Person", name: about.name, url: SITE_URL },
      // From the stored slug, not a re-slugified title -- the column is the
      // authority and cannot drift from it.
      url: `${SITE_URL}/blog/${blog.slug}/`,
      keywords: blog.tags,
    }));
  }
  return schema;
}

export function blogPostingSchema(blog: BlogPost, about: AboutData): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${blog.slug}/` },
    headline: blog.title,
    description: blog.description,
    image: blog.image_url ?? "",
    datePublished: iso(blog.created_at),
    dateModified: iso(blog.updated_at),
    author: {
      "@type": "Person",
      name: about.name,
      url: SITE_URL,
      image: about.image_url,
    },
    publisher: {
      "@type": "Person",
      name: about.name,
      logo: { "@type": "ImageObject", url: about.image_url },
    },
    keywords: blog.tags,
    wordCount: wordCount(blog),
    inLanguage: "en",
  };
}

/**
 * Words in a post's body.
 *
 * Django read `blog_data['word_count']`, a key the blog dict has never carried,
 * so it always emitted `wordCount: 0` -- a stated value that is simply wrong,
 * which is worse for a crawler than omitting the property. Counted from the
 * content blocks instead.
 */
function wordCount(blog: BlogPost): number {
  const text: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === "string") text.push(node);
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        // `class` holds CSS utilities, not prose.
        if (key !== "class") walk(value);
      }
    }
  };
  walk(blog.content);
  return text
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function softwareSourceCodeSchema(project: Project, about: AboutData): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: project.title,
    description: project.description.map(String).join(" "),
    url: project.demo_url ?? "",
    codeRepository: project.github_url ?? "",
    programmingLanguage: project.tech_stack.map((tech) => tech.name),
    author: { "@type": "Person", name: about.name, url: SITE_URL },
    dateCreated: iso(project.created_at),
    dateModified: iso(project.updated_at),
    license: "MIT",
    applicationCategory: "DeveloperApplication",
  };
}

export function collectionPageSchema(
  items: { title: string; slug: string }[],
  about: AboutData,
  collectionType: "projects" | "blog",
): JsonLd {
  const label = collectionType.charAt(0).toUpperCase() + collectionType.slice(1);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${about.name}'s ${label}`,
    description: `Browse through ${about.name}'s ${collectionType}`,
    url: `${SITE_URL}/${collectionType}/`,
    author: { "@type": "Person", name: about.name, url: SITE_URL },
    numberOfItems: items.length,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 10).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.title,
        url: `${SITE_URL}/${collectionType}/${item.slug}/`,
      })),
    },
  };
}

export function legalDocumentSchema(about: AboutData, document: LegalDocument): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: document.title,
    description: document.summary,
    url: `${SITE_URL}${document.url}`,
    inLanguage: "en",
    dateCreated: SITE_CREATED_ISO,
    // The document's own timestamp, so this reflects when the terms actually
    // changed rather than when the page happened to be rendered.
    dateModified: iso(document.last_updated),
    isPartOf: { "@type": "WebSite", name: `${about.name}'s Portfolio`, url: SITE_URL },
    publisher: { "@type": "Person", name: about.name, url: SITE_URL },
  };
}

export function breadcrumbSchema(crumbs: { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function contactPageSchema(about: AboutData): JsonLd {
  const social = about.social_media;
  const email = social.email;
  const contactPoints: JsonLd[] = [];

  if (email) {
    contactPoints.push({
      "@type": "ContactPoint",
      email,
      contactType: "customer service",
      availableLanguage: ["English", "Indonesian"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    });
  }
  if (social.linkedin) {
    contactPoints.push({
      "@type": "ContactPoint",
      url: social.linkedin,
      contactType: "customer service",
      availableLanguage: ["English", "Indonesian"],
    });
  }
  if (social.github) {
    contactPoints.push({
      "@type": "ContactPoint",
      url: social.github,
      contactType: "technical support",
      availableLanguage: ["English"],
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${about.name}`,
    description: `Get in touch with ${about.name} for professional inquiries, project collaborations, or technical discussions.`,
    url: `${SITE_URL}/contact/`,
    mainEntity: {
      "@type": "Organization",
      name: about.name,
      url: SITE_URL,
      logo: about.image_url,
      email,
      sameAs: profileLinks(social),
      contactPoint: contactPoints,
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "17:00",
          validFrom: "2024-01-01",
          validThrough: "2025-12-31",
        },
      ],
      availableLanguage: ["English", "Indonesian"],
    },
    author: {
      "@type": "Person",
      name: about.name,
      url: SITE_URL,
      image: about.image_url,
      jobTitle: about.role || "Software Developer",
      email,
      sameAs: profileLinks(social),
    },
    dateCreated: SITE_CREATED_ISO,
    dateModified: BUILD_TIME_ISO,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: `${about.name}'s Portfolio`, url: SITE_URL },
  };
}

export async function profilePageSchema(about: AboutData): Promise<JsonLd> {
  const [person, certifications, awards] = await Promise.all([
    personSchema(about),
    getCertifications(),
    getAwards(),
  ]);

  person.hasCredential = certifications.map((cert: Certification) => ({
    "@type": "EducationalOccupationalCredential",
    name: cert.title,
    url: cert.credential_url,
    credentialCategory: "certification",
    recognizedBy: { "@type": "Organization", name: cert.institution, url: cert.website },
    // ISO 8601, not "Jul 2025" -- validFrom is a Date property.
    validFrom: cert.issued_iso,
    description: cert.achievements.join(" "),
  }));

  person.award = awards.map((award) => ({
    "@type": "Award",
    name: award.title,
    description: award.description,
    // ISO 8601, not "Feb 2020" -- dateReceived is a Date property.
    dateReceived: award.issued_iso,
    awardingOrganization: { "@type": "Organization", name: award.institution, url: award.website },
    url: award.credential_url,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${about.name}'s Professional Profile`,
    description: `Professional profile showcasing ${about.name}'s experience, education, certifications, and achievements`,
    url: `${SITE_URL}/about/`,
    mainEntity: person,
    author: { "@type": "Person", name: about.name, url: SITE_URL },
    dateCreated: SITE_CREATED_ISO,
    dateModified: BUILD_TIME_ISO,
    inLanguage: "en",
  };
}

/**
 * The privacy policy page.
 *
 * `dateModified` comes from the document row, not the clock. Django used the
 * clock here while using the row's own timestamp for every *other* legal
 * document -- an inconsistency, and the clock version told a crawler the policy
 * changed on every request.
 */
export function privacyPolicySchema(about: AboutData, document?: LegalDocument | null): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    name: "Privacy Policy - ridwaanhall.com",
    description:
      "Comprehensive privacy policy outlining how we collect, use, and protect your personal information on ridwaanhall.com",
    url: `${SITE_URL}/privacy-policy/`,
    dateCreated: SITE_CREATED_ISO,
    dateModified: document ? iso(document.last_updated) : BUILD_TIME_ISO,
    inLanguage: "en",
    publisher: {
      "@type": "Person",
      name: about.name,
      url: SITE_URL,
      email: about.social_media.email,
      image: about.image_url,
    },
    author: {
      "@type": "Person",
      name: about.name,
      url: SITE_URL,
      email: about.social_media.email,
      jobTitle: about.role || "Software Developer",
    },
    isPartOf: { "@type": "WebSite", name: `${about.name}'s Portfolio`, url: SITE_URL },
    audience: { "@type": "Audience", audienceType: "Website Users" },
    jurisdiction: "Global",
    keywords: [
      "privacy policy", "data protection", "user privacy", "personal information",
      "data collection", "cookie policy", "GDPR compliance",
    ],
    mainEntity: {
      "@type": "Organization",
      name: about.name,
      url: SITE_URL,
      contactPoint: {
        "@type": "ContactPoint",
        email: about.social_media.email,
        contactType: "customer service",
      },
    },
  };
}

export type { ProjectSummary };
