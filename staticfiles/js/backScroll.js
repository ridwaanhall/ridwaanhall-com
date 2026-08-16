/**
 * Reveals the floating action buttons once the page has been scrolled.
 *
 * Not every page that loads this script has every button: about, openhire and
 * the privacy policy render only #scrollToTopBtn, while #backToBtn, #toGitHub
 * and #toDemo come from the blog and project detail floating-button
 * components. Addressing them unconditionally threw
 * "Cannot read properties of null (reading 'classList')" on every scroll event
 * on those pages, which also aborted the handler before the buttons that *did*
 * exist were updated -- so the visible symptom was a console full of errors and
 * a scroll-to-top button that never appeared.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    // Only the buttons this page actually rendered.
    const revealable = ['scrollToTopBtn', 'backToBtn', 'toGitHub', 'toDemo']
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);

    if (revealable.length) {
        window.addEventListener('scroll', function () {
            const scrolled = window.scrollY > 300;
            revealable.forEach(function (btn) {
                btn.classList.toggle('opacity-100', scrolled);
                btn.classList.toggle('translate-y-0', scrolled);
                btn.classList.toggle('opacity-0', !scrolled);
                btn.classList.toggle('translate-y-10', !scrolled);
            });
        });
    }

    scrollToTopBtn?.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
