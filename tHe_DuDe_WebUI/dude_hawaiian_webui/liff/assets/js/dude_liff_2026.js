/* 
 * DuDe LIFF Dashboard 2026 - Core Logic (PROD)
 */

const LIFF_ID = "2008020536-b0ePOONl";

const SERVICE_LINKS = {
    vision: "/liff/vision.html",
    drive: "/liff/drive.html",
    note: "/liff/note.html",
    rag: "/liff/rag_upload.html",
    room: "/liff/room_service.html"
};

const SERVICE_NAMES = {
    vision: "DuDe Vision",
    drive: "DuDe Drive",
    note: "DuDe Note",
    rag: "DuDe RAG",
    room: "DuDe Room Service"
};

class SubscriptionManager {
    constructor() {
        this.userId = null;
        this.subscription = { plan: "free", features: [], is_active: true };
    }

    async init() {
        try {
            // 🇹🇭 Initialize LIFF
            await liff.init({ liffId: LIFF_ID });
            
            if (!liff.isLoggedIn()) {
                liff.login();
                return;
            }

            const profile = await liff.getProfile();
            this.userId = profile.userId;
            console.log("Your LINE User ID:", this.userId); // 🇹🇭 Show ID for Admin setup
            
            // 🇹🇭 เก็บข้อมูลไว้ใช้ในหน้าอื่น ๆ
            sessionStorage.setItem('dude_line_user_id', this.userId);
            
            // 🇹🇭 ดึงข้อมูลสมาชิกจริงจาก Backend
            await this.fetchSubscription();
            
            this.updateProfileUI(profile);
            this.renderDashboard();

        } catch (err) {
            console.error("LIFF/Subscription Init Failed:", err);
            // 🇹🇭 DEBUG MODE: Show error to User
            alert("LIFF Error: " + err); // Alert for immediate visibility
            this.updateProfileUI({ 
                displayName: "Error: " + (err.message || err), 
                pictureUrl: "https://ui-avatars.com/api/?name=Error&background=red" 
            });
            this.renderDashboard();
        }
    }

    async fetchSubscription() {
        if (!this.userId) return;
        try {
            // 🇹🇭 ยิงไปที่ ag_boss ผ่าน Nginx Proxy (/api/subscription/)
            const response = await fetch(`/api/subscription/${this.userId}`);
            if (response.ok) {
                this.subscription = await response.json();
                console.log("Real Subscription Loaded:", this.subscription);
            }
        } catch (err) {
            console.error("Failed to fetch subscription, using default free plan.", err);
        }
    }

    updateProfileUI(profile) {
        const img = document.getElementById('user-img');
        const name = document.getElementById('user-name');
        
        if (img && profile.pictureUrl) img.src = profile.pictureUrl;
        if (name) name.textContent = profile.displayName || "User";
        
        // 🇹🇭 อัปเดตแพลนปัจจุบัน (ถ้ามี UI element รองรับ)
        const planPill = document.getElementById('user-plan-pill');
        if (planPill) {
            planPill.textContent = (this.subscription.plan || "free").toUpperCase();
        }
    }

    renderDashboard() {
        const cards = document.querySelectorAll('.service-card');
        const { plan, features, is_active } = this.subscription;

        cards.forEach(card => {
            const serviceKey = card.dataset.service;
            
            // 🇹🇭 ตรรกะการตรวจสอบสิทธิ์ (Feature Gating)
            let hasAccess = false;
            
            // 0. 👑 Admin: Open Everything
            if (this.userId === ADMIN_ID) {
                hasAccess = true;
                console.log(`Admin Access Granted for ${serviceKey}`);
            }
            // 1. ระดับ Pro/Master เปิดทุกอย่าง
            else if (plan === 'pro' || plan === 'resort_master') {
                hasAccess = true;
            } 
            // 2. แพลน Vision (Bundled Vision + Drive)
            else if (plan === 'vision' && (serviceKey === 'vision' || serviceKey === 'drive')) {
                hasAccess = true;
            }
            // 3. แพลน Drive (Single)
            else if (plan === 'drive' && serviceKey === 'drive') {
                hasAccess = true;
            }
            // 4. ตรวจสอบจาก Feature List ตรงๆ
            else if (Array.isArray(features) && features.includes(serviceKey)) {
                hasAccess = true;
            }

            // 5. ต้องยังไม่หมดอายุ
            if (!is_active) hasAccess = false;

            // 🇹🇭 อัปเดต UI Card
            card.classList.remove('active', 'locked');
            
            // ล้าง indicator เก่า
            const oldPill = card.querySelector('.status-pill');
            if (oldPill) oldPill.remove();
            const oldOverlay = card.querySelector('.lock-overlay');
            if (oldOverlay) oldOverlay.remove();

            if (hasAccess) {
                card.classList.add('active');
                card.setAttribute('onclick', `openSubMenu('${serviceKey}')`);
                
                const pill = document.createElement('div');
                pill.className = 'status-pill';
                card.appendChild(pill);
            } else {
                card.classList.add('locked');
                card.setAttribute('onclick', `showUpgradeModal('${serviceKey}')`);
                
                const overlay = document.createElement('div');
                overlay.className = 'lock-overlay';
                overlay.innerHTML = '<span class="material-icons-round lock-icon">lock</span>';
                card.appendChild(overlay);
            }
        });
    }
}

