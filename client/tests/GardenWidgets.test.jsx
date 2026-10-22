import { it, expect, vi, afterEach } from "vitest";
import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  WishGarden,
  FireflyJar,
  LeafLetters,
  MemoryJar,
  WishBoat,
  BirthdayClock,
  dateAtMidnight,
} from "../src/GardenWidgets";
afterEach(() => vi.useRealTimers());
it("wishes grow in three stages and a fully grown garden can be replanted", async () => {
  const done = vi.fn();
  const user = userEvent.setup();
  render(<WishGarden onBloom={done} />);
  for (const seed of ["Courage", "Joy", "Peace"]) {
    await user.click(
      screen.getByRole("button", { name: new RegExp("^" + seed) }),
    );
    for (let i = 0; i < 3; i++)
      await user.click(screen.getByRole("button", { name: /Water this wish/ }));
    expect(
      screen.getByRole("button", { name: /This little wish is blooming/ }),
    ).toBeDisabled();
  }
  expect(done).toHaveBeenCalledOnce();
  expect(screen.getByRole("status")).toHaveTextContent(
    "whole garden of possibility",
  );
  await user.click(
    screen.getByRole("button", { name: /Plant a fresh garden/ }),
  );
  expect(screen.getByRole("button", { name: /Water this wish/ })).toBeEnabled();
});
it("collects six fireflies in a jar and supports resetting", async () => {
  const done = vi.fn();
  const user = userEvent.setup();
  const { container } = render(<FireflyJar onComplete={done} />);
  for (let i = 1; i <= 6; i++)
    await user.click(
      screen.getByRole("button", { name: `Collect firefly ${i}` }),
    );
  expect(done).toHaveBeenCalledOnce();
  expect(container.querySelectorAll(".jar-body i")).toHaveLength(6);
  expect(screen.getByRole("status")).toHaveTextContent("shine loudly");
  await user.click(
    screen.getByRole("button", { name: /Let them wander again/ }),
  );
  expect(container.querySelectorAll(".jar-body i")).toHaveLength(0);
});
it("leaf notes can be turned over and closed with accessible buttons", async () => {
  const user = userEvent.setup();
  render(<LeafLetters />);
  const leaf = screen.getByRole("button", { name: /For your brave days/ });
  expect(leaf).toHaveAttribute("aria-expanded", "false");
  await user.click(leaf);
  expect(leaf).toHaveAttribute("aria-expanded", "true");
  expect(
    within(leaf).getByText(/May you trust the quiet little voice/),
  ).toBeVisible();
  await user.click(leaf);
  expect(leaf).toHaveAttribute("aria-expanded", "false");
});
it("future memory choices are ideas, not invented past events", async () => {
  const user = userEvent.setup();
  render(<MemoryJar />);
  expect(
    screen.getByText(/not stories that have already happened/),
  ).toBeVisible();
  const button = screen.getByRole("button", { name: /A slow coffee/ });
  await user.click(button);
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("status")).toHaveTextContent("1 little idea");
  await user.click(button);
  expect(button).toHaveAttribute("aria-pressed", "false");
});
it("private wishes are folded locally and can be edited again", async () => {
  const user = userEvent.setup();
  const fetch = vi.spyOn(globalThis, "fetch");
  render(<WishBoat />);
  expect(screen.getByRole("button", { name: /Fold my wish/ })).toBeDisabled();
  await user.type(
    screen.getByLabelText("Your little wish"),
    "A gentle, happy year.",
  );
  await user.click(screen.getByRole("button", { name: /Fold my wish/ }));
  expect(screen.getByRole("status")).toHaveTextContent("beautiful shore");
  expect(fetch).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: /Unfold and edit/ }));
  expect(screen.getByLabelText("Your little wish")).toHaveValue(
    "A gentle, happy year.",
  );
});
it("birthday midnight is computed in India rather than the host timezone", () => {
  expect(
    new Date(dateAtMidnight("2026-10-24", "Asia/Kolkata")).toISOString(),
  ).toBe("2026-10-23T18:30:00.000Z");
  expect(new Date(dateAtMidnight("2026-10-24", "UTC")).toISOString()).toBe(
    "2026-10-24T00:00:00.000Z",
  );
});
it("the countdown updates each minute until the birthday", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-23T18:20:00Z"));
  const { container } = render(
    <BirthdayClock birthday="2026-10-24" timeZone="Asia/Kolkata" />,
  );
  expect(container.querySelector(".birthday-clock")).toHaveTextContent(
    "10minutes",
  );
  act(() => vi.advanceTimersByTime(60000));
  expect(container.querySelector(".birthday-clock")).toHaveTextContent(
    "9minutes",
  );
});
it("the birthday gets a today message, not a negative countdown", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-23T20:00:00Z"));
  render(<BirthdayClock birthday="2026-10-24" timeZone="Asia/Kolkata" />);
  expect(
    screen.getByText("Today, this little garden blooms for you."),
  ).toBeVisible();
});
it("after the birthday the garden remains a keepsake", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-25T20:00:00Z"));
  render(<BirthdayClock birthday="2026-10-24" timeZone="Asia/Kolkata" />);
  expect(screen.getByText(/A little garden to return to/)).toBeVisible();
});
