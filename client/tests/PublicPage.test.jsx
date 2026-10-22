import { it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("../src/api", () => ({
  API_BASE: "https://api.example",
  request: vi.fn().mockRejectedValue(new Error("offline")),
}));
import PublicPage from "../src/PublicPage";
it("keeps the birthday experience usable when the API is offline", async () => {
  render(<PublicPage />);
  expect(
    await screen.findByText(/Showing the original birthday wishes/),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: /Open Anu’s Garden/ }),
  ).toBeEnabled();
});
