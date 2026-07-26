# Scenario test format

Use this contract for small behavior specifications that will be compiled into
deterministic test code.

## Template

```markdown
---
id: stable-kebab-case-id
surface: web | api | cli | desktop | mobile | library
risk: low | medium | high
---

# Human-readable behavior

## Intent

One sentence describing the behavior this scenario protects.

## Preconditions

- State that must exist before the action.
- Controlled identity, data, time, feature flags, and dependencies.

## Steps

1. Given an observable starting state.
2. When one primary action occurs.
3. Then an observable result appears.

## Oracles

- Exact outcomes that decide pass or fail.
- Include durable state or emitted output when it matters.

## Test data

- Minimal deterministic fixtures and values.

## Cleanup

- How the test restores or discards state.

## Out of scope

- Related behavior this scenario intentionally does not prove.
```

## Compilation rules

1. Keep one primary behavior per file.
2. Give every oracle a concrete assertion in the compiled test.
3. Keep selectors, fixtures, and implementation paths out of the scenario. Map
   them while inspecting the repository.
4. Prefer exact observable outcomes. Replace "works," "looks right," and
   "handles correctly" with visible state, output, status, event, or data.
5. Control external inputs. Freeze time, seed randomness, fake remote services,
   and isolate storage when they affect the result.
6. Put human authorization, subjective visual quality, and broad multi-system
   journeys in smoke tests rather than pretending they are deterministic.
7. Give the scenario a stable ID and preserve that ID in the compiled test.

## Review checklist

- Could a product owner understand the behavior without reading code?
- Could a test author implement it without inventing the expected result?
- Can the state be created and removed repeatedly?
- Would the same inputs produce the same judgment on every run?
- Does a failure point to one behavior rather than a whole journey?
