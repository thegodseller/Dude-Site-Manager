/**
 * DuDe Component Showcase
 * Visual demo of all 20 components
 * Drop this into tHe_DuDe_WebUI/src/ComponentShowcase.tsx
 */

import { useState } from 'react';
import {
  StatusBadge, RoleBadge, Button, MetricRow,
  AlertList, ChatWindow, TaskList, CameraNodeMap,
  ProposalCard, SkillRegistry, ShiftHandover,
  DataTable, Input, Select, TabBar, FilterPills,
  SectionHeader, Modal, Toast, Timeline,
  Skeleton, SkeletonCard, AgentStatusPanel,
} from './DuDeComponents';
import type {
  ChatMessage, AgentData,
} from './DuDeComponents';

// ── Demo data ─────────────────────────────────────────────────

const DEMO_AGENTS: AgentData[] = [
  { name: 'ag_boss',       port: 11111, type: 'Orchestrator', status: 'ok',      latency: 42  },
  { name: 'ag_negotiator', port: 11112, type: 'Gateway',      status: 'ok',      latency: 18  },
  { name: 'ag_librarian',  port: 11113, type: 'RAG/Sync',     status: 'degraded',latency: 890 },
  { name: 'ag_watcher',    port: 11115, type: 'Vision',       status: 'ok',      latency: 65  },
  { name: 'ag_butler',     port: 11116, type: 'IoT/Logger',   status: 'ok',      latency: 33  },
  { name: 'ag_adventure',  port: 11114, type: 'Search',       status: 'ok',      latency: 210 },
];

const DEMO_MESSAGES: ChatMessage[] = [
  { role: 'user', content: 'ปิดประตูโกดัง B ด่วน', time: '14:32' },
  { role: 'dude', content: '✅ ปิดประตูโกดัง B แล้ว', iotAction: 'DOOR_LOCK_WAREHOUSE_B → locked', time: '14:32' },
  { role: 'user', content: 'สถานะ Line 1 ตอนนี้', time: '14:33' },
  { role: 'dude', content: '⚠️ Line 1: 2 defects วันนี้\nTrend: เพิ่มขึ้น (+0.8/สัปดาห์)\nแนะนำ Maintenance ก่อน 15/05', time: '14:33' },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 48 }}>
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10, letterSpacing: '0.2em', color: '#3b82f6',
      textTransform: 'uppercase', marginBottom: 16,
    }}>
      ── {title} ──────────────────────────
    </div>
    {children}
  </section>
);

