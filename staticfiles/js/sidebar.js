/*
 * Mobile navigation drawer.
 *
 * There is no close button. The drawer is dismissed by dragging it down from
 * the grab handle or the header, by tapping the backdrop above it, or with
 * Escape. The drag is the primary gesture and the whole reason the handle is
 * drawn, so it has to track the finger rather than merely fire on release.
 *
 * The handle and header carry `touch-none` in the template. That is load
 * bearing: #mobile-menu is `overflow-y-auto`, so without it the browser claims
 * a vertical drag as a scroll of the drawer and these handlers never see the
 * move at all.
 */
document.addEventListener('DOMContentLoaded', function () {
    const openSidebarBtn = document.getElementById('open-sidebar');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!mobileSidebar || !mobileMenu) {
        return;
    }

    // Drag past this share of the drawer's own height and release closes it;
    // short of that it springs back. Proportional rather than a pixel count so
    // a short drawer is not disproportionately hard to dismiss.
    const CLOSE_FRACTION = 0.25;
    // A quick flick should close even when it never travelled that far.
    const FLICK_VELOCITY = 0.5; // px per ms
    const FLICK_MIN_DISTANCE = 12; // ignore taps, which are fast but go nowhere

    let dragging = false;
    let startY = 0;
    let startTime = 0;
    let offset = 0;

    const openSidebar = () => {
        mobileSidebar.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        setTimeout(() => {
            mobileMenu.classList.remove('translate-y-full');
        }, 50);
    };

    const closeSidebar = () => {
        mobileMenu.classList.add('translate-y-full');
        setTimeout(() => {
            mobileSidebar.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 300);
    };

    // Hand the drawer back to CSS. Clearing the inline transform in the same
    // synchronous block as the class change means the class's own 300ms
    // transition carries it the rest of the way from wherever the finger left
    // it, instead of it jumping to 0 first.
    function settle(shouldClose) {
        mobileMenu.style.transition = '';
        mobileMenu.style.transform = '';
        if (shouldClose) {
            closeSidebar();
        }
    }

    function onPointerDown(event) {
        // Never start a drag on something the user meant to press -- the status
        // badges in the header are a link.
        if (event.button !== 0 || event.target.closest('a, button, input')) {
            return;
        }
        dragging = true;
        startY = event.clientY;
        startTime = event.timeStamp;
        offset = 0;
        // Transitions off for the duration: the drawer has to sit under the
        // finger, not chase it 300ms behind.
        mobileMenu.style.transition = 'none';
        // Capture keeps the moves coming once the finger leaves the handle,
        // which it does immediately on any real drag. It is an improvement,
        // not a requirement, so a failure here must not abort the drag and
        // strand the drawer with its transitions switched off.
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch (e) {
            /* no capture; moves still arrive while over the handle */
        }
    }

    function onPointerMove(event) {
        if (!dragging) {
            return;
        }
        // Downward only. Rubber-banding upward would suggest the drawer can be
        // expanded, and it cannot.
        offset = Math.max(0, event.clientY - startY);
        mobileMenu.style.transform = 'translateY(' + offset + 'px)';
    }

    function onPointerUp(event) {
        if (!dragging) {
            return;
        }
        dragging = false;
        const elapsed = Math.max(1, event.timeStamp - startTime);
        const flicked = offset > FLICK_MIN_DISTANCE && offset / elapsed > FLICK_VELOCITY;
        // Read the height before settle() touches any style, so the measurement
        // is not what flushes the pending transform.
        const travelled = offset > mobileMenu.offsetHeight * CLOSE_FRACTION;
        settle(flicked || travelled);
    }

    function onPointerCancel() {
        if (!dragging) {
            return;
        }
        dragging = false;
        settle(false);
    }

    mobileMenu.querySelectorAll('[data-drawer-handle]').forEach((handle) => {
        handle.addEventListener('pointerdown', onPointerDown);
        handle.addEventListener('pointermove', onPointerMove);
        handle.addEventListener('pointerup', onPointerUp);
        handle.addEventListener('pointercancel', onPointerCancel);
    });

    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', openSidebar);
    }

    // Anything above the drawer is backdrop.
    mobileSidebar.addEventListener('click', function (event) {
        if (event.target === mobileSidebar) {
            closeSidebar();
        }
    });

    // With the close button gone this is the only keyboard dismissal.
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !mobileSidebar.classList.contains('hidden')) {
            closeSidebar();
        }
    });
});
