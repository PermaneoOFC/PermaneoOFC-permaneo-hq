import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined") {
  if (!window.PointerEvent) {
    window.PointerEvent = MouseEvent as typeof PointerEvent;
  }

  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: () => {},
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
