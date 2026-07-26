---
name: build-scenario-tests
description: Inspect an unfamiliar repository, turn a focused Markdown behavior scenario into a deterministic test in the repository's native test stack, run it, and preserve traceability between intent and code. Use when asked to add scenario tests, compile acceptance criteria or Given/When/Then Markdown into executable tests, reproduce a user-visible regression, or convert a narrow workflow specification into stable web, API, CLI, desktop, or mobile interaction coverage. Do not use for broad exploratory journeys or agent-judged smoke tests.
---

# Build Scenario Tests

Compile one small behavior contract into deterministic, repository-native test
code. Understand the host project before choosing a harness, command, fixture,
selector, or assertion.

## Operating contract

- Treat repository instructions and existing tests as authoritative.
- Keep each scenario focused on one behavior and one reason to fail.
- Compile into the test stack the repository already uses. Add a dependency only
  when no suitable harness exists and the user accepts the tradeoff.
- Make setup, inputs, actions, and expected results deterministic.
- Prefer public behavior over implementation details. Assert what a user or
  external caller can observe.
- Keep the Markdown scenario beside the test or in the repository's established
  specification directory. Record the mapping in both artifacts.
- Never weaken an assertion merely to make a test pass.

## Workflow

### 1. Pass the repository-understanding gate

Read the nearest `AGENTS.md` or equivalent instructions, product README,
contribution guide, manifests, test configuration, and the smallest relevant
product documentation. Use repository search to find the implementation entry
point, neighboring tests, fixtures, stable selectors, and validation commands.
Trace the relevant action from its public entry point through the state boundary
to the observable result. Do not read the entire tree without a reason.

Before editing, be able to state:

```text
product surface:
behavior source:
relevant architecture and data flow:
runtime or start command:
existing test runner:
nearest tests to imitate:
fixture and state-isolation strategy:
narrow validation command:
full validation command:
known trust or destructive boundaries:
```

If a material field is unknown, search again. If the repository does not answer
it, expose the gap and ask only for the missing product decision. Do not invent
commands, selectors, credentials, or expected behavior.

### 2. Normalize the scenario

Read [references/scenario-format.md](references/scenario-format.md). If the user
provided prose, rewrite it into that contract without changing its intent.

Reject or split a scenario when it:

- contains multiple independent behaviors;
- depends on subjective visual judgment;
- requires uncontrolled third-party state, real payment, or human
  authorization;
- uses vague outcomes such as "works correctly";
- cannot reset its data, time, randomness, or network dependencies.

Route a broad or agent-judged journey to a smoke-test workflow instead.

### 3. Map intent to the host test stack

Create a compact mapping before writing code:

| Scenario element | Repository implementation |
| --- | --- |
| Preconditions | fixture, factory, seed, fake, or setup API |
| User action | public UI, CLI, HTTP, SDK, or native interaction |
| Oracle | visible state, output, response, durable state, or emitted event |
| Cleanup | transaction rollback, fixture teardown, or isolated temp state |

Choose the narrowest existing harness that reaches the behavior:

- web or desktop UI: the repository's browser or UI runner;
- API or service: the native integration-test client;
- CLI: the existing subprocess or command runner;
- mobile: the project's native UI-test framework;
- library: the public API through its current test runner.

Do not force a browser test onto behavior that a stable public API test can
prove more directly.

### 4. Compile the deterministic test

Write the test in surrounding style. Preserve this traceability:

- include the scenario ID in the test name or metadata;
- link the scenario path from a short code comment when local conventions allow;
- keep every oracle from the Markdown represented by an assertion;
- use stable roles, labels, test IDs, public outputs, or API contracts;
- isolate state with existing factories, fakes, temporary directories, or
  transactions;
- control time, randomness, retries, and network calls when they affect results;
- make cleanup run even after a failed assertion.

Do not copy the bundled demonstration code blindly. It contains fictional
fixtures to show the mapping, not reusable project infrastructure.

### 5. Prove the compilation

Run the new test alone. Confirm it fails for the intended reason without the
behavior or regression fix when that check is safe and practical. Then run the
nearest relevant suite and the repository's required lint, type, build, and test
commands.

Inspect failures semantically. Fix the test only when the test is wrong. Do not
change product behavior unless the user asked for the implementation or fix.

Check for:

- every Markdown oracle has a matching assertion;
- no accidental live service, account, payment, or production dependency;
- repeated runs use isolated state and stable ordering;
- failure output identifies the broken behavior;
- the scenario and compiled test link to each other.

### 6. Hand off the evidence

Report:

1. what repository evidence informed the test design;
2. the scenario path and compiled test path;
3. the behavior and boundaries covered;
4. commands run and results;
5. anything intentionally left to integration or smoke coverage.

## Demonstration examples

- [Web workspace invitation](examples/web-workspace-invite.scenario.md) paired
  with an illustrative
  [Playwright compilation](examples/web-workspace-invite.spec.ts).
- [Expired CLI session](examples/cli-expired-session.scenario.md) paired with an
  illustrative [pytest compilation](examples/test_cli_expired_session.py).

Use these to explain the Markdown-to-code model. When applying the skill, derive
all commands, fixtures, and assertions from the actual repository.

## Failure handling

- No test harness: document the nearest viable seam and ask before adding a
  dependency.
- Behavior is undocumented or contradictory: preserve the evidence and ask the
  product owner which outcome is authoritative.
- Failure requires subjective or human judgment: keep the deterministic portion
  as a scenario test and route the rest to smoke coverage.
- Test is flaky after two focused attempts: stop, preserve logs, and report the
  uncontrolled input instead of adding retries.
