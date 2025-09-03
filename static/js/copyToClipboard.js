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