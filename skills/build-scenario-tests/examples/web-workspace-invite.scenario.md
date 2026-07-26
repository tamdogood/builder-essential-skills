---
id: web-workspace-invite-acceptance
surface: web
risk: high
---

# An invited member returns to the intended workspace after signing in

## Intent

Protect the invitation context across authentication so a signed-out recipient
can join the workspace they were invited to.

## Preconditions

- A workspace named `Orchid Research` exists.
- `new.member@example.test` has a pending Viewer invitation.
- The browser has no authenticated session.
- Email delivery is replaced by a test fixture that exposes the invitation URL.

## Steps

1. Given the recipient opens the invitation URL while signed out.
2. When they sign in as `new.member@example.test`.
3. Then the product returns them to the invitation for `Orchid Research`.
4. When they accept the invitation.
5. Then the workspace opens and identifies them as a Viewer.

## Oracles

- The post-authentication page names `Orchid Research`.
- Accepting the invitation opens the `Orchid Research` workspace.
- The member list contains `new.member@example.test` with the Viewer role.
- Reopening the invitation URL reports that the invitation was already used.

## Test data

- Workspace: `Orchid Research`
- Recipient: `new.member@example.test`
- Role: Viewer

## Cleanup

- Delete the isolated workspace and its memberships through the existing test
  fixture teardown.

## Out of scope

- Real email delivery.
- Expired invitations.
- Changing the member's role after acceptance.
