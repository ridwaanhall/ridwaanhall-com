document.addEventListener('DOMContentLoaded', function() {

    document.querySelectorAll('a').forEach(link => {

        if (link.href.startsWith(window.location.origin) && !link.target) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const pageContent = document.getElementById('page-content');
                const destination = this.href;
                
                const progressBar = document.getElementById("page-loading-bar");
                progressBar.style.opacity = "1";
                progressBar.style.width = "0%";
                
                pageContent.classList.add('opacity-0', 'translate-y-8');
                
                setTimeout(() => {
                    window.location.href = destination;
                }, 500);
            });
        }
    });
});