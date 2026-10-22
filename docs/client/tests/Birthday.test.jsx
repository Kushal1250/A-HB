import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Birthday, { createKeepsake } from "../src/Birthday";
import defaults from "../../shared/defaults.json";
const content = { ...defaults, music: null };
const enter = async (user) =>
  user.click(screen.getByRole("button", { name: /Unlock the garden/ }));
it("opens as a personalised October garden without starting audio", () => {
  render(<Birthday content={content} />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "For Anu.",
  );
  expect(screen.getAllByText(/24 October 2026/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/KUSHAL PATEL/).length).toBeGreaterThan(0);
  expect(
    screen.getByRole("button", { name: /Unlock the garden/ }),
  ).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: /Water this wish/ }),
  ).not.toBeInTheDocument();
});
it("unlocks the scenes, blows candles, reads Kushal’s letter and replays", async () => {
  const user = userEvent.setup();
  render(<Birthday content={content} />);
  await enter(user);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Happy Birthday,Anu.",
  );
  await user.click(screen.getByRole("button", { name: /Make a wish & blow/ }));
  expect(screen.getByText("May your wish come true, Anu.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Relight/ }));
  expect(
    screen.getByRole("button", { name: /Make a wish & blow/ }),
  ).toBeEnabled();
  await user.click(screen.getByRole("button", { name: /Unfold your letter/ }));
  const dialog = screen.getByRole("dialog", {
    name: "A letter from KUSHAL PATEL",
  });
  expect(within(dialog).getByText((_,el)=>el.tagName==="P"&&el.textContent==="Dear Anu,")).toBeVisible();
  expect(
    within(dialog).getByText(
      /I wish you a life that feels good from the inside/,
    ),
  ).toBeVisible();
  await user.click(
    within(dialog).getByRole("button", { name: /Close A letter/ }),
  );
  await user.click(
    screen.getByRole("button", { name: /One last little wish/ }),
  );
  expect(screen.getByText(/May your life grow in directions/)).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: /Walk through the garden again/ }),
  );
  expect(
    screen.getByRole("button", { name: /Unlock the garden/ }),
  ).toBeEnabled();
});
it("supports moonlight, animation pause and individual candles", async () => {
  const user = userEvent.setup();
  const { container } = render(<Birthday content={content} />);
  await user.click(screen.getByRole("button", { name: "Switch to moonlight" }));
  expect(container.querySelector(".birthday")).toHaveAttribute(
    "data-theme",
    "moonlight",
  );
  await user.click(screen.getByRole("button", { name: "Pause animations" }));
  expect(container.querySelector(".birthday")).toHaveAttribute(
    "data-motion",
    "off",
  );
  await enter(user);
  for (let i = 1; i <= 3; i++)
    await user.click(
      screen.getByRole("button", { name: `Blow out candle ${i}` }),
    );
  expect(
    screen.getByRole("button", { name: "Your wish is on its way" }),
  ).toBeDisabled();
  expect(container.querySelector(".confetti-layer")).not.toBeInTheDocument();
});
it("keeps missing photographs honest and offers future memory ideas", async () => {
  const user = userEvent.setup();
  render(<Birthday content={content} />);
  await enter(user);
  expect(screen.getAllByText("Your photo here")).toHaveLength(3);
  expect(
    screen.getByText(/These pages are waiting for your real photos/),
  ).toBeVisible();
  expect(
    screen.getByText(/These are ideas for future moments, not stories/),
  ).toBeVisible();
});
it("real photographs open in a navigable lightbox and restore focus", async () => {
  const user = userEvent.setup();
  render(
    <Birthday
      content={{
        ...content,
        photos: [
          { id: "a", src: "/a.webp", alt: "A real memory", caption: "First" },
          {
            id: "b",
            src: "/b.webp",
            alt: "Another real memory",
            caption: "Second",
          },
        ],
      }}
    />,
  );
  await enter(user);
  const trigger = screen.getByRole("button", {
    name: "Open photo: A real memory",
  });
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: /Next/ }));
  expect(screen.getByText("2 / 2")).toBeVisible();
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { bubbles: true, cancelable: true }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
it("included instrumental plays only after a click and supports mute/pause", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => {});
  const user = userEvent.setup();
  render(
    <Birthday
      content={{
        ...content,
        music: {
          src: "/api/media/original/full",
          originalName: "October Light — original instrumental.wav",
        },
      }}
    />,
  );
  expect(play).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: /Play October Light/ }));
  expect(play).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "Mute" }));
  expect(screen.getByRole("button", { name: "Unmute" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  Object.defineProperty(document.querySelector("audio"), "paused", {
    value: false,
    configurable: true,
  });
  await user.click(screen.getByRole("button", { name: /Pause music/ }));
  expect(pause).toHaveBeenCalled();
});
it("reduced motion suppresses petal effects", async () => {
  window.matchMedia.mockReturnValueOnce({ matches: true });
  const user = userEvent.setup();
  const { container } = render(<Birthday content={content} />);
  await enter(user);
  expect(container.querySelector(".birthday")).toHaveAttribute(
    "data-motion",
    "off",
  );
  expect(container.querySelector(".confetti-layer")).not.toBeInTheDocument();
});
it("reports unavailable canvas instead of pretending to create a keepsake", async () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  await expect(createKeepsake(content)).rejects.toThrow("cannot create");
});
