---
id: saas-owner-first-team-onboarding
surface: web
environment: staging
risk: medium
---

# A new owner creates a workspace and invites the first teammate

## Goal

A first-time owner signs in, creates a workspace, finishes the onboarding
checklist, and sends one staging-only teammate invitation.

## Persona

Jordan is evaluating the product for a small research team. Jordan has an
approved staging account but no existing workspace.

## Starting state

- The staging build under test is healthy.
- `jordan.owner@example.test` exists and has no workspace.
- `casey.member@example.test` routes to the staging mail sink.
- The browser starts signed out with an empty storage profile.

## Allowed mutations

- Create one workspace whose name begins with `Smoke Orchid`.
- Create one sample project inside that workspace.
- Send one invitation to `casey.member@example.test`.
- Delete the workspace during cleanup.

## Human checkpoints

- A human completes the staging identity-provider login when prompted.
- No secret, recovery code, or session token is copied into the agent chat.

## Journey

1. Open the staging home page and choose `Start free`.
   Expect a sign-in page that preserves the return path to onboarding.
2. Pause for the human to authenticate as `jordan.owner@example.test`.
   Expect the browser to return to the first onboarding step.
3. Create a workspace named `Smoke Orchid <UTC timestamp>`.
   Expect the workspace shell to open with a three-item onboarding checklist.
4. Create the first project from the `Blank project` option and name it
   `Launch notes`.
   Expect the project editor to open and the checklist to show one completed
   item.
5. Return to onboarding and invite `casey.member@example.test` as a Viewer.
   Expect an invitation confirmation and a second completed checklist item.
6. Open the staging mail sink and inspect the newest message for the recipient.
   Expect the workspace name, Viewer role, and a staging invitation URL.
7. Return to the workspace overview.
   Expect `Launch notes` to appear and the pending member to be listed as
   `casey.member@example.test`.

## Critical oracles

- Authentication returns to onboarding rather than the generic dashboard.
- The created workspace and project remain visible after a page reload.
- The mail sink receives exactly one invitation for the intended workspace,
  recipient, and Viewer role.
- The member list shows the invitation as pending.
- No uncaught error appears in the browser console.

## Noncritical observations

- Record confusing copy, unnecessary steps, visible layout shifts, and any step
  that takes longer than five seconds.
- Record whether the onboarding checklist progress is understandable without
  opening documentation.

## Evidence

- Full browser recording when the driver supports it.
- Screenshot after authentication, workspace creation, project creation,
  invitation confirmation, mail receipt, and final member list.
- Browser console output and relevant failed network requests.
- Timestamped step timeline suitable for subtitles.

## Cleanup

- Delete the `Smoke Orchid <UTC timestamp>` workspace through the staging UI.
- Confirm the workspace disappears from the account switcher.
- If deletion fails, record the workspace ID and do not retry with an internal
  production tool.

## Abort conditions

- The hostname is not the approved staging hostname.
- The identity provider resolves to a production tenant.
- The invitation recipient is not under `example.test`.
- Any step requests payment details or access to a real customer workspace.
