(() => {
  const forms = document.querySelectorAll("form[data-logout-confirm]");
  let pendingForm = null;

  if (!forms.length) {
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
  modal.setAttribute("aria-labelledby", "logout-modal-title");
  modal.innerHTML = `
    <h3 class="modal-title" id="logout-modal-title">Confirm Logout</h3>
    <p class="modal-text">Are you sure you want to log out from the admin studio?</p>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" data-modal-cancel>Cancel</button>
      <button type="button" class="btn btn-primary" data-modal-confirm>Yes, Logout</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  const closeModal = () => {
    backdrop.style.display = "none";
    modal.style.display = "none";
    pendingForm = null;
  };

  const openModal = (form) => {
    pendingForm = form;
    backdrop.style.display = "block";
    modal.style.display = "block";
  };

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      openModal(form);
    });
  });

  backdrop.addEventListener("click", closeModal);

  modal.querySelector("[data-modal-cancel]")?.addEventListener("click", closeModal);

  modal.querySelector("[data-modal-confirm]")?.addEventListener("click", () => {
    if (!pendingForm) {
      closeModal();
      return;
    }

    const form = pendingForm;
    closeModal();
    form.submit();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display !== "none") {
      closeModal();
    }
  });
})();
