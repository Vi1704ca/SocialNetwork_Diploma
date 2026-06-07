let currentPage = 1
let isLoading = false
// 
const loaderLine = document.getElementById('postLoaderLine')
const postList = document.querySelector('.post-list')
// 
const observer = new IntersectionObserver(async (entries) => {
    if (entries[0].isIntersecting && isLoading == false){
        isLoading = true
        currentPage ++
        let path = window.location.pathname
        console.log(path)

        const response = await fetch(`${path}?page=${currentPage}`, {
            headers:{
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        const data = await response.json()
        if(data.success){
            const html = data.html
            loaderLine.insertAdjacentHTML('beforebegin', html)
            // loaderLine.insertAdjacentHTML('beforebegin', 'html')
        }else{
            observer.disconnect()
        }
        isLoading = false
    }
}, {rootMargin: '200px'})
// 
observer.observe(loaderLine)
