function switchTab(tabName) {
    console.log('Switching to tab:', tabName); // Debug log
    
    const tabOrder = {
        'intro': 1,
        'experiences': 2,
        'education': 3,
        'awards': 4,
        'certifications': 5,
        'applications': 6
    };
    
    const currentActive = document.querySelector('.tab-content > div:not(.hidden)');
    const selectedContent = document.getElementById('content-' + tabName);
    
    // Error handling
    if (!selectedContent) {
        console.error('Content element not found for tab:', tabName);
        return;
    }
    
    if (currentActive && currentActive !== selectedContent) {
        const currentTabName = currentActive.id.replace('content-', '');
        
        const goingForward = tabOrder[tabName] > tabOrder[currentTabName];
        const startPosition = goingForward ? 'translateX(20px)' : 'translateX(-20px)';
        const exitPosition = goingForward ? 'translateX(-20px)' : 'translateX(20px)';
        
        currentActive.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        currentActive.style.opacity = '0';
        currentActive.style.transform = exitPosition;
        
        setTimeout(() => {
            currentActive.classList.add('hidden');
            currentActive.classList.remove('block');
            currentActive.style.transform = '';
            currentActive.style.opacity = '';
            currentActive.style.transition = '';
            
            selectedContent.classList.remove('hidden');
            selectedContent.classList.add('block');
            selectedContent.style.opacity = '0';
            selectedContent.style.transform = startPosition;
            
            setTimeout(() => {
                selectedContent.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                selectedContent.style.opacity = '1';
                selectedContent.style.transform = 'translateX(0)';
                
                // Clean up styles after animation
                setTimeout(() => {
                    selectedContent.style.transition = '';
                    selectedContent.style.transform = '';
                    selectedContent.style.opacity = '';
                }, 300);
            }, 10);
        }, 300);
    } else if (selectedContent) {
        selectedContent.classList.remove('hidden');
        selectedContent.classList.add('block');
        selectedContent.style.opacity = '1';
        selectedContent.style.transform = 'translateX(0)';
    }
    
    // Update tab buttons
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('border-zinc-300', 'text-zinc-300');
        tab.classList.add('border-transparent');
        tab.setAttribute('aria-selected', 'false');
    });
    
    const selectedTab = document.getElementById('tab-' + tabName);
    if (selectedTab) {
        selectedTab.classList.remove('border-transparent');
        selectedTab.classList.add('border-zinc-300', 'text-zinc-300');
        selectedTab.setAttribute('aria-selected', 'true');
    } else {
        console.error('Tab button not found for:', tabName);
    }
}

// Initialize first tab on page load
document.addEventListener('DOMContentLoaded', function() {
    switchTab('intro');
});