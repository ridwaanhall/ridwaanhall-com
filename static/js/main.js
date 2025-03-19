document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuToggle = document.createElement('button');
    mobileMenuToggle.classList.add('button', 'is-primary', 'is-rounded', 'mobile-menu-toggle', 'is-hidden-tablet');
    mobileMenuToggle.innerHTML = '<span class="icon"><i class="fas fa-bars"></i></span>';
    document.body.appendChild(mobileMenuToggle);
    
    const sidebar = document.querySelector('.sidebar');
    
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('is-active');
        const isActive = sidebar.classList.contains('is-active');
        mobileMenuToggle.innerHTML = isActive ? 
            '<span class="icon"><i class="fas fa-times"></i></span>' : 
            '<span class="icon"><i class="fas fa-bars"></i></span>';
    });
    
    // Close sidebar when clicking on a link (mobile)
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 769) {
                sidebar.classList.remove('is-active');
                mobileMenuToggle.innerHTML = '<span class="icon"><i class="fas fa-bars"></i></span>';
            }
        });
    });
});