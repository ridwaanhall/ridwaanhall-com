function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        // Get the "Copy link" tooltip out of the way first -- it occupies the
        // same spot as the success chip, and on touch it is on a 2s timer that
        // would otherwise sit on top of this. tooltip.js owns the hiding.
        document.dispatchEvent(new CustomEvent('tooltip:hide'));

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