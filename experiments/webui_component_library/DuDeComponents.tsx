/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║   DuDe SaaS — React Component Library  v2.0              ║
 * ║   20 components | Thai-first | Dark Industrial            ║
 * ║   Stack: React 18 + TypeScript (no Tailwind dependency)   ║
 * ╚═══════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   import { StatusBadge, AlertList, ChatWindow } from './DuDeComponents'
 *
 * Peer deps: react, react-dom
 * Optional:  IBM Plex Sans Thai, IBM Plex Mono (Google Fonts)
 */

import {
  useState, useEffect, useRef, useCallback,
  type CSSProperties, type ReactNode,
} from 'react';

// ─────────────────────────────────────────────────────────────
// THEME TOKENS
// ─────────────────────────────────────────────────────────────

const T = {
  bg:           '#080c14',
  surface:      '#0f1623',
  s2:           '#161f30',
  s3:           '#1e2a3f',
  s4:           '#243347',
  border:       '#1e2d42',
  border2:      '#2a3d58',
  accent:       '#3b82f6',
  accentHover:  '#2563eb',
  critical:     '#ef4444',
  criticalBg:   'rgba(239,68,68,0.12)',
  warning:      '#f59e0b',
  warningBg:    'rgba(245,158,11,0.12)',
  success:      '#10b981',
  successBg:    'rgba(16,185,129,0.12)',
  info:         '#6366f1',
  infoBg:       'rgba(99,102,241,0.12)',
  text:         '#f0f4ff',
  sub:          '#8896b0',
  muted:        '#4a5878',
  font:         "'IBM Plex Sans Thai', Sarabun, 'Noto Sans Thai', sans-serif",
  mono:         "'IBM Plex Mono', 'Fira Code', monospace",
} as const;

// ─────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────

export type Severity   = 'critical' | 'warning' | 'success' | 'info' | 'resolved';
export type Role       = 'superAdmin' | 'b2bAdmin' | 'manager' | 'supervisor' | 'operator';
export type BtnVariant = 'primary' | 'danger' | 'success' | 'ghost' | 'outline';
export type Size       = 'sm' | 'md' | 'lg';
export type Priority   = 'urgent' | 'high' | 'medium' | 'done' | 'todo';
export type CamStatus  = 'normal' | 'alert' | 'critical' | 'offline';
export type AgentStatus = 'ok' | 'degraded' | 'error' | 'unknown';

// Shared style helpers
const card = (extra?: CSSProperties): CSSProperties => ({
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: 12, padding: 16, ...extra,
});

const font = (extra?: CSSProperties): CSSProperties => ({
  fontFamily: T.font, ...extra,
});

// ─────────────────────────────────────────────────────────────
// 01. STATUS BADGE
// ─────────────────────────────────────────────────────────────

const SEV_MAP: Record<Severity, { label: string; bg: string; text: string; dot: string }> = {
  critical: { label: 'วิกฤต',     bg: 'rgba(127,29,29,0.8)',  text: '#fca5a5', dot: '#ef4444' },
  warning:  { label: 'เตือน',     bg: 'rgba(120,53,15,0.8)',  text: '#fcd34d', dot: '#f59e0b' },
  success:  { label: 'ปกติ',      bg: 'rgba(6,78,59,0.8)',    text: '#6ee7b7', dot: '#10b981' },
  info:     { label: 'ข้อมูล',    bg: 'rgba(30,27,75,0.8)',   text: '#a5b4fc', dot: '#6366f1' },
  resolved: { label: 'แก้ไขแล้ว', bg: 'rgba(31,41,55,0.8)',   text: '#94a3b8', dot: '#475569' },
};

export interface StatusBadgeProps {
  severity?: Severity;
  size?: Size;
  pulse?: boolean;
  label?: string; // override default Thai label
}

