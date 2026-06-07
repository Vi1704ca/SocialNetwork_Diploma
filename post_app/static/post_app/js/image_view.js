const input = document.getElementById('images-input');
const preview = document.getElementById('image-preview');
const btn = document.getElementById('choose-images');

btn.addEventListener('click', () => {
    input.click();
});

input.addEventListener('change', () => {
    preview.innerHTML = ""; 

    const files = Array.from(input.files);

    files.forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const container = document.createElement('div');
            container.classList.add('preview-container');

            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('preview-img');

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.classList.add('remove-image-btn');
            removeBtn.innerHTML = `<img src="/static/icons/modal/del_image.svg" alt="Удалить">`;

            removeBtn.addEventListener('click', () => {
                container.remove();
            });

            container.appendChild(img);
            container.appendChild(removeBtn);
            preview.appendChild(container);
        };

        reader.readAsDataURL(file);
    });
});