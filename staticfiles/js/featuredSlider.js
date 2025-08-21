document.addEventListener('DOMContentLoaded', function() {
    const sliderWrapper = document.querySelector('.featured-slider-wrapper');
    if (!sliderWrapper) {
        return;
    }

    const slides = document.querySelectorAll('.featured-slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-nav.prev');
    const nextBtn = document.querySelector('.slider-nav.next');
    let currentIndex = 0;
    let autoSlideInterval;

    if (!slides.length || !dots.length || !prevBtn || !nextBtn) {
        console.warn("Featured slider elements not found. Slider functionality disabled.");
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        dots.forEach(dot => dot.style.display = 'none');
        return;
    }

    if (dots.length > 0) {
        dots[0].classList.add('bg-zinc-300', 'w-4');
        dots[0].classList.remove('bg-zinc-300/50', 'w-1.5');
    }

    function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentIndex = index;
        sliderWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;

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
            }, 5000);
        }
    }

    prevBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        startAutoSlide();
    });
    nextBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        startAutoSlide();
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            goToSlide(i);
            startAutoSlide();
        });
    });

    startAutoSlide();

    if (slides.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        dots.forEach(dot => dot.style.display = 'none');
        clearInterval(autoSlideInterval);
    }
});
