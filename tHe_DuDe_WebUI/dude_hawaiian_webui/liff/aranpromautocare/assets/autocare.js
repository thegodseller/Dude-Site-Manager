/* Arany AutoCare - LIFF JavaScript */

// API Base URL (change for production)
const API_BASE = 'https://ui.thegodseller.com/autocare'; // 🇹🇭 Correct Public URL

// Service type translations
const SERVICE_NAMES = {
  oil_change: 'เปลี่ยนน้ำมันเครื่อง',
  gear_oil: 'เปลี่ยนน้ำมันเกียร์',
  diff_oil: 'เปลี่ยนน้ำมันเฟืองท้าย',
  ac_refill: 'เติมน้ำยาแอร์',
  ac_repair: 'ซ่อมระบบแอร์',
  alternator: 'ไดนาโม',
  engine: 'เครื่องยนต์',
  suspension: 'ช่วงล่าง',
  other: 'อื่นๆ'
};

// Status translations
const STATUS_NAMES = {
  received: 'รอรับงาน',
  diagnosing: 'ตรวจสอบ',
  quoted: 'เสนอราคาแล้ว',
  approved: 'อนุมัติ',
  in_progress: 'กำลังซ่อม',
  waiting_parts: 'รออะไหล่',
  ready: 'พร้อมรับ',
  delivered: 'ส่งมอบแล้ว',
  cancelled: 'ยกเลิก'
};

function getServiceName(type) {
  return SERVICE_NAMES[type] || type;
}

function getStatusName(status) {
  return STATUS_NAMES[status] || status;
}

// API helper
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: error.message };
  }
}

// Format date
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format currency
function formatCurrency(amount) {
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
