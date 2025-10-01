/**
 * Image Lightbox - Modal overlay for magnifying project images
 */

class ImageLightbox {
    constructor() {
        this.lightbox = null;
        this.images = [];
        this.currentIndex = 0;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.createLightbox();
        this.bindEvents();
        this.addMagnifyButtons();
    }

    createLightbox() {
        const lightboxHTML = `
            <div class="image-lightbox" id="imageLightbox">
                <div class="lightbox-content">
                    <!-- Header (Mac-style) -->
                    <div class="lightbox-header">
                        <div class="mac-dots">
                            <div class="mac-dot red"></div>
                            <div class="mac-dot yellow"></div>
                            <div class="mac-dot green"></div>
                        </div>
                        <div class="lightbox-filename" id="lightboxFilename">image.jpg</div>
                    </div>
                    
                    <!-- Image Container -->
                    <div class="lightbox-image-container">
                        <div class="lightbox-slider-wrapper" id="lightboxSliderWrapper">
                            <!-- Images will be dynamically added here -->
                        </div>
                        
                        <!-- Close Button -->
                        <button class="lightbox-close" id="lightboxClose" type="button" title="Close (ESC)">
                            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                        
                        <!-- Combined Navigation like in slider -->
                        <div class="lightbox-nav-combined" id="lightboxNavCombined">
                            <button class="lightbox-nav prev" id="lightboxPrev" type="button" title="Previous Image">
                                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            
                            <button class="lightbox-nav next" id="lightboxNext" type="button" title="Next Image">
                                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <!-- Counter -->
                        <div class="lightbox-counter" id="lightboxCounter">1 / 1</div>
                        
                        <!-- Dot Indicators -->
                        <div class="lightbox-dots" id="lightboxDots">
                            <!-- Dots will be dynamically added here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        this.lightbox = document.getElementById('imageLightbox');
    }

    addMagnifyButtons() {
        // Wait for images to load before adding buttons
        setTimeout(() => {
            // Add magnify buttons to project image gallery
            const galleryContainers = document.querySelectorAll('.project-slider-container');
            galleryContainers.forEach(container => {
                this.addMagnifyButtonToGallery(container);
            });

            // Add magnify button to single project image (backward compatible)
            // Look for single image containers that are not part of a gallery
            const singleImageContainers = document.querySelectorAll('.aspect-video');
            singleImageContainers.forEach(container => {
                // Skip if this is part of a gallery
                if (container.closest('.project-slider-container')) return;
                
                const img = container.querySelector('img');
                const parentContainer = container.closest('.rounded-lg');
                
                if (img && parentContainer && !parentContainer.querySelector('.magnify-button')) {
                    this.addMagnifyButtonToSingle(parentContainer, img);
                }
            });
        }, 500);
    }

    addMagnifyButtonToGallery(container) {
        // Check if magnify button already exists
        if (container.querySelector('.magnify-button')) return;

        const magnifyButton = document.createElement('button');
        magnifyButton.className = 'magnify-button cursor-pointer absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-30 bg-zinc-900/70 hover:bg-zinc-800/70 border border-zinc-800 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-105';
        magnifyButton.type = 'button';
        magnifyButton.title = 'Magnify Images';
        magnifyButton.innerHTML = `
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
            </svg>
        `;

        container.appendChild(magnifyButton);

        // Collect images from this gallery
        const slides = container.querySelectorAll('.project-slide img');
        const galleryImages = Array.from(slides).map(img => ({
            src: img.src.replace(/[?&]w=\d+&h=\d+/, '').replace(/\?.*$/, ''), // Remove all URL parameters for full resolution
            alt: img.alt,
            filename: img.dataset.filename || img.alt || 'image.jpg'
        }));

        magnifyButton.addEventListener('click', () => {
            // Get current slide index from the slider
            const currentSlideIndex = this.getCurrentSlideIndex(container);
            this.open(galleryImages, currentSlideIndex);
        });
    }

    addMagnifyButtonToSingle(container, img = null) {
        // Check if magnify button already exists
        if (container.querySelector('.magnify-button')) return;

        const magnifyButton = document.createElement('button');
        magnifyButton.className = 'magnify-button cursor-pointer absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-30 bg-zinc-900/70 hover:bg-zinc-800/70 border border-zinc-800 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-105';
        magnifyButton.type = 'button';
        magnifyButton.title = 'Magnify Image';
        magnifyButton.innerHTML = `
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
            </svg>
        `;

        container.style.position = 'relative';
        container.appendChild(magnifyButton);

        // Get the single image
        if (!img) {
            img = container.querySelector('img');
        }
        
        if (img) {
            const singleImage = [{
                src: img.src.replace(/[?&]w=\d+&h=\d+/, '').replace(/\?.*$/, ''), // Remove all URL parameters
                alt: img.alt,
                filename: img.alt || 'image.jpg'
            }];

            magnifyButton.addEventListener('click', () => {
                this.open(singleImage, 0);
            });
        }
    }

    bindEvents() {
        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'lightboxClose' || e.target.closest('#lightboxClose')) {
                this.close();
            }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (e.target.id === 'imageLightbox') {
                this.close();
            }
        });

        // Navigation buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'lightboxPrev' || e.target.closest('#lightboxPrev')) {
                this.prev();
            } else if (e.target.id === 'lightboxNext' || e.target.closest('#lightboxNext')) {
                this.next();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        });
    }

    open(images, startIndex = 0) {
        this.images = images;
        this.currentIndex = startIndex;
        this.isOpen = true;
        
        // Store current scroll position and prevent scrolling
        this.scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        
        // Show lightbox immediately
        this.lightbox.style.visibility = 'visible';
        this.lightbox.style.display = 'flex';
        
        // Trigger animations with delay like sidebar search
        setTimeout(() => {
            this.lightbox.classList.add('active');
        }, 10);
        
        // Wait a bit for the lightbox to be visible, then create slides
        setTimeout(() => {
            this.updateLightbox();
            this.updateNavigation();
        }, 50);
    }

    close() {
        this.isOpen = false;
        
        // Start hide animation
        this.lightbox.classList.remove('active');
        
        // Hide lightbox after animation completes
        setTimeout(() => {
            this.lightbox.style.visibility = 'hidden';
            this.lightbox.style.display = 'none';
            
            // Restore scrolling
            document.body.style.overflow = '';
        }, 300);
    }

    prev() {
        if (this.images.length <= 1) return;
        
        const newIndex = this.currentIndex > 0 
            ? this.currentIndex - 1 
            : this.images.length - 1;
        
        this.goToSlide(newIndex);
        this.updateCounter();
        this.updateFilename();
        this.updateDots();
    }

    next() {
        if (this.images.length <= 1) return;
        
        const newIndex = this.currentIndex < this.images.length - 1 
            ? this.currentIndex + 1 
            : 0;
        
        this.goToSlide(newIndex);
        this.updateCounter();
        this.updateFilename();
        this.updateDots();
    }

    updateLightbox() {
        this.createSlides();
        this.createDots();
        this.goToSlide(this.currentIndex);
        this.updateCounter();
        this.updateFilename();
        this.updateDots();
    }

    createSlides() {
        const sliderWrapper = document.getElementById('lightboxSliderWrapper');
        sliderWrapper.innerHTML = '';

        this.images.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = 'lightbox-slide';
            slide.innerHTML = `
                <img class="lightbox-image" src="${image.src}" alt="${image.alt}" loading="lazy" />
            `;
            sliderWrapper.appendChild(slide);
        });
    }

    goToSlide(index) {
        const sliderWrapper = document.getElementById('lightboxSliderWrapper');
        sliderWrapper.style.transform = `translateX(-${index * 100}%)`;
        this.currentIndex = index;
    }

    updateCounter() {
        const lightboxCounter = document.getElementById('lightboxCounter');
        lightboxCounter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    }

    updateFilename() {
        const lightboxFilename = document.getElementById('lightboxFilename');
        const currentImage = this.images[this.currentIndex];
        lightboxFilename.textContent = currentImage.filename;
    }

    createDots() {
        const dotsContainer = document.getElementById('lightboxDots');
        dotsContainer.innerHTML = '';

        if (this.images.length <= 1) {
            dotsContainer.style.display = 'none';
            return;
        }

        dotsContainer.style.display = 'flex';
        this.images.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'lightbox-dot';
            dot.type = 'button';
            dot.title = `Go to image ${index + 1}`;
            dot.addEventListener('click', () => {
                this.goToSlide(index);
                this.updateCounter();
                this.updateFilename();
                this.updateDots();
            });
            dotsContainer.appendChild(dot);
        });
    }

    updateDots() {
        const dots = document.querySelectorAll('.lightbox-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    updateNavigation() {
        const navCombined = document.getElementById('lightboxNavCombined');
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');
        
        if (this.images.length <= 1) {
            navCombined.style.display = 'none';
        } else {
            navCombined.style.display = 'flex';
        }
    }

    getCurrentSlideIndex(container) {
        const wrapper = container.querySelector('.project-slider-wrapper');
        if (!wrapper) return 0;
        
        const transform = wrapper.style.transform;
        const translateMatch = transform.match(/translateX\\((-?\\d+(?:\\.\\d+)?)%\\)/);
        
        if (translateMatch) {
            const translateX = parseFloat(translateMatch[1]);
            return Math.abs(translateX / 100);
        }
        
        return 0;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ImageLightbox();
});

// Export for use in other scripts
window.ImageLightbox = ImageLightbox;