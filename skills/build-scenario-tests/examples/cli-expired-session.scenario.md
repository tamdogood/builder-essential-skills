---
id: cli-expired-session-preserves-config
surface: cli
risk: medium
---

# An expired session fails safely without rewriting project configuration

## Intent

Protect a developer's local configuration when a command discovers that the
stored session has expired.

## Preconditions

- The CLI runs in an isolated temporary project.
- The project contains a valid `project.toml`.
- The credential fixture returns an expired session.
- Network access is replaced by the repository's fake API server.

## Steps

1. Given the developer has a valid project configuration and an expired session.
2. When they run `tool deploy --dry-run`.
3. Then the command exits with the repository's authentication failure code.
4. Then stderr explains how to sign in again.
5. Then `project.toml` remains byte-for-byte unchanged.
6. Then no deployment request reaches the API.

## Oracles

- The process exit code is the documented authentication failure code.
- Stderr contains the documented sign-in recovery command.
- The project configuration bytes are unchanged.
- The fake API records no deployment request.

## Test data

- Project name: `orchid-cli-demo`
- Region: `test-1`
- Session expiry: `2025-01-01T00:00:00Z`

## Cleanup

- Remove the temporary project and fake credential store.

## Out of scope

- Interactive browser authentication.
- A successful deployment after signing in.
