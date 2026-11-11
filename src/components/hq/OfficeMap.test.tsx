import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfficeMap } from "@/components/hq/OfficeMap";
import { demoAgents } from "@/lib/demo";
import { ROOMS } from "@/lib/hq";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...props
  }: {
    to: string;
    params?: { slug: string };
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={params ? `${to.replace("$slug", params.slug)}` : to} {...props}>
      {children}
    </a>
  ),
}));

describe("interactive virtual floor", () => {
  let selectRoom: ReturnType<typeof vi.fn<(room: string) => void>>;
  beforeEach(() => {
    selectRoom = vi.fn();
  });

  it("shows all five rooms with their real agent totals and 14 distinct profiles", () => {
    render(<OfficeMap agents={demoAgents} selected="engenharia" onSelect={selectRoom} />);
    expect(screen.getByRole("group", { name: /Andar virtual do Permaneo/, hidden: true })).toBeInTheDocument();
    const roomButtons = screen.getAllByRole("button", { hidden: true });
    for (const [id, room] of Object.entries(ROOMS)) {
      expect(
        roomButtons.find(button => button.getAttribute("aria-label")?.startsWith(`${room.label},`)),
      ).toHaveAccessibleName();
      expect(demoAgents.filter((agent) => agent.room === id)).toHaveLength(
        id === "engenharia" ? 4 : id === "estudio" || id === "biblioteca" ? 3 : 2,
      );
    }
    const avatarNames = screen
      .getAllByRole("img", { hidden: true })
      .map((avatar) => avatar.getAttribute("aria-label"));
    expect(new Set(avatarNames).size).toBe(14);
    const avatarColors = screen
      .getAllByRole("img", { hidden: true })
      .map((avatar) => avatar.querySelector("rect")?.getAttribute("fill"));
    expect(new Set(avatarColors).size).toBe(14);
  });

  it("selects a room by click and supports arrow-key room navigation", () => {
    render(<OfficeMap agents={demoAgents} selected="engenharia" onSelect={selectRoom} />);
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(`${ROOMS["estudio"]!.label},`) }),
    );
    expect(selectRoom).toHaveBeenCalledWith("estudio");
    fireEvent.keyDown(
      screen.getByRole("button", { name: new RegExp(`${ROOMS["engenharia"]!.label},`) }),
      { key: "ArrowRight" },
    );
    expect(selectRoom).toHaveBeenLastCalledWith("estudio");
  });

  it("zooms through dedicated controls and keeps normal wheel input unhandled", () => {
    render(<OfficeMap agents={demoAgents} selected="engenharia" onSelect={selectRoom} />);
    fireEvent.click(screen.getByRole("button", { name: "Aumentar zoom" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    const viewport = document.querySelector(".floor-viewport")!;
    const regularWheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 100 });
    viewport.dispatchEvent(regularWheel);
    expect(regularWheel.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Ver andar inteiro/ }));
    expect(screen.getByText("66%")).toBeInTheDocument();
  });

  it("supports horizontal drag while regular wheel input remains available to the page", () => {
    render(<OfficeMap agents={demoAgents} selected="engenharia" onSelect={selectRoom} />);
    const viewport = document.querySelector(".floor-viewport")!;
    Object.defineProperty(viewport, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 180,
    });
    fireEvent.pointerDown(viewport, { button: 0, clientX: 180, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 95, pointerId: 1 });
    expect(viewport.scrollLeft).toBe(265);
    fireEvent.pointerUp(viewport, { pointerId: 1 });
  });

  it("fits the actual viewport width, including a narrow phone", () => {
    render(<OfficeMap agents={demoAgents} />);
    const viewport = document.querySelector(".floor-viewport")!;
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 350 });
    fireEvent.click(screen.getByRole("button", { name: /Ver andar inteiro/ }));
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(document.querySelector(".floor-svg")).toHaveStyle({ width: "350px" });
  });

  it("selects rooms without a parent callback and does not select after dragging a room", () => {
    render(<OfficeMap agents={demoAgents} />);
    const room = screen.getByRole("button", { name: new RegExp(`${ROOMS["estudio"]!.label},`) });
    const viewport = document.querySelector(".floor-viewport")!;
    fireEvent.pointerDown(room, { button: 0, clientX: 180, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 90, pointerId: 1 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    fireEvent.click(room);
    expect(room).toHaveAttribute("aria-pressed", "false");
    fireEvent.pointerDown(room, { button: 0, clientX: 100, pointerId: 2 });
    fireEvent.pointerUp(room, { pointerId: 2 });
    fireEvent.click(room);
    expect(room).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: ROOMS["estudio"]!.label })).toBeInTheDocument();
  });
});
