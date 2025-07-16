/* js/switchTab.js */
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

/* js/toggleCareer.js */
function toggleAchievements(id) {
    const element = document.getElementById(id);
    const counter = id.split('-')[1];
    const showText = document.getElementById('show-text-' + counter);
    const hideText = document.getElementById('hide-text-' + counter);
    const arrow = document.getElementById('arrow-' + counter);
    
    if (element.classList.contains('hidden')) {

        element.classList.remove('hidden');
        element.style.maxHeight = '0';
        element.style.opacity = '0';
        element.style.overflow = 'hidden';
        element.style.transition = 'max-height 0.3s ease-out, opacity 0.3s ease-out';
        showText.classList.add('hidden');
        hideText.classList.remove('hidden');
        arrow.classList.add('rotate-180');
        
        setTimeout(() => {
            element.style.maxHeight = element.scrollHeight + 'px';
            element.style.opacity = '1';
        }, 10);
    } else {
        element.style.maxHeight = '0';
        element.style.opacity = '0';
        showText.classList.remove('hidden');
        hideText.classList.add('hidden');
        arrow.classList.remove('rotate-180');
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 300);
    }
}

function toggleAchievementsCerts(id) {
    const element = document.getElementById(id);
    const counter = id.split('-')[1];
    const showTextCert = document.getElementById('show-text-cert-' + counter);
    const hideTextCert = document.getElementById('hide-text-cert-' + counter);
    const arrowCert = document.getElementById('arrow-cert-' + counter);
    
    if (element.classList.contains('hidden')) {
        element.classList.remove('hidden');
        element.style.maxHeight = '0';
        element.style.opacity = '0';
        element.style.overflow = 'hidden';
        element.style.transition = 'max-height 0.3s ease-out, opacity 0.3s ease-out';
        showTextCert.classList.add('hidden');
        hideTextCert.classList.remove('hidden');
        arrowCert.classList.add('rotate-180');
        
        setTimeout(() => {
            element.style.maxHeight = element.scrollHeight + 'px';
            element.style.opacity = '1';
        }, 10);
    } else {
        element.style.maxHeight = '0';
        element.style.opacity = '0';
        showTextCert.classList.remove('hidden');
        hideTextCert.classList.add('hidden');
        arrowCert.classList.remove('rotate-180');
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 300);
    }
}

function toggleResponsibilities(id) {
    const element = document.getElementById(id);
    const counterParts = id.split('-').slice(1).join('-');
    const showTextResp = document.getElementById('show-text-resp-' + counterParts);
    const hideTextResp = document.getElementById('hide-text-resp-' + counterParts);
    const arrowResp = document.getElementById('arrow-' + counterParts);

    if (element.classList.contains('hidden')) {
        element.classList.remove('hidden');
        element.style.maxHeight = '0';
        element.style.opacity = '0';
        element.style.overflow = 'hidden';
        element.style.transition = 'max-height 0.3s ease-out, opacity 0.3s ease-out';
        showTextResp.classList.add('hidden');
        hideTextResp.classList.remove('hidden');
        arrowResp.classList.add('rotate-180');
        
        setTimeout(() => {
            element.style.maxHeight = element.scrollHeight + 'px';
            element.style.opacity = '1';
        }, 10);
    } else {
        element.style.maxHeight = '0';
        element.style.opacity = '0';
        showTextResp.classList.remove('hidden');
        hideTextResp.classList.add('hidden');
        arrowResp.classList.remove('rotate-180');
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 300);
    }
}

function toggleJourney(id) {
    const content = document.getElementById(id);
    const cardId = id.split('-').pop();
    const showText = document.getElementById('show-journey-' + cardId);
    const hideText = document.getElementById('hide-journey-' + cardId);
    const arrow = document.getElementById('arrow-journey-' + cardId);
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        content.classList.add('block');
        showText.classList.add('hidden');
        hideText.classList.remove('hidden');
        arrow.classList.add('rotate-180');
        
        setTimeout(() => {
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
        }, 10);
    } else {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        showText.classList.remove('hidden');
        hideText.classList.add('hidden');
        arrow.classList.remove('rotate-180');
        
        setTimeout(() => {
            content.classList.add('hidden');
            content.classList.remove('block');
        }, 300);
    }
}

/* js/backScroll.js */
document.addEventListener('DOMContentLoaded', function() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const backToBtn = document.getElementById('backToBtn');
    const toGitHub = document.getElementById('toGitHub');
    const toDemo = document.getElementById('toDemo');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.remove('opacity-0', 'translate-y-10');
            scrollToTopBtn.classList.add('opacity-100', 'translate-y-0');
            backToBtn.classList.remove('opacity-0', 'translate-y-10');
            backToBtn.classList.add('opacity-100', 'translate-y-0');
            toGitHub.classList.remove('opacity-0', 'translate-y-10');
            toGitHub.classList.add('opacity-100', 'translate-y-0');
            toDemo.classList.remove('opacity-0', 'translate-y-10');
            toDemo.classList.add('opacity-100', 'translate-y-0');
        } else {
            scrollToTopBtn.classList.remove('opacity-100', 'translate-y-0');
            scrollToTopBtn.classList.add('opacity-0', 'translate-y-10');
            backToBtn.classList.remove('opacity-100', 'translate-y-0');
            backToBtn.classList.add('opacity-0', 'translate-y-10');
            toGitHub.classList.remove('opacity-100', 'translate-y-0');
            toGitHub.classList.add('opacity-0', 'translate-y-10');
            toDemo.classList.remove('opacity-100', 'translate-y-0');
            toDemo.classList.add('opacity-0', 'translate-y-10');
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