// 🇹🇭 Global Instance
const ADMIN_ID = "U1951c31d4d6158a9eac9fc294e8c85ae"; // 🇹🇭 The Creator Code
const subManager = new SubscriptionManager();

// 🇹🇭 Sub-Menu Configurations
const SUBMENUS = {
    vision: [
        { icon: "videocam", label: "Live View", action: "link", url: "vision.html" },
        { icon: "history", label: "Playback", action: "link", url: "playback.html" },
        { icon: "analytics", label: "Package Usage", action: "msg", text: "Check Usage" }
    ],
    drive: [
        { icon: "edit_note", label: "My Notes", action: "link", url: "note.html" },
        { icon: "cloud_upload", label: "Upload Knowledge", action: "link", url: "rag_upload.html" },
        { icon: "folder_shared", label: "Shared Drive", action: "msg", text: "Open Drive" }
    ],
    service: [
        // 🇹🇭 Admin Only Items will be filtered in logic
        { icon: "car_repair", label: "Car Care", action: "link", url: "https://liff.line.me/2008020536-tuJPR90N", adminOnly: true },
        { icon: "room_service", label: "Room Service", action: "link", url: "room_service.html", adminOnly: true },
        { icon: "precision_manufacturing", label: "AM Vision", action: "link", url: "am_vision.html", adminOnly: true }
    ]
};

window.openSubMenu = function(category) {
    const list = document.getElementById('submenu-list');
    const title = document.getElementById('submenu-title');
    const modal = document.getElementById('submenu-modal');
    
    if (!list || !modal) return;

    // Set Title
    const titles = { vision: "DuDe VisioN", drive: "DuDe DrivE", service: "DuDe ServicE" };
    title.textContent = titles[category] || "Menu";

    // Clear previous items
    list.innerHTML = '';

    // Generate Items
    const items = SUBMENUS[category] || [];
    const currentUserId = sessionStorage.getItem('dude_line_user_id');

    // 🇹🇭 Admin Check Logic (Strict Mode)
    const isAdmin = (currentUserId === ADMIN_ID);

    items.forEach(item => {
        // Filter Admin Only
        if (item.adminOnly && !isAdmin) return;

        const el = document.createElement('a');
        el.className = 'submenu-item';
        
        // Handle Actions
        if (item.action === 'link' && item.url) {
            el.href = "#";
            el.onclick = (e) => {
                e.preventDefault();
                // 🇹🇭 Use liff.openWindow for external links (Safe for LIFF-to-LIFF)
                if (item.url.startsWith('http')) {
                    liff.openWindow({
                        url: item.url,
                        external: false // Open in LINE Browser
                    });
                } else {
                    // Internal Navigation
                    window.location.href = item.url;
                }
            };
        } else if (item.action === 'msg' && item.text) {
            el.href = "#";
            el.onclick = (e) => {
                e.preventDefault();
                if (liff.isInClient()) {
                    liff.sendMessages([{ type: 'text', text: item.text }])
                        .then(() => { liff.closeWindow(); })
                        .catch((err) => { console.error(err); alert("Error sending message"); });
                } else {
                    alert("This feature works only in LINE App.");
                }
            };
        } else {
             el.href = "#";
             el.onclick = (e) => { e.preventDefault(); alert("Feature Coming Soon"); };
        }

        el.innerHTML = `
            <span class="material-icons-round submenu-icon">${item.icon}</span>
            <span class="submenu-text">${item.label}</span>
            <span class="material-icons-round" style="color:var(--text-muted)">chevron_right</span>
        `;
        list.appendChild(el);
    });

    // Show Modal
    modal.classList.add('show');
};

window.closeModal = function() {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.classList.remove('show'));
};

window.goToUpgrade = function() {
    window.location.href = '/liff/subscribe.html';
};

// 🇹🇭 เริ่มต้นทำงาน
document.addEventListener('DOMContentLoaded', () => subManager.init());
