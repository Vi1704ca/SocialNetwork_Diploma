const csrfMeta = document.querySelector("meta[name='csrf-token']");
const csrfToken = csrfMeta ? csrfMeta.content : null;

const modalFriends = document.getElementById("modalFriends");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalConfirmBtn = document.getElementById("modalConfirmBtn");

let pendingActionButton = null;

function openConfirmModal(actionButton) {
  pendingActionButton = actionButton;

  if (modalFriends) {
    modalFriends.classList.remove("hidden");
    modalFriends.classList.add("confirm-action");
  }
}

function closeConfirmModal() {
  pendingActionButton = null;

  if (modalFriends) {
    modalFriends.classList.add("hidden");
    modalFriends.classList.remove("confirm-action");
  }
}

if (modalCancelBtn) {
  modalCancelBtn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    closeConfirmModal();
  });
}

if (modalConfirmBtn) {
  modalConfirmBtn.addEventListener("click", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    const actionButton = pendingActionButton;
    closeConfirmModal();

    if (actionButton) {
      await handleFriendAction(actionButton);
    }
  });
}

async function handleFriendAction(actionButton) {
  if (!actionButton.dataset.url) {
    return;
  }

  actionButton.disabled = true;

  const headers = {
    "X-Requested-With": "XMLHttpRequest",
  };

  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  let response;

  try {
    response = await fetch(actionButton.dataset.url, {
      method: "POST",
      headers: headers,
    });
  } catch (error) {
    console.error("Мережева помилка", error);
    actionButton.disabled = false;
    return;
  }

  if (!response.ok) {
    console.error("Помилка сервера", response.status);
    actionButton.disabled = false;
    return;
  }

  const data = await response.json();

  if (data.success === false) {
    console.error(data.message || "Дія не виконана");
    actionButton.disabled = false;
    return;
  }

  if (data.redirect) {
    window.location.href = data.redirect;
    return;
  }

  if (data.remove) {
    if (actionButton.dataset.actionContext === "profile") {
      window.location.reload();
      return;
    }

    const removedCard = actionButton.closest(".card-user, .person-card");
    if (removedCard) {
      removedCard.remove();
    }
  }

  actionButton.disabled = false;
}

function connectFriendActionButtons(parent = document) {
  const actionButtons = parent.querySelectorAll(".action-button[data-url]");

  actionButtons.forEach(function (actionButton) {
    if (actionButton.dataset.eventConnected === "true") {
      return;
    }

    actionButton.dataset.eventConnected = "true";

    actionButton.addEventListener("click", async function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (actionButton.dataset.confirm === "true") {
        openConfirmModal(actionButton);
        return;
      }

      await handleFriendAction(actionButton);
    });
  });
}

connectFriendActionButtons();

window.connectFriendActionButtons = connectFriendActionButtons;