function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : document.querySelector("[name=csrfmiddlewaretoken]")?.value;
}

let activePostId = null;

function getPanel() {
    return document.getElementById("modalPanel");
}

function openPanel(postId, buttonElement) {
    const panel = getPanel();

    if (!panel || !buttonElement) {
        return;
    }

    activePostId = postId;
    panel.dataset.postId = postId;

    panel.classList.remove("hidden");
    panel.classList.add("panel-edit");

    const buttonRect = buttonElement.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    let top = buttonRect.bottom + 8;
    let left = buttonRect.right - panelRect.width;

    if (left < 8) {
        left = 8;
    }

    if (left + panelRect.width > window.innerWidth - 8) {
        left = window.innerWidth - panelRect.width - 8;
    }

    if (top + panelRect.height > window.innerHeight - 8) {
        top = buttonRect.top - panelRect.height - 8;
    }

    panel.style.position = "fixed";
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.style.zIndex = "2000";
}

function closePanel() {
    const panel = getPanel();

    if (!panel) {
        return;
    }

    panel.classList.add("hidden");
    panel.classList.remove("panel-edit");
}

function clearLinks() {
    const linksList = document.getElementById("links-list");

    if (linksList) {
        linksList.innerHTML = "";
    }
}

function createLinkRow(value = "") {
    const linksList = document.getElementById("links-list");

    if (!linksList) {
        return;
    }

    const row = document.createElement("div");
    row.className = "link-item-row";

    const input = document.createElement("input");
    input.type = "url";
    input.name = "links";
    input.value = value;
    input.placeholder = "https://www.instagram.com/world.it...";
    input.className = "dynamic-input";

    const actions = document.createElement("div");
    actions.className = "actions-container";

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "circle-btn plus";
    plusBtn.innerHTML = `<img src="/static/icons/modal/plus.svg" alt="Додати">`;
    plusBtn.addEventListener("click", () => createLinkRow());

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "circle-btn remove";
    removeBtn.innerHTML = `<img src="/static/icons/modal/del_links.svg" alt="Видалити">`;
    removeBtn.addEventListener("click", () => {
        row.remove();

        if (!linksList.querySelector(".link-item-row")) {
            createLinkRow();
        }
    });

    actions.appendChild(plusBtn);
    actions.appendChild(removeBtn);
    row.appendChild(input);
    row.appendChild(actions);
    linksList.appendChild(row);
}

function setSelectedTags(tagIds) {
    const selected = tagIds.map(String);

    document.querySelectorAll('.create-post-forms .tags input[type="checkbox"]').forEach(input => {
        input.checked = selected.includes(input.value);
        input.closest("label")?.classList.toggle("selected", input.checked);
    });
}

function openCreateModalAsEdit(post) {
    const modal = document.getElementById("modal-create-post");
    const form = document.getElementById("post-create-form");

    if (!modal || !form) {
        return;
    }

    form.dataset.mode = "edit";
    form.dataset.postId = post.id;
    form.action = `/post/update/${post.id}/`;

    const titleInput = document.getElementById("id_title");
    const topicInput = document.getElementById("id_topic");
    const contentInput = document.getElementById("id_content");

    if (titleInput) titleInput.value = post.title;
    if (topicInput) topicInput.value = post.topic;
    if (contentInput) contentInput.value = post.content;

    setSelectedTags(post.tags || []);

    clearLinks();

    if (post.links && post.links.length) {
        post.links.forEach(link => createLinkRow(link));
    } else {
        createLinkRow();
    }

    const heading = form.querySelector("h2");
    if (heading) {
        heading.textContent = "Редагування публікації";
    }

    modal.style.display = "flex";
}

async function readJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Server returned not JSON:", text);
        throw new Error("Сервер повернув не JSON. Перевір URL запиту.");
    }

    return response.json();
}

document.addEventListener("click", async event => {
    const openBtn = event.target.closest("[data-open-post-panel]");
    if (openBtn) {
        event.preventDefault();
        openPanel(openBtn.dataset.postId, openBtn);
        return;
    }

    const deleteBtn = event.target.closest("[data-panel-delete-post]");
    if (deleteBtn) {
        event.preventDefault();

        if (!activePostId) {
            return;
        }

        const response = await fetch(`/post/delete/${activePostId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        const data = await readJsonResponse(response);

        if (data.success) {
            document.querySelector(`.post[data-post-id="${activePostId}"]`)?.remove();
            closePanel();
            activePostId = null;
        }

        return;
    }

    const editBtn = event.target.closest("[data-panel-edit-post]");
    if (editBtn) {
        event.preventDefault();

        if (!activePostId) {
            return;
        }

        const response = await fetch(`/post/detail/${activePostId}/`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        const data = await readJsonResponse(response);

        if (data.success) {
            closePanel();
            openCreateModalAsEdit(data.post);
        }

        return;
    }

    const panel = getPanel();

    if (
        panel &&
        !panel.contains(event.target) &&
        !event.target.closest("[data-open-post-panel]")
    ) {
        closePanel();
    }
});