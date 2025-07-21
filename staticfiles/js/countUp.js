document.addEventListener('DOMContentLoaded', function() {
    const countElements = document.querySelectorAll('.count-up');
    
    countElements.forEach(element => {
        const target = parseFloat(element.dataset.target);
        const duration = 4000;
        const startTime = performance.now();
        
        function updateCount(currentTime) {
            const elapsedTime = currentTime - startTime;
            if (elapsedTime < duration) {
                const progress = elapsedTime / duration;
                const currentValue = Math.floor(progress * target);
                element.textContent = currentValue;
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = target;
            }
        }
        
        requestAnimationFrame(updateCount);
    });
});