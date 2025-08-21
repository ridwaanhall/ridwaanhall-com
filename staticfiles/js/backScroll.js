document.addEventListener('DOMContentLoaded', function() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const backToBtn = document.getElementById('backToBtn');
    const toGitHub = document.getElementById('toGitHub');
    const toDemo = document.getElementById('toDemo');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.remove('opacity-0', 'translate-y-10');
            scrollToTopBtn.classList.add('opacity-100', 'translate-y-0');
            backToBtn.classList.remove('opacity-0', 'translate-y-10');
            backToBtn.classList.add('opacity-100', 'translate-y-0');
            toGitHub.classList.remove('opacity-0', 'translate-y-10');
            toGitHub.classList.add('opacity-100', 'translate-y-0');
            toDemo.classList.remove('opacity-0', 'translate-y-10');
            toDemo.classList.add('opacity-100', 'translate-y-0');
        } else {
            scrollToTopBtn.classList.remove('opacity-100', 'translate-y-0');
            scrollToTopBtn.classList.add('opacity-0', 'translate-y-10');
            backToBtn.classList.remove('opacity-100', 'translate-y-0');
            backToBtn.classList.add('opacity-0', 'translate-y-10');
            toGitHub.classList.remove('opacity-100', 'translate-y-0');
            toGitHub.classList.add('opacity-0', 'translate-y-10');
            toDemo.classList.remove('opacity-100', 'translate-y-0');
            toDemo.classList.add('opacity-0', 'translate-y-10');
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});