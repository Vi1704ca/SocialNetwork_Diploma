const observer = new MutationObserver(() => {
    const containers = document.querySelectorAll('.post div div');
    
    containers.forEach(container => {
        const links = Array.from(container.querySelectorAll('p a'));
        if (links.length === 0) return;

        // Сброс классов
        links.forEach(l => l.className = '');

        if (links.length < 3) {
            links.forEach(l => l.classList.add('img-fix'));
        } else if (links.length === 3) {
            links.forEach(l => l.classList.add('img-small'));
        } else {
            // Схема 2-3-2-3...
            for (let i = 0; i < links.length; ) {
                // Две большие
                if (links[i]) links[i].classList.add('img-big');
                if (links[i+1]) links[i+1].classList.add('img-big');
                i += 2;
                // Три маленькие
                if (links[i]) links[i].classList.add('img-small');
                if (links[i+1]) links[i+1].classList.add('img-small');
                if (links[i+2]) links[i+2].classList.add('img-small');
                i += 3;
            }
        }
    });
});

// Начинаем следить за изменениями в документе
observer.observe(document.body, { childList: true, subtree: true });