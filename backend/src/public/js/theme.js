(() => {
  const root = document.documentElement;
  const storageKey = "admin-theme";

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const applyTheme = (theme) => {
    const nextTheme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", nextTheme);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const label = nextTheme === "dark" ? "Light Mode" : "Dark Mode";
      const icon = nextTheme === "dark" ? "☀" : "☾";
      button.innerHTML = `<span aria-hidden=\"true\">${icon}</span><span>${label}</span>`;
      button.setAttribute("aria-label", "Toggle color mode");
    });
  };

  const initialTheme = localStorage.getItem(storageKey) || systemTheme;
  applyTheme(initialTheme);

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (!button) {
      return;
    }

    const currentTheme = root.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  });
})();
