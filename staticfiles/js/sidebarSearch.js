document.addEventListener("DOMContentLoaded", function () {
    const mobileSearchTrigger = document.getElementById("mobile-search-trigger");
    const desktopSearchTrigger = document.getElementById("desktop-search-trigger");
    // The modal's three elements are looked up by ModalDialog.create() below,
    // so they are no longer held here.
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
    // The show/hide animation, backdrop dismissal and Escape handling live in
    // modalDialog.js, shared with the comment delete confirmation. Only the
    // search-specific bits (focus the input, reset the query on close) stay here.
    const searchDialog = window.ModalDialog.create({
        root: "search-modal",
        backdrop: "search-modal-backdrop",
        panel: "search-modal-content",
        onShown: () => searchInput?.focus(),
        onHidden: () => {
            if (searchInput) { searchInput.value = ""; }
            filterResults("");
        },
    });

    function showSearchModal() {
        searchDialog?.show();
    }

    function hideSearchModal() {
        searchDialog?.hide();
    }

    // Filter search results
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
    desktopSearchTrigger?.addEventListener("click", showSearchModal);
    // Backdrop dismissal and the click guard on the panel are registered by
    // ModalDialog.create() above, so they are deliberately not repeated here.

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
            if (searchDialog?.isOpen()) {
                hideSearchModal();
            } else {
                showSearchModal();
            }
        }
        // Escape is handled by ModalDialog, for every dialog on the page.
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