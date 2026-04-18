from flask import Flask, render_template_string
import os

app = Flask(__name__)

@app.route('/')
def index():
    # อ่านไฟล์รายงานล่าสุดที่บันทึกตอนตี 5
    # บน Pi 5 จริงจะเป็น: /home/pi/DuDe_Watcher_pi5hialo8_IceFac_Aran/logs/daily_report.log
    # ในการจำลองนี้ เราจะใช้ path ที่เข้าถึงได้บนเครื่องนี้
    report_path = "/home/thegodseller/DuDe_Hawaiian/logs/daily_report.log"
    content = "ยังไม่มีข้อมูลรายงาน"
    
    if os.path.exists(report_path):
        with open(report_path, 'r') as f:
            content = f.read()
    
    # UI Design by DuDe AI
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Vision Report | DuDe HAWAIIAN</title>
            <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
            <style>
                body { 
                    background: #0a0a0a; 
                    color: #e0e0e0; 
                    font-family: 'Lexend', sans-serif; 
                    margin: 0; 
                    padding: 40px; 
                }
                .vision-container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: #111; 
                    color: #39ff14; 
                    padding: 30px; 
                    border: 2px solid #39ff14; 
                    box-shadow: 0 0 20px rgba(57, 255, 20, 0.1);
                    border-radius: 8px;
                }
                h2 { color: #39ff14; margin-top: 0; letter-spacing: 2px; }
                pre { 
                    background: #000; 
                    padding: 20px; 
                    border-radius: 4px; 
                    font-family: 'JetBrains Mono', monospace; 
                    font-size: 1.1em;
                    overflow-x: auto;
                    border: 1px solid rgba(57, 255, 20, 0.2);
                    white-space: pre-wrap;
                }
                hr { border: 0; border-top: 1px solid rgba(57, 255, 20, 0.3); margin: 20px 0; }
                small { color: #888; text-transform: uppercase; letter-spacing: 1px; }
                .status-tag { color: #ffd700; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="vision-container">
                <h2>👁️ DUDE VISION LIVE REPORT</h2>
                <pre>{{ content }}</pre>
                <hr>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small>Status: <span class="status-tag">Hailo-8 Active</span> | Node: 192.168.11.15</small>
                    <small>Last Sync: Today 05:00</small>
                </div>
            </div>
        </body>
        </html>
    ''', content=content)

if __name__ == '__main__':
    # รันบนพอร์ต 5000 ตามที่ระบุใน Tunnel Config
    app.run(host='0.0.0.0', port=5000)
