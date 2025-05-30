document.addEventListener('DOMContentLoaded', function() {
    const sliderWrapper = document.querySelector('.featured-slider-wrapper');
    // Check if the slider wrapper exists on the page
    if (!sliderWrapper) {
        return; // Exit if the slider element isn't found
    }

    const slides = document.querySelectorAll('.featured-slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-nav.prev');
    const nextBtn = document.querySelector('.slider-nav.next');
    let currentIndex = 0;
    let autoSlideInterval;

    // Ensure elements exist before proceeding
    if (!slides.length || !dots.length || !prevBtn || !nextBtn) {
        console.warn("Featured slider elements not found. Slider functionality disabled.");
        // Optionally hide controls if elements are missing but wrapper exists
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        dots.forEach(dot => dot.style.display = 'none');
        return;
    }

    // Set initial active dot
    if (dots.length > 0) {
        dots[0].classList.add('bg-zinc-300', 'w-4');
        dots[0].classList.remove('bg-zinc-300/50', 'w-1.5'); // Ensure initial state is correct
    }

    function goToSlide(index) {
        // Handle edge cases
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentIndex = index;
        sliderWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Update dots
        dots.forEach((dot, i) => {
            if (i === currentIndex) {
                // Active dot
                dot.classList.remove('bg-zinc-300/50', 'w-1.5');
                dot.classList.add('bg-zinc-300', 'w-4');
            } else {
                // Inactive dot
                dot.classList.remove('bg-zinc-300', 'w-4');
                dot.classList.add('bg-zinc-300/50', 'w-1.5');
            }
        });
    }

    function startAutoSlide() {
        // Clear existing interval before starting a new one
        clearInterval(autoSlideInterval);
        if (slides.length > 1) {
            autoSlideInterval = setInterval(() => {
                goToSlide(currentIndex + 1);
            }, 5000);
        }
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        startAutoSlide(); // Restart timer on manual navigation
    });
    nextBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        startAutoSlide(); // Restart timer on manual navigation
    });

    // Add click events to dots
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            goToSlide(i);
            startAutoSlide(); // Restart timer on manual navigation
        });
    });

    // Start auto-sliding initially
    startAutoSlide();

    // Hide navigation if only one slide
    if (slides.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        dots.forEach(dot => dot.style.display = 'none'); // Hide dots too if only one slide
        clearInterval(autoSlideInterval); // Stop auto-slide if only one slide
    }
});
