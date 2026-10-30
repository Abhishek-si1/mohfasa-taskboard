// theme.js - runs before first paint so there is no flash of the wrong theme
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("mohfasaTheme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch {
  /* storage unavailable: fall back to the default light theme */
}