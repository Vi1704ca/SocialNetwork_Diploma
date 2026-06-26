(function () {
    const loaderLine = document.getElementById("postLoaderLine");
    const postList = document.querySelector(".post-list");

    if (!loaderLine || !postList) {
        return;
    }

    if (window.postListInitialized) {
        return;
    }

    window.postListInitialized = true;

    let currentPage = 1;
    let isLoading = false;

    const observer = new IntersectionObserver(async (entries) => {
        if (!entries[0].isIntersecting || isLoading) {
            return;
        }

        isLoading = true;
        currentPage += 1;

        try {
            const path = window.location.pathname;

            const response = await fetch(`${path}?page=${currentPage}`, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            const data = await response.json();

            if (data.success) {
                loaderLine.insertAdjacentHTML("beforebegin", data.html);
            } else {
                observer.disconnect();
            }
        } catch (error) {
            console.error("Post list loading error:", error);
            observer.disconnect();
        }

        isLoading = false;
    }, { rootMargin: "200px" });

    observer.observe(loaderLine);
})();