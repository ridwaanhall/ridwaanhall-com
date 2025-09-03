document.addEventListener('DOMContentLoaded', function() {
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileMenu = document.getElementById('mobile-menu');
    
    const openSidebar = () => {
        mobileSidebar.classList.remove('hidden');
        setTimeout(() => {
            mobileMenu.classList.remove('-translate-x-full');
        }, 50);
    };
    
    const closeSidebar = () => {
        mobileMenu.classList.add('-translate-x-full');
        setTimeout(() => {
            mobileSidebar.classList.add('hidden');
        }, 300);
    };
    
    openSidebarBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    
    mobileSidebar.addEventListener('click', function(e) {
        if (e.target === mobileSidebar) {
            closeSidebar();
        }
    });
});