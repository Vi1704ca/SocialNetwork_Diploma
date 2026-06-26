const input = document.getElementById("images-input");
const preview = document.getElementById("image-preview");
const btn = document.getElementById("choose-images");

let selectedFiles = [];

function syncInputFiles() {
    const dataTransfer = new DataTransfer();

    selectedFiles.forEach(file => {
        dataTransfer.items.add(file);
    });

    input.files = dataTransfer.files;
}

function renderPreview() {
    preview.innerHTML = "";

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = event => {
            const container = document.createElement("div");
            container.className = "preview-container";

            const img = document.createElement("img");
            img.src = event.target.result;
            img.className = "preview-img";

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "remove-image-btn";
            removeBtn.innerHTML = `<img src="/static/icons/modal/del_image.svg" alt="Видалити">`;

            removeBtn.addEventListener("click", () => {
                selectedFiles.splice(index, 1);
                syncInputFiles();
                renderPreview();
            });

            container.appendChild(img);
            container.appendChild(removeBtn);
            preview.appendChild(container);
        };

        reader.readAsDataURL(file);
    });
}

if (btn && input && preview) {
    btn.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", () => {
        selectedFiles = Array.from(input.files);
        syncInputFiles();
        renderPreview();
    });
}