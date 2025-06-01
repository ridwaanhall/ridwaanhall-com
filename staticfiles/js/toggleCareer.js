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