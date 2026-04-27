/**
 * DuDe SaaS — Design Tokens
 * Single source of truth for all colors, spacing, typography
 * Usage: import { T, injectTheme } from './theme'
 */

export const T = {
  // Backgrounds
  bg:       '#080c14',
  surface:  '#0f1623',
  s2:       '#161f30',
  s3:       '#1e2a3f',
  s4:       '#243347',

  // Borders
  border:   '#1e2d42',
  border2:  '#2a3d58',

  // Accent
  accent:   '#3b82f6',
  accentHover: '#2563eb',
  accentGlow:  'rgba(59,130,246,0.15)',

  // Semantic
  critical: '#ef4444',
  criticalBg: 'rgba(239,68,68,0.12)',
  criticalGlow: 'rgba(239,68,68,0.25)',

  warning:  '#f59e0b',
  warningBg: 'rgba(245,158,11,0.12)',

  success:  '#10b981',
  successBg: 'rgba(16,185,129,0.12)',

  info:     '#6366f1',
  infoBg:   'rgba(99,102,241,0.12)',

  // Text
  text:     '#f0f4ff',
  sub:      '#8896b0',
  muted:    '#4a5878',

  // Font
  font:     "'IBM Plex Sans Thai', Sarabun, 'Noto Sans Thai', sans-serif",
  mono:     "'IBM Plex Mono', 'Fira Code', monospace",
  display:  "'Bebas Neue', 'Anton', sans-serif",
} as const;

export type ThemeKey = keyof typeof T;

/** Inject CSS variables into :root — call once in App.tsx */
export function injectTheme(): void {
  const root = document.documentElement;
  const map: Record<string, string> = {
    '--dude-bg':       T.bg,
    '--dude-surface':  T.surface,
    '--dude-s2':       T.s2,
    '--dude-s3':       T.s3,
    '--dude-s4':       T.s4,
    '--dude-border':   T.border,
    '--dude-border2':  T.border2,
    '--dude-accent':   T.accent,
    '--dude-critical': T.critical,
    '--dude-warning':  T.warning,
    '--dude-success':  T.success,
    '--dude-info':     T.info,
    '--dude-text':     T.text,
    '--dude-sub':      T.sub,
    '--dude-muted':    T.muted,
    '--dude-font':     T.font,
    '--dude-mono':     T.mono,
  };
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));
}

/** Shared card style object — spread into style prop */
export const cardStyle = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: 16,
} as const;

export type Severity = 'critical' | 'warning' | 'success' | 'info' | 'resolved';
export type Role = 'superAdmin' | 'b2bAdmin' | 'manager' | 'supervisor' | 'operator';
export type ButtonVariant = 'primary' | 'danger' | 'success' | 'ghost' | 'outline';
export type Size = 'sm' | 'md' | 'lg';
export type Priority = 'urgent' | 'high' | 'medium' | 'done' | 'todo';
export type CameraStatus = 'normal' | 'alert' | 'critical' | 'offline';
export type AgentStatus = 'ok' | 'degraded' | 'error' | 'unknown';
