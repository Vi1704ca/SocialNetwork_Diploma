const _csrfMeta = document.querySelector("meta[name='csrf-token']");
const csrfToken = _csrfMeta ? _csrfMeta.content : null;
const friendsMainList = document.querySelector("#friendsMainList") || document.querySelector(".friends-main");

async function handleFriendAction(actionButton) {
  const headers = {};
  if (csrfToken) headers["X-CSRFToken"] = csrfToken;

  const response = await fetch(actionButton.dataset.url, {
    method: "POST",
    headers,
  });
  const data = await response.json();

  if (data.friend_html) {
    addFriendToMain(data.friend_html);
  }
  if (data.label) {
    actionButton.textContent = data.label;
  }
  if (data.remove) {
    const removedCard = actionButton.closest(".card-user, .person-card");
    if (removedCard) removedCard.remove();
  }
}

function addFriendToMain(friendHtml) {
  if (!friendsMainList) return;

  const friendsCount = friendsMainList.querySelectorAll(".card-user, .person-card").length;
  if (friendsCount < 6) {
    friendsMainList.insertAdjacentHTML('beforeend', friendHtml);
    connectFriendActionButtons(friendsMainList);
  }
}

function connectFriendActionButtons(parent = document) {
  const actionButtons = parent.querySelectorAll(".action-button");
  actionButtons.forEach((actionButton) => {
    if (!actionButton.dataset.eventConnected) {
      actionButton.dataset.eventConnected = true;
      actionButton.addEventListener("click", async () => {
        await handleFriendAction(actionButton);
      });
    }
  });
}

connectFriendActionButtons();

window.connectFriendActionButtons = connectFriendActionButtons;
