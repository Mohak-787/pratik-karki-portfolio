(() => {
  const tableBody = document.getElementById("contacts-table-body");
  const selectAll = document.getElementById("select-all-contacts");
  const bulkDeleteButton = document.getElementById("bulk-delete-btn");
  const selectionCount = document.getElementById("contact-selection-count");
  const emptyState = document.getElementById("contacts-empty");

  if (!tableBody || !selectAll || !bulkDeleteButton || !selectionCount || !emptyState) {
    return;
  }

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.style.display = "none";

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "none";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "contacts-modal-title");

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  const getCheckboxes = () => Array.from(tableBody.querySelectorAll("[data-contact-checkbox]"));
  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const closeModal = () => {
    modal.style.display = "none";
    backdrop.style.display = "none";
    modal.innerHTML = "";
  };

  const openConfirmModal = ({ title, text, confirmLabel, onConfirm }) => {
    modal.innerHTML = `
      <h3 class="modal-title" id="contacts-modal-title">${escapeHtml(title)}</h3>
      <p class="modal-text">${escapeHtml(text)}</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-modal-cancel>Cancel</button>
        <button type="button" class="btn btn-primary" data-modal-confirm>${escapeHtml(confirmLabel)}</button>
      </div>
    `;

    backdrop.style.display = "block";
    modal.style.display = "block";

    modal.querySelector("[data-modal-cancel]")?.addEventListener("click", closeModal);
    modal.querySelector("[data-modal-confirm]")?.addEventListener("click", async () => {
      const confirmButton = modal.querySelector("[data-modal-confirm]");
      const cancelButton = modal.querySelector("[data-modal-cancel]");
      if (confirmButton) {
        confirmButton.disabled = true;
      }
      if (cancelButton) {
        cancelButton.disabled = true;
      }

      try {
        await onConfirm();
        closeModal();
      }
      catch (_error) {
        if (confirmButton) {
          confirmButton.disabled = false;
        }
        if (cancelButton) {
          cancelButton.disabled = false;
        }
      }
    });
  };

  const setActionError = (message) => {
    const actionBar = bulkDeleteButton.closest(".filter-bar");
    if (!actionBar) {
      return;
    }

    const existing = actionBar.querySelector("[data-contact-error]");
    if (existing) {
      existing.textContent = message;
      return;
    }

    const errorNode = document.createElement("p");
    errorNode.className = "metric";
    errorNode.style.color = "var(--danger)";
    errorNode.setAttribute("data-contact-error", "");
    errorNode.textContent = message;
    actionBar.appendChild(errorNode);
  };

  const clearActionError = () => {
    const actionBar = bulkDeleteButton.closest(".filter-bar");
    if (!actionBar) {
      return;
    }

    const existing = actionBar.querySelector("[data-contact-error]");
    if (existing) {
      existing.remove();
    }
  };

  const refreshSelectionState = () => {
    const checkboxes = getCheckboxes();
    const checked = checkboxes.filter((checkbox) => checkbox.checked);

    selectionCount.textContent = `${checked.length} selected`;
    bulkDeleteButton.disabled = checked.length === 0;
    selectAll.checked = checkboxes.length > 0 && checked.length === checkboxes.length;
    selectAll.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
  };

  const updateEmptyState = () => {
    const hasRows = tableBody.querySelectorAll("tr[data-contact-row]").length > 0;
    const tableWrap = tableBody.closest(".table-wrap");
    const actionBar = bulkDeleteButton.closest(".filter-bar");

    if (hasRows) {
      emptyState.style.display = "none";
      if (tableWrap) {
        tableWrap.style.display = "";
      }
      if (actionBar) {
        actionBar.style.display = "";
      }
      return;
    }

    emptyState.style.display = "block";
    if (tableWrap) {
      tableWrap.style.display = "none";
    }
    if (actionBar) {
      actionBar.style.display = "none";
    }
  };

  const deleteSingleContact = async (id) => {
    const response = await fetch(`/admin/contact/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.errors?.[0]?.msg || payload?.message || "Unable to delete contact.");
    }
  };

  const deleteManyContacts = async (ids) => {
    const response = await fetch("/admin/contacts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ ids })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.errors?.[0]?.msg || payload?.message || "Unable to delete selected contacts.");
    }
  };

  selectAll.addEventListener("change", () => {
    const shouldSelect = selectAll.checked;
    getCheckboxes().forEach((checkbox) => {
      checkbox.checked = shouldSelect;
    });
    clearActionError();
    refreshSelectionState();
  });

  tableBody.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-contact-checkbox]");
    if (!checkbox) {
      return;
    }

    clearActionError();
    refreshSelectionState();
  });

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-contact]");
    if (!button) {
      return;
    }

    const id = button.getAttribute("data-delete-contact");
    if (!id) {
      return;
    }

    const row = tableBody.querySelector(`tr[data-contact-id="${id}"]`);
    const contactName = row?.children?.[1]?.textContent?.trim() || "this contact";

    clearActionError();
    openConfirmModal({
      title: "Delete Contact",
      text: `Delete ${contactName}? This action cannot be undone.`,
      confirmLabel: "Yes, Delete",
      onConfirm: async () => {
        try {
          await deleteSingleContact(id);
          row?.remove();
          refreshSelectionState();
          updateEmptyState();
        }
        catch (error) {
          setActionError(error instanceof Error ? error.message : "Unable to delete contact.");
          throw error;
        }
      }
    });
  });

  bulkDeleteButton.addEventListener("click", () => {
    const selectedCheckboxes = getCheckboxes().filter((checkbox) => checkbox.checked);
    const selectedIds = selectedCheckboxes.map((checkbox) => checkbox.value).filter(Boolean);

    if (!selectedIds.length) {
      refreshSelectionState();
      return;
    }

    clearActionError();
    openConfirmModal({
      title: "Delete Selected Contacts",
      text: `Delete ${selectedIds.length} selected contact(s)? This action cannot be undone.`,
      confirmLabel: "Delete Selected",
      onConfirm: async () => {
        try {
          await deleteManyContacts(selectedIds);
          selectedIds.forEach((id) => {
            const row = tableBody.querySelector(`tr[data-contact-id="${id}"]`);
            row?.remove();
          });
          refreshSelectionState();
          updateEmptyState();
        }
        catch (error) {
          setActionError(error instanceof Error ? error.message : "Unable to delete selected contacts.");
          throw error;
        }
      }
    });
  });

  backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display !== "none") {
      closeModal();
    }
  });

  refreshSelectionState();
  updateEmptyState();
})();
