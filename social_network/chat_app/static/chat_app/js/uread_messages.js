(function () {
  function unreadText(count) {
    return count > 0 ? `(${count})` : ''
  }

  function setTextById(id, count) {
    const element = document.getElementById(id)

    if (element) {
      element.textContent = unreadText(count)
    }
  }

  function getUnreadBadge(button) {
    let badge = button.querySelector('.chat-unread-count')

    if (!badge) {
      badge = document.createElement('div')
      badge.className = 'chat-unread-count'
      button.querySelector('.avatar-wrapper')?.appendChild(badge)
    }

    return badge
  }

  function updateChatButtonUnread(chatId, count) {
    const button = document.querySelector(`.chat-user-button[data-chat-id="${chatId}"]`)

    if (!button) return

    const badge = getUnreadBadge(button)

    button.classList.toggle('has-unread', count > 0)
    badge.textContent = count > 0 ? count : ''
    badge.style.display = count > 0 ? 'flex' : 'none'
  }

  function updateTotalBadge(total) {
    const badge = document.querySelector('.notification-badge')
    const badgeText = badge?.querySelector('span')

    if (!badge || !badgeText) return

    badgeText.textContent = total > 0 ? total : ''
    badge.style.display = total > 0 ? 'flex' : 'none'
  }

  function applyUnreadCounts(counts) {
    const safeCounts = counts || {}
    let total = 0

    Object.entries(safeCounts).forEach(([chatId, count]) => {
      const normalizedCount = Number(count) || 0

      total += normalizedCount
      updateChatButtonUnread(chatId, normalizedCount)
    })

    setTextById('headerUnreadCount', total)
    setTextById('personalUnreadCount', total)
    setTextById('pesronalUnreadCount', total)
    updateTotalBadge(total)
  }

  function clearChatUnread(chatId) {
    updateChatButtonUnread(chatId, 0)
  }

  window.UnreadMessages = {
    applyUnreadCounts,
    clearChatUnread,
    updateChatButtonUnread,
  }
})()