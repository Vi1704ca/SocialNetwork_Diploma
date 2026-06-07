document.querySelectorAll('a').forEach(link => {
    if (link.pathname === window.location.pathname) {
      link.classList.add('active');
    }
  });
// pathname чатов = пустой
// window.location.pathname = / (тоже пустой)