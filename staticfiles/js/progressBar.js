const progressBar = document.getElementById("page-loading-bar");
let width = 0;

progressBar.style.width = "5%";

const interval = setInterval(() => {
    width += Math.random() * 3 + 0.5;
    if (width > 80) {
        clearInterval(interval);
    }
    progressBar.style.width = width + "%";
}, 50);

document.addEventListener("DOMContentLoaded", function () {

    clearInterval(interval);
    progressBar.style.transition = "width 400ms ease-out, opacity 500ms ease";
    progressBar.style.width = "100%";

    setTimeout(() => {
        progressBar.style.opacity = "0";
    }, 600);

    setTimeout(function () {
        const pageContent = document.getElementById("page-content");
        if (pageContent) {
            pageContent.classList.remove("opacity-0", "translate-y-8");
        }
    }, 100);
});