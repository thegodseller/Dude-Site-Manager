import React, { useState, useEffect, useRef } from 'react';

// ─── THEME TOKENS ────────────────────────────────────────────────────────────

import { T } from './theme';

const commonCss = {
  card: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    padding: 16,
  },
  font: { fontFamily: "'IBM Plex Sans Thai', Sarabun, sans-serif" },
};

// ─── INTERFACES ──────────────────────────────────────────────────────────────

export interface SeverityItem {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

export interface RoleItem {
  label: string;
  bg: string;
}

export interface ButtonVariant {
  bg: string;
  text: string;
  border: string;
}

export interface StatusBadgeProps {
  severity?: string;
  size?: 'sm' | 'md';
}

export interface RoleBadgeProps {
  role?: string;
}

export interface ButtonProps {
  variant?: string;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  status?: string;
  icon?: React.ReactNode;
}

export interface MetricRowProps {
  metrics?: MetricCardProps[];
}

export interface AlertItemProps {
  severity?: string;
  title: string;
  source?: string;
  time?: string;
  incidentId?: string;
  onAck?: () => void;
  onView?: () => void;
  onFalseAlarm?: () => void;
}

export interface AlertListProps {
  alerts?: AlertItemProps[];
}

export interface ChatBubbleProps {
  role: string;
  content: React.ReactNode;
  time?: string;
  iotAction?: string;
}

export interface ChatWindowProps {
  messages?: ChatBubbleProps[];
  model?: string;
  onSend?: (msg: string) => void;
}

export interface TaskItemProps {
  title: string;
  priority?: string;
  time?: string;
  checked?: boolean;
  onChange?: () => void;
}

export interface TaskListProps {
  tasks?: TaskItemProps[];
  shift?: string;
  operator?: string;
}

export interface CameraNodeProps {
  id: string;
  label: string;
  status?: string;
  conf?: number;
  onClick?: (cam: { id: string; label: string; status: string }) => void;
}

export interface CameraNodeMapProps {
  cameras?: CameraNodeProps[];
  onSelect?: (cam: { id: string; label: string; status: string }) => void;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabBarProps {
  tabs?: TabItem[];
  active?: string;
  onChange?: (id: string) => void;
}

export interface FilterPillItem {
  id: string;
  label: string;
  count?: number;
}

export interface FilterPillsProps {
  pills?: FilterPillItem[];
  active?: string;
  onChange?: (id: string) => void;
}

export interface SkillCardProps {
  icon?: React.ReactNode;
  name: string;
  version?: string;
  status?: string;
  onInstall?: () => void;
}

export interface SkillRegistryProps {
  skills?: SkillCardProps[];
  onInstall?: () => void;
}

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TimelineEvent {
  title: string;
  time: string;
  status: string;
  description: string;
  actor?: string;
}

export interface TimelineProps {
  events?: TimelineEvent[];
}

export interface ShiftHandoverItem {
  status: string;
  text: string;
}

export interface ShiftHandoverProps {
  from: string;
  to: string;
  time: string;
  items?: ShiftHandoverItem[];
  note?: string;
}

// ─── 01. BADGES ──────────────────────────────────────────────────────────────

const SEVERITY: Record<string, SeverityItem> = {
  critical: { label: 'วิกฤต',     bg: '#7f1d1d', text: '#fca5a5', dot: '#ef4444' },
  warning:  { label: 'เตือน',     bg: '#78350f', text: '#fcd34d', dot: '#f59e0b' },
  success:  { label: 'ปกติ',      bg: '#064e3b', text: '#6ee7b7', dot: '#10b981' },
  info:     { label: 'ข้อมูล',    bg: '#1e1b4b', text: '#a5b4fc', dot: '#6366f1' },
  resolved: { label: 'แก้ไขแล้ว', bg: '#1f2937', text: '#94a3b8', dot: '#475569' },
};

const ROLES: Record<string, RoleItem> = {
  superAdmin: { label: 'Super Admin',  bg: '#7c3aed' },
  b2bAdmin:   { label: 'B2B Admin',    bg: '#0369a1' },
  manager:    { label: 'Manager',      bg: '#0f766e' },
  supervisor: { label: 'Supervisor',   bg: '#b45309' },
  operator:   { label: 'Operator',     bg: '#374151' },
};

export function StatusBadge({ severity = 'success', size = 'md' }: StatusBadgeProps) {
  const s = SEVERITY[severity] || SEVERITY.success;
  const px = size === 'sm' ? '6px 10px' : '5px 12px';
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.text,
      padding: px, borderRadius: 99, fontSize: fs,
      fontWeight: 600, letterSpacing: '0.02em',
      ...commonCss.font,
    } as React.CSSProperties}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: s.dot,
        ...(severity === 'critical' ? {
          boxShadow: `0 0 0 2px ${s.dot}40`,
          animation: 'pulse 1.4s ease-in-out infinite',
        } : {}),
      } as React.CSSProperties} />
      {s.label}
    </span>
  );
}