export default function ComponentShowcase() {
  const [activeTab, setActiveTab] = useState('all');
  const [activePill, setActivePill] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>(DEMO_MESSAGES);
  const [isThinking, setIsThinking] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [selectVal, setSelectVal] = useState('live');

  const handleChatSend = (text: string) => {
    setChatMsgs(prev => [...prev, { role: 'user', content: text, time: new Date().toLocaleTimeString('th', { hour: '2-digit', minute: '2-digit' }) }]);
    setIsThinking(true);
    setTimeout(() => {
      setChatMsgs(prev => [...prev, {
        role: 'dude',
        content: `รับคำสั่ง: "${text}" กำลังดำเนินการ...`,
        time: new Date().toLocaleTimeString('th', { hour: '2-digit', minute: '2-digit' }),
      }]);
      setIsThinking(false);
    }, 1800);
  };

  return (
    <div style={{
      background: '#080c14', minHeight: '100vh',
      padding: '40px 32px', maxWidth: 1200, margin: '0 auto',
      fontFamily: "'IBM Plex Sans Thai', Sarabun, sans-serif",
      color: '#f0f4ff',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid #1e2d42' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.3em', color: '#3b82f6', marginBottom: 8 }}>
          DuDe SaaS — v2.0
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', color: '#f0f4ff' }}>
          Component Library
        </h1>
        <p style={{ fontSize: 14, color: '#8896b0', margin: 0 }}>
          20 components · Thai-first · Dark Industrial · Production-ready
        </p>
      </div>

      {/* 01 Badges */}
      <Section title="01 Status + Role Badges">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <StatusBadge severity="critical" pulse />
          <StatusBadge severity="warning" />
          <StatusBadge severity="success" />
          <StatusBadge severity="info" />
          <StatusBadge severity="resolved" />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <RoleBadge role="superAdmin" />
          <RoleBadge role="b2bAdmin" />
          <RoleBadge role="manager" />
          <RoleBadge role="supervisor" />
          <RoleBadge role="operator" />
        </div>
      </Section>

      {/* 02 Buttons */}
      <Section title="02 Buttons">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary">อนุมัติ</Button>
          <Button variant="danger">วิกฤต</Button>
          <Button variant="success">ยืนยัน</Button>
          <Button variant="ghost">ยกเลิก</Button>
          <Button variant="outline">ดูรายละเอียด</Button>
          <Button variant="primary" size="sm">ขนาดเล็ก</Button>
          <Button variant="primary" size="lg">ขนาดใหญ่</Button>
          <Button variant="primary" loading>กำลังโหลด...</Button>
          <Button variant="ghost" disabled>ปิดใช้งาน</Button>
        </div>
      </Section>

      {/* 03 Metrics */}
      <Section title="03 Metric Cards">
        <MetricRow metrics={[
          { label: 'Sites Live',   value: 34,     icon: '🌐', status: 'normal',   trend: '+2 สัปดาห์นี้' },
          { label: 'Active Alerts',value: 5,      icon: '🚨', status: 'critical',  trend: '+3 จากเมื่อวาน' },
          { label: 'System Uptime',value: '99.2', unit: '%',  icon: '✅', status: 'success', trend: '+0.1%' },
          { label: 'Avg Response', value: 12,     unit: 's',  icon: '⚡', status: 'warning', trend: '-4s' },
        ]} />
      </Section>

      {/* 04 Alerts */}
      <Section title="04 Alert List">
        <AlertList alerts={[
          {
            id: 'INC-001', severity: 'critical',
            title: 'ตรวจพบควันไฟ — Warehouse Section B',
            source: 'CAM2 · confidence 94%',
            time: '14:32', incidentId: 'INC-20260407-001',
            onView: () => alert('ดูภาพ'),
            onFalseAlarm: () => {},
          },
          {
            id: 'INC-002', severity: 'warning',
            title: 'Defect เกิน Threshold — Production Line 1',
            source: 'PROD_LINE_1 · 2 defects detected',
            time: '13:15', incidentId: 'INC-20260407-002',
          },
          {
            id: 'INC-003', severity: 'resolved',
            title: 'ถังขยะ Zone A เก็บแล้ว',
            source: 'WASTE_BIN_A', time: '12:30',
          },
        ]} />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48 }}>
        {/* 05 Chat */}
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 16 }}>
            ── 05 Chat Window ────────────────
          </div>
          <ChatWindow
            messages={chatMsgs}
            model="qwen2.5:3b"
            isThinking={isThinking}
            onSend={handleChatSend}
          />
        </div>

        {/* 06 Task List */}
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 16 }}>
            ── 06 Task List ──────────────────
          </div>
          <TaskList
            shift="เวรบ่าย 13:00-21:00"
            operator="นายสมชาย"
            tasks={[
              { id: '1', title: 'ตรวจสอบ Section B ด่วน', priority: 'urgent', time: '14:32' },
              { id: '2', title: 'ตรวจ Line 1 ของเสีย', priority: 'high', time: '13:15' },
              { id: '3', title: 'OCR ใบสั่งงาน WO-2045', priority: 'done', checked: true },
              { id: '4', title: 'ตรวจถังขยะ Zone A', priority: 'todo' },
            ]}
          />
        </div>
      </div>

      {/* 07 Camera Map */}
      <Section title="07 Camera Node Map">
        <CameraNodeMap
          cameras={[
            { id: 'CAM1', label: 'Front Gate', status: 'normal' },
            { id: 'CAM2', label: 'Warehouse B', status: 'critical', confidence: 94 },
            { id: 'CAM3', label: 'Line 1', status: 'alert', confidence: 72 },
            { id: 'CAM4', label: 'Line 2', status: 'normal' },
            { id: 'CAM5', label: 'Waste Zone', status: 'normal' },
            { id: 'CAM6', label: 'Exit Gate', status: 'offline' },
          ]}
          onSelect={cam => console.log('Selected:', cam)}
        />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48 }}>
        {/* 08 Proposal */}
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 16 }}>
            ── 08 AI Proposal Card ───────────
          </div>
          <ProposalCard
            id="P-A3F2B1"
            title="ปรับ Threshold กล้อง CAM2"
            description="CAM2 มี False Alarm 7/14 ครั้ง (50%) ในช่วง 14:00-15:00 เสนอเพิ่ม confidence threshold เพื่อลด FA rate"
            current={0.80}
            proposed={0.90}
            risk="อาจพลาด event จริงที่ confidence ต่ำ — แนะนำ monitor 7 วันหลัง apply"
            onApprove={id => console.log('Approved:', id)}
            onReject={id => console.log('Rejected:', id)}
            onEvidence={id => console.log('Evidence:', id)}
          />
        </div>

        {/* 09 Skill Registry */}
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 16 }}>
            ── 09 Skill Registry ─────────────
          </div>
          <SkillRegistry
            skills={[
              { id: 'ocr', name: 'OCR ใบสั่งงาน', icon: '📋', version: 'v1.0', status: 'loaded' },
              { id: 'report', name: 'Custom Report', icon: '📊', version: 'v1.0', status: 'loaded' },
              { id: 'equip', name: 'New Equipment', icon: '🔌', version: 'v1.0', status: 'disabled' },
              { id: 'add', name: '', status: 'add' },
            ]}
            onInstall={() => alert('Marketplace')}
          />
        </div>
      </div>

      {/* 10 Shift Handover */}
      <Section title="10 Shift Handover">
        <div style={{ maxWidth: 480 }}>
          <ShiftHandover
            from="เวรเช้า"
            to="เวรบ่าย"
            time="13:00 น."
            items={[
              { status: 'resolved', text: 'ไฟไหม้ Section B — แก้ไขแล้ว 14:45' },
              { status: 'warning',  text: 'Line 1 defect สูงกว่าปกติ — ติดตามต่อ' },
              { status: 'resolved', text: 'ถังขยะ Zone A เก็บแล้ว 12:30' },
            ]}
            onSubmit={note => console.log('Submit:', note)}
            onSendLine={() => alert('ส่ง LINE')}
          />
        </div>
      </Section>

      {/* 11 Data Table */}
      <Section title="11 Data Table (Multi-tenant)">
        <DataTable
          columns={[
            { key: 'name',    label: 'ลูกค้า' },
            { key: 'sites',   label: 'Sites', sortable: true },
            { key: 'alerts',  label: 'Alerts', sortable: true,
              render: (v) => <span style={{ color: Number(v) > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{String(v)}</span> },
            { key: 'status',  label: 'สถานะ', sortable: false,
              render: (v) => <StatusBadge severity={v === 'ok' ? 'success' : v === 'warning' ? 'warning' : 'critical'} size="sm" /> },
          ]}
          rows={[
            { name: 'บริษัท ABC จำกัด', sites: 3, alerts: 2, status: 'critical' },
            { name: 'โรงงาน XYZ',       sites: 1, alerts: 0, status: 'ok' },
            { name: 'บริษัท DEF อุตฯ',  sites: 8, alerts: 3, status: 'warning' },
          ]}
          onRowClick={row => console.log('Row:', row)}
        />
      </Section>

      {/* 12 Forms */}
      <Section title="12 Form Elements">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
          <Input label="ชื่อกล้อง" placeholder="เช่น CAM2-Warehouse" value={inputVal} onChange={setInputVal} />
          <Input label="Threshold" placeholder="0.80" value="" onChange={() => {}} type="number" />
          <Input label="ตัวอย่าง Error" placeholder="..." value="ค่าผิด" onChange={() => {}} error="กรุณากรอกตัวเลข 0-1" />
          <Select
            label="โหมดกล้อง"
            options={[{ value: 'live', label: 'LIVE' }, { value: 'record', label: 'RECORD' }, { value: 'standby', label: 'STANDBY' }]}
            value={selectVal}
            onChange={setSelectVal}
          />
        </div>
      </Section>

      {/* 13 Navigation */}
      <Section title="13 Navigation">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'all',      label: 'ทั้งหมด', badge: 5 },
              { id: 'critical', label: 'วิกฤต', icon: '🚨', badge: 2 },
              { id: 'warning',  label: 'เตือน', icon: '⚠️' },
              { id: 'resolved', label: 'แก้ไขแล้ว' },
            ]}
          />
          <FilterPills
            active={activePill}
            onChange={setActivePill}
            pills={[
              { id: 'all',    label: 'ทุก Site',  count: 34 },
              { id: 'site-a', label: 'Site A',    count: 12 },
              { id: 'site-b', label: 'Site B',    count: 8  },
              { id: 'site-c', label: 'Site C',    count: 14 },
            ]}
          />
        </div>
      </Section>

      {/* 14 Section Header */}
      <Section title="14 Section Header">
        <SectionHeader
          title="Alert Center"
          subtitle="เหตุการณ์ทั้งหมดในระบบ realtime"
          badge="5 active"
          action={<Button size="sm" variant="ghost">ดูทั้งหมด →</Button>}
        />
      </Section>

      {/* 15 Modal + Toast */}
      <Section title="15–16 Modal + Toast">
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={() => setModalOpen(true)}>เปิด Modal</Button>
          <Button variant="success" onClick={() => setToastVisible(true)}>แสดง Toast</Button>
        </div>
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="ยืนยันการดำเนินการ"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => setModalOpen(false)}>ยืนยัน</Button>
            </>
          }
        >
          <p style={{ fontSize: 14, color: '#8896b0', lineHeight: 1.7 }}>
            คุณต้องการหยุด Production Line 1 ทันทีหรือไม่? การดำเนินการนี้จะส่งผลต่อสายการผลิตทั้งหมด
          </p>
        </Modal>
        {toastVisible && (
          <Toast
            title="ส่งคำสั่งสำเร็จ"
            message="ปิดประตูโกดัง B แล้ว (14:32:15)"
            severity="success"
            onClose={() => setToastVisible(false)}
          />
        )}
      </Section>

      {/* 17 Timeline */}
      <Section title="17 Timeline">
        <div style={{ maxWidth: 480 }}>
          <Timeline events={[
            { time: '14:32', title: 'ตรวจพบควันไฟ', description: 'CAM2 · confidence 94%', status: 'critical', actor: 'ag_watcher' },
            { time: '14:32', title: 'ส่ง LINE Alert', description: 'Level 1 → นายสมชาย', status: 'alert', actor: 'ag_butler' },
            { time: '14:33', title: 'Human Confirmed', description: 'นายสมชาย ยืนยัน — รับทราบ', status: 'normal', actor: 'นายสมชาย' },
            { time: '14:45', title: 'RESOLVED', description: 'ดับเพลิงสำเร็จ incident ปิดแล้ว', status: 'success', actor: 'ag_boss' },
          ]} />
        </div>
      </Section>

      {/* 18 Skeleton */}
      <Section title="18 Skeleton Loader">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 700 }}>
          <SkeletonCard rows={3} />
          <SkeletonCard rows={2} />
          <SkeletonCard rows={4} />
        </div>
      </Section>

      {/* 19 Agent Status */}
      <Section title="19–20 Agent Status Panel (DuDe-specific)">
        <div style={{ maxWidth: 540 }}>
          <AgentStatusPanel
            agents={DEMO_AGENTS}
            onRefresh={() => console.log('Refreshing...')}
          />
        </div>
      </Section>

      <div style={{ paddingTop: 32, borderTop: '1px solid #1e2d42', textAlign: 'center' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#4a5878', letterSpacing: '0.2em' }}>
          DuDe Hawaiian · Component Library v2.0 · เมษายน 2026
        </div>
      </div>
    </div>
  );
}
