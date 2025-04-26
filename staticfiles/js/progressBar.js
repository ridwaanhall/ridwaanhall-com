document.addEventListener("DOMContentLoaded", function () {
    const progressBar = document.getElementById("page-loading-bar");
    if (!progressBar) return;

    let width = 0;
    progressBar.style.width = "5%";

    const interval = setInterval(() => {
        width += Math.random() * 3 + 0.5;
        if (width >= 80) { // Stop increasing significantly before 100%
            clearInterval(interval);
        } else {
            progressBar.style.width = width + "%";
        }
    }, 50);

    // Function to complete the loading bar
    const completeLoading = () => {
        clearInterval(interval); // Ensure interval is cleared
        progressBar.style.transition = "width 400ms ease-out, opacity 500ms ease 100ms"; // Add delay to opacity transition
        progressBar.style.width = "100%";

        setTimeout(() => {
            progressBar.style.opacity = "0";
        }, 500); // Start fading out after width transition starts

        // Reset progress bar for potential back/forward navigation
        setTimeout(() => {
            progressBar.style.transition = 'none'; // Remove transition for reset
            progressBar.style.width = '0%';
            progressBar.style.opacity = '1'; // Reset opacity for next load
        }, 1000); // Wait until fade out is complete
    };

    // Complete loading when the DOM is fully loaded
    completeLoading();

    // Show page content after a short delay
    setTimeout(function () {
        const pageContent = document.getElementById("page-content");
        if (pageContent) {
            pageContent.classList.remove("opacity-0", "translate-y-8");
        }
    }, 100); // Adjust delay as needed

    // Handle back/forward navigation cache (bfcache)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // Page loaded from bfcache, reset progress bar immediately
            progressBar.style.transition = 'none';
            progressBar.style.width = '100%';
            progressBar.style.opacity = '0';
            // Ensure content is visible
            const pageContent = document.getElementById("page-content");
            if (pageContent) {
                pageContent.classList.remove("opacity-0", "translate-y-8");
            }
        }
    });
});
