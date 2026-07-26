---
id: cli-developer-first-success
surface: cli
environment: local
risk: low
---

# A developer reaches a successful local preview from a fresh CLI install

## Goal

A developer builds the CLI from the repository, authenticates against the local
test service, creates a project, recovers from an invalid configuration, and
starts a successful preview.

## Persona

Riley knows the shell but has never used this CLI. Riley follows only the
repository's documented quick start.

## Starting state

- The repository is at the commit under test with dependencies installed.
- The local test service is healthy and contains no Riley account.
- A new temporary directory is available outside the repository.
- No global configuration or production credential may be read.

## Allowed mutations

- Build the CLI with the documented repository command.
- Create files only inside the temporary project and isolated test credential
  store.
- Create one account in the local test service.
- Bind a loopback port selected by the operating system.

## Human checkpoints

- A human confirms the one-time local authentication code displayed by the test
  identity service.

## Journey

1. Build the CLI and run its documented version command.
   Expect a zero exit code and a version tied to the build under test.
2. In the temporary directory, run the documented project initialization
   command and accept its default template.
   Expect a project file, example source file, and next-step instructions.
3. Run the documented local preview command before authentication.
   Expect an actionable authentication message without deleting project files.
4. Start the documented login flow and pause for the human to confirm the local
   one-time code.
   Expect the CLI to report the local test account, not a production account.
5. Replace the configured region with `not-a-region` and run preview again.
   Expect a nonzero exit, the invalid key and value, and a list or command for
   discovering valid regions.
6. Restore a valid test region and run preview.
   Expect a loopback URL, a successful health check, and rendered example
   content.
7. Stop preview with the documented interrupt.
   Expect a clean exit with no child process holding the port.

## Critical oracles

- Every command uses the CLI built from the commit under test.
- Unauthenticated and invalid-config failures preserve the project files.
- Authentication targets only the local test service.
- The final preview responds successfully on loopback.
- Interrupting preview releases its process and port.

## Noncritical observations

- Record commands whose help text differs from the quick start.
- Record unclear recovery instructions, repeated prompts, and steps that take
  longer than ten seconds.

## Evidence

- A timestamped terminal transcript with secrets redacted.
- Exit codes for each command.
- Checksums of project files before and after both failure paths.
- Final loopback health response.
- Process and port state after cleanup.

## Cleanup

- Stop the preview process.
- Delete the temporary project and isolated credential store.
- Delete the local test account with the documented test-service command.

## Abort conditions

- Any command targets a non-loopback service without explicit approval.
- The CLI reads a global production credential.
- Cleanup would affect files outside the temporary project or isolated
  credential store.
