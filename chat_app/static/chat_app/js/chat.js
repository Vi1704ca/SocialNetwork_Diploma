let chatSocket = null

function getCSRFToken() {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta ? meta.getAttribute('content') : document.querySelector('[name=csrfmiddlewaretoken]')?.value
}

document.addEventListener('DOMContentLoaded', () => {
  const chatTitle = document.getElementById('chat-title')
  const chatStatus = document.getElementById('chat-status')
  const chatDate = document.getElementById('chat-date')
  const chatButtons = document.querySelectorAll('[data-chat-user], [data-chat-id]')
  const chatWindow = document.getElementById('chat-window')
  const chatForm = document.getElementById('chat-message-form')
  const chatInput = document.getElementById('chat-input')
  const currentUserId = Number(document.querySelector('meta[name="current-user-id"]')?.content || 0)
  const pendingClientIds = new Set()
  let lastRenderedDate = null

  function formatTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  function createMessageBubble(text, isSelf = false, createdAt = null) {
    const row = document.createElement('div')
    row.className = `message-row${isSelf ? ' self' : ' incoming'}`

    const bubble = document.createElement('div')
    bubble.className = `chat-bubble${isSelf ? ' self' : ' incoming'}`
    const time = createdAt ? `<span class="bubble-time">${formatTime(createdAt)}</span>` : ''
    bubble.innerHTML = `<span class="message-text">${text}</span>${time}`

    if (!isSelf) {
      const avatar = document.createElement('div')
      avatar.className = 'bubble-avatar'
      avatar.innerHTML = '<img src="/static/chat_app/icons/Jane Cooper.png" alt="avatar">'
      row.appendChild(avatar)
    }

    row.appendChild(bubble)
    return row
  }

  function createDateDivider(dateString) {
    const divider = document.createElement('div')
    divider.className = 'message-date-divider'
    divider.textContent = formatDate(dateString)
    return divider
  }

  function resetDateState() {
    lastRenderedDate = null
    if (chatDate) {
      chatDate.textContent = ''
    }
  }

  function maybeInsertDate(dateString) {
    if (!chatWindow) return
    const currentDate = new Date(dateString).toDateString()
    if (currentDate !== lastRenderedDate) {
      const divider = createDateDivider(dateString)
      chatWindow.appendChild(divider)
      if (chatDate && !lastRenderedDate) {
        chatDate.textContent = formatDate(dateString)
      }
      lastRenderedDate = currentDate
    }
  }

  function renderMessages(messages) {
    if (!chatWindow) return
    chatWindow.innerHTML = ''
    resetDateState()
    messages.forEach(message => {
      maybeInsertDate(message.created_at)
      const isSelf = message.sender_id === currentUserId
      const bubble = createMessageBubble(message.message, isSelf, message.created_at)
      chatWindow.appendChild(bubble)
    })
    chatWindow.scrollTop = chatWindow.scrollHeight
  }

  function connectWebSocket(chatId) {
    if (chatSocket) {
      chatSocket.close()
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    chatSocket = new WebSocket(`${protocol}://${window.location.host}/chat/${chatId}/`)

    chatSocket.onmessage = function(event) {
      const data = JSON.parse(event.data)
      if (data.message) {
        if (data.sender_id === currentUserId && data.client_id && pendingClientIds.has(data.client_id)) {
          pendingClientIds.delete(data.client_id)
          return
        }

        if (chatStatus) {
          chatStatus.textContent = 'Онлайн'
        }
        if (chatWindow) {
          const isSelf = data.sender_id === currentUserId
          const bubble = createMessageBubble(data.message, isSelf, data.created_at)
          chatWindow.appendChild(bubble)
          chatWindow.scrollTop = chatWindow.scrollHeight
        }
      }
    }

    chatSocket.onclose = function() {
      if (chatStatus) {
        chatStatus.textContent = 'Підключення закрито'
      }
    }
  }

  async function openPersonalChat(userId, username) {
    const response = await fetch(`/chat/chat_with/${userId}/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken(),
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (!data.success) {
      return
    }
    if (chatTitle) {
      chatTitle.textContent = `Чат з ${data.username || username}`
    }
    if (chatWindow) {
      renderMessages(data.messages || [])
    }
    connectWebSocket(data.chat_id)
  }

  async function openGroupChat(chatId, chatName) {
    const response = await fetch(`/chat/chat_open/${chatId}/`)
    const data = await response.json()
    if (!data.success) {
      return
    }
    if (chatTitle) {
      chatTitle.textContent = data.chat_name || chatName || 'Груповий чат'
    }
    if (chatWindow) {
      renderMessages(data.messages || [])
    }
    connectWebSocket(data.chat_id)
  }

  chatButtons.forEach(function(button) {
    button.addEventListener('click', async function() {
      if (button.dataset.chatUser) {
        await openPersonalChat(button.dataset.chatUser, button.dataset.chatUsername)
      } else if (button.dataset.chatId) {
        await openGroupChat(button.dataset.chatId, button.dataset.chatName)
      }
    })
  })

  if (chatForm) {
    chatForm.addEventListener('submit', function(event) {
      event.preventDefault()
      if (!chatInput || !chatInput.value.trim() || !chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
        return
      }
      const message = chatInput.value.trim()
      const clientId = (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2)
      const createdAt = new Date().toISOString()
      pendingClientIds.add(clientId)
      
      if (chatWindow) {
        const bubble = createMessageBubble(message, true, createdAt)
        bubble.dataset.clientId = clientId
        chatWindow.appendChild(bubble)
        chatWindow.scrollTop = chatWindow.scrollHeight
      }

      chatSocket.send(JSON.stringify({ message, client_id: clientId }))
      chatInput.value = ''
    })
  }
})

