/**
 * Project Image Slider - Mac-style slider for project images with filename display
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all project image sliders on the page
    const sliderContainers = document.querySelectorAll('.project-slider-container');
    
    sliderContainers.forEach(container => {
        initializeProjectSlider(container);
    });
});

function initializeProjectSlider(container) {
    const sliderWrapper = container.querySelector('.project-slider-wrapper');
    if (!sliderWrapper) {
        return;
    }

    const slides = container.querySelectorAll('.project-slide');
    const dots = container.querySelectorAll('.project-slider-dot');
    const prevBtn = container.querySelector('.project-prev');
    const nextBtn = container.querySelector('.project-next');
    const filenameDisplay = container.querySelector('.current-filename');
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
        console.warn("Project slider navigation buttons not found.");
        return;
    }

    // Initialize first dot as active
    if (dots.length > 0) {
        dots[0].classList.add('bg-zinc-300', 'w-4');
        dots[0].classList.remove('bg-zinc-300/50', 'w-1.5');
    }

    function updateFilename(index) {
        if (filenameDisplay && slides[index]) {
            const img = slides[index].querySelector('img');
            if (img && img.dataset.filename) {
                filenameDisplay.textContent = img.dataset.filename;
            }
        }
    }

    function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentIndex = index;
        sliderWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;

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

        // Update filename
        updateFilename(currentIndex);
    }

    function startAutoSlide() {
        clearInterval(autoSlideInterval);
        if (slides.length > 1) {
            autoSlideInterval = setInterval(() => {
                goToSlide(currentIndex + 1);
            }, 5000); // 5 seconds for project images
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
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            startAutoSlide(); // Restart auto-slide after manual navigation
        });
    });

    // Pause auto-slide on hover
    container.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });

    container.addEventListener('mouseleave', () => {
        startAutoSlide();
    });

    // Start auto-slide
    startAutoSlide();

    // Initialize filename display
    updateFilename(0);
}
