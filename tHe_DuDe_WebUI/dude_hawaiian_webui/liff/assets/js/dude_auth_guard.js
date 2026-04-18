/*
 * DuDe Auth Guard 2026 - Sub-page access control
 */

async function verifyAccess(feature) {
    let userId = sessionStorage.getItem('dude_line_user_id');
    
    // 🇹🇭 ถ้าไม่มี User ID ใน session (เช่น เปิดหน้าตรงๆ)
    if (!userId) {
        try {
            // โหลด LIFF เพื่อหา ID
            if (typeof liff !== 'undefined') {
                if (!liff.id) {
                    await liff.init({ liffId: "2008020536-b0ePOONI" });
                }
                
                if (liff.isLoggedIn()) {
                    const profile = await liff.getProfile();
                    userId = profile.userId;
                    sessionStorage.setItem('dude_line_user_id', userId);
                } else {
                    // ถ้ายังไม่ login ให้เด้งไปหน้าหลัก
                    window.location.href = '/liff/index.html';
                    return;
                }
            }
        } catch (e) {
            console.error("Auth Guard: LIFF Init failed", e);
            // ในโหมด Development บน Browser อาจจะไม่มี LIFF
            // userId = "MOCK_USER_ID"; 
        }
    }

    if (!userId) return; // ปล่อยผ่านถ้ายังหา ID ไม่ได้ (อาจจะเป็นโหมด dev)

    try {
        const res = await fetch('/api/subscription/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ line_user_id: userId, feature: feature })
        });
        
        const result = await res.json();
        
        if (result.allowed === false) {
            console.warn(`🇹🇭 Access Denied: ${feature}. Reason: ${result.reason}`);
            // Redirect to subscription page with context
            window.location.href = `/liff/subscribe.html?service=${feature}&reason=${result.reason}`;
        } else {
            console.log(`🇹🇭 Access Granted for ${feature} (${result.plan})`);
            document.documentElement.classList.add('access-granted');
        }
    } catch (err) {
        console.error("🇹🇭 Auth Guard Check Failed:", err);
    }
}
