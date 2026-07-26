/**
 * Illustrative compilation of web-workspace-invite.scenario.md.
 *
 * The imports, routes, and test IDs are fictional. A real compilation must
 * discover and use the host repository's existing fixtures and conventions.
 */
import { expect, test } from "@playwright/test";
import {
  createPendingWorkspaceInvite,
  deleteWorkspace,
} from "../support/workspace-fixtures";

test("web-workspace-invite-acceptance", async ({ page }) => {
  const fixture = await createPendingWorkspaceInvite({
    workspaceName: "Orchid Research",
    recipientEmail: "new.member@example.test",
    role: "viewer",
  });

  try {
    await page.goto(fixture.invitationUrl);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    await page.getByLabel("Email").fill("new.member@example.test");
    await page.getByLabel("Password").fill(fixture.recipientPassword);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByRole("heading", { name: "Join Orchid Research" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Accept invitation" }).click();

    await expect(
      page.getByRole("heading", { name: "Orchid Research" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Members" }).click();
    await expect(
      page.getByRole("row", { name: /new\.member@example\.test.*Viewer/ }),
    ).toBeVisible();

    await page.goto(fixture.invitationUrl);
    await expect(page.getByText("This invitation has already been used")).toBeVisible();
  } finally {
    await deleteWorkspace(fixture.workspaceId);
  }
});
