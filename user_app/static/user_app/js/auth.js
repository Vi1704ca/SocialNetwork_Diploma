function getCSRFToken(){
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content')
}

document.getElementById("register-form").addEventListener(
    "submit",
    (event) => {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);

        fetch(form.action, {
            method: "POST", 
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "X-Requested-With": "XMLHttpRequest",
            },
            body: formData  
        })
            .then(async (response) => {
                const data = await response.json()
                if (!response.ok){
                    throw data;    
                }
                return data
            })   
            .then((data)=>{
                console.log("Користувач успішно створений")
                const email = formData.get('email');
                document.getElementById('confirm-email').value = email;
                document.getElementById('user-email').textContent = email;
                navigateTo('email-link');
            })
            .catch((data)=>{
                if(data.errors){
                    console.log(data.errors)
                }
            })
    }
)

document.getElementById("login-form").addEventListener(
    "submit",
    (event) => {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);

        fetch(form.action, {
            method: "POST", 
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "X-Requested-With": "XMLHttpRequest",
            },
            body: formData  
        })
            .then(async (response) => {
                const data = await response.json()
                if (!response.ok){
                    throw data;    
                }
                return data
            })   
            .then((data)=>{
                console.log("Користувач успішно залогінився")
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
            })
            .catch((data)=>{
                if(data.errors){
                    console.log(data.errors)
                }
            })
    }
)

document.getElementById("confirm-form").addEventListener(
    "submit",
    (event) => {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);

        fetch(form.action, {
            method: "POST", 
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "X-Requested-With": "XMLHttpRequest",
            },
            body: formData  
        })
            .then(async (response) => {
                const data = await response.json()
                if (!response.ok){
                    throw data;    
                }
                return data
            })   
            .then((data)=>{
                console.log("E-mail підтверджено")
                if (data.show_modal && data.modal_html) {
                    document.body.insertAdjacentHTML('beforeend', data.modal_html);
                } else if (data.redirect) {
                    window.location.href = data.redirect;
                }
            })
            .catch((data)=>{
                if(data.message){
                    console.log(data.message)
                }
            })
    }
)

document.addEventListener("submit", (event) => {
    if (event.target && event.target.id === "userDetailsForm") {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        fetch(form.action, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "X-Requested-With": "XMLHttpRequest",
            },
            body: formData
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw data;
                }
                return data;
            })
            .then((data) => {
                console.log("Деталі користувача успішно збережено");
                const modal = document.getElementById("userDetailsModal");
                if (modal) {
                    modal.remove();
                }

                if (data.redirect) {
                    window.location.href = data.redirect;
                }
            })
            .catch((data) => {
                if (data.errors) {
                    console.log("Помилки валідації деталей:", data.errors);
                }
            });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const passwordFields = document.querySelectorAll('input[type="password"]');

    passwordFields.forEach((input) => {
        if (input.closest('.password-input-wrapper')) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'password-input-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'password-toggle-btn';
        toggleButton.setAttribute('aria-label', 'Показати пароль');
        toggleButton.setAttribute('title', 'Показати пароль');
        wrapper.appendChild(toggleButton);

        toggleButton.addEventListener('click', () => {
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            toggleButton.classList.toggle('opened');
            toggleButton.setAttribute('aria-label', isHidden ? 'Сховати пароль' : 'Показати пароль');
            toggleButton.setAttribute('title', isHidden ? 'Сховати пароль' : 'Показати пароль');
        });
    });
});