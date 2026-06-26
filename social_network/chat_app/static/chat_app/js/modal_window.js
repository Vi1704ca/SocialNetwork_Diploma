document.addEventListener('DOMContentLoaded', () => {
  const buttonModalChat = document.querySelector('.create-chat')
  const modalChat = document.getElementById('select-members')
  const modalOverlay = document.querySelector('.modal-window')
  const closeModalChat = document.getElementById('close-select-members')

  const nextSelectMembers = document.getElementById('select-members-next')
  const cancelSelectMembers = document.getElementById('cancel-select-members')
  const selectMembersError = document.getElementById('select-members-error')
  const selectMembersTitle = document.getElementById('select-members-title')

  const newGroupModal = document.getElementById('new-group-modal')
  const groupModalTitle = document.getElementById('group-modal-title')
  const closeNewGroupModal = document.getElementById('close-new-group-modal')
  const backToSelect = document.getElementById('group-modal-back')

  const memberCheckboxes = document.querySelectorAll('.group-member-checkbox')
  const selectedCount = document.querySelector('.selected-count')
  const groupMembersInput = document.getElementById('group-members-input')
  const groupMembersPreview = document.getElementById('group-members-preview')
  const editAddMembersButton = document.getElementById('edit-add-members-btn')

  const groupSubmitIcon = document.getElementById('group-submit-icon')
  const groupNameInput = document.getElementById('make_a_name')
  const groupPhotoInput = document.getElementById('group-photo-input')
  const groupPhotoPreview = document.getElementById('group-photo-preview')
  const addPhotoButton = document.getElementById('group-add-photo-btn')
  const pickPhotoButton = document.getElementById('group-pick-photo-btn')
  const searchInput = document.getElementById('group-search-input')

  const selectedAvatarImageInput = document.getElementById('selected-avatar-image-id')
  const avatarGallery = document.getElementById('group-avatar-gallery')
  const avatarGalleryList = document.getElementById('group-avatar-gallery-list')
  const closeAvatarGallery = document.getElementById('close-avatar-gallery')

  let mode = 'create'
  let editingChatId = null

  function getSelectedCheckboxes() {
    return Array.from(memberCheckboxes).filter(input => input.checked)
  }

  function getSelectedMemberIds() {
    return getSelectedCheckboxes().map(input => input.value)
  }

  function updateSelectedCount() {
    const count = getSelectedCheckboxes().length
    if (selectedCount) selectedCount.textContent = `Вибрано: ${count}`
  }

  function setSelectedMemberIds(ids) {
    const idSet = new Set(ids.map(String))

    memberCheckboxes.forEach(input => {
      input.checked = idSet.has(String(input.value))
    })

    updateSelectedCount()
  }

  function getMemberNameById(id) {
    const checkbox = document.querySelector(`.group-member-checkbox[value="${id}"]`)
    return checkbox?.closest('.member')?.querySelector('.name-member p')?.textContent?.trim() || id
  }

  function renderGroupPreview() {
    if (!groupMembersPreview || !groupMembersInput) return

    const ids = getSelectedMemberIds()
    groupMembersInput.value = ids.join(',')

    groupMembersPreview.innerHTML = ids.map(id => {
      const memberName = getMemberNameById(id)
      const initials = typeof getInitials === 'function'
        ? getInitials(memberName)
        : memberName.slice(0, 2).toUpperCase()

      return `
        <div class="member-row-item" data-member-id="${id}">
          <div class="member-info-block">
            <div class="member-avatar-circle">${initials}</div>
            <p class="member-fullname">${memberName}</p>
          </div>

          <button type="button" class="remove-member" data-member-id="${id}">
            <img src="/static/chat_app/icons/garbage.svg" alt="">
          </button>
        </div>
      `
    }).join('')
  }

  function resetCreateMode() {
    mode = 'create'
    editingChatId = null

    if (newGroupModal) {
      newGroupModal.dataset.mode = 'create'
      newGroupModal.action = '/chat/group/create/'
    }

    if (groupModalTitle) groupModalTitle.textContent = 'Нова група'
    if (selectMembersTitle) selectMembersTitle.textContent = 'Нова група'
    if (groupSubmitIcon) groupSubmitIcon.src = '/static/chat_app/icons/make-group.svg'

    editAddMembersButton?.classList.add('hidden')

    if (selectedAvatarImageInput) selectedAvatarImageInput.value = ''
    if (groupNameInput) groupNameInput.value = ''
    if (groupMembersInput) groupMembersInput.value = ''
    if (groupMembersPreview) groupMembersPreview.innerHTML = ''
    if (groupPhotoInput) groupPhotoInput.value = ''

    setSelectedMemberIds([])

    if (groupPhotoPreview) {
      groupPhotoPreview.style.backgroundImage = ''
      groupPhotoPreview.innerHTML = '<span class="group-photo-initials">NG</span>'
    }
  }

  function closeAllModals() {
    modalChat?.classList.add('hidden')
    modalChat?.classList.remove('select-members')
    newGroupModal?.classList.add('hidden')
    modalOverlay?.classList.add('hidden')
    avatarGallery?.classList.add('hidden')
  }

  function openSelectMembers(nextMode = mode) {
    mode = nextMode

    if (selectMembersTitle) {
      selectMembersTitle.textContent = mode === 'edit' ? 'Додати учасника' : 'Нова група'
    }

    modalChat?.classList.remove('hidden')
    modalChat?.classList.add('select-members')
    newGroupModal?.classList.add('hidden')
    modalOverlay?.classList.remove('hidden')
    updateSelectedCount()
  }

  function openGroupModal() {
    modalChat?.classList.add('hidden')
    modalChat?.classList.remove('select-members')
    newGroupModal?.classList.remove('hidden')
    modalOverlay?.classList.remove('hidden')
  }

  function openEditGroupModal(chatData) {
    mode = 'edit'
    editingChatId = chatData.chat_id

    if (newGroupModal) {
      newGroupModal.dataset.mode = 'edit'
      newGroupModal.action = `/chat/group/${editingChatId}/edit/`
    }

    if (groupModalTitle) groupModalTitle.textContent = 'Редагування групи'
    if (selectMembersTitle) selectMembersTitle.textContent = 'Додати учасника'
    if (groupNameInput) groupNameInput.value = chatData.chat_name || ''
    if (groupSubmitIcon) groupSubmitIcon.src = '/static/chat_app/icons/confirm.svg'
    if (selectedAvatarImageInput) selectedAvatarImageInput.value = ''
    if (groupPhotoInput) groupPhotoInput.value = ''

    editAddMembersButton?.classList.remove('hidden')

    const memberIds = (chatData.members || [])
      .filter(member => String(member.id) !== String(window.ChatUI?.state?.currentUserId))
      .map(member => String(member.id))

    setSelectedMemberIds(memberIds)
    renderGroupPreview()

    if (groupPhotoPreview) {
      if (chatData.avatar_url) {
        groupPhotoPreview.style.backgroundImage = `url(${chatData.avatar_url})`
        groupPhotoPreview.innerHTML = ''
      } else {
        groupPhotoPreview.style.backgroundImage = ''
        groupPhotoPreview.innerHTML = '<span class="group-photo-initials">NG</span>'
      }
    }

    modalOverlay?.classList.remove('hidden')
    openGroupModal()
  }

  function validateSelectedMembers() {
    if (getSelectedCheckboxes().length < 2) {
      selectMembersError?.classList.remove('hidden')
      return false
    }

    selectMembersError?.classList.add('hidden')
    return true
  }

   async function openAvatarGallery() {
    const response = await fetch('/chat/group/avatars/')
    const data = await response.json()

    if (!data.success) return

    if (!data.images.length) {
      alert('У групах ще немає фото')
      return
    }

    avatarGalleryList.innerHTML = data.images.map(image => `
      <button type="button" class="avatar-gallery-item" data-image-id="${image.id}" data-image-url="${image.url}">
        <img src="${image.url}" alt="">
      </button>
    `).join('')

    avatarGallery?.classList.remove('hidden')
  }

  memberCheckboxes.forEach(input => {
    input.addEventListener('change', () => {
      updateSelectedCount()

      if (getSelectedCheckboxes().length >= 2) {
        selectMembersError?.classList.add('hidden')
      }
    })
  })

  buttonModalChat?.addEventListener('click', () => {
    resetCreateMode()
    openSelectMembers('create')
  })

  nextSelectMembers?.addEventListener('click', () => {
    if (!validateSelectedMembers()) return

    renderGroupPreview()
    openGroupModal()
  })

  editAddMembersButton?.addEventListener('click', () => {
    openSelectMembers('edit')
  })

  groupMembersPreview?.addEventListener('click', event => {
    const button = event.target.closest('.remove-member')
    if (!button) return

    const memberId = button.dataset.memberId
    const checkbox = document.querySelector(`.group-member-checkbox[value="${memberId}"]`)

    if (checkbox) checkbox.checked = false

    renderGroupPreview()
    updateSelectedCount()
  })

  newGroupModal?.addEventListener('submit', async event => {
    if (mode !== 'edit') return

    event.preventDefault()
    renderGroupPreview()

    const formData = new FormData(newGroupModal)

    const response = await fetch(`/chat/group/${editingChatId}/edit/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.content || '',
      },
      body: formData,
    })

    const data = await response.json()

    if (!data.success) {
      alert('Не вдалося зберегти зміни')
      return
    }

    window.ChatUI?.updateOpenedGroupAfterEdit?.(data)

    closeAllModals()
  })

  function updateGroupPhotoPreview(file) {
    if (!groupPhotoPreview || !file) return

    const reader = new FileReader()

    reader.onload = event => {
      groupPhotoPreview.style.backgroundImage = `url(${event.target.result})`
      groupPhotoPreview.innerHTML = ''
      groupPhotoPreview.classList.add('photo-selected')
    }

    reader.readAsDataURL(file)
  }

  addPhotoButton?.addEventListener('click', () => groupPhotoInput?.click())
  pickPhotoButton?.addEventListener('click', openAvatarGallery)

  groupPhotoInput?.addEventListener('change', () => {
    const file = groupPhotoInput.files?.[0]

    if (file) {
      if (selectedAvatarImageInput) selectedAvatarImageInput.value = ''
      updateGroupPhotoPreview(file)
    }
  })

  avatarGalleryList?.addEventListener('click', event => {
    const button = event.target.closest('.avatar-gallery-item')
    if (!button) return

    const imageId = button.dataset.imageId
    const imageUrl = button.dataset.imageUrl

    if (selectedAvatarImageInput) selectedAvatarImageInput.value = imageId
    if (groupPhotoInput) groupPhotoInput.value = ''

    if (groupPhotoPreview) {
      groupPhotoPreview.style.backgroundImage = `url(${imageUrl})`
      groupPhotoPreview.innerHTML = ''
      groupPhotoPreview.classList.add('photo-selected')
    }

    avatarGallery?.classList.add('hidden')
  })

  closeAvatarGallery?.addEventListener('click', () => {
    avatarGallery?.classList.add('hidden')
  })

  backToSelect?.addEventListener('click', () => {
    if (mode === 'edit') {
      closeAllModals()
      return
    }

    openSelectMembers('create')
  })

  closeModalChat?.addEventListener('click', closeAllModals)
  cancelSelectMembers?.addEventListener('click', closeAllModals)
  closeNewGroupModal?.addEventListener('click', closeAllModals)

  searchInput?.addEventListener('input', () => {
    const value = searchInput.value.toLowerCase()

    document.querySelectorAll('#select-members-list .letter-group').forEach(group => {
      let anyVisible = false

      group.querySelectorAll('.member').forEach(member => {
        const name = member.querySelector('.name-member p')?.textContent?.toLowerCase() || ''
        const visible = name.includes(value)

        member.style.display = visible ? 'flex' : 'none'
        if (visible) anyVisible = true
      })

      group.style.display = anyVisible ? 'flex' : 'none'
    })
  })

  window.GroupModal = {
    openEditGroupModal,
    closeAllModals,
  }

  updateSelectedCount()
})