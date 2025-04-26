document.addEventListener('DOMContentLoaded', function() {
    const pageContent = document.getElementById('page-content');
    const progressBar = document.getElementById("page-loading-bar");

    document.querySelectorAll('a').forEach(link => {
        // Check if the link is internal, not targeting a new tab, and not a hash link
        if (link.href.startsWith(window.location.origin) && !link.target && !link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(e) {
                const destination = this.href;

                // Prevent navigation if it's the current page
                if (destination === window.location.href) {
                    e.preventDefault();
                    return;
                }

                e.preventDefault(); // Prevent default navigation

                // Start the transition: fade out content and show progress bar
                if (pageContent) {
                    pageContent.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                    pageContent.classList.add('opacity-0', 'translate-y-8');
                }

                if (progressBar) {
                    progressBar.style.transition = 'width 3000ms cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.2s ease-in'; // Slower progress, faster fade in
                    progressBar.style.opacity = "1";
                    progressBar.style.width = "0%";
                    // Force reflow to apply initial styles before starting transition
                    progressBar.offsetHeight;
                    progressBar.style.width = "75%"; // Animate to partial width quickly
                }

                // Navigate after the fade-out animation duration
                setTimeout(() => {
                    window.location.href = destination;
                }, 300); // Match the duration of the fade-out transition
            });
        }
    });
});
