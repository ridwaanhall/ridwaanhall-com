document.addEventListener("DOMContentLoaded", function () {
    const mobileSearchTrigger = document.getElementById("mobile-search-trigger");
    const desktopSearchTrigger = document.getElementById("desktop-search-trigger");
    const searchModal = document.getElementById("search-modal");
    const searchModalBackdrop = document.getElementById("search-modal-backdrop");
    const searchModalContent = document.getElementById("search-modal-content");
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");
    const noResultsDiv = document.getElementById("no-results");
    const pagesSection = document.getElementById("pages-section");
    const socialsSection = document.getElementById("socials-section");
    const externalLinksSection = document.getElementById("external-links-section");
    const pagesHeader = document.getElementById("pages-header");
    const socialsHeader = document.getElementById("socials-header");
    const externalLinksHeader = document.getElementById("external-links-header");
    const searchItems = document.querySelectorAll(".search-item");
    const socialItems = document.querySelectorAll(".social-item");
    const externalItems = document.querySelectorAll(".external-item");
    const allSearchableItems = document.querySelectorAll(".search-item, .social-item, .external-item"); // Show search modal with smooth animation
    function showSearchModal() {
        // Disable body scroll
        document.body.style.overflow = "hidden";

        searchModal.classList.remove("hidden");
        searchModal.setAttribute("aria-hidden", "false");

        // Trigger animations
        setTimeout(() => {
            searchModal.classList.remove("backdrop-blur-none");
            searchModal.classList.add("backdrop-blur-md");
            searchModalContent.classList.remove("scale-95", "opacity-0");
            searchModalContent.classList.add("scale-100", "opacity-100");
        }, 10);

        // Focus input after animation
        setTimeout(() => {
            searchInput.focus();
        }, 150);
    }

    // Hide search modal with smooth animation
    function hideSearchModal() {
        // Start hide animation
        searchModal.classList.remove("backdrop-blur-md");
        searchModal.classList.add("backdrop-blur-none");
        searchModalContent.classList.remove("scale-100", "opacity-100");
        searchModalContent.classList.add("scale-95", "opacity-0");

        // Hide modal after animation completes
        setTimeout(() => {
            searchModal.classList.add("hidden");
            searchModal.setAttribute("aria-hidden", "true");
            searchInput.value = "";
            filterResults("");

            // Re-enable body scroll
            document.body.style.overflow = "";
        }, 300);
    }    // Filter search results
    function filterResults(query) {
        const searchQuery = query.toLowerCase().trim();
        let hasResults = false;
        let hasPageResults = false;
        let hasSocialResults = false;
        let hasExternalResults = false;

        // Filter search items (pages)
        searchItems.forEach((item) => {
            const itemName = item.dataset.name.toLowerCase();
            const itemText = item.querySelector("span").textContent.toLowerCase();

            if (searchQuery === "" || itemName.includes(searchQuery) || itemText.includes(searchQuery)) {
                item.style.display = "block";
                hasResults = true;
                hasPageResults = true;
            } else {
                item.style.display = "none";
            }
        });

        // Filter social items
        socialItems.forEach((item) => {
            const itemName = item.dataset.name.toLowerCase();
            const itemText = item.querySelector("span").textContent.toLowerCase();

            if (searchQuery === "" || itemName.includes(searchQuery) || itemText.includes(searchQuery)) {
                item.style.display = "block";
                hasResults = true;
                hasSocialResults = true;
            } else {
                item.style.display = "none";
            }
        });

        // Filter external items
        externalItems.forEach((item) => {
            const itemName = item.dataset.name.toLowerCase();
            const itemText = item.querySelector("span").textContent.toLowerCase();

            if (searchQuery === "" || itemName.includes(searchQuery) || itemText.includes(searchQuery)) {
                item.style.display = "block";
                hasResults = true;
                hasExternalResults = true;
            } else {
                item.style.display = "none";
            }
        });

        // Show/hide section headers based on results
        if (hasPageResults || searchQuery === "") {
            pagesHeader.style.display = "block";
        } else {
            pagesHeader.style.display = "none";
        }

        if (hasSocialResults || searchQuery === "") {
            socialsHeader.style.display = "block";
        } else {
            socialsHeader.style.display = "none";
        }

        if (hasExternalResults || searchQuery === "") {
            externalLinksHeader.style.display = "block";
        } else {
            externalLinksHeader.style.display = "none";
        }

        // Show/hide sections and no results message
        if (hasResults || searchQuery === "") {
            pagesSection.style.display = hasPageResults || searchQuery === "" ? "block" : "none";
            socialsSection.style.display = hasSocialResults || searchQuery === "" ? "block" : "none";
            externalLinksSection.style.display = hasExternalResults || searchQuery === "" ? "block" : "none";
            noResultsDiv.classList.add("hidden");
        } else {
            pagesSection.style.display = "none";
            socialsSection.style.display = "none";
            externalLinksSection.style.display = "none";
            noResultsDiv.classList.remove("hidden");
        }
    }

    // Event listeners
    mobileSearchTrigger?.addEventListener("click", showSearchModal);
    desktopSearchTrigger?.addEventListener("click", showSearchModal); // Close modal when clicking outside the modal content
    searchModal?.addEventListener("click", function (e) {
        if (e.target === searchModal || e.target === searchModalBackdrop) {
            hideSearchModal();
        }
    });

    // Prevent modal from closing when clicking inside the modal content
    searchModalContent?.addEventListener("click", function (e) {
        e.stopPropagation();
    });

    // Search input
    searchInput?.addEventListener("input", function (e) {
        filterResults(e.target.value);
    }); // Handle search item clicks (pages)
    searchItems.forEach((item) => {
        item.addEventListener("click", function () {
            const url = this.dataset.url;
            if (url) {
                window.location.href = url;
            }
        });
    });

    // Handle social item clicks (external links)
    socialItems.forEach((item) => {
        item.addEventListener("click", function () {
            const url = this.dataset.url;
            if (url) {
                if (url.startsWith("mailto:")) {
                    // Handle email links
                    window.location.href = url;
                } else {
                    // Handle external links - open in new tab
                    window.open(url, "_blank", "noopener,noreferrer");
                }
                hideSearchModal();
            }
        });
    });

    // Handle external item clicks (external links)
    externalItems.forEach((item) => {
        item.addEventListener("click", function () {
            const url = this.dataset.url;
            if (url) {
                if (url.startsWith("mailto:")) {
                    // Handle email links
                    window.location.href = url;
                } else if (url.startsWith("http") || url.startsWith("https")) {
                    // Handle external links - open in new tab
                    window.open(url, "_blank", "noopener,noreferrer");
                } else {
                    // Handle internal links - same tab
                    window.location.href = url;
                }
                hideSearchModal();
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", function (e) {
        // Ctrl/Cmd + K to toggle search modal
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            
            // Check if modal is currently visible
            if (searchModal.classList.contains("hidden")) {
                showSearchModal();
            } else {
                hideSearchModal();
            }
        }

        // Escape to close search
        if (e.key === "Escape" && !searchModal.classList.contains("hidden")) {
            hideSearchModal();
        }
    }); // Arrow key navigation
    searchInput?.addEventListener("keydown", function (e) {
        const visibleItems = Array.from(allSearchableItems).filter((item) => item.style.display !== "none");

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();

            let currentIndex = visibleItems.findIndex((item) => item.classList.contains("highlighted"));

            // Remove current highlight
            visibleItems.forEach((item) => item.classList.remove("highlighted"));

            if (e.key === "ArrowDown") {
                currentIndex = currentIndex < visibleItems.length - 1 ? currentIndex + 1 : 0;
            } else {
                currentIndex = currentIndex > 0 ? currentIndex - 1 : visibleItems.length - 1;
            }

            if (visibleItems[currentIndex]) {
                visibleItems[currentIndex].classList.add("highlighted");
                visibleItems[currentIndex].scrollIntoView({
                    block: "nearest",
                });
            }
        }

        if (e.key === "Enter") {
            const highlighted = document.querySelector(".search-item.highlighted, .social-item.highlighted");
            if (highlighted) {
                highlighted.click();
            }
        }
    });
});