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
  let activeFilter = "PRIMARY";
  let modalOnClose = null;
  let modalSubmitAction = null;
  let modalDefaultFocusSelector = null;

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

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.style.display = "none";

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "none";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "video-modal-title");

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

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

  const sortByCreatedAt = (videos) => [...videos].sort((a, b) => {
    const aTs = new Date(a.createdAt || 0).getTime();
    const bTs = new Date(b.createdAt || 0).getTime();
    return bTs - aTs;
  });

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

  const closeModal = () => {
    const onClose = modalOnClose;
    modalOnClose = null;
    modalSubmitAction = null;
    modalDefaultFocusSelector = null;
    modal.style.display = "none";
    backdrop.style.display = "none";
    modal.classList.remove("modal-wide");
    modal.innerHTML = "";
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const openModal = ({ title, bodyHtml, confirmLabel, cancelLabel = "Cancel", onConfirm, wide = false, defaultFocusSelector = null, onClose = null }) => {
    modalOnClose = onClose;
    modalSubmitAction = onConfirm || null;
    modalDefaultFocusSelector = defaultFocusSelector;
    modal.classList.toggle("modal-wide", wide);
    modal.innerHTML = `
      <h3 class="modal-title" id="video-modal-title">${escapeHtml(title)}</h3>
      ${bodyHtml}
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-modal-cancel>${escapeHtml(cancelLabel)}</button>
        <button type="button" class="btn btn-primary" data-modal-confirm>${escapeHtml(confirmLabel)}</button>
      </div>
    `;
    backdrop.style.display = "block";
    modal.style.display = "block";

    const focusNode = modalDefaultFocusSelector ? modal.querySelector(modalDefaultFocusSelector) : null;
    if (focusNode && typeof focusNode.focus === "function") {
      focusNode.focus();
    }
  };

  const showError = (message) => {
    let errorNode = modal.querySelector("[data-modal-error]");
    if (!errorNode) {
      const titleNode = modal.querySelector(".modal-title");
      errorNode = document.createElement("p");
      errorNode.className = "modal-error";
      errorNode.setAttribute("data-modal-error", "");
      if (titleNode && titleNode.nextSibling) {
        modal.insertBefore(errorNode, titleNode.nextSibling);
      }
      else {
        modal.appendChild(errorNode);
      }
    }

    errorNode.textContent = message || "Something went wrong.";
    errorNode.style.display = "block";
  };

  const setModalButtonsDisabled = (disabled) => {
    modal.querySelectorAll("[data-modal-confirm], [data-modal-cancel]").forEach((button) => {
      button.disabled = disabled;
    });
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
      return `
        <article class="card">
          <h3>${escapeHtml(video.title || "Untitled")}</h3>
          <p style="margin-bottom: 10px;"><span class="badge ${badgeClass}">${type}</span></p>
          ${mediaBlock}
          <p>Client: ${escapeHtml(video.client || "-")}</p>
          <p class="subtitle" style="margin-top: 12px;">Created: ${escapeHtml(formatDate(video.createdAt))}</p>
          <div class="card-action">
            <div class="stack">
              <button type="button" class="btn btn-secondary" data-action="edit" data-id="${escapeHtml(video._id)}">Edit</button>
              <button type="button" class="btn btn-ghost" data-action="delete" data-id="${escapeHtml(video._id)}">Delete</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  };

  const setActiveButton = (filter) => {
    activeFilter = filter;
    buttons.forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === filter);
    });
  };

  const fetchByType = async (filter) => {
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
    cache[filter] = sortByCreatedAt(videos);
    return cache[filter];
  };

  const findVideoById = (videoId) => {
    const list = cache.all || [];
    return list.find((video) => String(video._id) === String(videoId)) || null;
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

  const refreshVisibleVideos = async () => {
    setLoading();
    const videos = await fetchByType(activeFilter);
    render(videos);
  };

  const applyVideoUpdateToCache = (updatedVideo) => {
    if (!updatedVideo || !updatedVideo._id) {
      return;
    }

    const videoId = String(updatedVideo._id);
    cache.all = sortByCreatedAt([
      ...(cache.all || []).filter((video) => String(video._id) !== videoId),
      updatedVideo
    ]);

    if (Array.isArray(cache.PRIMARY)) {
      cache.PRIMARY = sortByCreatedAt([
        ...cache.PRIMARY.filter((video) => String(video._id) !== videoId),
        ...(updatedVideo.type === "PRIMARY" ? [updatedVideo] : [])
      ]);
    }

    if (Array.isArray(cache.SECONDARY)) {
      cache.SECONDARY = sortByCreatedAt([
        ...cache.SECONDARY.filter((video) => String(video._id) !== videoId),
        ...(updatedVideo.type === "SECONDARY" ? [updatedVideo] : [])
      ]);
    }
  };

  const applyVideoDeleteToCache = (videoId) => {
    const id = String(videoId);
    cache.all = (cache.all || []).filter((video) => String(video._id) !== id);

    if (Array.isArray(cache.PRIMARY)) {
      cache.PRIMARY = cache.PRIMARY.filter((video) => String(video._id) !== id);
    }

    if (Array.isArray(cache.SECONDARY)) {
      cache.SECONDARY = cache.SECONDARY.filter((video) => String(video._id) !== id);
    }
  };

  const updateVideoRequest = async (videoId, body) => {
    const response = await fetch(`/admin/video/${encodeURIComponent(videoId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.errors?.[0]?.msg || payload?.message || "Unable to update video.");
    }

    return payload.video;
  };

  const deleteVideoRequest = async (videoId) => {
    const response = await fetch(`/admin/video/${encodeURIComponent(videoId)}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json"
      }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.errors?.[0]?.msg || payload?.message || "Unable to delete video.");
    }
  };

  const openEditModal = (video) => {
    openModal({
      title: "Update Video",
      confirmLabel: "Save Changes",
      wide: true,
      defaultFocusSelector: "[name='title']",
      bodyHtml: `
        <p class="modal-text">Edit video details below.</p>
        <form class="form" data-edit-form style="margin-top: 12px;">
          <label>
            Title
            <input name="title" type="text" required value="${escapeHtml(video.title || "")}" />
          </label>
          <label>
            Video Link
            <input name="link" type="url" required value="${escapeHtml(video.link || "")}" />
          </label>
          <div class="row">
            <label>
              Type
              <select name="type" required>
                <option value="PRIMARY" ${video.type === "PRIMARY" ? "selected" : ""}>PRIMARY</option>
                <option value="SECONDARY" ${video.type === "SECONDARY" ? "selected" : ""}>SECONDARY</option>
              </select>
            </label>
            <label>
              Client
              <input name="client" type="text" value="${escapeHtml(video.client || "")}" />
            </label>
          </div>
        </form>
      `,
      onConfirm: async () => {
        const form = modal.querySelector("[data-edit-form]");
        if (!(form instanceof HTMLFormElement)) {
          return;
        }

        const formData = new FormData(form);
        const body = {
          title: String(formData.get("title") || "").trim(),
          link: String(formData.get("link") || "").trim(),
          type: String(formData.get("type") || "").trim().toUpperCase(),
          client: String(formData.get("client") || "").trim()
        };

        if (!body.title || !body.link || (body.type !== "PRIMARY" && body.type !== "SECONDARY")) {
          showError("Please provide valid title, link, and type.");
          return;
        }

        setModalButtonsDisabled(true);
        try {
          const updatedVideo = await updateVideoRequest(video._id, body);
          applyVideoUpdateToCache(updatedVideo);
          closeModal();
          await refreshVisibleVideos();
        }
        catch (error) {
          showError(error instanceof Error ? error.message : "Unable to update video.");
        }
        finally {
          setModalButtonsDisabled(false);
        }
      }
    });
  };

  const openDeleteModal = (video) => {
    openModal({
      title: "Delete Video",
      confirmLabel: "Yes, Delete",
      bodyHtml: `
        <p class="modal-text">Delete <strong>${escapeHtml(video.title || "this video")}</strong>? This action cannot be undone.</p>
      `,
      onConfirm: async () => {
        setModalButtonsDisabled(true);
        try {
          await deleteVideoRequest(video._id);
          applyVideoDeleteToCache(video._id);
          closeModal();
          await refreshVisibleVideos();
        }
        catch (error) {
          showError(error instanceof Error ? error.message : "Unable to delete video.");
          setModalButtonsDisabled(false);
        }
      }
    });
  };

  backdrop.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    const cancelButton = event.target.closest("[data-modal-cancel]");
    if (cancelButton) {
      closeModal();
      return;
    }

    const confirmButton = event.target.closest("[data-modal-confirm]");
    if (confirmButton && typeof modalSubmitAction === "function") {
      modalSubmitAction();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display !== "none") {
      closeModal();
    }
  });

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

  grid.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action][data-id]");
    if (!actionButton) {
      return;
    }

    const { action, id } = actionButton.dataset;
    if (!action || !id) {
      return;
    }

    const existing = findVideoById(id);
    if (!existing) {
      setError("Video not found. Refresh and try again.");
      return;
    }

    if (action === "edit") {
      openEditModal(existing);
      return;
    }

    if (action === "delete") {
      openDeleteModal(existing);
    }
  });

  (async () => {
    setActiveButton(activeFilter);
    try {
      await refreshVisibleVideos();
    }
    catch (_error) {
      setError("Unable to load videos for this filter. Try again.");
    }

  })();
})();
