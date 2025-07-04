document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    function updateButtonState() {
        const hasValue = searchInput.value.trim().length > 0;
        searchButton.disabled = !hasValue;
        
        if (hasValue) {
            searchButton.className = "inline-flex items-center justify-center px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800 hover:border-zinc-400 hover:bg-zinc-900 hover:shadow-md hover:shadow-zinc-400/20 transition-all duration-300 text-sm font-semibold h-full whitespace-nowrap cursor-pointer";
        } else {
            searchButton.className = "inline-flex items-center justify-center px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800 transition-all duration-300 text-sm font-semibold h-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
        }
    }
    
    // Check initial state
    updateButtonState();
    
    // Listen for input changes
    searchInput.addEventListener('input', updateButtonState);
    searchInput.addEventListener('paste', function() {
        // Use setTimeout to wait for paste to complete
        setTimeout(updateButtonState, 0);
    });
});