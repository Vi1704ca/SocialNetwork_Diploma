(function () {
  const state = {
    currentChatId: null,
    currentUserId: Number(document.querySelector('meta[name="current-user-id"]')?.content || 0),
  }

  const elements = {}

  function getCSRFToken() {
    return (
      document.querySelector('meta[name="csrf-token"]')?.content ||
      document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
      ''
    )
  }

  function cacheElements() {
    elements.chatTitle = document.getElementById('chat-title')
    elements.chatStatus = document.getElementById('chat-status')
    elements.chatAvatar = document.getElementById('chat-avatar')
    elements.chatWindow = document.getElementById('chat-window')
    elements.chatHeader = document.querySelector('.chat-header')
    elements.chatForm = document.getElementById('chat-message-form')
    elements.chatInput = document.getElementById('chat-input')
  }

  function setChatActive(active) {
    elements.chatHeader?.classList.toggle('hidden', !active)
    elements.chatForm?.classList.toggle('hidden', !active)

    if (!active) {
      state.currentChatId = null
    }
  }

  function renderChat(data) {
    state.currentChatId = data.chat_id

    if (elements.chatTitle) {
      elements.chatTitle.textContent = data.chat_name || 'Чат'
    }

    if (elements.chatAvatar) {
      const name = data.chat_name || 'Чат'
      elements.chatAvatar.textContent = typeof getInitials === 'function'
        ? getInitials(name)
        : name.slice(0, 1).toUpperCase()
    }

    if (elements.chatWindow) {
      elements.chatWindow.classList.remove('placeholder-active')
      elements.chatWindow.innerHTML = ''
      window.renderMessages(elements.chatWindow, data.messages || [], state.currentUserId)
      scrollToBottom()
    }

    setChatActive(true)
    window.ChatSocket.connect(data.chat_id)
  }

  function scrollToBottom() {
    if (!elements.chatWindow) return
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight
  }

  function addMessage(data) {
    if (!elements.chatWindow) return

    const bubble = window.createMessageBubble(
      data.message || '',
      data.sender_id === state.currentUserId,
      data.created_at,
      data.sender_name,
      data.images || [],
      data.is_read || false,
      data.message_id || null
    )

    elements.chatWindow.appendChild(bubble)
    scrollToBottom()
  }

  function updateChatPreview(chatId, message, createdAt) {
    const button = document.querySelector(`.chat-user-button[data-chat-id="${chatId}"]`)
    if (!button) return

    const messageElement = button.querySelector('.user-message')
    const timeElement = button.querySelector('.message-time')

    if (messageElement) {
      messageElement.textContent = message || 'Фото'
    }

    if (timeElement) {
      timeElement.textContent = createdAt || ''
    }

    button.dataset.lastMessageTime = Date.now()
    sortChatsByLastMessage()
  }

  function updateUnreadBadge(chatId, count) {
    const button = document.querySelector(`.chat-user-button[data-chat-id="${chatId}"]`)
    if (!button) return

    button.classList.toggle('has-unread', count > 0)

    let badge = button.querySelector('.chat-unread-count')

    if (!badge) {
      badge = document.createElement('div')
      badge.className = 'chat-unread-count'
      button.querySelector('.avatar-wrapper')?.appendChild(badge)
    }

    badge.textContent = count > 0 ? count : ''
    badge.style.display = count > 0 ? 'flex' : 'none'
  }

  function applyUnreadCounts(counts) {
    Object.entries(counts || {}).forEach(([chatId, count]) => {
      updateUnreadBadge(chatId, Number(count))
    })

    const total = Object.values(counts || {}).reduce((sum, count) => sum + Number(count), 0)
    const badgeText = document.querySelector('.notification-badge span')
    const badge = badgeText?.closest('.notification-badge')

    if (badgeText) {
      badgeText.textContent = total > 0 ? total : ''
    }

    if (badge) {
      badge.style.display = total > 0 ? 'flex' : 'none'
    }
  }

  function clearUnread(chatId) {
    updateUnreadBadge(chatId, 0)
  }

  function sortChatsByLastMessage() {
    const list = document.querySelector('.chats-list')
    if (!list) return

    const items = Array.from(list.querySelectorAll('.chat-user-button'))

    items.sort((a, b) => {
      return Number(b.dataset.lastMessageTime || 0) - Number(a.dataset.lastMessageTime || 0)
    })

    items.forEach(item => list.appendChild(item))
  }

  function updateUserPresence(userId, isOnline) {
    document
      .querySelectorAll(`.status-indicator[data-user-id="${userId}"]`)
      .forEach(indicator => {
        indicator.classList.toggle('online', isOnline)
      })

    updateHeaderPresence(userId, isOnline)
  }

  function syncOnlineUsers(userIds) {
    const onlineIds = new Set((userIds || []).map(String))

    document.querySelectorAll('.status-indicator[data-user-id]').forEach(indicator => {
      indicator.classList.toggle('online', onlineIds.has(String(indicator.dataset.userId)))
    })

    updateCurrentHeaderFromList()
  }

  function updateCurrentHeaderFromList() {
    if (!state.currentChatId || !elements.chatStatus) return

    const currentButton = document.querySelector(`.chat-user-button[data-chat-id="${state.currentChatId}"]`)
    const userId = currentButton?.dataset.chatUser
    if (!userId) return

    const isOnline = document
      .querySelector(`.status-indicator[data-user-id="${userId}"]`)
      ?.classList.contains('online')

    renderPersonalStatus(Boolean(isOnline))
  }

  function updateHeaderPresence(userId, isOnline) {
    const currentButton = document.querySelector(`.chat-user-button[data-chat-id="${state.currentChatId}"]`)

    if (currentButton?.dataset.chatUser === String(userId)) {
      renderPersonalStatus(isOnline)
    }
  }

  function renderPersonalStatus(isOnline) {
    if (!elements.chatStatus) return

    elements.chatStatus.innerHTML = `
      <span class="chat-status-dot ${isOnline ? 'online' : ''}"></span>
      <span>${isOnline ? 'В мережі' : 'Не в мережі'}</span>
    `
  }

  async function openPersonalChat(userId, username, button) {
    const response = await fetch(`/chat/chat_with/${userId}/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken(),
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    if (!data.success) return

    if (button) {
      button.dataset.chatId = data.chat_id
      button.dataset.chatUser = userId
      clearUnread(data.chat_id)
    }

    renderChat(data)
    updateCurrentHeaderFromList()
  }

  async function openGroupChat(chatId) {
    const response = await fetch(`/chat/chat_open/${chatId}/`)
    const data = await response.json()

    if (!data.success) return

    renderChat(data)

    if (elements.chatStatus) {
      elements.chatStatus.textContent = data.chat_status || ''
    }
  }

  function bindChatButtons() {
    document.querySelectorAll('.chat-user-button').forEach(button => {
      button.addEventListener('click', () => {
        if (button.dataset.chatUser) {
          openPersonalChat(button.dataset.chatUser, button.dataset.chatUsername, button)
          return
        }

        if (button.dataset.chatId) {
          openGroupChat(button.dataset.chatId)
        }
      })
    })
  }

  function init() {
    cacheElements()
    setChatActive(false)
    bindChatButtons()
  }

  window.ChatUI = {
    state,
    elements,
    init,
    addMessage,
    updateChatPreview,
    applyUnreadCounts,
    clearUnread,
    syncOnlineUsers,
    updateUserPresence,
    scrollToBottom,
  }

  document.addEventListener('DOMContentLoaded', init)
})()