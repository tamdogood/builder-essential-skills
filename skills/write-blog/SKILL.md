---
name: write-blog
description: >-
  Write and ship a blog post for your project that reads like a human wrote it and pulls
  SEO traffic to your site. Use when a contributor wants to draft, edit, or publish a blog
  post, add a post to the site, write about the project for search/traction, or make an
  existing draft sound less like AI. Enforces the house voice (no em dashes), picks a
  non-cannibalizing angle, uses ASD-STE100 Simplified Technical English for technical
  prose, wires the post into your site, and runs the humanizer pass before shipping.
compatibility: claude-code
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
---

# Write a blog post

You are helping a contributor write a blog post for the project's website. The bar: it
reads like a person wrote it, it ranks for a search cluster no other post already owns,
and it ships wired correctly into the site with the build green.

Use ASD-STE100 Simplified Technical English (STE) for the post's technical and
instructional prose. Use short, direct sentences, consistent terms, clear actions, and
the approved meaning of technical words when the STE dictionary is available. Do not use
idioms, slang, figurative language, or synonym changes that can make a technical term
unclear. Preserve exact code, commands, identifiers, product names, and quotations.
The post can keep a human opinion and a concrete example, but clarity takes priority over
rhythm or decoration. Do not claim strict STE conformance without checking the current
ASD-STE100 issue and dictionary.

This skill exists so every contributor writes in the same voice, picks non-overlapping
topics, and passes the same anti-AI-slop gate, whether or not they already know the house
rules.

## The one rule that gets a post rejected

**No em dashes (—) or en dashes (–). Ever.** The house voice bans them. Use a period, a
comma, or "so"/"because"/parentheses instead. A single dash in a draft is a hard fail.
There is a scanner: run `bash check.sh <file>` (in this skill's folder) on any draft before
you call it done.

## Workflow

Do these in order. Don't skip the angle check or the humanizer pass.

### 1. Read the ground truth first

Before writing a word, read what already exists so you match voice and don't cannibalize
keywords:

- **Your site's post registry / index.** Whatever lists every published post (a registry
  file, a content collection, a CMS list, or the frontmatter across your blog's source
  directory). This is the **live record of every published post and the angle it owns.**
  Read every slug, title, description, and tag set.
- One or two full published posts (the prose sources) to absorb the voice.
- `reference/angles.md` (in this skill folder) for how to pick an angle that doesn't
  collide, plus the topics still untapped.
- `reference/voice.md` for the house voice and the anti-AI checklist, self-contained.
- `reference/craft.md` for the writing craft: leads that win the click, spine structure,
  and which creative-writing skill to reach for at each stage.
- `reference/seo.md` for on-page keyword placement, internal linking, verifying the
  machine-readable SEO, and the post-ship distribution loop that earns the first backlinks.

### 2. Pick and pitch the angle

Every post must **own a distinct search cluster.** Two posts fighting for the same
keywords cannibalize each other. From your post index and `reference/angles.md`, pick an
angle no shipped post already owns, then pitch it back to the contributor in one line
before drafting: the working title, the one-sentence thesis, and the 3-5 keyword phrases it
targets. Confirm before you write the body. If they gave you a topic that collides with an
existing post, say so and propose the adjacent-but-distinct angle instead.

### 3. Outline

A good post has a spine, not a listicle. Read `reference/craft.md` before you outline; the
lead and the H2-spine are 80% of whether the post gets finished and ranked. Structure:

- **A lead (description + opening) that names a concrete, specific problem** the reader has.
  Not "AI agents are transforming collaboration." Something like "Two agents can talk about
  a change all day. Handing over the change itself, byte for byte, is a different problem."
- 4-7 sections, each with a claim and **real code, real commands, or a real number from
  your project** backing it. Read the actual source and docs of your project and quote it
  accurately. Made-up APIs are worse than no code.
- A "what this is NOT" or honest-limitations beat. The voice is a little contrarian and
  admits what's deferred. That honesty is what makes it not read like marketing.
- A close that lands the thesis without a generic "in conclusion, the future is bright"
  wrap-up. End on a concrete thing the reader can do or check.

### 4. Draft

Write the prose as plain markdown first, in your blog's source directory (the source of
truth). Follow `reference/voice.md`, `reference/craft.md`, and the STE guidance above as
you write. Keep it honest, concrete, and grounded in real project code. Use one clear
opinion and support it with evidence. If `/direct-response-copy` is available in your environment, run it
on the title, description, and closing CTA (only those three surfaces, not the body).

### 5. Humanize (mandatory)

Run a humanizer pass on the draft: if `/humanizer` is available in your environment, invoke
it on the draft. If it isn't available, apply the checklist in `reference/voice.md`
yourself. Then run an STE pass. Check sentence length, clear subjects and actions,
consistent technical terms, approved word meanings when available, and intentional
exceptions. Strip: significance inflation, promotional adjectives, the rule of three,
"-ing" tail analyses, negative parallelisms ("it's not X, it's Y"), synonym cycling,
hedging, and every dash. For headline/description/CTA polish you may also pull in
`/direct-response-copy` if it's available.

Then run `bash check.sh <draft-file>` and fix anything it flags.

### 6. Wire it into the site

Follow `reference/wiring.md`. In short: register the post in whatever index/registry your
blog uses, add the body in your blog's format, make sure the SEO surfaces (sitemap, RSS,
OG/Twitter cards, JSON-LD) include the new post, add the cover image, and build. For keyword
placement (title/description/first-H2/tags), internal-link count, and anchor-text rules,
follow `reference/seo.md`. Add a reciprocal inbound link from the most related existing post.

### 7. Verify before done

Your site's build command must be green. Then smoke-test the post: confirm the post page,
the cover image, the blog index, the sitemap, and the RSS feed all load and include the new
post. View source on the post and confirm the meta description, OG/Twitter tags, and
`BlogPosting` JSON-LD actually emitted with the right values (`reference/seo.md` lists what
to check). Re-run `bash check.sh` on the final markdown. Only then is the post itself done.

### 8. Distribute (this is what earns the traction)

A correct post with no inbound links does not rank. After it ships, seed the first signal:
if `/x-tweet` is available in your environment, run it on the post's core insight for a
thread that teaches the idea and links the post; cross-link the post from the relevant docs;
and answer the real question it solves where people are already asking it. See the
distribution loop in `reference/seo.md`. Always link the canonical production URL
(`<your-site-url>/blog/<slug>`), never a staging or preview host.

## Guardrails

- Never invent project APIs, flags, or numbers. Read the source and quote it.
- Never weaken the house voice to sound "professional." Concrete and a little contrarian
  beats polished and generic every time.
- Use STE for technical and instructional prose. Do not use figurative language or
  decorative wording when it can reduce technical clarity.
- Don't ship a post whose angle overlaps a published one. Adjust the angle instead.
- Covers can be SVG or a raster image. Match your site's brand palette. If you can't make a
  good cover, reuse an existing one rather than shipping something ugly.

## Note on this skill's own files

The scanner will flag `SKILL.md` and the `reference/` files because they name the banned
characters `(—)` `(–)` and use `→` as teaching notation. That's expected. The scanner is
for blog drafts and rendered post bodies, not for this skill's documentation.