export function StatusBadge({ severity = 'success', size = 'md', pulse, label }: StatusBadgeProps) {
  const s = SEV_MAP[severity];
  const fs = size === 'sm' ? 11 : size === 'lg' ? 14 : 12;
  const px = size === 'sm' ? '4px 10px' : '5px 12px';

  return (
    <span style={font({
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.text,
      padding: px, borderRadius: 99, fontSize: fs, fontWeight: 600,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
      border: `1px solid ${s.dot}30`,
    })}>
      <span style={{
        position: 'relative', width: 7, height: 7,
        borderRadius: '50%', background: s.dot, flexShrink: 0,
        ...(pulse && severity === 'critical' ? {
          animation: 'dude-pulse 1.4s ease-in-out infinite',
        } : {}),
      }} />
      {label ?? s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 02. ROLE BADGE
// ─────────────────────────────────────────────────────────────

const ROLE_MAP: Record<Role, { label: string; color: string }> = {
  superAdmin: { label: 'Super Admin',  color: '#7c3aed' },
  b2bAdmin:   { label: 'B2B Admin',    color: '#0369a1' },
  manager:    { label: 'Manager',      color: '#0f766e' },
  supervisor: { label: 'Supervisor',   color: '#b45309' },
  operator:   { label: 'Operator',     color: '#374151' },
};

export interface RoleBadgeProps { role: Role }

export function RoleBadge({ role }: RoleBadgeProps) {
  const r = ROLE_MAP[role];
  return (
    <span style={font({
      display: 'inline-flex', alignItems: 'center',
      background: `${r.color}25`, color: '#fff',
      border: `1px solid ${r.color}60`,
      padding: '3px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
    })}>
      {r.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 03. BUTTON
// ─────────────────────────────────────────────────────────────

const BTN: Record<BtnVariant, { bg: string; text: string; border: string; hoverBg: string }> = {
  primary: { bg: T.accent,    text: '#fff',   border: 'transparent', hoverBg: T.accentHover },
  danger:  { bg: '#dc2626',   text: '#fff',   border: 'transparent', hoverBg: '#b91c1c' },
  success: { bg: '#059669',   text: '#fff',   border: 'transparent', hoverBg: '#047857' },
  ghost:   { bg: 'transparent', text: T.sub,  border: T.border2,     hoverBg: T.s3 },
  outline: { bg: 'transparent', text: T.accent, border: T.accent,    hoverBg: 'rgba(59,130,246,0.1)' },
};

export interface ButtonProps {
  variant?: BtnVariant;
  size?: Size;
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Button({
  variant = 'primary', size = 'md', children,
  icon, loading = false, disabled = false,
  fullWidth = false, onClick, style,
}: ButtonProps) {
  const [hov, setHov] = useState(false);
  const v = BTN[variant];
  const pad = size === 'sm' ? '6px 14px' : size === 'lg' ? '12px 28px' : '9px 20px';
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={font({
        display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', gap: 7,
        background: hov && !disabled ? v.hoverBg : v.bg,
        color: v.text, border: `1px solid ${v.border}`,
        borderRadius: 8, padding: pad, fontSize: fs, fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background 0.15s, transform 0.1s, opacity 0.15s',
        transform: hov && !disabled ? 'translateY(-1px)' : 'none',
        width: fullWidth ? '100%' : 'auto',
        userSelect: 'none',
        ...style,
      })}
    >
      {loading
        ? <svg width={14} height={14} viewBox="0 0 24 24" style={{ animation: 'dude-spin 0.7s linear infinite', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"
              strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
          </svg>
        : icon && <span style={{ flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      }
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 04. METRIC CARD
// ─────────────────────────────────────────────────────────────

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;       // e.g. "+12%" or "-3s"
  status?: 'normal' | 'warning' | 'critical' | 'success';
  icon?: string;        // emoji
  onClick?: () => void;
}

export function MetricCard({ label, value, unit, trend, status = 'normal', icon, onClick }: MetricCardProps) {
  const [hov, setHov] = useState(false);
  const statusColor = {
    normal: T.accent, warning: T.warning, critical: T.critical, success: T.success,
  }[status];
  const trendUp = trend?.startsWith('+');

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...card({
          borderLeft: `3px solid ${statusColor}`,
          cursor: onClick ? 'pointer' : 'default',
          background: hov && onClick ? T.s2 : T.surface,
          transition: 'background 0.15s',
          minWidth: 140,
        }),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={font({ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 })}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: trend ? 8 : 0 }}>
        <span style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span style={font({ fontSize: 12, color: T.sub })}>{unit}</span>}
      </div>
      {trend && (
        <span style={font({
          fontSize: 11, fontWeight: 600,
          color: trendUp ? T.success : T.critical,
        })}>
          {trend}
        </span>
      )}
    </div>
  );
}

export interface MetricRowProps { metrics: MetricCardProps[] }

export function MetricRow({ metrics }: MetricRowProps) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 05. ALERT ITEM + LIST
// ─────────────────────────────────────────────────────────────

export interface AlertItemProps {
  id?: string;
  severity?: Severity;
  title: string;
  source?: string;
  time?: string;
  incidentId?: string;
  acked?: boolean;
  onAck?: (id?: string) => void;
  onView?: (id?: string) => void;
  onFalseAlarm?: (id?: string) => void;
}

export function AlertItem({
  id, severity = 'critical', title, source, time, incidentId,
  acked: initAcked = false, onAck, onView, onFalseAlarm,
}: AlertItemProps) {
  const [acked, setAcked] = useState(initAcked);
  const s = SEV_MAP[severity];

  return (
    <div className="dude-slide-in" style={{
      display: 'flex', background: T.s2, borderRadius: 10,
      border: `1px solid ${acked ? T.border : s.dot + '40'}`,
      overflow: 'hidden', opacity: acked ? 0.55 : 1,
      transition: 'opacity 0.3s, border-color 0.3s',
    }}>
      {/* Color strip */}
      <div style={{ width: 4, background: s.dot, flexShrink: 0,
        ...(severity === 'critical' && !acked ? { animation: 'dude-blink 2s ease-in-out infinite' } : {}) }} />

      <div style={{ padding: '12px 14px', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <StatusBadge severity={severity} size="sm" pulse={!acked && severity === 'critical'} />
              {incidentId && (
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>{incidentId}</span>
              )}
            </div>
            <div style={font({ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 })}
              className="dude-truncate">{title}</div>
            {source && <div style={font({ fontSize: 12, color: T.sub })}>{source}</div>}
          </div>
          {time && <span style={font({ fontSize: 11, color: T.muted, whiteSpace: 'nowrap', flexShrink: 0 })}>{time}</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!acked && (
            <Button variant="success" size="sm" onClick={() => { setAcked(true); onAck?.(id); }}>
              ✓ รับทราบ
            </Button>
          )}
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(id)}>📷 ดูภาพ</Button>
          )}
          {!acked && onFalseAlarm && (
            <Button variant="ghost" size="sm" onClick={() => { setAcked(true); onFalseAlarm(id); }}>
              ✕ False Alarm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export interface AlertListProps { alerts: AlertItemProps[] }

export function AlertList({ alerts }: AlertListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {alerts.map((a, i) => <AlertItem key={a.id ?? i} {...a} />)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 06. CHAT WINDOW
// ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'dude';
  content: string;
  time?: string;
  iotAction?: string;
  thinking?: boolean;
}

export interface ChatWindowProps {
  messages?: ChatMessage[];
  model?: string;
  onSend: (text: string) => void;
  isThinking?: boolean;
  quickReplies?: string[];
}

export function ChatWindow({
  messages = [], model = 'qwen2.5:3b',
  onSend, isThinking = false,
  quickReplies = ['รายงานวันนี้', 'สถานะกล้อง', 'ประวัติเหตุการณ์'],
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = useCallback(() => {
    const txt = input.trim();
    if (!txt) return;
    onSend(txt);
    setInput('');
  }, [input, onSend]);

  return (
    <div style={card({ display: 'flex', flexDirection: 'column', height: 440, padding: 0, overflow: 'hidden' })}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: T.s2, borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg, ${T.accent}, ${T.info})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🤖</div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 9, height: 9, borderRadius: '50%',
              background: T.success, border: `2px solid ${T.s2}`,
              animation: 'dude-pulse 2s ease-in-out infinite',
            }} />
          </div>
          <div>
            <div style={font({ fontSize: 13, fontWeight: 700, color: T.text })}>DuDe AI</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>{model} · ONLINE</div>
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>Thai-first</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => {
          const isAI = m.role === 'dude';
          return (
            <div key={i} style={{ display: 'flex', flexDirection: isAI ? 'row' : 'row-reverse', gap: 10, alignItems: 'flex-end' }}>
              {isAI && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.info})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                }}>🤖</div>
              )}
              <div style={{ maxWidth: '74%' }}>
                {isAI && (
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>DUDE</div>
                )}
                <div style={font({
                  background: isAI ? T.s3 : T.accent,
                  color: T.text, fontSize: 13, lineHeight: 1.6,
                  padding: '9px 13px',
                  borderRadius: isAI ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                  border: isAI ? `1px solid ${T.border2}` : 'none',
                })}>
                  {m.content}
                  {m.iotAction && (
                    <div style={{
                      marginTop: 8, padding: '5px 10px',
                      background: T.successBg, borderRadius: 6,
                      border: `1px solid ${T.success}40`,
                      fontFamily: T.mono, fontSize: 11, color: T.success,
                    }}>
                      IoT → {m.iotAction}
                    </div>
                  )}
                </div>
                {m.time && (
                  <div style={font({ fontSize: 10, color: T.muted, marginTop: 3, textAlign: isAI ? 'left' : 'right' })}>
                    {m.time}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking indicator */}
        {isThinking && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${T.accent}, ${T.info})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
            <div style={{ background: T.s3, border: `1px solid ${T.border2}`, borderRadius: '4px 12px 12px 12px', padding: '10px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: T.sub, animation: `dude-pulse 1.2s ease-in-out ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && (
        <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: `1px solid ${T.border}` }}>
          {quickReplies.map(q => (
            <button key={q} onClick={() => { setInput(q); }}
              style={font({
                background: T.s3, color: T.sub, border: `1px solid ${T.border2}`,
                borderRadius: 99, padding: '4px 12px', fontSize: 11, cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              })}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = T.text; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = T.sub; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 8, borderTop: `1px solid ${T.border}` }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="พิมพ์คำสั่งภาษาไทย..."
          style={font({
            flex: 1, background: T.s3, border: `1px solid ${T.border2}`,
            borderRadius: 8, padding: '9px 14px', color: T.text, fontSize: 13, outline: 'none',
          })}
        />
        <Button onClick={handleSend} disabled={!input.trim() || isThinking}>ส่ง</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 07. TASK LIST
// ─────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: T.critical, high: T.warning, medium: T.accent, done: T.success, todo: T.muted,
};
const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'URGENT', high: 'HIGH', medium: 'MED', done: 'DONE', todo: 'TODO',
};

export interface TaskItemData {
  id?: string;
  title: string;
  priority?: Priority;
  time?: string;
  checked?: boolean;
}

export interface TaskListProps {
  tasks: TaskItemData[];
  shift?: string;
  operator?: string;
  onChange?: (id: string | undefined, checked: boolean) => void;
}

export function TaskList({ tasks, shift, operator, onChange }: TaskListProps) {
  const [items, setItems] = useState(tasks);

  useEffect(() => { setItems(tasks); }, [tasks]);

  return (
    <div style={card()}>
      {(shift || operator) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 12,
          paddingBottom: 12, borderBottom: `1px solid ${T.border}`,
        }}>
          {shift    && <span style={font({ fontSize: 12, color: T.sub })}>{shift}</span>}
          {operator && <span style={font({ fontSize: 12, color: T.accent, fontWeight: 600 })}>{operator}</span>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((t, i) => {
          const priority = t.priority ?? 'todo';
          const color = PRIORITY_COLOR[priority];
          return (
            <div key={t.id ?? i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: T.s2, borderRadius: 8, padding: '10px 14px',
              border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`,
              opacity: t.checked ? 0.55 : 1, transition: 'opacity 0.2s',
            }}>
              <input
                type="checkbox"
                checked={t.checked ?? false}
                onChange={() => {
                  setItems(prev => prev.map((p, j) => j === i ? { ...p, checked: !p.checked } : p));
                  onChange?.(t.id, !t.checked);
                }}
                style={{ accentColor: T.accent, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={font({
                  fontSize: 13, color: t.checked ? T.muted : T.text,
                  textDecoration: t.checked ? 'line-through' : 'none',
                })} className="dude-truncate">{t.title}</div>
                {t.time && <div style={font({ fontSize: 11, color: T.muted, marginTop: 2 })}>{t.time}</div>}
              </div>
              <span style={{
                fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                color, letterSpacing: '0.06em', flexShrink: 0,
              }}>{PRIORITY_LABEL[priority]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 08. CAMERA NODE MAP
// ─────────────────────────────────────────────────────────────

export interface CameraNodeData {
  id: string;
  label: string;
  status?: CamStatus;
  confidence?: number;
  location?: string;
}

export interface CameraNodeMapProps {
  cameras: CameraNodeData[];
  onSelect?: (cam: CameraNodeData) => void;
  columns?: number;
}

export function CameraNodeMap({ cameras, onSelect, columns = 3 }: CameraNodeMapProps) {
  const [hov, setHov] = useState<string | null>(null);
  const statusColor: Record<CamStatus, string> = {
    normal: T.success, alert: T.warning, critical: T.critical, offline: T.muted,
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
      {cameras.map(cam => {
        const c = statusColor[cam.status ?? 'normal'];
        const isCrit = cam.status === 'critical';
        const isOff  = cam.status === 'offline';

        return (
          <div key={cam.id}
            onClick={() => !isOff && onSelect?.(cam)}
            onMouseEnter={() => setHov(cam.id)}
            onMouseLeave={() => setHov(null)}
            style={{
              background: hov === cam.id && !isOff ? T.s3 : T.s2,
              border: `1px solid ${isCrit ? c : T.border}`,
              borderRadius: 10, padding: 14,
              cursor: isOff ? 'default' : 'pointer',
              transition: 'all 0.15s',
              boxShadow: isCrit ? `0 0 14px ${c}35` : 'none',
              opacity: isOff ? 0.45 : 1,
              position: 'relative', overflow: 'hidden',
            }}
          >
            {isCrit && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 8, height: 8, borderRadius: '50%',
                background: T.critical, animation: 'dude-pulse 1s ease-in-out infinite',
              }} />
            )}
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 6 }}>{cam.id}</div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
            <div style={font({ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 5 })}>{cam.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c,
                animation: !isOff ? 'dude-pulse 2.5s ease-in-out infinite' : 'none' }} />
              <span style={font({ fontSize: 10, color: c, fontWeight: 700, textTransform: 'uppercase' })}>
                {cam.status === 'normal' ? 'LIVE' : (cam.status ?? 'LIVE').toUpperCase()}
              </span>
              {cam.confidence != null && (
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginLeft: 'auto' }}>
                  {cam.confidence}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 09. AI PROPOSAL CARD
// ─────────────────────────────────────────────────────────────

export interface ProposalCardProps {
  id: string;
  title: string;
  description: string;
  current: number;
  proposed: number;
  unit?: string;
  risk?: string;
  evidence?: string[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEvidence?: (id: string) => void;
}

export function ProposalCard({
  id, title, description, current, proposed, unit = '',
  risk, onApprove, onReject, onEvidence,
}: ProposalCardProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const max = Math.max(current, proposed, 1);

  const statusConfig = {
    pending:  { bg: `${T.info}20`,     color: T.info,    label: '💡 รอพิจารณา' },
    approved: { bg: `${T.success}20`,  color: T.success, label: '✅ อนุมัติแล้ว' },
    rejected: { bg: `${T.critical}20`, color: T.critical, label: '❌ ปฏิเสธแล้ว' },
  }[status];

  return (
    <div style={card({ borderLeft: `3px solid ${T.info}` })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>{id}</div>
          <div style={font({ fontSize: 14, fontWeight: 700, color: T.text })}>{title}</div>
        </div>
        <span style={font({
          background: statusConfig.bg, color: statusConfig.color,
          borderRadius: 99, padding: '3px 12px', fontSize: 11, fontWeight: 700,
          border: `1px solid ${statusConfig.color}30`, whiteSpace: 'nowrap',
        })}>
          {statusConfig.label}
        </span>
      </div>

      <p style={font({ fontSize: 12, color: T.sub, marginBottom: 14, lineHeight: 1.6 })}>{description}</p>

      {/* Comparison bars */}
      {[
        { label: 'ปัจจุบัน', value: current, color: T.sub },
        { label: 'เสนอเป็น', value: proposed, color: T.accent },
      ].map(b => (
        <div key={b.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={font({ fontSize: 11, color: b.color })}>{b.label}</span>
            <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: b.color }}>
              {b.value}{unit}
            </span>
          </div>
          <div style={{ background: T.s3, borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${(b.value / max) * 100}%`, height: '100%',
              background: b.color, borderRadius: 4,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}

      {risk && (
        <div style={{
          background: T.warningBg, border: `1px solid ${T.warning}30`,
          borderRadius: 6, padding: '7px 12px', marginBottom: 14,
          fontSize: 11, color: T.warning, ...font(),
        }}>⚠️ {risk}</div>
      )}

      {status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="success" size="sm" onClick={() => { setStatus('approved'); onApprove?.(id); }}>
            ✅ อนุมัติ
          </Button>
          <Button variant="danger" size="sm" onClick={() => { setStatus('rejected'); onReject?.(id); }}>
            ❌ ปฏิเสธ
          </Button>
          {onEvidence && (
            <Button variant="ghost" size="sm" onClick={() => onEvidence(id)}>📊 หลักฐาน</Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. SKILL REGISTRY
// ─────────────────────────────────────────────────────────────

export interface SkillData {
  id: string;
  name: string;
  icon?: string;
  version?: string;
  status: 'loaded' | 'disabled' | 'add';
  onToggle?: (id: string, enabled: boolean) => void;
}

export interface SkillRegistryProps {
  skills: SkillData[];
  onInstall?: () => void;
}

export function SkillRegistry({ skills, onInstall }: SkillRegistryProps) {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(skills.map(s => [s.id, s.status === 'loaded']))
  );

  return (
    <div style={card()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={font({ fontSize: 13, fontWeight: 700, color: T.text })}>🧩 Skill Registry</span>
        <span style={font({ fontSize: 11, color: T.success })}>
          {skills.filter(s => s.status !== 'add').length} installed
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {skills.map(sk => {
          if (sk.status === 'add') {
            return (
              <button key="add" onClick={onInstall} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'transparent', border: `1px dashed ${T.border2}`,
                borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                color: T.muted, width: '100%',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = T.accent;
                (e.currentTarget as HTMLElement).style.color = T.accent;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border2;
                (e.currentTarget as HTMLElement).style.color = T.muted;
              }}>
                <span style={{ fontSize: 20 }}>➕</span>
                <span style={font({ fontSize: 12, fontWeight: 600 })}>ติดตั้งจาก Marketplace</span>
              </button>
            );
          }

          const enabled = states[sk.id] ?? true;
          return (
            <div key={sk.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: T.s2, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '10px 14px',
              opacity: enabled ? 1 : 0.5, transition: 'opacity 0.2s',
            }}>
              <span style={{ fontSize: 22, width: 28, textAlign: 'center', flexShrink: 0 }}>
                {sk.icon ?? '🧩'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={font({ fontSize: 13, fontWeight: 600, color: T.text })}>{sk.name}</div>
                {sk.version && <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>{sk.version}</div>}
              </div>
              {/* Toggle */}
              <div
                onClick={() => {
                  const next = !enabled;
                  setStates(p => ({ ...p, [sk.id]: next }));
                  sk.onToggle?.(sk.id, next);
                }}
                style={{
                  width: 32, height: 18, borderRadius: 9, cursor: 'pointer', position: 'relative',
                  background: enabled ? T.success : T.muted, transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  left: enabled ? 16 : 2,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. SHIFT HANDOVER
// ─────────────────────────────────────────────────────────────

export interface ShiftItem {
  status: 'resolved' | 'pending' | 'warning';
  text: string;
}

export interface ShiftHandoverProps {
  from: string;
  to: string;
  time?: string;
  items?: ShiftItem[];
  onSubmit?: (note: string) => void;
  onSendLine?: () => void;
}

export function ShiftHandover({ from, to, time, items = [], onSubmit, onSendLine }: ShiftHandoverProps) {
  const [note, setNote] = useState('');
  const iconMap = { resolved: '✅', pending: '🔄', warning: '⚠️' };
  const colorMap = { resolved: T.success, pending: T.accent, warning: T.warning };

  return (
    <div style={card()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={font({ fontSize: 14, fontWeight: 700, color: T.text })}>{from} → {to}</div>
        {time && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>{time}</span>}
      </div>
      <div style={font({
        background: T.s3, borderRadius: 6, padding: '6px 10px',
        fontSize: 10, color: T.muted, letterSpacing: '0.06em', marginBottom: 12,
      })}>
        AUTO-GENERATED BY DUDE ✦
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: colorMap[item.status], ...font() }}>
            <span style={{ flexShrink: 0 }}>{iconMap[item.status]}</span>
            <span style={{ color: T.sub, lineHeight: 1.5 }}>{item.text}</span>
          </div>
        ))}
      </div>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="หมายเหตุเพิ่มเติม..."
        rows={2}
        style={font({
          width: '100%', background: T.s3, border: `1px solid ${T.border2}`,
          borderRadius: 8, padding: '9px 12px', color: T.text, fontSize: 12,
          resize: 'vertical', outline: 'none', marginBottom: 12,
        })}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => onSubmit?.(note)}>✓ ส่งเวร</Button>
        <Button variant="ghost" onClick={onSendLine}>📤 ส่ง LINE</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 12. DATA TABLE (Multi-tenant)
// ─────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
  width?: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyText?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns, rows, onRowClick, emptyText = 'ไม่มีข้อมูล',
}: DataTableProps<T>) {
  const [sortCol, setSortCol] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hovRow, setHovRow] = useState<number | null>(null);

  const handleSort = (col: keyof T) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    const v1 = a[sortCol], v2 = b[sortCol];
    if (typeof v1 === 'number' && typeof v2 === 'number')
      return sortDir === 'asc' ? v1 - v2 : v2 - v1;
    return sortDir === 'asc'
      ? String(v1).localeCompare(String(v2))
      : String(v2).localeCompare(String(v1));
  });

  return (
    <div style={card({ padding: 0, overflow: 'hidden' })}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.s2 }}>
            {columns.map(col => (
              <th key={String(col.key)}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={font({
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: 10, fontWeight: 700, color: T.sub,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  borderBottom: `1px solid ${T.border}`,
                  cursor: col.sortable !== false ? 'pointer' : 'default',
                  userSelect: 'none', width: col.width,
                })}
              >
                {col.label}
                {sortCol === col.key && <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={font({
                padding: '24px 16px', textAlign: 'center', color: T.muted, fontSize: 13,
              })}>
                {emptyText}
              </td>
            </tr>
          ) : sorted.map((row, i) => (
            <tr key={i}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={() => setHovRow(i)}
              onMouseLeave={() => setHovRow(null)}
              style={{
                borderBottom: `1px solid ${T.border}`,
                background: hovRow === i && onRowClick ? T.s2 : i % 2 === 1 ? `${T.s2}50` : 'transparent',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
            >
              {columns.map(col => (
                <td key={String(col.key)} style={font({ padding: '12px 16px', fontSize: 13, color: T.text })}>
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 13. FORM ELEMENTS
// ─────────────────────────────────────────────────────────────

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

export function Input({ label, placeholder, value, onChange, type = 'text', error, hint, disabled }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={font({ fontSize: 12, fontWeight: 600, color: T.sub })}>{label}</label>}
      <input
        type={type} value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={font({
          background: T.s2, border: `1px solid ${error ? T.critical : focused ? T.accent : T.border}`,
          borderRadius: 8, padding: '10px 14px', color: T.text, fontSize: 13, outline: 'none',
          transition: 'border-color 0.15s', opacity: disabled ? 0.5 : 1, width: '100%',
        })}
      />
      {error && <span style={font({ fontSize: 11, color: T.critical })}>{error}</span>}
      {hint && !error && <span style={font({ fontSize: 11, color: T.muted })}>{hint}</span>}
    </div>
  );
}

export interface SelectOption { value: string; label: string }
export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function Select({ label, options, value, onChange, disabled }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={font({ fontSize: 12, fontWeight: 600, color: T.sub })}>{label}</label>}
      <select
        value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={font({
          background: T.s2, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '10px 14px', color: T.text,
          fontSize: 13, outline: 'none', opacity: disabled ? 0.5 : 1, width: '100%',
        })}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 14. TAB BAR + FILTER PILLS
// ─────────────────────────────────────────────────────────────

export interface TabItem { id: string; label: string; icon?: string; badge?: number }

export interface TabBarProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div style={{
      display: 'flex', gap: 2, background: T.s2, padding: 4,
      borderRadius: 10, border: `1px solid ${T.border}`,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={font({
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 7,
            background: isActive ? T.accent : 'transparent',
            color: isActive ? '#fff' : T.sub, border: 'none',
            fontSize: 12, fontWeight: isActive ? 700 : 400, cursor: 'pointer',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          })}>
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span style={{
                background: T.critical, color: '#fff',
                borderRadius: 99, padding: '0 5px',
                fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: 'center',
              }}>{tab.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface PillItem { id: string; label: string; count?: number }

export interface FilterPillsProps {
  pills: PillItem[];
  active: string;
  onChange: (id: string) => void;
}

export function FilterPills({ pills, active, onChange }: FilterPillsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {pills.map(p => {
        const isActive = p.id === active;
        return (
          <button key={p.id} onClick={() => onChange(p.id)} style={font({
            padding: '5px 14px', borderRadius: 99,
            background: isActive ? T.accent : T.s2,
            color: isActive ? '#fff' : T.sub,
            border: `1px solid ${isActive ? T.accent : T.border}`,
            fontSize: 12, fontWeight: isActive ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
          })}>
            {p.label}
            {p.count != null && (
              <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>{p.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 15. SECTION HEADER
// ─────────────────────────────────────────────────────────────

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, badge, action }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={font({ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 })}>{title}</h2>
          {badge != null && (
            <span style={font({
              background: `${T.accent}20`, color: T.accent,
              borderRadius: 99, padding: '2px 10px',
              fontSize: 11, fontWeight: 700, border: `1px solid ${T.accent}30`,
            })}>{badge}</span>
          )}
        </div>
        {subtitle && <p style={font({ fontSize: 12, color: T.sub, margin: '4px 0 0' })}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 16. MODAL
// ─────────────────────────────────────────────────────────────

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Modal({ isOpen, onClose, title, children, footer, width = 500 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,12,20,0.85)',
      backdropFilter: 'blur(6px)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dude-slide-in" style={{
        background: T.surface, border: `1px solid ${T.border2}`,
        borderRadius: 14, width: '100%', maxWidth: width,
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
        }}>
          <h3 style={font({ margin: 0, fontSize: 16, fontWeight: 700, color: T.text })}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: T.sub,
            fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4, borderRadius: 6,
            transition: 'color 0.15s',
          }}>✕</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, ...font() }}>{children}</div>
        {footer && (
          <div style={{
            padding: '14px 20px', borderTop: `1px solid ${T.border}`,
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            background: T.s2, borderRadius: '0 0 14px 14px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 17. TOAST
// ─────────────────────────────────────────────────────────────

export interface ToastProps {
  title: string;
  message?: string;
  severity?: Omit<Severity, 'resolved'>;
  onClose?: () => void;
  visible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function Toast({
  title, message, severity = 'info', onClose, visible = true,
  position = 'top-right',
}: ToastProps) {
  if (!visible) return null;

  const colorMap = { critical: T.critical, warning: T.warning, success: T.success, info: T.info };
  const iconMap  = { critical: '🚨', warning: '⚠️', success: '✅', info: 'ℹ️' };
  const c = colorMap[severity as keyof typeof colorMap] ?? T.info;

  const posStyle: CSSProperties = {
    position: 'fixed', zIndex: 10000,
    ...(position.includes('top')    ? { top: 20 }    : { bottom: 20 }),
    ...(position.includes('right')  ? { right: 20 }  : { left: 20 }),
  };

  return (
    <div className="dude-slide-in" style={{
      ...posStyle,
      background: T.s2, border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${c}`, borderRadius: 10,
      padding: '12px 16px', minWidth: 280, maxWidth: 360,
      boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{iconMap[severity as keyof typeof iconMap]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={font({ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: message ? 4 : 0 })}>{title}</div>
        {message && <div style={font({ fontSize: 12, color: T.sub, lineHeight: 1.4 })}>{message}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: T.muted,
          cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0,
        }}>✕</button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 18. TIMELINE
// ─────────────────────────────────────────────────────────────

export interface TimelineEvent {
  time: string;
  title: string;
  description?: string;
  actor?: string;
  status?: 'normal' | 'alert' | 'critical' | 'success';
}

export interface TimelineProps { events: TimelineEvent[] }

export function Timeline({ events }: TimelineProps) {
  const colorMap = { normal: T.accent, alert: T.warning, critical: T.critical, success: T.success };

  return (
    <div>
      {events.map((ev, i) => {
        const isLast = i === events.length - 1;
        const c = colorMap[ev.status ?? 'normal'];
        return (
          <div key={i} style={{ display: 'flex', gap: 16 }}>
            {/* Left: time + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52, flexShrink: 0 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 6, whiteSpace: 'nowrap' }}>
                {ev.time}
              </div>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: T.s2, border: `2px solid ${c}`, zIndex: 1,
              }} />
              {!isLast && <div style={{ width: 2, flex: 1, background: T.border, margin: '4px 0' }} />}
            </div>
            {/* Right: content */}
            <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1, paddingTop: 18 }}>
              <div style={font({ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 3 })}>{ev.title}</div>
              {ev.description && (
                <div style={font({ fontSize: 12, color: T.sub, lineHeight: 1.5, marginBottom: ev.actor ? 6 : 0 })}>
                  {ev.description}
                </div>
              )}
              {ev.actor && (
                <span style={font({
                  display: 'inline-block', padding: '2px 8px',
                  background: T.s3, borderRadius: 4,
                  fontSize: 10, color: T.muted,
                })}>👤 {ev.actor}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 19. SKELETON
// ─────────────────────────────────────────────────────────────

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div className="dude-skeleton" style={{ width, height, borderRadius, ...style }} />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={card({ display: 'flex', flexDirection: 'column', gap: 12 })}>
      <Skeleton width="40%" height={12} />
      <Skeleton width="70%" height={24} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width={`${60 + i * 10}%`} height={12} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 20. AGENT STATUS PANEL (DuDe-specific)
// ─────────────────────────────────────────────────────────────

export interface AgentData {
  name: string;
  port: number;
  type: string;
  status: AgentStatus;
  latency?: number;
  lastSeen?: string;
}

export interface AgentStatusPanelProps {
  agents: AgentData[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function AgentStatusPanel({ agents, onRefresh, refreshing = false }: AgentStatusPanelProps) {
  const statusColor: Record<AgentStatus, string> = {
    ok: T.success, degraded: T.warning, error: T.critical, unknown: T.muted,
  };
  const statusLabel: Record<AgentStatus, string> = {
    ok: 'OK', degraded: 'DEGRADED', error: 'ERROR', unknown: 'UNKNOWN',
  };

  const counts = agents.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1; return acc;
  }, {} as Record<AgentStatus, number>);

  return (
    <div style={card()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={font({ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 })}>
            🤖 Agent Status
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {(Object.entries(counts) as [AgentStatus, number][]).map(([s, n]) => (
              <span key={s} style={font({ fontSize: 11, color: statusColor[s], fontWeight: 600 })}>
                {n} {statusLabel[s]}
              </span>
            ))}
          </div>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} loading={refreshing}>↻ Refresh</Button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {agents.map(ag => {
          const c = statusColor[ag.status];
          return (
            <div key={ag.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: T.s2, borderRadius: 8, padding: '9px 14px',
              border: `1px solid ${ag.status === 'error' ? T.critical + '50' : T.border}`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0,
                animation: ag.status === 'ok' ? 'dude-pulse 3s ease-in-out infinite' : 'none',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={font({ fontSize: 13, fontWeight: 600, color: T.text })}>{ag.name}</div>
                <div style={font({ fontSize: 11, color: T.muted })}>{ag.type} · :{ag.port}</div>
              </div>
              {ag.latency != null && (
                <span style={{ fontFamily: T.mono, fontSize: 11, color: ag.latency > 500 ? T.warning : T.muted }}>
                  {ag.latency}ms
                </span>
              )}
              <span style={font({
                fontSize: 10, fontWeight: 700, color: c,
                letterSpacing: '0.06em',
              })}>{statusLabel[ag.status]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPORTS SUMMARY
// ─────────────────────────────────────────────────────────────
// 01. StatusBadge
// 02. RoleBadge
// 03. Button
// 04. MetricCard, MetricRow
// 05. AlertItem, AlertList
// 06. ChatWindow
// 07. TaskList
// 08. CameraNodeMap
// 09. ProposalCard
// 10. SkillRegistry
// 11. ShiftHandover
// 12. DataTable
// 13. Input, Select
// 14. TabBar, FilterPills
// 15. SectionHeader
// 16. Modal
// 17. Toast
// 18. Timeline
// 19. Skeleton, SkeletonCard
// 20. AgentStatusPanel  ← DuDe-specific, shows all 6 agents
