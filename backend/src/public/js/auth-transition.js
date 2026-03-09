(() => {
  const body = document.body;
  if (!body || !body.classList.contains("auth-page")) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const EXIT_MS = 220;

  body.classList.add("auth-anim");
  requestAnimationFrame(() => {
    body.classList.add("is-ready");
  });

  const navigateWithExit = (href) => {
    if (!href || href === window.location.pathname + window.location.search + window.location.hash) {
      return;
    }

    body.classList.add("is-leaving");
    window.setTimeout(() => {
      window.location.href = href;
    }, EXIT_MS);
  };

  document.querySelectorAll("a[data-auth-nav]").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;

      event.preventDefault();
      navigateWithExit(href);
    });
  });

  window.addEventListener("pageshow", () => {
    body.classList.add("is-ready");
    body.classList.remove("is-leaving");
  });
})();
