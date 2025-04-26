document.addEventListener('DOMContentLoaded', function() {
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!openSidebarBtn || !closeSidebarBtn || !mobileSidebar || !mobileMenu) {
        // console.warn("Sidebar elements not found."); // Optional: Add warning if elements are missing
        return;
    }

    const openSidebar = () => {
        mobileSidebar.classList.remove('hidden');
        // Force reflow to ensure transition is applied
        mobileSidebar.offsetHeight;
        mobileMenu.classList.remove('-translate-x-full');
    };

    const closeSidebar = () => {
        mobileMenu.classList.add('-translate-x-full');
        // Wait for the transition to finish before hiding the overlay
        mobileMenu.addEventListener('transitionend', () => {
            mobileSidebar.classList.add('hidden');
        }, { once: true }); // Use { once: true } to automatically remove the listener
    };

    openSidebarBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);

    // Close sidebar when clicking on the overlay background
    mobileSidebar.addEventListener('click', function(e) {
        if (e.target === mobileSidebar) {
            closeSidebar();
        }
    });

    // Close sidebar on Escape key press
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !mobileSidebar.classList.contains('hidden')) {
            closeSidebar();
        }
    });
});
