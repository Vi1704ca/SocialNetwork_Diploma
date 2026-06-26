function updatePostImageLayouts() {
    document.querySelectorAll('.post-images').forEach(container => {
        const images = Array.from(container.querySelectorAll('.post-image-link'))

        images.forEach(image => {
            image.classList.remove('img-big', 'img-small')
        })

        for (let i = 0; i < images.length;) {
            if (images[i]) images[i].classList.add('img-big')
            if (images[i + 1]) images[i + 1].classList.add('img-big')
            i += 2

            if (images[i]) images[i].classList.add('img-small')
            if (images[i + 1]) images[i + 1].classList.add('img-small')
            if (images[i + 2]) images[i + 2].classList.add('img-small')
            i += 3
        }
    })
}

updatePostImageLayouts()

const observer = new MutationObserver(updatePostImageLayouts)

observer.observe(document.body, {
    childList: true,
    subtree: true,
})