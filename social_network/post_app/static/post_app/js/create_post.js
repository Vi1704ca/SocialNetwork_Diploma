import { renderErrors } from "../../../../static/js/renderErrors.js"

document.getElementById('show-modal-create').addEventListener(
    'click',
    function (){
        const quickPostContent = document.getElementById("quick-post-content");
        const modalContentInput = document.getElementById("id_content");

        if (quickPostContent && modalContentInput) {
            modalContentInput.value = quickPostContent.value;
        }

        document.querySelector(".modal-create-post").style.display = 'flex';
    }
)
document.querySelector('.close-modal').addEventListener(
    'click',
    function (){
        document.querySelector(".modal-create-post").style.display = 'none'
    }
)
function getCSRFToken(){
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content')
}
// 
document.addEventListener('DOMContentLoaded', function() {
    const linksList = document.getElementById('links-list');

    function createLinkRow(value = '') {
        if (!linksList) return;

        const row = document.createElement('div');
        row.className = 'link-item-row';
        
        const input = document.createElement('input');
        input.type = 'url';
        input.name = 'links';
        input.value = value;
        input.placeholder = 'https://www.instagram.com/world.it.academy';
        input.className = 'dynamic-input';

        const actions = document.createElement('div');
        actions.className = 'actions-container';

        row.appendChild(input);
        row.appendChild(actions);
        linksList.appendChild(row);

        updateButtons();
    }

    function updateButtons() {
        const allRows = document.querySelectorAll('.link-item-row');
        
        allRows.forEach((row, index) => {
            const actionsContainer = row.querySelector('.actions-container');
            if (!actionsContainer) return;
            actionsContainer.innerHTML = ''; 

            if (index === allRows.length - 1) {
                const plusBtn = document.createElement('button');
                plusBtn.type = 'button';
                plusBtn.className = 'circle-btn plus';
                plusBtn.innerHTML = `<img src="/static/icons/modal/plus.svg" alt="Добавить">`;
                plusBtn.onclick = () => createLinkRow();
                actionsContainer.appendChild(plusBtn);

                if (allRows.length > 1) {
                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'circle-btn remove';
                    removeBtn.innerHTML = `<img src="/static/icons/modal/del_links.svg" alt="Удалить">`;
                    removeBtn.onclick = () => {
                        row.remove();
                        updateButtons();
                    };
                    actionsContainer.appendChild(removeBtn);
                }
            }
        });
    }
    
    if (linksList) {
        createLinkRow();
    }
});

const chooseImagesBtn = document.getElementById("choose-images");
    const imagesInput = document.getElementById("images-input");
    if (chooseImagesBtn && imagesInput) {
        chooseImagesBtn.addEventListener("click", function() {
            imagesInput.click();
        });
    }
// 
document.getElementById('post-create-form').addEventListener(
    'submit',
    function (event){
        event.preventDefault()
        const form = event.target
        const formData = new FormData(form)

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(async response => {
            const data = await response.json()
            if (!response.ok) {
                throw data
            }
            return data
        })
        .then(data => {
    if (data.post_html) {
        const oldPost = document.querySelector(`.post[data-post-id="${data.post_id}"]`);

        if (oldPost) {
            oldPost.outerHTML = data.post_html;
        } else {
            const postList = document.querySelector(".post-list");
            const loaderLine = document.getElementById("postLoaderLine");

            if (postList && loaderLine) {
                loaderLine.insertAdjacentHTML("beforebegin", data.post_html);
            } else if (postList) {
                postList.insertAdjacentHTML("afterbegin", data.post_html);
            }
        }
    }

    form.reset();
    form.dataset.mode = "";
    form.dataset.postId = "";
    form.action = "/post/create/";

    const heading = form.querySelector("h2");
    if (heading) {
        heading.textContent = "Створення публікації";
    }

    const quickPostContent = document.getElementById("quick-post-content");
    if (quickPostContent) {
        quickPostContent.value = "";
    }

    const modal = document.querySelector(".modal-create-post");
    if (modal) {
        modal.style.display = "none";
    }
})
        .catch(data => {
            if(data.errors){
                renderErrors("create-errors", data.errors)
            }
        })
    }
)
