/* js/copyToClipboard.js */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        const hoverTooltips = document.querySelectorAll('.hover-tooltip');
        hoverTooltips.forEach(tooltip => {
            tooltip.classList.remove('opacity-100', 'translate-y-0');
            tooltip.classList.add('opacity-0', 'translate-y-2');
        });
        
        const tooltip = document.getElementById('copyTooltip');
        tooltip.classList.remove('opacity-0', 'translate-y-2');
        tooltip.classList.add('opacity-100', 'translate-y-0');
        
        setTimeout(function() {
            tooltip.classList.remove('opacity-100', 'translate-y-0');
            tooltip.classList.add('opacity-0', 'translate-y-2');
        }, 2000);
    }, function(err) {
        console.error('Could not copy text: ', err);
    });
}

/* js/backScroll.js */
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

/* js/blogImageSlider.js */
/**
 * Blog Image Slider - Similar to featured blog slider but for multiple blog images
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all blog image sliders on the page
    const sliderContainers = document.querySelectorAll('.blog-slider-container');
    
    sliderContainers.forEach(container => {
        initializeBlogSlider(container);
    });
});

function initializeBlogSlider(container) {
    const sliderWrapper = container.querySelector('.blog-slider-wrapper');
    if (!sliderWrapper) {
        return;
    }

    const slides = container.querySelectorAll('.blog-slide');
    const dots = container.querySelectorAll('.blog-slider-dot');
    const prevBtn = container.querySelector('.blog-prev');
    const nextBtn = container.querySelector('.blog-next');
    let currentIndex = 0;
    let autoSlideInterval;

    // If there's only one slide or missing elements, hide controls
    if (!slides.length || slides.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        dots.forEach(dot => dot.style.display = 'none');
        return;
    }

    if (!prevBtn || !nextBtn) {
        console.warn("Blog slider navigation buttons not found.");
        return;
    }

    // Initialize first dot as active
    if (dots.length > 0) {
        dots[0].classList.add('bg-zinc-300', 'w-4');
        dots[0].classList.remove('bg-zinc-300/50', 'w-1.5');
    }

    function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentIndex = index;
        sliderWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update filename in Mac-style header
        const filenameDisplay = container.closest('.blog-image-gallery')?.querySelector('.current-filename');
        if (filenameDisplay) {
            const currentSlide = slides[currentIndex];
            const currentImage = currentSlide?.querySelector('img');
            const filename = currentImage?.getAttribute('data-filename') || currentImage?.alt || `image-${currentIndex + 1}`;
            filenameDisplay.textContent = filename;
        }

        // Update dots
        dots.forEach((dot, i) => {
            if (i === currentIndex) {
                dot.classList.remove('bg-zinc-300/50', 'w-1.5');
                dot.classList.add('bg-zinc-300', 'w-4');
            } else {
                dot.classList.remove('bg-zinc-300', 'w-4');
                dot.classList.add('bg-zinc-300/50', 'w-1.5');
            }
        });
    }

    function startAutoSlide() {
        clearInterval(autoSlideInterval);
        if (slides.length > 1) {
            autoSlideInterval = setInterval(() => {
                goToSlide(currentIndex + 1);
            }, 4000); // 4 seconds for blog images
        }
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        startAutoSlide(); // Restart auto-slide after manual navigation
    });

    nextBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        startAutoSlide(); // Restart auto-slide after manual navigation
    });

    // Dot navigation
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            goToSlide(i);
            startAutoSlide(); // Restart auto-slide after manual navigation
        });
    });

    // Start auto-slide
    startAutoSlide();

    // Pause auto-slide on hover
    container.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });

    container.addEventListener('mouseleave', () => {
        startAutoSlide();
    });

    // Handle single slide case
    if (slides.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        dots.forEach(dot => dot.style.display = 'none');
        clearInterval(autoSlideInterval);
    }
}

