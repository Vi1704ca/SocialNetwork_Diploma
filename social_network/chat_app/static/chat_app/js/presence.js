(function () {
  let socket = null
  let reconnectTimer = null
  const onlineUsers = new Set()

  function getSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.host}/presence/`
  }

  function getUserIdFromElement(element) {
    return element.dataset.userStatusId || element.dataset.userId
  }

  function getStatusElements(userId) {
    return document.querySelectorAll(
      `[data-user-status-id="${userId}"], [data-user-id="${userId}"]`
    )
  }

  function setUserStatus(userId, isOnline) {
    getStatusElements(userId).forEach(element => {
      element.classList.toggle('online', isOnline)
      element.classList.toggle('offline', !isOnline)
    })

    if (window.ChatUI?.updateUserPresence) {
      window.ChatUI.updateUserPresence(userId, isOnline)
    }
  }

  function syncOnlineUsers(userIds) {
    onlineUsers.clear()

    userIds.forEach(userId => {
      onlineUsers.add(String(userId))
    })

    document.querySelectorAll('[data-user-status-id], [data-user-id]').forEach(element => {
      const userId = getUserIdFromElement(element)
      const isOnline = onlineUsers.has(String(userId))

      element.classList.toggle('online', isOnline)
      element.classList.toggle('offline', !isOnline)
    })

    if (window.ChatUI?.syncOnlineUsers) {
      window.ChatUI.syncOnlineUsers(userIds)
    }
  }

  function applyUnreadCounts(counts) {
    if (window.UnreadMessages?.applyUnreadCounts) {
      window.UnreadMessages.applyUnreadCounts(counts)
      return
    }

    if (window.ChatUI?.applyUnreadCounts) {
      window.ChatUI.applyUnreadCounts(counts)
    }
  }

  function handleMessage(event) {
    const data = JSON.parse(event.data)

    if (data.type === 'presence_sync') {
      syncOnlineUsers(data.online_users || [])
      return
    }

    if (data.type === 'presence_update') {
      const userId = String(data.user_id)

      if (data.is_online) {
        onlineUsers.add(userId)
      } else {
        onlineUsers.delete(userId)
      }

      setUserStatus(userId, data.is_online)
      return
    }

    if (data.type === 'unread_update') {
      applyUnreadCounts(data.unread_counts || {})
    }
  }

  function connect() {
    socket = new WebSocket(getSocketUrl())

    socket.onmessage = handleMessage

    socket.onclose = () => {
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(connect, 1500)
    }
  }

  document.addEventListener('DOMContentLoaded', connect)

  window.Presence = {
    onlineUsers,
    setUserStatus,
    syncOnlineUsers,
  }
})()