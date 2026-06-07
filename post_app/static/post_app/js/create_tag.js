import { renderErrors } from "../../../../static/js/renderErrors.js";

function getCSRFToken() {
    // Пытаемся найти токен в мета-тегах или в скрытом инпуте формы
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : document.querySelector('[name=csrfmiddlewaretoken]')?.value;
}

document.addEventListener('click', function(e) {
    const postModal = document.getElementById('modal-create-post');
    const tagModal = document.getElementById('tag-modal');

    // 1. Открытие модалки тега (через кнопку "+" или "Додати тег")
    if (e.target.closest('#tag-button') || e.target.closest('#open-modal-tag')) {
        e.preventDefault();
        
        if (postModal) postModal.style.setProperty('display', 'none', 'important');
        if (tagModal) tagModal.style.setProperty('display', 'flex', 'important');
    }

    // 2. Закрытие модалки тега (крестик или кнопка "Скасувати")
    if (e.target.closest('.close-modal-tag') || e.target.closest('#cancel-tag')) {
        e.preventDefault();
        
        if (tagModal) tagModal.style.setProperty('display', 'none', 'important');
        if (postModal) postModal.style.setProperty('display', 'flex', 'important');
        
        // Очищаем форму и ошибки при закрытии
        const form = document.getElementById('tag-form-element');
        if (form) form.reset();
        const errorContainer = document.getElementById("tag-errors");
        if (errorContainer) errorContainer.innerHTML = '';
    }
});

document.addEventListener('submit', function(e) {
    // 3. Обработка отправки формы создания тега
    if (e.target && e.target.id === 'tag-form-element') {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        })
        .then(data => {
            if (data.success) {
                // ТЕГ УСПЕШНО СОЗДАН
                // Чтобы модалка поста "узнала" о новом теге и отобразила его со всеми стилями,
                // мы просто перезагружаем страницу.
                window.location.reload();
            }
        })
        .catch(data => {
            if (data.errors) {
                // Вывод ошибок валидации (например, если тег пустой или слишком длинный)
                renderErrors("tag-errors", data.errors);
            }
        });
    }
});