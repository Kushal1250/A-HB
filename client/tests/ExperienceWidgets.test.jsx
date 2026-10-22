import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BalloonGarden,
  ScratchSurprise,
  FortuneWheel,
  GiftPortal,
} from "../src/ExperienceWidgets";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("balloons reveal five wishes, announce completion, and reset", async () => {
  const complete = vi.fn();
  const user = userEvent.setup();
  render(<BalloonGarden onComplete={complete} />);
  for (const word of ["joy", "courage", "peace", "adventure", "friendship"])
    await user.click(
      screen.getByRole("button", { name: `Pop ${word} balloon` }),
    );
  expect(screen.getByRole("status")).toHaveTextContent("All for you");
  expect(complete).toHaveBeenCalledOnce();
  expect(
    screen.getByRole("button", { name: "Pop joy balloon" }),
  ).toBeDisabled();
  await user.click(
    screen.getByRole("button", { name: /Bring the balloons back/ }),
  );
  expect(screen.getByRole("button", { name: "Pop joy balloon" })).toBeEnabled();
  expect(screen.getByRole("status")).toHaveTextContent("0 of 5");
});
it("scratch-card can be fully revealed using a normal keyboard-accessible button", async () => {
  const onReveal = vi.fn();
  const user = userEvent.setup();
  const { container } = render(
    <ScratchSurprise name="Anu" onReveal={onReveal} />,
  );
  expect(container.querySelector(".secret-message")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await user.click(screen.getByRole("button", { name: /Reveal my secret/ }));
  expect(container.querySelector(".secret-message")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  expect(screen.getByText((_, element) => element.tagName === "EM" && element.textContent === "Anu.")).toBeVisible();
  expect(onReveal).toHaveBeenCalledOnce();
  expect(container.querySelector("canvas")).not.toBeInTheDocument();
});
it("real scratch gestures remove the covering and eventually reveal the card", () => {
  vi.stubGlobal("CanvasRenderingContext2D", function () {});
  vi.stubGlobal("PointerEvent", MouseEvent);
  const gradient = { addColorStop: vi.fn() };
  const ctx = {
    setTransform: vi.fn(),
    createLinearGradient: () => gradient,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  vi.spyOn(
    HTMLCanvasElement.prototype,
    "getBoundingClientRect",
  ).mockReturnValue({ left: 0, top: 0, width: 320, height: 250 });
  const onReveal = vi.fn();
  const { container } = render(
    <ScratchSurprise name="Anu" onReveal={onReveal} />,
  );
  const canvas = container.querySelector("canvas");
  expect(container.querySelector(".scratch-fallback")).not.toBeInTheDocument();
  fireEvent.pointerDown(canvas, { clientX: 8, clientY: 8, pointerId: 1 });
  for (let y = 10; y < 245 && container.querySelector("canvas"); y += 18)
    for (let x = 8; x < 315 && container.querySelector("canvas"); x += 16)
      fireEvent.pointerMove(canvas, { clientX: x, clientY: y, pointerId: 1 });
  expect(ctx.arc).toHaveBeenCalled();
  expect(onReveal).toHaveBeenCalledOnce();
  expect(container.querySelector(".scratch-wrap")).toHaveClass("revealed");
});
it("the wheel shows a result immediately when animations are paused", async () => {
  const user = userEvent.setup();
  vi.spyOn(Math, "random").mockReturnValue(0);
  const done = vi.fn();
  render(<FortuneWheel motion={false} onSpin={done} />);
  await user.click(
    screen.getByRole("button", { name: /Spin my birthday wish/ }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("A little adventure");
  expect(screen.getByRole("button", { name: /One more spin/ })).toBeEnabled();
  expect(done).toHaveBeenCalledOnce();
});
it("the animated wheel prevents double spins and settles after its transition", () => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0);
  const done = vi.fn();
  render(<FortuneWheel motion onSpin={done} />);
  fireEvent.click(
    screen.getByRole("button", { name: /Spin my birthday wish/ }),
  );
  expect(
    screen.getByRole("button", { name: /magic in motion/ }),
  ).toBeDisabled();
  expect(done).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1900));
  expect(screen.getByRole("status")).toHaveTextContent("A little adventure");
  expect(done).toHaveBeenCalledOnce();
});
it("pausing motion during a spin settles the result without forcing a wait", () => {
  vi.useFakeTimers();
  const done = vi.fn();
  const { rerender } = render(<FortuneWheel motion onSpin={done} />);
  fireEvent.click(
    screen.getByRole("button", { name: /Spin my birthday wish/ }),
  );
  rerender(<FortuneWheel motion={false} onSpin={done} />);
  expect(done).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: /One more spin/ })).toBeEnabled();
});
it("the gift opens once after a hold and does not double-open on release", () => {
  vi.useFakeTimers();
  const open = vi.fn();
  render(<GiftPortal opened={false} onOpen={open} motion />);
  const button = screen.getByRole("button", { name: "Open my surprise" });
  fireEvent.pointerDown(button);
  act(() => vi.advanceTimersByTime(950));
  expect(open).toHaveBeenCalledOnce();
  fireEvent.pointerUp(button);
  fireEvent.click(button);
  expect(open).toHaveBeenCalledOnce();
});
it("unmounting the wheel cancels its pending completion callback", () => {
  vi.useFakeTimers();
  const done = vi.fn();
  const { unmount } = render(<FortuneWheel motion onSpin={done} />);
  fireEvent.click(
    screen.getByRole("button", { name: /Spin my birthday wish/ }),
  );
  unmount();
  act(() => vi.advanceTimersByTime(2000));
  expect(done).not.toHaveBeenCalled();
});
