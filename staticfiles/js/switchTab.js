function switchTab(tabName) {
    const tabOrder = {
        'experiences': 1,
        'education': 2,
        'awards': 3,
        'certifications': 4,
        'applications': 5
    };
    
    const currentActive = document.querySelector('.tab-content > div:not(.hidden)');
    const selectedContent = document.getElementById('content-' + tabName);
    
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
            
            selectedContent.classList.remove('hidden');
            selectedContent.classList.add('block');
            selectedContent.style.opacity = '0';
            selectedContent.style.transform = startPosition;
            
            setTimeout(() => {
                selectedContent.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                selectedContent.style.opacity = '1';
                selectedContent.style.transform = 'translateX(0)';
            }, 10);
        }, 300);
    } else if (selectedContent) {
        selectedContent.classList.remove('hidden');
        selectedContent.classList.add('block');
        selectedContent.style.opacity = '1';
        selectedContent.style.transform = 'translateX(0)';
    }
    
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('border-indigo-500', 'text-indigo-400');
        tab.classList.add('border-transparent');
        tab.setAttribute('aria-selected', 'false');
    });
    
    const selectedTab = document.getElementById('tab-' + tabName);
    if (selectedTab) {
        selectedTab.classList.remove('border-transparent');
        selectedTab.classList.add('border-indigo-500', 'text-indigo-400');
        selectedTab.setAttribute('aria-selected', 'true');
    }
}