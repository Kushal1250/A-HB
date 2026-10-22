import { it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import defaults from "../../shared/defaults.json";
vi.mock("../src/api", () => ({
  API_BASE: "https://api.example",
  request: vi.fn(),
  uploadFile: vi.fn(),
}));
import { request } from "../src/api";
import Admin from "../src/Admin";
it("preserves edited text after a failed save and disables publishing unsaved changes", async () => {
  request.mockImplementation(async (path) => {
    if (path === "/auth/login")
      return {
        token: "test-token",
        expiresAt: new Date(Date.now() + 7200000).toISOString(),
      };
    if (path === "/admin/draft")
      return {
        content: structuredClone(defaults),
        revision: 3,
        mediaConfigured: false,
      };
    if (path === "/admin/media") return { media: [], configured: false };
    throw new Error("Unexpected path");
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText("Email"), "admin@example.com");
  await user.type(screen.getByLabelText("Password"), "a-valid-long-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  const name = await screen.findByLabelText("Recipient’s full name");
  await user.clear(name);
  await user.type(name, "ANU EDITED");
  expect(
    screen.getByRole("button", { name: /Publish saved draft/ }),
  ).toBeDisabled();
  request.mockImplementationOnce(async () => {
    throw new Error("Database unavailable. Please try again.");
  });
  await user.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Database unavailable",
    ),
  );
  expect(name).toHaveValue("ANU EDITED");
  expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
});