export function RoleBadge({ role = 'operator' }: RoleBadgeProps) {
  const r = ROLES[role] || ROLES.operator;
  return (
    <span style={{
      background: r.bg, color: '#fff',
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      textTransform: 'uppercase', ...commonCss.font,
    } as React.CSSProperties}>
      {r.label}
    </span>
  );
}

// ─── 02. BUTTON ──────────────────────────────────────────────────────────────

const BTN_VARIANTS: Record<string, ButtonVariant> = {
  primary: { bg: T.accent,    text: '#fff',     border: 'transparent' },
  danger:  { bg: '#dc2626',   text: '#fff',     border: 'transparent' },
  success: { bg: '#059669',   text: '#fff',     border: 'transparent' },
  ghost:   { bg: 'transparent', text: T.sub,   border: T.border },
  outline: { bg: 'transparent', text: T.accent, border: T.accent },
};

export function Button({
  variant = 'primary', size = 'md', children,
  icon, loading = false, disabled = false,
  onClick, fullWidth = false,
}: ButtonProps) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  const [hover, setHover] = useState(false);
  const pad = size === 'sm' ? '6px 14px' : size === 'lg' ? '12px 28px' : '9px 20px';
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: v.bg, color: v.text,
        border: `1px solid ${v.border}`,
        borderRadius: 8, padding: pad, fontSize: fs,
        fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : hover ? 0.85 : 1,
        transition: 'opacity .15s, transform .1s',
        transform: hover && !disabled ? 'translateY(-1px)' : 'none',
        width: fullWidth ? '100%' : 'auto',
        justifyContent: 'center', ...commonCss.font,
      } as React.CSSProperties}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}

function Spinner({ size = 16, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{
      animation: 'spin 0.7s linear infinite',
    } as React.CSSProperties}>
      <circle cx="12" cy="12" r="10" fill="none" stroke={color}
        strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"
        strokeLinecap="round" />
    </svg>
  );
}

// ─── 03. METRIC CARD ─────────────────────────────────────────────────────────

export function MetricCard({ label, value, unit, trend, status = 'normal', icon }: MetricCardProps) {
  const statusColors: Record<string, string> = {
    normal:   T.accent,
    warning:  T.warning,
    critical: T.critical,
    success:  T.success,
  };
  const c = statusColors[status] || T.accent;

  return (
    <div style={{
      ...commonCss.card,
      borderLeft: `3px solid ${c}`,
      display: 'flex', flexDirection: 'column', gap: 8,
      minWidth: 140,
    } as React.CSSProperties}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase',
          letterSpacing: '0.06em', ...commonCss.font } as React.CSSProperties}>{label}</span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: T.text,
          fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: T.sub }}>{unit}</span>}
      </div>
      {trend && (
        <span style={{ fontSize: 11, color: trend.startsWith('+') ? T.success : T.critical }}>
          {trend}
        </span>
      )}
    </div>
  );
}

