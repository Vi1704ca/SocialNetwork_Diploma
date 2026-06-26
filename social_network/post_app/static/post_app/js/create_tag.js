import { renderErrors } from "../../../../static/js/renderErrors.js";

function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : document.querySelector('[name=csrfmiddlewaretoken]')?.value;
}

function openPostModal() {
    const postModal = document.getElementById("modal-create-post");
    const tagModal = document.getElementById("tag-modal");

    if (tagModal) {
        tagModal.style.display = "none";
    }

    if (postModal) {
        postModal.style.display = "flex";
    }
}

function addTagToPostForm(tagId, tagName) {
    const tagsWrapper = document.querySelector(".create-post-forms .tags");

    if (!tagsWrapper) {
        return;
    }

    const tagValue = String(tagId);

    const existingInput = tagsWrapper.querySelector(`input[value="${tagValue}"]`);
    if (existingInput) {
        existingInput.checked = true;
        existingInput.closest("label")?.classList.add("selected");
        return;
    }

    const label = document.createElement("label");
    label.className = "tag-choice selected";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "tags";
    input.value = tagValue;
    input.checked = true;

    const span = document.createElement("span");
    span.textContent = tagName;

    label.appendChild(input);
    label.appendChild(span);
    tagsWrapper.appendChild(label);
}

document.addEventListener("click", function (event) {
    if (event.target.closest("#tag-button") || event.target.closest("#open-modal-tag")) {
        event.preventDefault();

        const postModal = document.getElementById("modal-create-post");
        const tagModal = document.getElementById("tag-modal");

        if (postModal) {
            postModal.style.display = "none";
        }

        if (tagModal) {
            tagModal.style.display = "flex";
        }
    }

    if (event.target.closest(".close-modal-tag") || event.target.closest("#cancel-tag")) {
        event.preventDefault();

        const form = document.getElementById("tag-form-element");
        const errorContainer = document.getElementById("tag-errors");

        if (form) {
            form.reset();
        }

        if (errorContainer) {
            errorContainer.innerHTML = "";
        }

        openPostModal();
    }

    const tagLabel = event.target.closest(".create-post-forms .tags label");
    if (tagLabel) {
        setTimeout(() => {
            const input = tagLabel.querySelector('input[type="checkbox"]');
            tagLabel.classList.toggle("selected", Boolean(input && input.checked));
        }, 0);
    }
});

document.addEventListener("submit", function (event) {
    if (!event.target || event.target.id !== "tag-form-element") {
        return;
    }

    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    fetch(form.action, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest"
        },
        body: formData
    })
        .then(async response => {
            const data = await response.json();

            if (!response.ok) {
                throw data;
            }

            return data;
        })
        .then(data => {
            if (!data.success) {
                return;
            }

            addTagToPostForm(data.tag_id, data.tag_name);

            form.reset();

            const errorContainer = document.getElementById("tag-errors");
            if (errorContainer) {
                errorContainer.innerHTML = "";
            }

            openPostModal();
        })
        .catch(data => {
            if (data.errors) {
                renderErrors("tag-errors", data.errors);
            }
        });
});