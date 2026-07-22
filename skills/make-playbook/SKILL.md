---
name: make-playbook
description: >-
  Indie maker playbook for bootstrapped apps inspired by Pieter Levels' MAKE:
  The Indie Maker Blueprint. Use when a user is starting or sizing an app idea,
  choosing what to build next, building a minimal product, preparing a launch,
  diagnosing stalled growth, deciding pricing or monetization, automating
  operations, maintaining a per-app MAKE.md tracker, or evaluating whether to
  sell a product.
---

# MAKE Playbook

Use this skill as a stage-specific operating system for solo and bootstrapped
software products. It is an original checklist and diagnostic system inspired by
Pieter Levels' *MAKE: The Indie Maker Blueprint*; it is not a substitute for the
book. Keep attribution intact when reusing the references.

## Stage Model

Idea -> Build -> Launch -> Grow -> Monetize -> Automate -> Exit

Always treat `references/ethos.md` as the standing frame for bootstrapping,
persistence, and ethical constraints. Load it once per session when it has not
already been read. Its constraints override stage tactics: no fake engagement,
fake reviews, dishonest growth hacks, user-hostile monetization, or selling user
data.

## Workflow

1. Identify the app and current stage. If the user has not named the app or the
   current situation, ask one concise question. If a `MAKE.md` file exists in
   the project root, read it first because it may already contain this state.
2. Load the current stage reference. Load one adjacent stage when the question
   is on a boundary, such as build/launch for "is this ready to launch" or
   grow/monetize for "traffic but no revenue."
3. Apply the reference to the user's specific app. Use the diagnostic questions
   at the end of each reference to get missing facts, then convert the checklist
   into a concrete action list for this product and this week.
4. Push toward shipping. When the user is stuck in abstraction, give the
   smallest next action that creates market evidence.
5. Offer to create or update a tracker. For a new app, copy
   `templates/make-tracker.md` to the project root as `MAKE.md` and fill in
   what is known. For an existing `MAKE.md`, update the relevant section as
   decisions are made.
6. End with action, not advice. Close every response with a short, time-boxed
   next step unless the user explicitly requested only analysis.

## Reference Routing

| User situation | Load |
| --- | --- |
| "I do not know what to build", idea feels broad, niche is unclear | `references/idea.md` |
| Stuck choosing stack, overbuilding, outsourcing before proof | `references/build.md` |
| Built something but nobody knows, launch plan is vague | `references/launch.md` |
| Traffic plateaued, retention unclear, growth depends on paid ads | `references/grow.md` |
| Users but no revenue, pricing/model is unclear | `references/monetize.md` |
| Revenue exists but founder is the bottleneck | `references/automate.md` |
| Acquisition offer, sale timing, valuation, or diligence questions | `references/exit.md` |

## Tracker Handling

- Prefer `MAKE.md` in the project root for per-app state.
- Preserve user-written sections and update only the stage details relevant to
  the conversation.
- Keep the tracker factual: current stage, niche, decisions, launch dates,
  pricing, repeat tasks, and post-mortem notes.
- When copying the template, replace obvious placeholders rather than leaving a
  blank scaffold if the conversation already contains the answers.

## Response Shape

For most requests, return:

1. Stage diagnosis in one or two sentences.
2. The key constraints or evidence gaps.
3. A numbered plan of concrete actions.
4. Tracker updates made or recommended.
5. The next action to take today or this week.