export function MetricRow({ metrics = [] }: MetricRowProps) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
    </div>
  );
}

// ─── 04. ALERT LIST ITEM ─────────────────────────────────────────────────────

export function AlertItem({ severity = 'critical', title, source, time, incidentId, onAck, onView, onFalseAlarm }: AlertItemProps) {
  const [acked, setAcked] = useState(false);
  const s = SEVERITY[severity] || SEVERITY.critical;

  return (
    <div style={{
      display: 'flex', gap: 0,
      background: T.s2, borderRadius: 10,
      overflow: 'hidden', border: `1px solid ${T.border}`,
      opacity: acked ? 0.55 : 1, transition: 'opacity .3s',
    } as React.CSSProperties}>
      {/* Left strip */}
      <div style={{ width: 4, background: s.dot, flexShrink: 0 }} />

      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <StatusBadge severity={severity} size="sm" />
              {incidentId && (
                <span style={{ fontSize: 10, color: T.muted,
                  fontFamily: "'IBM Plex Mono', monospace" }}>{incidentId}</span>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, ...commonCss.font } as React.CSSProperties}>{title}</div>
            {source && <div style={{ fontSize: 12, color: T.sub, marginTop: 2, ...commonCss.font } as React.CSSProperties}>{source}</div>}
          </div>
          <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap', ...commonCss.font } as React.CSSProperties}>{time}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {!acked && (
            <Button variant="primary" size="sm" onClick={() => { setAcked(true); onAck?.(); }}>
              ✓ รับทราบ
            </Button>
          )}
          {onView && <Button variant="ghost" size="sm" onClick={onView}>📷 ดูภาพ</Button>}
          {onFalseAlarm && !acked && (
            <Button variant="ghost" size="sm" onClick={onFalseAlarm}>✕ False Alarm</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertList({ alerts = [] }: AlertListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {alerts.map((a, i) => <AlertItem key={i} {...a} />)}
    </div>
  );
}

// ─── 05. CHAT (DuDe AI) ──────────────────────────────────────────────────────

export function ChatBubble({ role, content, time, iotAction }: ChatBubbleProps) {
  const isAI = role === 'dude';
  return (
    <div style={{
      display: 'flex', gap: 10,
      flexDirection: isAI ? 'row' : 'row-reverse',
      alignItems: 'flex-end',
      marginBottom: 12
    } as React.CSSProperties}>
      {isAI && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `linear-gradient(135deg, ${T.accent}, #7c3aed)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>🤖</div>
      )}
      <div style={{ maxWidth: '72%' }}>
        <div style={{
          background: isAI ? T.s2 : T.accent,
          color: T.text, borderRadius: isAI ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
          padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
          border: isAI ? `1px solid ${T.border}` : 'none',
          ...commonCss.font,
        } as React.CSSProperties}>
          {isAI && (
            <span style={{ fontSize: 10, color: T.sub, display: 'block', marginBottom: 4,
              fontFamily: "'IBM Plex Mono', monospace" }}>DUDE</span>
          )}
          {content}
          {iotAction && (
            <div style={{
              marginTop: 8, padding: '6px 10px',
              background: `${T.success}20`, borderRadius: 6,
              border: `1px solid ${T.success}40`,
              fontSize: 11, color: T.success,
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              IoT: {iotAction}
            </div>
          )}
        </div>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4,
          textAlign: isAI ? 'left' : 'right', ...commonCss.font } as React.CSSProperties}>{time}</div>
      </div>
    </div>
  );
}

export function ChatWindow({ messages = [], model = 'typhoon2.5-4b', onSend }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend?.(input.trim());
    setInput('');
  };

  return (
    <div style={{ ...commonCss.card, display: 'flex', flexDirection: 'column', height: 420 } as React.CSSProperties}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success,
            boxShadow: `0 0 6px ${T.success}` }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text, ...commonCss.font } as React.CSSProperties}>DuDe AI</span>
        </div>
        <span style={{ fontSize: 10, color: T.muted,
          fontFamily: "'IBM Plex Mono', monospace" }}>{model}</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex',
        flexDirection: 'column', gap: 4 }}>
        {messages.map((m, i) => <ChatBubble key={i} {...m} />)}
        <div ref={endRef} />
      </div>

      {/* Quick chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {['รายงานวันนี้', 'สถานะกล้อง', 'ประวัติ'].map(t => (
          <button key={t} onClick={() => setInput(t)} style={{
            background: T.s3, color: T.sub, border: `1px solid ${T.border}`,
            borderRadius: 99, padding: '4px 12px', fontSize: 11, cursor: 'pointer',
            ...commonCss.font,
          } as React.CSSProperties}>{t}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="พิมพ์คำสั่งภาษาไทย..."
          style={{
            flex: 1, background: T.s3, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '9px 14px',
            color: T.text, fontSize: 13, outline: 'none',
            ...commonCss.font,
          } as React.CSSProperties}
        />
        <Button onClick={handleSend} icon="▶">ส่ง</Button>
      </div>
    </div>
  );
}

// ─── 06. TASK LIST ───────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  urgent: T.critical,
  high:   T.warning,
  done:   T.success,
  todo:   T.muted,
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'URGENT', high: 'HIGH', done: 'DONE', todo: 'TODO',
};

export function TaskItem({ title, priority = 'todo', time, checked = false, onChange }: TaskItemProps) {
  const c = PRIORITY_COLORS[priority] || T.muted;
  return (
    <div style={{
      display: 'flex', gap: 0,
      background: T.s2, borderRadius: 8,
      overflow: 'hidden', border: `1px solid ${T.border}`,
      opacity: checked ? 0.6 : 1,
      marginBottom: 8
    } as React.CSSProperties}>
      <div style={{ width: 3, background: c, flexShrink: 0 }} />
      <div style={{ padding: '10px 14px', flex: 1,
        display: 'flex', alignItems: 'center', gap: 12 }}>
        <input type="checkbox" checked={checked} onChange={onChange}
          style={{ accentColor: T.accent, width: 16, height: 16, cursor: 'pointer' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: checked ? T.muted : T.text,
            textDecoration: checked ? 'line-through' : 'none', ...commonCss.font } as React.CSSProperties}>{title}</div>
          {time && <div style={{ fontSize: 11, color: T.muted, marginTop: 2, ...commonCss.font } as React.CSSProperties}>{time}</div>}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: c,
          letterSpacing: '0.05em', ...commonCss.font,
        } as React.CSSProperties}>{PRIORITY_LABELS[priority]}</span>
      </div>
    </div>
  );
}

export function TaskList({ tasks = [], shift, operator }: TaskListProps) {
  const [items, setItems] = useState<TaskItemProps[]>(tasks.map(t => ({ ...t, checked: t.checked || false })));
  return (
    <div style={{ ...commonCss.card } as React.CSSProperties}>
      {(shift || operator) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12,
          paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
          {shift && <span style={{ fontSize: 12, color: T.sub, ...commonCss.font } as React.CSSProperties}>{shift}</span>}
          {operator && <span style={{ fontSize: 12, color: T.accent, fontWeight: 600, ...commonCss.font } as React.CSSProperties}>{operator}</span>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((t, i) => (
          <TaskItem key={i} {...t}
            checked={t.checked}
            onChange={() => setItems(prev => prev.map((p, j) => j === i ? { ...p, checked: !p.checked } : p))}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 07. CAMERA NODE MAP ─────────────────────────────────────────────────────

export function CameraNode({ id, label, status = 'normal', conf, onClick }: CameraNodeProps) {
  const colors: Record<string, string> = { normal: T.success, alert: T.warning, critical: T.critical, offline: T.muted };
  const c = colors[status] || T.success;
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => onClick?.({ id, label, status })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? T.s3 : T.s2,
        border: `1px solid ${status === 'critical' ? c : T.border}`,
        borderRadius: 10, padding: 14, cursor: 'pointer',
        transition: 'all .15s',
        boxShadow: status === 'critical' ? `0 0 12px ${c}40` : 'none',
        position: 'relative', overflow: 'hidden',
      } as React.CSSProperties}
    >
      {status === 'critical' && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 8, height: 8, borderRadius: '50%',
          background: T.critical, animation: 'pulse 1s ease-in-out infinite',
        } as React.CSSProperties} />
      )}
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 6,
        fontFamily: "'IBM Plex Mono', monospace" }}>{id}</div>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
      <div style={{ fontSize: 12, color: T.text, fontWeight: 600, marginBottom: 4, ...commonCss.font } as React.CSSProperties}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
        <span style={{ fontSize: 10, color: c, textTransform: 'uppercase',
          fontWeight: 700, ...commonCss.font } as React.CSSProperties}>
          {status === 'normal' ? 'LIVE' : status.toUpperCase()}
        </span>
        {conf && <span style={{ fontSize: 10, color: T.muted, marginLeft: 'auto',
          fontFamily: "'IBM Plex Mono', monospace" }}>{conf}%</span>}
      </div>
    </div>
  );
}

export function CameraNodeMap({ cameras = [], onSelect }: CameraNodeMapProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
      {cameras.map((cam, i) => (
        <CameraNode key={i} {...cam} onClick={onSelect} />
      ))}
    </div>
  );
}

// ─── 08. TAB BAR ─────────────────────────────────────────────────────────────

export function TabBar({ tabs = [], active, onChange }: TabBarProps) {
  return (
    <div style={{ display: 'flex', gap: 2, background: T.s2,
      padding: 4, borderRadius: 10, border: `1px solid ${T.border}` } as React.CSSProperties}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button key={tab.id} onClick={() => onChange?.(tab.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 7,
            background: isActive ? T.accent : 'transparent',
            color: isActive ? '#fff' : T.sub,
            border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: isActive ? 700 : 400,
            transition: 'all .15s', ...commonCss.font,
          } as React.CSSProperties}>
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterPills({ pills = [], active, onChange }: FilterPillsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {pills.map((pill) => {
        const isActive = pill.id === active;
        return (
          <button key={pill.id} onClick={() => onChange?.(pill.id)} style={{
            padding: '5px 14px', borderRadius: 99,
            background: isActive ? T.accent : T.s2,
            color: isActive ? '#fff' : T.sub,
            border: `1px solid ${isActive ? T.accent : T.border}`,
            fontSize: 12, fontWeight: isActive ? 600 : 400,
            cursor: 'pointer', transition: 'all .15s', ...commonCss.font,
          } as React.CSSProperties}>
            {pill.label}
            {pill.count !== undefined && (
              <span style={{ marginLeft: 5, fontSize: 10,
                color: isActive ? 'rgba(255,255,255,.7)' : T.muted }}>{pill.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── 09. SKILL REGISTRY ──────────────────────────────────────────────────────

export function SkillCard({ icon, name, version, status = 'loaded', onInstall }: SkillCardProps) {
  const isAdd = status === 'add';
  return (
    <div style={{
      background: isAdd ? 'transparent' : T.s2,
      border: `${isAdd ? '2px dashed' : '1px solid'} ${T.border}`,
      borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      cursor: isAdd ? 'pointer' : 'default',
      transition: 'all .15s',
      minWidth: 120,
    } as React.CSSProperties} onClick={isAdd ? onInstall : undefined}>
      <div style={{ fontSize: 28 }}>{icon || (isAdd ? '➕' : '🧩')}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, textAlign: 'center', ...commonCss.font } as React.CSSProperties}>
        {name}
      </div>
      {version && <div style={{ fontSize: 10, color: T.muted, ...commonCss.font } as React.CSSProperties}>{version}</div>}
      <div style={{
        fontSize: 10, fontWeight: 700,
        color: isAdd ? T.accent : T.success, ...commonCss.font,
      } as React.CSSProperties}>
        {isAdd ? 'INSTALL' : `● ${status.toUpperCase()}`}
      </div>
    </div>
  );
}

export function SkillRegistry({ skills = [], onInstall }: SkillRegistryProps) {
  return (
    <div style={{ ...commonCss.card } as React.CSSProperties}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, ...commonCss.font } as React.CSSProperties}>
          🧩 Skill Registry
        </span>
        <span style={{ fontSize: 11, color: T.success, ...commonCss.font } as React.CSSProperties}>
          {skills.filter(s => s.status !== 'add').length} loaded
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {skills.map((s, i) => <SkillCard key={i} {...s} onInstall={onInstall} />)}
      </div>
    </div>
  );
}

// ─── 10. SECTION HEADER ──────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle, action, badge }: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: 16,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, ...commonCss.font } as React.CSSProperties}>{title}</h2>
          {badge && (
            <span style={{
              background: T.accentGlow, color: T.accent,
              borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, ...commonCss.font,
            } as React.CSSProperties}>{badge}</span>
          )}
        </div>
        {subtitle && <p style={{ fontSize: 12, color: T.sub, margin: '4px 0 0', ...commonCss.font } as React.CSSProperties}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── 11. TIMELINE ───────────────────────────────────────────────────────────

export function Timeline({ events = [] }: TimelineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((ev, i) => (
        <div key={i} style={{ display: 'flex', gap: 16 }}>
          {/* Track */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: (SEVERITY[ev.status] || SEVERITY.success).dot,
              marginTop: 6, flexShrink: 0,
              boxShadow: `0 0 0 3px ${(SEVERITY[ev.status] || SEVERITY.success).dot}20`
            }} />
            {i !== events.length - 1 && (
              <div style={{ flex: 1, width: 2, background: T.border, margin: '4px 0' }} />
            )}
          </div>
          {/* Content */}
          <div style={{ paddingBottom: 20, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text, ...commonCss.font } as React.CSSProperties}>{ev.title}</span>
              <span style={{ fontSize: 11, color: T.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{ev.time}</span>
            </div>
            <div style={{ fontSize: 12, color: T.sub, ...commonCss.font } as React.CSSProperties}>{ev.description}</div>
            {ev.actor && (
              <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, marginTop: 4, textTransform: 'uppercase' }}>
                BY: {ev.actor}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 12. SHIFT HANDOVER ──────────────────────────────────────────────────────

export function ShiftHandover({ from, to, time, items = [], note }: ShiftHandoverProps) {
  return (
    <div style={{ ...commonCss.card, background: T.s2 } as React.CSSProperties}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📋</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, ...commonCss.font } as React.CSSProperties}>Shift Handover</div>
            <div style={{ fontSize: 11, color: T.muted }}>{time}</div>
          </div>
        </div>
        <StatusBadge severity="info" size="sm" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>FROM</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{from}</div>
        </div>
        <div style={{ fontSize: 14, color: T.muted }}>→</div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>TO</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{to}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub, ...commonCss.font } as React.CSSProperties}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: (SEVERITY[item.status] || SEVERITY.success).dot }} />
            {item.text}
          </div>
        ))}
      </div>

      {note && (
        <div style={{ padding: 10, background: T.s3, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, fontWeight: 700 }}>SUPERVISOR NOTE</div>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4, ...commonCss.font } as React.CSSProperties}>{note}</div>
        </div>
      )}
    </div>
  );
}

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────

export function DuDeGlobalStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
      @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.05)} }
      @keyframes spin  { to{transform:rotate(360deg)} }
      @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
      * { box-sizing: border-box; }
      body { background: #0a0e1a; margin: 0; color: #f1f5f9; font-family: 'IBM Plex Sans Thai', sans-serif; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #111827; }
      ::-webkit-scrollbar-thumb { background: #2a3a55; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      input::placeholder { color: #475569; }
    ` }} />
  );
}
