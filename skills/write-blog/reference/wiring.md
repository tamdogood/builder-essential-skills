# Publish and wire the post into your site

Blog systems differ (static site generators like Astro, Hugo, Eleventy, Next.js, or Jekyll;
a CMS; or a plain markdown/frontmatter blog), but the wiring steps are the same everywhere.
Do them in this order.

## 1. Register the post in your site's index

Add the post to whatever your blog uses to list published posts: a registry file, a content
collection, a CMS entry, or the frontmatter that a content directory is scanned for. On many
systems all SEO surfaces (sitemap, RSS, per-post OpenGraph + Twitter cards, and the
`BlogPosting` JSON-LD) auto-derive from this metadata, so you do not wire them separately.
Whatever the mechanism, the entry needs at least:

- `slug` — kebab-case, matches the body file and the source markdown.
- `title` — sentence case, no dashes.
- `description` / standfirst — one to two sentences. This is your meta description, so
  front-load the keyword phrase and make it read like a promise, not a summary.
- `date` — ISO, drives the `<time>` element and sort order (and a human label if your system
  wants one separately).
- `readingTime` — honest.
- `author`.
- `tags` / keywords — these typically become the JSON-LD keywords.
- `cover` — path to the cover image.

## 2. Add the body in your blog's format

Write the post body in whatever format your blog renders: a markdown/MDX file, a template, a
component, or a CMS rich-text field. Whatever the format:

- Give H2s an `id` so they can be deep-linked.
- Use real links (not "click here"), and link to 1-2 related posts by `/blog/<slug>` for
  internal SEO.
- Quote real code from your project accurately.

Copy the structure of an existing post rather than inventing a new layout.

## 3. Make sure the SEO surfaces include the new post

Confirm the sitemap, RSS feed, per-post OpenGraph + Twitter cards, and `BlogPosting` JSON-LD
all pick up the new post. On systems where these auto-derive from the index entry (step 1),
there's nothing extra to do but verify. On systems where they don't, add the post to each
surface by hand. The page should fail loudly (a 404 / not-found) if the post is registered
but its body is missing, or vice versa, so make sure both halves are present.

## 4. Drop the prose source

Keep the plain-markdown draft you wrote and humanized in your blog's source directory
permanently. It's the source of truth for the prose; whatever your site renders is the
rendered form. If your blog already authors directly in markdown, this and step 2 are the
same file.

## 5. Cover image

Add the cover image where your site serves post assets. SVG or a raster image is fine. Match
your site's brand palette. If you can't produce a good one, reuse an existing cover rather
than shipping something ugly. A broken OG image kills the click-through on every social
share.

## Verify

Your site's build command must be green. Then serve the site and smoke-test that these all
load and include the new post: the post page `/blog/<slug>`, the cover image, the blog index
(the new card shows), the sitemap, and the RSS feed. Re-run `bash check.sh` on the post's
markdown source.

## Example: Next.js

As one concrete illustration, a Next.js site might wire a post like this (adapt to your own
stack):

- Register metadata by adding an entry to the top of a `POSTS` array in `web/lib/blog.ts`
  (newest first). All SEO surfaces auto-derive from it.

  ```ts
  {
    slug: "your-slug",
    title: "Sentence case, no dashes",
    dek: "One-to-two sentence standfirst that front-loads the keyword phrase.",
    date: "2026-07-DD",
    dateLabel: "July D, 2026",
    readingTime: "N min read",
    author: "Your Name",
    tags: ["Primary keyword", "Secondary"],
    cover: "/blog/your-slug.svg",
  },
  ```

- Write the body as a React component in `web/components/blog/<slug>.tsx`, using shared prose
  primitives (`ArticleH2`, `P`, `Lead`, `CodeBlock`, `A`, ...) from `components/blog/prose.tsx`
  so every post renders identically.

  ```tsx
  import { Lead, P, ArticleH2, A, InlineCode, CodeBlock } from "./prose";

  export function YourPostName() {
    return (
      <>
        <Lead>The opening that names a concrete, specific problem.</Lead>
        <ArticleH2 id="the-problem">The problem, plainly</ArticleH2>
        <P>...</P>
        <CodeBlock language="rust">{`// real code, quoted accurately`}</CodeBlock>
      </>
    );
  }
  ```

- Register the body in `web/app/blog/[slug]/page.tsx`: import the component and add
  `"your-slug": <YourPostName />,` to the `BODIES` map. The page falls back to `notFound()`
  if either the `POSTS` entry or the `BODIES` line is missing.
- Keep the prose source in `docs/blog/<slug>.md` and the cover in `web/public/blog/<slug>.svg`.
- Verify with `npm run build` (must be green), then `next start` and confirm 200s for
  `/blog/<slug>`, the cover, `/blog`, `/sitemap.xml`, and `/rss.xml`.
