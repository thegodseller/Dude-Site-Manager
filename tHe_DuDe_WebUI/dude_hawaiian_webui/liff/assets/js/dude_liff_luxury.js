/* DuDe Luxury 2026 - Interactions
   Author: Antigravity
   Date: 2026-02-16
*/

const APP_CONFIG = {
    liffId: "2008020536-b0ePOONI",
    mockMode: false
};

// Internal Mapping
const SERVICE_LINKS = {
    vision: "/liff/vision.html",
    drive: "/liff/drive.html",
    note: "/liff/note.html",
    rag: "/liff/rag_upload.html",
    room: "/liff/room_service.html"
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Simulate Loading
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            animateEntrance();
        }, 500);
    }, 1500);

    // Initialize LIFF
    initLiff();

    // Attach Event Listeners
    attachCardListeners();
});

function animateEntrance() {
    const elements = document.querySelectorAll('.animate-on-load');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
        el.classList.add('fade-in-up');
    });
}

function attachCardListeners() {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            const service = card.getAttribute('data-service');
            const targetUrl = card.getAttribute('data-url');
            
            // Ripple Effect
            createRipple(e, card);

            // Navigation
            setTimeout(() => {
                if (targetUrl) {
                    // Internal Navigation
                    window.location.href = targetUrl;
                } else {
                    // Feature Locked or Custom Action
                    showLockedModal(service);
                }
            }, 300);
        });
        
        // 3D Tilt Effect
        card.addEventListener('mousemove', handleTilt);
        card.addEventListener('mouseleave', resetTilt);
    });
}

function handleTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
}

function resetTilt(e) {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
}

function createRipple(event, element) {
    const circle = document.createElement("span");
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - element.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - element.offsetTop - radius}px`;
    circle.classList.add("ripple");

    const ripple = element.getElementsByClassName("ripple")[0];

    if (ripple) {
        ripple.remove();
    }

    element.appendChild(circle);
}


/* LIFF Integration */
async function initLiff() {
    if (APP_CONFIG.mockMode) {
        // Mock User Data
        updateUserProfile({
            displayName: "Guest User",
            pictureUrl: "https://ui-avatars.com/api/?name=Guest+User&background=random&color=fff"
        });
        return;
    }

    try {
        await liff.init({ liffId: APP_CONFIG.liffId });
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            const profile = await liff.getProfile();
            updateUserProfile(profile);
        }
    } catch (err) {
        console.error('LIFF Init Error:', err);
    }
}

function updateUserProfile(profile) {
    const nameEl = document.getElementById('user-name');
    const imgEl = document.getElementById('user-img');
    
    if (nameEl) nameEl.textContent = profile.displayName;
    if (imgEl && profile.pictureUrl) imgEl.src = profile.pictureUrl;
}

/* Modal Logic */
function showLockedModal(serviceName) {
    alert(`Service [${serviceName}] is coming soon in 2026 update.`);
}
