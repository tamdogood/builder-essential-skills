# Technical SEO + distribution: get the post found and linked

`angles.md` covers not cannibalizing your own posts. This file covers the on-page mechanics
that make a single post rank, and the distribution loop that gets it the first backlinks so
it can rank at all. Ranking is on-page correctness times off-page signal; skip either half
and the post sits on page 5.

## On-page: one primary phrase, placed deliberately

Pick one primary keyword phrase per post, the exact string a developer in your audience
would type into a search box. Favor:

- **Real error strings** (an exact message a user would paste): low volume, near-zero
  competition, high intent. These are the cheapest wins.
- **Concept phrases** (the plain name of the thing your post explains).
- **Comparison phrases** ("X vs Y", "alternative to Z").

Avoid brand-y phrases nobody searches ("the such-and-such paradigm"). You cannot rank for
demand that does not exist.

Place the primary phrase in all four of these, or the post is under-optimized:

1. The post `title` (the `<title>` and OG title derive from it).
2. The description / standfirst (the meta description and search snippet). Front-load the
   phrase; make it a promise.
3. The first H2 in the body.
4. The tags/keywords (these become the JSON-LD `keywords`).

Use secondary phrases naturally in later H2s. Do not stuff; modern ranking reads for
coverage of a topic, not keyword density. One clear primary plus honest depth beats
repetition.

## On-page: the structural signals

- **Sentence-case headings that are claims**, not labels. They double as the spine (see
  `craft.md`) and as the outline Google reads.
- **Deep-linkable H2s.** Every H2 needs an `id` so sections can be shared and can
  win their own snippet.
- **Internal links: 2 to 3 per post**, to sibling posts by `/blog/<slug>`, using descriptive
  anchor text ("how agents hand off code", not "click here"). This is the single most
  under-used lever here. It flows ranking between your posts and keeps readers on-site.
  Reciprocate: when you ship a post, add one inbound link to it from the most related
  existing post.
- **One outbound link to an authority** (the MCP spec, a paper, a repo) signals the post is
  situated in real work, not a content mill.
- **Reading time and date** are already wired; keep them honest.

## Verify the machine-readable SEO actually emitted

On many blog systems the sitemap, RSS, per-post OpenGraph + Twitter cards, and `BlogPosting`
JSON-LD auto-derive from the post's registry/frontmatter entry, so wiring the entry is most
of the job. But verify it, do not assume. After your site's build command, serve the site
locally and check:

- The sitemap returns 200 and contains the new `<loc>` for the slug.
- The RSS feed returns 200 and lists the new post.
- View source on `/blog/<slug>` and confirm: `<meta name="description">` matches the
  description, `og:title` / `og:image` / `twitter:card` are present, and the
  `application/ld+json` `BlogPosting` block has the right headline, datePublished, author,
  and keywords.
- The cover image returns 200. A broken OG image kills the click-through on every social
  share.

If any of these is wrong, the SEO surface is broken even though the build was green. This
step is not optional; it is the difference between a post that gets indexed well and one
that gets a bad snippet.

## Off-page: the distribution loop (this is what actually earns traction)

A technically perfect post with zero inbound links does not rank. Google needs a signal
that the page matters. You seed that signal yourself:

1. **The X thread.** If `/x-tweet` is available in your environment, run it on the post's
   core insight. The thread is not "new blog post link", it teaches the one sharp idea and
   links the post as the deep-dive. One genuinely useful thread out-performs ten "check out
   my article" posts. Link the exact post URL (`<your-site-url>/blog/<slug>`), not the
   homepage.
2. **The comment-where-the-question-lives play.** The post usually answers a real question
   people ask (on Hacker News, the relevant subreddits, GitHub discussions, Lobsters). When
   that question comes up, answer it for real and link the post as the fuller answer. Do not
   drive-by drop links; that gets flagged and does the brand harm.
3. **Cross-link from the repo.** Reference the post from the relevant docs and, when apt,
   the README. Repo-to-post links are backlinks Google trusts and they route repo traffic to
   the site.
4. **Update, do not abandon.** When a post's facts change (a deferred feature ships, a
   number moves), edit the post and bump nothing else. Fresh, accurate posts hold rank;
   stale ones decay. Keeping the plain-markdown source makes this easy.

## Going deeper on SEO fundamentals

The rules above are the blog-specific subset. For the full SEO surface (structured-data
schema choices, exhaustive OG/Twitter tag coverage, canonical and hreflang patterns, and
Core Web Vitals), lean on the `astro-seo` skill, invocable as `/astro-seo` and published as
`astro-seo-expert` at https://mcpmarket.com/tools/skills/astro-seo-expert. It is written for
Astro, so ignore its Astro-specific integration code (`Astro.site`, `@astrojs/sitemap`,
`@astrojs/rss`). What transfers cleanly and is worth pulling in:

- **Structured-data recipes.** Which JSON-LD `@type` to emit and the required fields, beyond
  the `BlogPosting` most blog systems emit (for example `BreadcrumbList`, `Person` author,
  `Organization` publisher). Verify the values it recommends against what your build actually
  emits (see the verify step above).
- **Meta-tag completeness.** The full Open Graph and Twitter Card checklist to confirm every
  card renders when the post is shared.
- **Canonical and hreflang.** The canonical-URL discipline (point at the production host, one
  canonical per page) maps onto whatever metadata layer your site uses.
- **Core Web Vitals.** The LCP/CLS/INP guidance is framework-agnostic. A fast post page keeps
  the bounce down and helps rank.

Treat it as the reference textbook and `seo.md` as the house checklist: when they disagree on
a blog-specific call (internal-link count, keyword placement), `seo.md` wins.

## The public URL

Outward links point at your canonical production domain, never a staging or preview host.
Use the production domain in the thread, in cross-links, and anywhere a human will see it, so
link equity accrues to the canonical host.
