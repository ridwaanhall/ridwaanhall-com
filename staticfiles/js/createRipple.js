document.addEventListener('DOMContentLoaded', function() {
    // Create click ripple effect
    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '60px';
        ripple.style.height = '60px';
        
        document.body.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    // Handle click events
    document.addEventListener('mousedown', function(e) {
        createRipple(e.clientX, e.clientY);
    });
});