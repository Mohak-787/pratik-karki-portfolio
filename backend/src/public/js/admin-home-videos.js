(() => {
  const grid = document.getElementById("admin-home-video-grid");
  const initialDataNode = document.getElementById("initial-home-videos");

  if (!grid || !initialDataNode) return;

  let videos = [];
  try {
    videos = JSON.parse(initialDataNode.textContent || "[]");
  } catch (_error) {
    videos = [];
  }

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.style.display = "none";

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "none";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "home-video-modal-title");

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  let modalSubmitAction = null;

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const closeModal = () => {
    modalSubmitAction = null;
    modal.style.display = "none";
    backdrop.style.display = "none";
    modal.classList.remove("modal-wide");
    modal.innerHTML = "";
  };

  const showError = (message) => {
    let errorNode = modal.querySelector("[data-modal-error]");
    if (!errorNode) {
      errorNode = document.createElement("p");
      errorNode.className = "modal-error";
      errorNode.setAttribute("data-modal-error", "");
      const titleNode = modal.querySelector(".modal-title");
      if (titleNode && titleNode.nextSibling) {
        modal.insertBefore(errorNode, titleNode.nextSibling);
      } else {
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

  const openModal = ({ title, bodyHtml, confirmLabel, cancelLabel = "Cancel", onConfirm, wide = false }) => {
    modalSubmitAction = onConfirm || null;
    modal.classList.toggle("modal-wide", wide);
    modal.innerHTML = `
      <h3 class="modal-title" id="home-video-modal-title">${escapeHtml(title)}</h3>
      ${bodyHtml}
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-modal-cancel>${escapeHtml(cancelLabel)}</button>
        <button type="button" class="btn btn-primary" data-modal-confirm>${escapeHtml(confirmLabel)}</button>
      </div>
    `;
    backdrop.style.display = "block";
    modal.style.display = "block";
  };

  const findVideoById = (id) => videos.find((v) => String(v._id) === String(id)) || null;

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
  };

  const deleteVideoRequest = async (videoId) => {
    const response = await fetch(`/admin/video/${encodeURIComponent(videoId)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" }
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
        if (!(form instanceof HTMLFormElement)) return;

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
          await updateVideoRequest(video._id, body);
          closeModal();
          window.location.reload();
        } catch (error) {
          showError(error instanceof Error ? error.message : "Unable to update video.");
          setModalButtonsDisabled(false);
        }
      }
    });
  };

  const openDeleteModal = (video) => {
    openModal({
      title: "Delete Video",
      confirmLabel: "Yes, Delete",
      bodyHtml: `<p class="modal-text">Delete <strong>${escapeHtml(video.title || "this video")}</strong>? This action cannot be undone.</p>`,
      onConfirm: async () => {
        setModalButtonsDisabled(true);
        try {
          await deleteVideoRequest(video._id);
          closeModal();
          window.location.reload();
        } catch (error) {
          showError(error instanceof Error ? error.message : "Unable to delete video.");
          setModalButtonsDisabled(false);
        }
      }
    });
  };

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const action = button.getAttribute("data-action");
    const id = button.getAttribute("data-id");
    if (!action || !id) return;

    const video = findVideoById(id);
    if (!video) return;

    if (action === "edit") {
      openEditModal(video);
      return;
    }

    if (action === "delete") {
      openDeleteModal(video);
    }
  });

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
})();
