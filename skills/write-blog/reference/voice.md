# House voice, ASD-STE100, and anti-AI checklist

This is self-contained: you can enforce it even if the `/humanizer` command isn't loaded.
But if `/humanizer` is available, run it too. This file is the house-specific layer on top
of it.

## What a good post sounds like

- **Human and a little contrarian.** It has an opinion and defends it. It's willing to say
  "most guides get this wrong" and then show why.
- **Honest about what's deferred.** It names the limitations and the things not built yet.
  That candor is the reason it doesn't read like a press release.
- **Concrete, always.** Every claim is backed by real code from the project, a real command,
  or a real number. Read the source before you describe it.
- **Clear rhythm.** Use short sentences. Combine sentences only when the relationship is clear.
- **First person when it fits.** "We shipped this and it broke in production" beats "the
  system experienced an issue."

## ASD-STE100 baseline

Use ASD-STE100 Simplified Technical English for technical and instructional prose:

- Use short sentences with one main action or statement.
- Use clear subjects and active verbs. State the actor when the actor matters.
- Use one term for one concept. Do not use synonyms only to avoid repetition.
- Use familiar words with precise meanings. Avoid idioms, slang, and figurative language.
- Keep technical noun groups short. Use prepositions when they make relationships clear.
- Write instructions as direct actions. State the condition, action, and expected result.
- Preserve exact code, commands, identifiers, product names, and quotations.
- Use the current STE dictionary when available. Do not claim full conformance without a
  check against the current ASD-STE100 issue and dictionary.

## The hard rules (a post fails on any of these)

1. **No em dashes (—) or en dashes (–).** Use a period, comma, "so", "because", or
   parentheses instead. Run `check.sh` to catch strays.
2. **No curly quotes.** Straight quotes only.
3. **No emojis in body prose.**
4. **Sentence case in headings, not Title Case.** "How agents hand off code", not "How
   Agents Hand Off Code".
5. **Use STE for technical prose.** Mark any term or passage that needs a deliberate
   domain-specific exception.

## AI tells to strip (the checklist)

Read the draft and remove each of these. This is the condensed version of the humanizer
patterns, tuned for this blog.

- **Significance inflation.** Cut "testament to", "pivotal", "groundbreaking", "in an
  ever-evolving landscape", "plays a vital role", "underscores the importance". Say the
  concrete thing instead.
- **Promotional adjectives.** Cut "seamless", "powerful", "robust", "cutting-edge",
  "revolutionary", "game-changing". Show the behavior; let the reader conclude it's good.
- **Rule of three.** AI loves "fast, simple, and reliable" triples. Break the pattern. One
  sharp adjective beats three padded ones.
- **The -ing tail analyses.** Cut sentences ending in "...highlighting the need for...",
  "...reflecting a broader shift...", "...underscoring how...". They add nothing.
- **Negative parallelism.** Kill "it's not just X, it's Y" and "this isn't about X; it's
  about Y". Overused to death by LLMs.
- **Synonym cycling / elegant variation.** Don't call the same thing a "solution", then a
  "platform", then an "offering", then a "framework" to avoid repetition. Repeat the plain
  noun.
- **Copula avoidance.** Prefer "is/are" over "serves as", "functions as", "stands as",
  "acts as a".
- **Vague attributions.** No "industry experts say", "many believe", "it is widely
  regarded". Name the source or cut it.
- **Hedging and filler.** "In order to" becomes "to". "Due to the fact that" becomes
  "because". "At this point in time" becomes "now". "It is important to note that": just
  say it. "Has the ability to" becomes "can".
- **Generic positive conclusion.** No "in conclusion, as agents continue to evolve, the
  possibilities are endless." End on something concrete.
- **Sycophancy / chat artifacts.** No "Great question!", "I hope this helps", "Let me know
  if...". This is an article, not a chat reply.
- **Boldface overuse.** Bold a term once when introduced, not every noun.

## The clarity test

After cleaning, read the post out loud. If a sentence is hard to follow, name the subject
and the action. If a technical term is vague, replace it with the exact term or define it.
Keep one real opinion and one concrete example. Do not add decorative language to create
personality.
