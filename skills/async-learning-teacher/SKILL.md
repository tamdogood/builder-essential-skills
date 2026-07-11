---
name: async-learning-teacher
description: Transform saved links, papers, articles, posts, videos, and reference collections into approachable AI teaching artifacts for later study. Use when a user wants to queue learning material, create a readable explanation from a source, teach a paper or post step by step, or run an interactive tutor that validates understanding over multiple sessions.
---

# Async Learning Teacher

## Mission

Convert raw learning captures into approachable teaching artifacts so a user can queue interesting resources now and study them later with less friction than reading the original source cold.

Use this skill for:

- Single links: blog posts, essays, papers, tweet threads, videos, documentation pages, or notes.
- Reference sets: 5-10+ links about one domain or topic.
- User-supplied pasted text when a link is unavailable, paywalled, deleted, or hard to scrape.
- Ongoing tutoring sessions where the agent should validate understanding before moving forward.

## Modes

Choose one mode from the user's request.

### Quick Teaching

Use `quick-teach` for one source or a small tightly related set of sources.

Intent:

```markdown
Teach me this resource. Break it down step by step. Write each step like a chapter in a book. Write it all out at once. For subtle or difficult concepts, break things down further and use examples.
```

Produce a complete teaching artifact in one response or one saved document.

### Interactive Tutor

Use `interactive-tutor` for broad topics, reference collections, or requests that explicitly ask to validate understanding.

Intent:

```markdown
Resources:
[reference links or pasted excerpts]

I would like you to teach me about [topic]. Presume I understand [baseline]. Build up my understanding from scratch step by step. Do not move to the next step without validating my current understanding. For subtle or difficult concepts, break things down further and use examples.
```

Teach one step at a time. Stop at the end of each step and ask the user to explain their understanding or answer validation questions before continuing.

Default mode selection:

- One link or one source: `quick-teach`.
- Multiple references plus a broad topic: `interactive-tutor`.
- User says "quiz me", "validate me", "teach me over time", or "do not move on": `interactive-tutor`.

## Workflow

1. Parse the user's capture:
   - Source URLs
   - Pasted source text
   - Topic
   - User's stated baseline knowledge
   - Desired output location or format, if any
   - Requested mode, if any

2. Inspect the source when possible:
   - Fetch or read available content.
   - If access is unavailable, use the URL, title, abstract, snippet, or pasted user context.
   - Clearly mark inaccessible or unverified source material.

3. Create the teaching artifact:
   - Use `quick-teach` for one-shot explanations.
   - Use `interactive-tutor` for staged learning and validation.
   - Preserve original source links and enough metadata for the user to revisit them.

4. Save or return the result according to the user's environment:
   - If the user names a destination, write there.
   - If the environment has a notes app, knowledge base, or file system convention, follow that convention.
   - If no destination is specified, return the artifact in Markdown and suggest a clear filename.

5. Report:
   - What was processed
   - Where it was saved, if applicable
   - Any validation gaps or follow-up questions

## Quick Teaching Output

Use this structure unless the user asks for another format:

```markdown
# [Resource Title] - Teaching Notes

## Source
- [Original link or citation]

## Why This Matters
-

## Prerequisites
-

## Chapter 1 - [Concept]
...

## Chapter 2 - [Concept]
...

## Subtle Points
-

## Examples
-

## What To Remember
-

## Follow-Up Questions
-

## Validation Gaps
-
```

Quality bar:

- Build from first principles.
- Prefer chapter-style explanation over bullet-only summaries.
- Explain jargon before relying on it.
- Use examples for subtle or abstract ideas.
- Separate what the source claims from what the agent infers.
- Include "Validation Gaps" for inaccessible pages, unclear claims, stale information, missing context, or uncertain interpretation.

## Interactive Tutor Output

Use this structure for the first response or saved checkpoint:

```markdown
# [Topic] - Interactive Tutor

## Resources
- [Link or citation]

## Assumed Baseline
-

## Learning Path
1. [Step]
2. [Step]
3. [Step]

## Current Step
### Step 1 - [Concept]
...

## Validation Questions
1. ...
2. ...
3. ...

## Continue When
Reply with your explanation of the current step. I will check it, correct misunderstandings, and only then move to the next step.

## Session Log
- [Date/time if available] Started at Step 1.

## Validation Gaps
-
```

When continuing an interactive tutor:

- Read the previous checkpoint if available.
- Evaluate the user's answer against the current step.
- Correct misunderstandings directly and kindly.
- If understanding is sufficient, advance one step.
- If not, reteach the same step with a different example.
- Keep a concise session log of what was understood and what remains unclear.

## Safety And Source Handling

- Do not claim to have read inaccessible content.
- Do not hide uncertainty. Mark gaps explicitly.
- Do not treat generated explanations as source-grounded facts unless they are supported by the source or reliable background knowledge.
- For medical, legal, financial, safety-critical, or current-events content, verify against authoritative current sources before presenting advice or conclusions.
- For copyrighted material, summarize and explain rather than reproducing long passages.

## Good Artifact Traits

- The result should feel easier to start than the original source.
- The explanation should meet the user at their stated level.
- The output should preserve enough links, context, and questions to support later follow-up.
- The artifact should be useful even if read days or weeks after capture.
