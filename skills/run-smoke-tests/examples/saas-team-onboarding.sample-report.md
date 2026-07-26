# Smoke report: saas-owner-first-team-onboarding

> This is an illustrative report for a fictional staging product. Paths and
> identifiers show the expected evidence structure.

## Result

- Result: PASS
- Confidence: high
- Build: `9f4e71c`
- Environment: `https://staging.example.test`
- Duration: 6m 42s
- Human checkpoints: staging SSO completed at `00:41`
- Flags: onboarding progress briefly stale after project creation

## Timeline

| Time | Instruction | Observation | Evidence | Judgment |
| --- | --- | --- | --- | --- |
| 00:00 | Open home and choose Start free | Sign-in opened with onboarding return path | `screens/01-sign-in.png` | pass |
| 00:41 | Complete staging SSO | Returned to workspace creation | `screens/02-onboarding.png` | pass |
| 01:18 | Create workspace | Workspace opened with checklist | `screens/03-workspace.png` | pass |
| 02:05 | Create Launch notes | Project opened; checklist updated after 1.3s | `screens/04-project.png` | pass with observation |
| 03:11 | Invite Casey as Viewer | Confirmation appeared | `screens/05-invite.png` | pass |
| 04:02 | Inspect mail sink | One matching staging invitation found | `screens/06-mail.png` | pass |
| 05:12 | Reload and inspect members | Project persisted; invite pending | `screens/07-members.png` | pass |
| 05:48 | Delete workspace | Workspace removed from switcher | `screens/08-cleanup.png` | pass |

## Critical oracles

- PASS: Authentication returned to onboarding. See `screens/02-onboarding.png`.
- PASS: Workspace and project survived reload. See `screens/07-members.png`.
- PASS: Exactly one correct invitation arrived. See `mail/invitation.json`.
- PASS: Pending Viewer appeared in the member list. See
  `screens/07-members.png`.
- PASS: No uncaught console error. See `logs/browser-console.txt`.

## Evidence

- Recording: `video/run.webm`
- Subtitles: `video/run.srt`
- Browser console: `logs/browser-console.txt`
- Failed requests: `logs/failed-requests.json`
- Run manifest: `run.json`

## Cleanup

Workspace `ws_smoke_20250726_0412` was deleted through the staging UI. No
residual test data was observed.

## Follow-up candidate

The delayed checklist update is deterministic enough for a focused scenario
test. It did not violate a critical oracle in this run.
