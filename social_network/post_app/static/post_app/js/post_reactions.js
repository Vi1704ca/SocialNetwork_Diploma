function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : document.querySelector("[name=csrfmiddlewaretoken]")?.value;
}

async function sendPostView(postId, postElement) {
    if (postElement.dataset.viewRegistered === "true") {
        return;
    }

    postElement.dataset.viewRegistered = "true";

    const response = await fetch(`/post/view/${postId}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest"
        }
    });

    const data = await response.json();

    if (data.success) {
        const counter = postElement.querySelector("[data-views-count]");
        if (counter) {
            counter.textContent = data.views_count;
        }
    }
}

document.addEventListener("click", async event => {
    const button = event.target.closest("[data-reaction-type]");

    if (!button) {
        return;
    }

    event.preventDefault();

    const postId = button.dataset.postId;
    const reactionType = button.dataset.reactionType;
    const postElement = button.closest(".post");

    const response = await fetch(`/post/reaction/${postId}/${reactionType}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest"
        }
    });

    const data = await response.json();

    if (!data.success || !postElement) {
        return;
    }

    button.classList.toggle("active", data.reacted);

    const heartCount = postElement.querySelector("[data-heart-count]");
    const likeCount = postElement.querySelector("[data-like-count]");
    const viewsCount = postElement.querySelector("[data-views-count]");

    if (heartCount) heartCount.textContent = data.heart_count;
    if (likeCount) likeCount.textContent = data.like_count;
    if (viewsCount) viewsCount.textContent = data.views_count;
});

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        }

        const postElement = entry.target;
        const postId = postElement.dataset.postId;

        if (postId) {
            sendPostView(postId, postElement);
        }
    });
}, {
    threshold: 0.5
});

document.querySelectorAll(".post[data-post-id]").forEach(post => {
    observer.observe(post);
});

const mutationObserver = new MutationObserver(() => {
    document.querySelectorAll(".post[data-post-id]:not([data-observed-view])").forEach(post => {
        post.dataset.observedView = "true";
        observer.observe(post);
    });
});

mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
});