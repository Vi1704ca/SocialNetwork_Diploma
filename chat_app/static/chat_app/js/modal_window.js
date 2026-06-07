document.addEventListener('DOMContentLoaded', () => {
     const buttonPanel = document.getElementById("open-panel")
     const modalPanel = document.getElementById("panel")

     if (buttonPanel && modalPanel){
        buttonPanel.addEventListener('click', () => {
            if (modalPanel.classList.contains('hidden')){
                modalPanel.classList.remove('hidden'); 
                modalPanel.classList.add('panel');
            } else{
                modalPanel.classList.add('hidden'); 
                modalPanel.classList.remove('panel');
            }
        });
     }

    const buttonModalChat = document.querySelector(".create-chat")
    const modalChat = document.getElementById("select-members")
    const modalOverlay = document.querySelector('.modal-window')
    const closeModalChat = document.getElementById("close-select-members")

    const nextSelectMembers = document.getElementById('select-members-next')
    const cancelSelectMembers = document.getElementById('cancel-select-members')
    const newGroupModal = document.getElementById('new-group-modal')
    const closeNewGroupModal = document.getElementById('close-new-group-modal')
    const backToSelect = document.getElementById('group-modal-back')
    const memberCheckboxes = document.querySelectorAll('.group-member-checkbox')
    const selectedCount = document.querySelector('.selected-count')
    const groupMembersInput = document.getElementById('group-members-input')
    const groupMembersPreview = document.getElementById('group-members-preview')
    const searchInput = document.getElementById('group-search-input')

    const updateSelectedCount = () => {
        const count = Array.from(memberCheckboxes).filter(input => input.checked).length
        if (selectedCount) {
            selectedCount.textContent = `Вибрано: ${count}`
        }
    }

    const closeAllModals = () => {
        if (modalChat) {
            modalChat.classList.add('hidden')
            modalChat.classList.remove('select-members')
        }
        if (newGroupModal) {
            newGroupModal.classList.add('hidden')
        }
        if (modalOverlay) {
            modalOverlay.classList.add('hidden')
        }
    }

    const openSelectMembers = () => {
        if (modalChat) {
            modalChat.classList.remove('hidden')
            modalChat.classList.add('select-members')
        }
        if (newGroupModal) {
            newGroupModal.classList.add('hidden')
        }
        if (modalOverlay) {
            modalOverlay.classList.remove('hidden')
        }
    }

    const openNewGroupModal = () => {
        if (modalChat) {
            modalChat.classList.add('hidden')
            modalChat.classList.remove('select-members')
        }
        if (newGroupModal) {
            newGroupModal.classList.remove('hidden')
        }
        if (modalOverlay) {
            modalOverlay.classList.remove('hidden')
        }
    }

    const renderGroupPreview = () => {
        if (!groupMembersPreview || !groupMembersInput) return
        const selected = Array.from(memberCheckboxes).filter(input => input.checked)
        groupMembersInput.value = selected.map(input => input.value).join(',')
        groupMembersPreview.innerHTML = selected.map(input => {
            const memberName = input.closest('.member')?.querySelector('.name-member p')?.textContent || ''
            return `<div class="member"><img src="/static/chat_app/icons/NP.png" alt="${memberName}"><p>${memberName}</p></div>`
        }).join('')
    }

    if (Array.from(memberCheckboxes).length > 0) {
        memberCheckboxes.forEach(input => {
            input.addEventListener('change', () => {
                updateSelectedCount()
            })
        })
    }

    if (buttonModalChat && modalChat && modalOverlay) {
        buttonModalChat.addEventListener('click', () => {
            openSelectMembers()
            updateSelectedCount()
        });
    }

    if (closeModalChat && modalChat && modalOverlay) {
        closeModalChat.addEventListener('click', () => {
            closeAllModals()
        });
    }

    if (cancelSelectMembers) {
        cancelSelectMembers.addEventListener('click', () => {
            closeAllModals()
        })
    }

    if (nextSelectMembers) {
        nextSelectMembers.addEventListener('click', () => {
            renderGroupPreview()
            openNewGroupModal()
        })
    }

    if (backToSelect) {
        backToSelect.addEventListener('click', () => {
            openSelectMembers()
        })
    }

    if (closeNewGroupModal) {
        closeNewGroupModal.addEventListener('click', () => {
            closeAllModals()
        })
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const value = searchInput.value.toLowerCase()
            document.querySelectorAll('#select-members-list .member').forEach(member => {
                const name = member.querySelector('.name-member p')?.textContent?.toLowerCase() || ''
                member.style.display = name.includes(value) ? 'flex' : 'none'
            })
        })
    }

    updateSelectedCount()

})