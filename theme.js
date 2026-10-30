// theme.js
// Loaded in <head> so the saved theme is applied before the page paints
// (prevents a flash of the wrong theme).
try {
  const savedTheme = localStorage.getItem("mohfasaTheme");
  const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");
} catch {
  // Storage unavailable: keep the default light theme.
}