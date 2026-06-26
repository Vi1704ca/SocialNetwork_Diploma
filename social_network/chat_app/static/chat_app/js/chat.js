(function () {
  let socket = null

  function getSocketUrl(chatId) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.host}/chat/${chatId}/`
  }

  function connect(chatId) {
    close()

    socket = new WebSocket(getSocketUrl(chatId))

    socket.onopen = () => {
      markRead()
    }

    socket.onmessage = event => {
      const data = JSON.parse(event.data)

      if (data.type === 'chat_message') {
        window.ChatUI.addMessage(data)

        if (data.chat_id) {
          window.ChatUI.updateChatPreview(data.chat_id, data.message || 'Фото', data.created_at)
        }

        if (data.sender_id !== window.ChatUI.state.currentUserId) {
          markRead()
        }

        return
      }

      if (data.type === 'read_receipt') {
        window.markMessageSeen?.(data.message_id)
        return
      }
      
      if (data.sender_id !== window.ChatUI.state.currentUserId) {
        markRead()
      }

      if (data.type === 'unread_update') {
        window.ChatUI.applyUnreadCounts(data.unread_counts)
      }
    }
  }

  function close() {
    if (!socket) return

    socket.onmessage = null
    socket.onclose = null
    socket.close()
    socket = null
  }

  function sendMessage(message) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false

    socket.send(JSON.stringify({
      message,
      client_id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    }))

    return true
  }

  function markRead() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return

    socket.send(JSON.stringify({
      type: 'mark_read',
    }))
  }

  function bindForm() {
    const form = document.getElementById('chat-message-form')
    const input = document.getElementById('chat-input')

    form?.addEventListener('submit', async event => {
      event.preventDefault()

      const chatId = window.ChatUI.state.currentChatId
      const message = input?.value.trim() || ''
      const hasImages = window.getSelectedImages?.().length > 0

      if (!chatId) return

      if (hasImages) {
        const result = await window.sendMessageWithImages(chatId, message)

        if (result?.success) {
          input.value = ''
          window.clearSelectedImages?.()
        }

        return
      }

      if (!message) return

      const sent = sendMessage(message)

      if (sent) {
        input.value = ''
      }
    })
  }

  window.ChatSocket = {
    connect,
    close,
    sendMessage,
    markRead,
  }

  document.addEventListener('DOMContentLoaded', bindForm)
})()