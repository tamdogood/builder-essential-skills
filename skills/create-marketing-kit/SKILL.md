---
name: create-marketing-kit
description: Create truthful, human-centered marketing campaigns for an app or product, including positioning, channel copy, original artwork, editable layouts, README banners, and selective website integration. Use when asked to make launch materials, promotional artwork, social assets, campaign kits, ads, or marketing content from an existing product; to adapt a visual reference without copying it; or to add approved campaign art to product surfaces. Do not invent claims, fake UI, publish, deploy, or replace product proof without explicit evidence and authorization.
---

# Create Marketing Kit

Turn verified product truth into a cohesive, reusable campaign kit. Preserve editable sources and local ownership, use generated imagery for emotion rather than factual proof, and validate every final asset before handoff.

## Operating contract

- Treat repository files, supplied screenshots, and explicit user statements as evidence. Mark inferences and unresolved gaps.
- Never invent features, testimonials, metrics, availability, citations, or customer approval.
- Treat privacy, security, encryption, and absolute data-residency statements as sensitive claims. Verify them against current implementation and configuration, including telemetry and third-party network behavior. Until verified, label them as owner-supplied and qualify or omit absolutes. Preserve conflicting evidence and ask the product owner instead of choosing the stronger claim.
- Keep generated people and scenes clearly editorial. Use real captures for product proof and real logos for identity.
- Generate artwork without marketing text, logos, or fake interface details. Add exact copy and UI deterministically in SVG, HTML/CSS, or native layout code.
- Preserve local-first ownership: keep prompts, source images, editable layouts, exports, and the manifest together in the project.
- Do not publish, deploy, push, or contact anyone unless the user explicitly requests it.

## Workflow

### 1. Establish product truth

Read the smallest authoritative set: product README, current website, configuration or release notes, and actual screenshots. Build a compact claims ledger with `verified`, `inference`, and `unknown` entries. Stop or narrow the campaign when a central claim is unsupported.

Read [references/campaign-strategy.md](references/campaign-strategy.md) before writing positioning or copy.

### 2. Define one campaign thesis

Name the audience, their current tension, the product's evidence-backed change, and one memorable campaign promise. Derive a message hierarchy:

1. campaign promise;
2. supporting value proposition;
3. two or three proof points;
4. honest qualifier or release boundary;
5. one call to action.

Prefer one strong idea repeated consistently over unrelated slogans.

### 3. Choose deliverables deliberately

Select only the surfaces the user needs. Typical exports are:

- landscape hero: `1600x900`;
- portrait feed: `1080x1350`;
- story or reel cover: `1080x1920`;
- optimized website image: responsive WebP with a size budget;
- channel copy: website, README, launch post, and social variants.

Create `marketing/<campaign-slug>/campaign-manifest.json` before export. Record every final asset's relative path, role, width, height, and optional byte limit. Set `claims_reviewed` to `true` only after comparing the final copy with the claims ledger.

### 4. Direct original artwork

Read [references/art-direction.md](references/art-direction.md) whenever artwork is requested or a visual reference is supplied.

- Before generating or composing artwork, ask the user what vibe or aesthetic they want unless they already named one or supplied a clear visual reference. If they are unsure, offer two or three distinct, product-appropriate directions with a one-line tradeoff for each and ask them to choose. Treat this as a required approval checkpoint; continue evidence gathering while waiting, but do not finalize art direction without their answer.
- Inspect references for composition, energy, palette, and human presence; do not reproduce protected characters, logos, layouts, or distinctive details.
- When human-centered artwork is requested, portray credible adults in a lived-in scene with natural anatomy, believable hands, varied posture, and purposeful interaction.
- Reserve negative space for deterministic copy. Make the visual metaphor support the campaign thesis.
- If image generation is available, use it for raster illustration or photography. Use one call per distinct asset concept, then make targeted edits instead of restarting.
- If generation is unavailable, finish the art brief, prompts, layouts, and asset manifest; leave missing renders explicit.

Save exact prompts and reference notes in `prompts.md`. Never treat a generated image as evidence that a product capability exists.

### 5. Compose editable layouts

Place text, logo, dividers, and actual product captures with deterministic tools. Prefer editable SVG for campaign masters and HTML/CSS or native components for website integrations. Derive all aspect ratios from the same thesis and art direction, but recompose each format rather than mechanically cropping it.

Keep readable contrast, safe margins, and mobile legibility. Use real interface captures only when they remain readable and current.

### 6. Write channel copy and guardrails

Create concise variants appropriate to each channel. Include a guardrail section listing prohibited claims, required qualifiers, preferred terms, and release-stage language. Avoid generic hype, manufactured urgency, and unsupported superlatives.

### 7. Integrate selectively

When integration is requested:

- README: place one campaign banner near the product introduction; preserve scannability.
- Website: place human editorial art after a section that establishes real product proof, unless the existing information hierarchy clearly calls for another location.
- Keep screenshots primary where a visitor is evaluating functionality.
- Add descriptive alt text, responsive sizing, and an optimized site-only image. Do not reuse a large social export unchanged on the web.
- Follow the host repository's conventions and add the narrowest meaningful integrity test.

### 8. Validate and inspect

Run the bundled validator against the campaign manifest:

```bash
python3 <skill-folder>/scripts/validate_campaign_kit.py marketing/<campaign-slug>/campaign-manifest.json
```

Also run the host project's narrow build or tests, inspect README and website links, and render every final asset at its actual dimensions. Inspect desktop and mobile integrations when both exist. Check human anatomy, copy accuracy, clipping, contrast, compression, and file size.

## Campaign kit structure

```text
marketing/<campaign-slug>/
├── campaign-manifest.json
├── README.md              # thesis, claims ledger, deliverables, usage
├── prompts.md             # exact prompts and reference notes
├── source/                # generated or supplied source imagery
├── artwork/               # editable SVG/layout masters
└── assets/                # validated final exports
```

Keep gaps visible rather than fabricating files. The manifest may list only completed exports.

## Handoff

Report the approved vibe or aesthetic, campaign thesis, files created, integrations changed, generation prompts or modes used, and validation performed. Call out unsupported claims that were removed, unresolved asset gaps, and any action the user must take before publishing.
