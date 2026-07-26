# Smoke test format

Use this contract for broad user journeys interpreted and executed at runtime by
an agent.

## Template

```markdown
---
id: stable-kebab-case-id
surface: web | api | cli | desktop | mobile | mixed
environment: local | test | preview | staging
risk: low | medium | high
---

# Human-readable journey

## Goal

The outcome the user is trying to achieve.

## Persona

Who the user is and what they already know or possess.

## Starting state

- Build, account, data, device, and feature-flag state.

## Allowed mutations

- Exact data the run may create, change, send, or delete.

## Human checkpoints

- Steps that require authorization or judgment from a person.

## Journey

1. User instruction and expected observable response.
2. Next instruction and expected observable response.
3. Continue through the complete goal.

## Critical oracles

- Outcomes required for PASS.

## Noncritical observations

- Quality, latency, copy, or friction worth recording without deciding PASS.

## Evidence

- Required screenshots, logs, outputs, recordings, or state snapshots.

## Cleanup

- Authorized cleanup and what to do when it fails.

## Abort conditions

- Wrong environment, unsafe account, real payment, data exposure, or other
  condition that must stop the run.
```

## Authoring rules

1. Describe a coherent user goal rather than a list of unrelated checks.
2. Use normal user language and supported product affordances.
3. State which observations decide the result. Do not ask the executor to
   "verify everything works."
4. Name human checkpoints before execution.
5. Define allowed mutations narrowly and forbid production by default.
6. Require evidence for every critical oracle.
7. Include cleanup even when the environment normally expires test data.
8. Keep narrow deterministic assertions in scenario tests. Use smoke coverage
   for the whole journey and the seams between systems.

## Evidence levels

- Strong: recording plus timestamp, structured output, durable state query, or
  screenshot tied to a step.
- Useful: console text, log excerpt, network trace, or human checkpoint record.
- Weak: executor memory or an unsupported "looked correct" statement.

Base PASS only on strong or useful evidence.
