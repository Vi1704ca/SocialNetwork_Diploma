document.addEventListener('DOMContentLoaded', () => {
    const routes = {
        'link-register': 'form_register',
        'link-login': 'form_login',
        'email-link': 'form_confirm_email',
        'back': 'form_register'
    };

    const activeFormToLink = {
        form_register: 'link-register',
        form_login: 'link-login'
    };

    const allFormIds = Array.from(new Set(Object.values(routes)));
    const switchLinks = document.querySelectorAll('.switchForm');

    const navigateTo = (targetId) => {
        const targetFormId = routes[targetId];
        allFormIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = (id === targetFormId) ? 'block' : 'none';
            }
        });

        const activeLinkId = activeFormToLink[targetFormId] || null;
        switchLinks.forEach(link => {
            link.classList.toggle('active', link.id === activeLinkId);
        });
    };

    window.navigateTo = navigateTo;

    document.addEventListener('click', (event) => {
        const clickedId = event.target.id;
        if (routes[clickedId]) {
            navigateTo(clickedId);
        }
    });

    navigateTo('link-register');
});