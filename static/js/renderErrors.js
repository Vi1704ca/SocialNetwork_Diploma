export function renderErrors(containerId, errors) {
    const errorsContainer = document.getElementById(containerId)
    errorsContainer.innerHTML = ""
    for (let fieldName in errors ){
        errors[fieldName].forEach(errorObj => {
            let p = document.createElement('p')
            p.textContent = errorObj.message
            errorsContainer.appendChild(p)
        })
    }
}