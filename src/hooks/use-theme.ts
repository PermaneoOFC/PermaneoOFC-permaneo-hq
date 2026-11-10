import { useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(localStorage.getItem("hq-theme") === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const toggle = () =>
    setDark((d) => {
      localStorage.setItem("hq-theme", d ? "light" : "dark");
      return !d;
    });
  return { dark, toggle };
}