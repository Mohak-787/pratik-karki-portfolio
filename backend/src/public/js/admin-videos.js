(() => {
  const grid = document.getElementById("video-grid");
  const empty = document.getElementById("video-empty");
  const counter = document.getElementById("video-count");
  const buttons = Array.from(document.querySelectorAll("[data-filter]"));
  const initialDataNode = document.getElementById("initial-videos");

  if (!grid || !empty || !counter || !buttons.length || !initialDataNode) {
    return;
  }

  let allVideos = [];

  try {
    allVideos = JSON.parse(initialDataNode.textContent || "[]");
  }
  catch (_error) {
    allVideos = [];
  }

  const cache = {
    all: allVideos,
    PRIMARY: null,
    SECONDARY: null
  };

  const endpoints = {
    PRIMARY: "/video/primary-videos",
    SECONDARY: "/video/secondary-videos"
  };

  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString();
  };

  const getYouTubeEmbedUrl = (rawUrl) => {
    if (!rawUrl) {
      return null;
    }

    try {
      const url = new URL(rawUrl);
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      const path = url.pathname;

      if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
        if (path.startsWith("/embed/")) {
          const embedId = path.split("/embed/")[1]?.split("/")[0];
          return embedId ? `https://www.youtube.com/embed/${embedId}` : null;
        }

        if (path === "/watch") {
          const videoId = url.searchParams.get("v");
          return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }

        if (path.startsWith("/shorts/")) {
          const shortsId = path.split("/shorts/")[1]?.split("/")[0];
          return shortsId ? `https://www.youtube.com/embed/${shortsId}` : null;
        }
      }

      if (host === "youtu.be") {
        const shortId = path.replace("/", "").split("/")[0];
        return shortId ? `https://www.youtube.com/embed/${shortId}` : null;
      }
    }
    catch (_error) {
      return null;
    }

    return null;
  };

  const render = (videos) => {
    counter.textContent = `${videos.length} video${videos.length === 1 ? "" : "s"}`;

    if (!videos.length) {
      grid.innerHTML = "";
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    grid.innerHTML = videos.map((video) => {
      const type = video.type === "PRIMARY" ? "PRIMARY" : "SECONDARY";
      const badgeClass = type === "PRIMARY" ? "badge-primary" : "badge-secondary";
      const embedUrl = getYouTubeEmbedUrl(video.link || "");
      const mediaBlock = embedUrl
        ? `<div class="video-frame">
            <iframe
              src="${escapeHtml(embedUrl)}"
              title="${escapeHtml(video.title || "YouTube video player")}"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>`
        : "";
      const linkBlock = embedUrl
        ? `<p><a href="${escapeHtml(video.link || "#")}" target="_blank" rel="noopener noreferrer">Open on YouTube</a></p>`
        : `<p style="margin-top: 8px;"><a href="${escapeHtml(video.link || "#")}" target="_blank" rel="noopener noreferrer">Open video link</a></p>`;

      return `
        <article class="card">
          <h3>${escapeHtml(video.title || "Untitled")}</h3>
          <p style="margin-bottom: 10px;"><span class="badge ${badgeClass}">${type}</span></p>
          ${mediaBlock}
          <p>Client: ${escapeHtml(video.client || "-")}</p>
          <p class="subtitle" style="margin-top: 12px;">Created: ${escapeHtml(formatDate(video.createdAt))}</p>
          <div class="card-action">${linkBlock}</div>
        </article>
      `;
    }).join("");
  };

  const setActiveButton = (filter) => {
    buttons.forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === filter);
    });
  };

  const fetchByType = async (filter) => {
    if (filter === "all") {
      return cache.all || [];
    }

    if (cache[filter]) {
      return cache[filter];
    }

    const response = await fetch(endpoints[filter], {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filter} videos`);
    }

    const payload = await response.json();
    const videos = Array.isArray(payload.videos) ? payload.videos : [];
    cache[filter] = videos;
    return videos;
  };

  const setLoading = () => {
    grid.innerHTML = "<article class=\"card\"><p>Loading videos...</p></article>";
    empty.style.display = "none";
  };

  const setError = (message) => {
    grid.innerHTML = `<article class=\"card\"><p>${escapeHtml(message)}</p></article>`;
    empty.style.display = "none";
    counter.textContent = "Error";
  };

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const filter = button.dataset.filter;
      setActiveButton(filter);
      setLoading();

      try {
        const videos = await fetchByType(filter);
        render(videos);
      }
      catch (_error) {
        setError("Unable to load videos for this filter. Try again.");
      }
    });
  });

  render(cache.all || []);
})();
