document.addEventListener('DOMContentLoaded', function() {
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileMenu = document.getElementById('mobile-menu');
    
    const openSidebar = () => {
        mobileSidebar.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        setTimeout(() => {
            mobileMenu.classList.remove('translate-y-full');
        }, 50);
    };
    
    const closeSidebar = () => {
        mobileMenu.classList.add('translate-y-full');
        setTimeout(() => {
            mobileSidebar.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
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