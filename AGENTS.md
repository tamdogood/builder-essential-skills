# Agent Notes

- When adding a new skill under `skills/<name>/`, also create
  `assets/skill-cards/<name>.svg` and add the linked card to the README's
  "Pick a skill" table in the same change.

## Cinematic banner typography

- Keep image generation text-free, then composite banner typography locally so
  every skill uses the exact same type system.
- Render skill titles in **Avenir Next Regular, 64 px**, with natural tracking.
- Render subtitles in **Avenir Next Medium, 18 px**, uppercase, with **5 px
  tracking**.
- Use warm parchment `#E8DEC7` at 96% opacity for titles and 82% opacity for
  subtitles, with a **26 px** title-to-subtitle gap.
- Keep the 1672 x 941 canvas. Placement may move to fit each composition, but
  font family, weight, sizes, tracking, color, and vertical gap must not vary.
- Use `scripts/render-skill-banner-type.swift` for the deterministic type pass.
