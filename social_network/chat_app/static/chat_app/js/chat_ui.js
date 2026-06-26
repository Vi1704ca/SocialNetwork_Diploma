(function () {
  const state = {
    currentChatId: null,
    currentGroupData: null,
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
<<<<<<< HEAD
    elements.chatHeaderStatusIndicator = document.getElementById('chat-header-status-indicator')
=======
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
    elements.chatWindow = document.getElementById('chat-window')
    elements.chatHeader = document.querySelector('.chat-header')
    elements.chatForm = document.getElementById('chat-message-form')
    elements.chatInput = document.getElementById('chat-input')
<<<<<<< HEAD
    elements.backArrow = document.querySelector('.back-arrow')
    elements.openPanelButton = document.getElementById('open-panel')

    elements.panel = document.getElementById('panel')
    elements.panelEditGroup = document.getElementById('panel-edit-group')
    elements.panelDeleteGroup = document.getElementById('panel-delete-group')
    elements.panelLeaveGroup = document.getElementById('panel-leave-group')
=======
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
  }

  function setChatActive(active) {
    elements.chatHeader?.classList.toggle('hidden', !active)
    elements.chatForm?.classList.toggle('hidden', !active)

    if (!active) {
      state.currentChatId = null
      state.currentGroupData = null
    }
  }

  function hideGroupPanelButton() {
    elements.openPanelButton?.classList.add('hidden')
  }

  function showGroupPanelButton() {
    elements.openPanelButton?.classList.remove('hidden')
  }

  function closePanel() {
    elements.panel?.classList.add('hidden')
    elements.panel?.classList.remove('panel')
  }

  function configureGroupPanel(isAdmin) {
    elements.panelEditGroup?.classList.toggle('hidden', !isAdmin)
    elements.panelDeleteGroup?.classList.toggle('hidden', !isAdmin)
    elements.panelLeaveGroup?.classList.toggle('hidden', isAdmin)
  }

  function hideHeaderStatusIndicator() {
    if (!elements.chatHeaderStatusIndicator) return

    elements.chatHeaderStatusIndicator.style.display = 'none'
    elements.chatHeaderStatusIndicator.removeAttribute('data-user-id')
    elements.chatHeaderStatusIndicator.classList.remove('online', 'offline')
  }

  function renderChatAvatar(data) {
    if (!elements.chatAvatar) return

    const name = data.chat_name || 'Чат'

    if (data.is_group && data.avatar_url) {
      elements.chatAvatar.innerHTML = `<img src="${data.avatar_url}" alt="${name}">`
      return
    }

    elements.chatAvatar.textContent = typeof getInitials === 'function'
      ? getInitials(name)
      : name.slice(0, 1).toUpperCase()
  }

  function showDefaultChatScreen() {
    state.currentChatId = null
    state.currentGroupData = null

    window.ChatSocket?.close?.()

    setChatActive(false)
    hideGroupPanelButton()
    closePanel()
    hideHeaderStatusIndicator()

    if (elements.chatWindow) {
      elements.chatWindow.classList.add('placeholder-active')
      elements.chatWindow.innerHTML = `
        <div class="chat-placeholder-container">
          <h2 class="placeholder-title">Почніть нове спілкування</h2>
          <p class="placeholder-subtitle">
            Оберіть контакт зі списку ліворуч<br>
            або створіть групу, щоб почати спілкування
          </p>
        </div>
      `
    }
  }

  function renderChat(data) {
    state.currentChatId = data.chat_id

    if (elements.chatTitle) {
      elements.chatTitle.textContent = data.chat_name || 'Чат'
    }

    renderChatAvatar(data)

    if (elements.chatWindow) {
      elements.chatWindow.classList.remove('placeholder-active')
      elements.chatWindow.innerHTML = ''
<<<<<<< HEAD

      window.renderMessages(elements.chatWindow, data.messages || [], state.currentUserId)

=======
      window.renderMessages(elements.chatWindow, data.messages || [], state.currentUserId)
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
      scrollToBottom()
    }

    setChatActive(true)
    window.ChatSocket.connect(data.chat_id)
  }

  function scrollToBottom() {
    if (!elements.chatWindow) return
<<<<<<< HEAD

    const scroll = () => {
      elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight
    }
=======
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight
  }
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835

    requestAnimationFrame(scroll)
    setTimeout(scroll, 100)
    setTimeout(scroll, 300)
  }

  function addMessage(data) {
    if (!elements.chatWindow) return

    const bubble = window.createMessageBubble(
      data.message || '',
<<<<<<< HEAD
      Number(data.sender_id) === Number(state.currentUserId),
=======
      data.sender_id === state.currentUserId,
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
      data.created_at,
      data.sender_name,
      data.images || [],
      data.is_read || false,
<<<<<<< HEAD
      data.message_id || data.id || null
=======
      data.message_id || null
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
    )

    elements.chatWindow.appendChild(bubble)
    scrollToBottom()
  }

<<<<<<< HEAD
  function updateChatPreview(chatId, message, createdAt, senderId = null) {
    let button = document.querySelector(`.chat-user-button[data-chat-id="${chatId}"]`)

    if (!button && senderId) {
      button = document.querySelector(`.chat-user-button[data-chat-user="${senderId}"]`)
    }

    if (!button) return

    if (chatId) {
      button.dataset.chatId = chatId
    }

    const messageElement = button.querySelector('.user-message')
    const timeElement = button.querySelector('.message-time')

    if (messageElement) {
      messageElement.textContent = message || 'Фото'
    }

    if (timeElement) {
      const formattedTime = window.formatTime?.(createdAt)

      if (formattedTime) {
        timeElement.textContent = formattedTime
        timeElement.dataset.time = createdAt
      }
    }

    button.dataset.lastMessageTime = Date.now()
    sortChatsByLastMessage()
  }

  function updateOpenedGroupAfterEdit(data) {
    if (!data?.chat_id) return

    const button = document.querySelector(`.chat-user-button[data-chat-id="${data.chat_id}"]`)

    if (button) {
      const nameElement = button.querySelector('.user-name')
      const avatarImage = button.querySelector('.avatar-wrapper img')

      if (nameElement) {
        nameElement.textContent = data.chat_name
      }

      if (avatarImage && data.avatar_url) {
        avatarImage.src = data.avatar_url
      }
    }

    if (String(state.currentChatId) === String(data.chat_id)) {
      if (elements.chatTitle) {
        elements.chatTitle.textContent = data.chat_name
      }

      state.currentGroupData = {
        ...(state.currentGroupData || {}),
        ...data,
        is_group: true,
      }

      renderChatAvatar(state.currentGroupData)
=======
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
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
    }
  }

  function clearUnread(chatId) {
<<<<<<< HEAD
    if (window.UnreadMessages?.updateChatButtonUnread) {
      window.UnreadMessages.updateChatButtonUnread(chatId, 0)
    }

    const counts = {}

    document.querySelectorAll('.chat-user-button[data-chat-id]').forEach(button => {
      const badge = button.querySelector('.chat-unread-count')
      const count = Number(badge?.textContent || 0)
      counts[button.dataset.chatId] = count
    })

    if (window.UnreadMessages?.applyUnreadCounts) {
      window.UnreadMessages.applyUnreadCounts(counts)
    }
=======
    updateUnreadBadge(chatId, 0)
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
  }

  function sortChatsByLastMessage() {
    document.querySelectorAll('.chats-list').forEach(list => {
      const items = Array.from(list.querySelectorAll('.chat-user-button'))

      items.sort((a, b) => {
        return Number(b.dataset.lastMessageTime || 0) - Number(a.dataset.lastMessageTime || 0)
      })

      items.forEach(item => list.appendChild(item))
    })
  }

  function isUserOnline(userId) {
    return window.Presence?.onlineUsers?.has(String(userId)) || false
  }

  function renderPersonalStatus(isOnline) {
    if (!elements.chatStatus) return

    elements.chatStatus.textContent = isOnline ? 'В мережі' : 'Не в мережі'
  }

  function updateHeaderStatusIndicator(userId) {
    if (!elements.chatHeaderStatusIndicator || !userId) return

    const isOnline = isUserOnline(userId)

    elements.chatHeaderStatusIndicator.dataset.userId = userId
    elements.chatHeaderStatusIndicator.style.display = ''
    elements.chatHeaderStatusIndicator.classList.toggle('online', isOnline)
    elements.chatHeaderStatusIndicator.classList.toggle('offline', !isOnline)

    renderPersonalStatus(isOnline)
  }

  function updateCurrentHeaderFromList() {
    if (!state.currentChatId || !elements.chatStatus) return

    const currentButton = document.querySelector(`.chat-user-button[data-chat-id="${state.currentChatId}"]`)
    const userId = currentButton?.dataset.chatUser
<<<<<<< HEAD

    if (!userId) {
      hideHeaderStatusIndicator()
      return
    }

    updateHeaderStatusIndicator(userId)
=======
    if (!userId) return

    const isOnline = document
      .querySelector(`.status-indicator[data-user-id="${userId}"]`)
      ?.classList.contains('online')

    renderPersonalStatus(Boolean(isOnline))
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
  }

  function updateHeaderPresence(userId, isOnline) {
    const currentButton = document.querySelector(`.chat-user-button[data-chat-id="${state.currentChatId}"]`)

<<<<<<< HEAD
    if (currentButton?.dataset.chatUser !== String(userId)) return

    renderPersonalStatus(isOnline)

    if (elements.chatHeaderStatusIndicator) {
      elements.chatHeaderStatusIndicator.dataset.userId = String(userId)
      elements.chatHeaderStatusIndicator.style.display = ''
      elements.chatHeaderStatusIndicator.classList.toggle('online', isOnline)
      elements.chatHeaderStatusIndicator.classList.toggle('offline', !isOnline)
    }
  }

  function updateUserPresence(userId, isOnline) {
    document
      .querySelectorAll(`.status-indicator[data-user-id="${userId}"]`)
      .forEach(indicator => {
        indicator.classList.toggle('online', isOnline)
        indicator.classList.toggle('offline', !isOnline)
      })

    updateHeaderPresence(userId, isOnline)
  }

  function syncOnlineUsers(userIds) {
    const onlineIds = new Set((userIds || []).map(String))

    document.querySelectorAll('.status-indicator[data-user-id]').forEach(indicator => {
      const isOnline = onlineIds.has(String(indicator.dataset.userId))

      indicator.classList.toggle('online', isOnline)
      indicator.classList.toggle('offline', !isOnline)
    })

    updateCurrentHeaderFromList()
  }

  function applyUnreadCounts(counts) {
    if (window.UnreadMessages?.applyUnreadCounts) {
      window.UnreadMessages.applyUnreadCounts(counts)
      return
    }

    Object.entries(counts || {}).forEach(([chatId, count]) => {
      window.UnreadMessages?.updateChatButtonUnread?.(chatId, Number(count) || 0)
    })
=======
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
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
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
<<<<<<< HEAD
    state.currentGroupData = null
    hideGroupPanelButton()
    closePanel()
    updateHeaderStatusIndicator(userId)
=======
    updateCurrentHeaderFromList()
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
  }

  async function openGroupChat(chatId) {
    const response = await fetch(`/chat/chat_open/${chatId}/`)
    const data = await response.json()

    if (!data.success) return

<<<<<<< HEAD
    clearUnread(data.chat_id)
    renderChat(data)

    state.currentGroupData = data

    showGroupPanelButton()
    hideHeaderStatusIndicator()
    configureGroupPanel(Boolean(data.is_admin))

    if (elements.chatStatus) {
      const participants = Number(data.participants_count) || 0
      const online = Number(data.online_count) || 0

      elements.chatStatus.textContent = `${participants} учасники, ${online} в мережі`
    }
  }

  async function leaveGroupChat() {
    if (!state.currentChatId) return

    const confirmed = confirm('Покинути групу?')
    if (!confirmed) return

    const response = await fetch(`/chat/group/${state.currentChatId}/leave/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken(),
      },
    })

    const data = await response.json()

    if (!data.success) {
      alert('Не вдалося покинути групу')
      return
    }

    document
      .querySelector(`.chat-user-button[data-chat-id="${state.currentChatId}"]`)
      ?.remove()

    closePanel()
    showDefaultChatScreen()
  }

  async function deleteGroupChat() {
    if (!state.currentChatId) return

    const confirmed = confirm('Видалити групу для всіх учасників?')
    if (!confirmed) return

    const response = await fetch(`/chat/group/${state.currentChatId}/delete/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken(),
      },
    })

    const data = await response.json()

    if (!data.success) {
      alert('Видалити групу може тільки адмін')
      return
    }

    document
      .querySelector(`.chat-user-button[data-chat-id="${state.currentChatId}"]`)
      ?.remove()

    closePanel()
    showDefaultChatScreen()
  }

  function bindPanelActions() {
    elements.panelEditGroup?.addEventListener('click', () => {
      closePanel()

      if (!state.currentGroupData) return

      window.GroupModal?.openEditGroupModal(state.currentGroupData)
    })

    elements.panelLeaveGroup?.addEventListener('click', leaveGroupChat)
    elements.panelDeleteGroup?.addEventListener('click', deleteGroupChat)
  }

  function bindChatButtons() {
    document.querySelectorAll('.chat-user-button').forEach(button => {
      button.addEventListener('click', () => {
        if (button.dataset.chatType === 'group') {
          openGroupChat(button.dataset.chatId)
          return
        }

        if (button.dataset.chatUser) {
          openPersonalChat(button.dataset.chatUser, button.dataset.chatUsername, button)
          return
        }

=======
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

>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
        if (button.dataset.chatId) {
          openGroupChat(button.dataset.chatId)
        }
      })
    })
  }
<<<<<<< HEAD

  function bindBackArrow() {
    elements.backArrow?.addEventListener('click', showDefaultChatScreen)
  }

  function formatInitialSidebarTimes() {
    document.querySelectorAll('.message-time[data-time]').forEach(element => {
      const formattedTime = window.formatTime?.(element.dataset.time)

      if (formattedTime) {
        element.textContent = formattedTime
      }
    })
  }
=======
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835

  function init() {
    cacheElements()
    setChatActive(false)
<<<<<<< HEAD
    hideGroupPanelButton()
    closePanel()
    bindChatButtons()
    bindBackArrow()
    bindPanelActions()
    formatInitialSidebarTimes()
=======
    bindChatButtons()
>>>>>>> 7dc235b581878fca51f80b9aee88182cd95fe835
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
    updateOpenedGroupAfterEdit,
    renderChatAvatar,
  }

  document.addEventListener('DOMContentLoaded', init)
})()