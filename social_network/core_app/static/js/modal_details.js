document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("userDetailsModal");
  const form = document.getElementById("userDetailsForm");
  const submitBtn = document.getElementById("saveDetailsBtn");

  if (!form) {
    return;
  }

  const suggestedItems = document.querySelectorAll(".suggested-item");

  suggestedItems.forEach(function (item) {
    item.addEventListener("click", function (event) {
      event.preventDefault();

      const usernameInput = document.getElementById("id_username");
      if (usernameInput) {
        usernameInput.value = item.dataset.username || "";
      }
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    clearFormErrors();

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    let response;
    let data;

    try {
      response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      data = await response.json();
    } catch (error) {
      console.error("Save details error:", error);
      showFormMessage("Помилка збереження даних");
      unlockSubmitButton();
      return;
    }

    if (!response.ok || !data.success) {
      showErrors(data.errors || {});
      unlockSubmitButton();
      return;
    }

    updateUserDetails(data.user);
    closeModal();
  });

  function closeModal() {
    if (modal) {
      modal.remove();
    }
  }

  function updateUserDetails(user) {
    if (!user) {
      return;
    }

    const userNameElement = document.querySelector(".sidebar-profile .user-name");
    const userHandleElement = document.querySelector(".sidebar-profile .user-handle");

    if (userNameElement) {
      userNameElement.textContent = user.nickname || user.email;
    }

    if (userHandleElement) {
      userHandleElement.textContent = `@${user.username}`;
        }
    }

  function unlockSubmitButton() {
    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }

  function clearFormErrors() {
    document.querySelectorAll(".field-error").forEach(function (errorElement) {
      errorElement.textContent = "";
    });

    document.querySelectorAll(".is-invalid").forEach(function (input) {
      input.classList.remove("is-invalid");
    });

    const oldMessage = document.querySelector(".modal-form-message");
    if (oldMessage) {
      oldMessage.remove();
    }
  }

  function showErrors(errors) {
    Object.entries(errors).forEach(function ([field, messages]) {
      const input = document.getElementById(`id_${field}`);
      const errorElement = document.querySelector(`[data-error-for="${field}"]`);

      if (input) {
        input.classList.add("is-invalid");
      }

      if (errorElement) {
        errorElement.textContent = Array.isArray(messages) ? messages[0] : messages;
      }
    });
  }

  function showFormMessage(message) {
    const messageElement = document.createElement("p");
    messageElement.className = "modal-form-message";
    messageElement.textContent = message;

    form.prepend(messageElement);
  }
});