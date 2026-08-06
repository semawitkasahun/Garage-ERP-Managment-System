import { Phone, MessageSquare, Mail, MessagesSquare, StickyNote, Plus } from 'lucide-react';

const CHANNEL_CONFIG = {
  call:      { label: 'Phone Call',      icon: Phone,          accent: 'hsl(210 55% 42%)', bg: 'hsl(210 50% 95%)' },
  sms:       { label: 'SMS',             icon: MessageSquare,  accent: 'hsl(84 30% 36%)',  bg: 'hsl(84 20% 95%)' },
  email:     { label: 'Email',           icon: Mail,           accent: 'hsl(265 42% 42%)', bg: 'hsl(265 35% 95%)' },
  whatsapp:  { label: 'WhatsApp',        icon: MessagesSquare, accent: 'hsl(145 45% 34%)', bg: 'hsl(145 35% 95%)' },
  note:      { label: 'Internal Note',   icon: StickyNote,     accent: 'hsl(42 65% 38%)',  bg: 'hsl(42 55% 95%)' },
};

const CHANNEL_LABELS = Object.entries(CHANNEL_CONFIG).map(([key, v]) => ({ key, ...v }));

function fmt(d) {
  return d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function LogEntry({ log }) {
  const channel = CHANNEL_CONFIG[log.channel?.toLowerCase()] ?? CHANNEL_CONFIG.note;
  const Icon = channel.icon;
  return (
    <div className="flex items-start gap-3 py-3.5" style={{ borderBottom: '1px solid hsl(45 15% 91%)' }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
        style={{ background: channel.bg }}>
        <Icon className="h-4 w-4" style={{ color: channel.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold" style={{ color: channel.accent }}>{channel.label}</p>
          <p className="font-mono text-[10px] shrink-0" style={{ color: 'hsl(90 8% 52%)' }}>{fmt(log.created_at)}</p>
        </div>
        {log.subject && (
          <p className="text-sm font-medium mt-0.5" style={{ color: 'hsl(90 12% 18%)' }}>{log.subject}</p>
        )}
        {log.body && (
          <p className="text-sm mt-0.5" style={{ color: 'hsl(90 8% 42%)' }}>{log.body}</p>
        )}
        {log.notes && (
          <p className="text-sm italic mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{log.notes}</p>
        )}
      </div>
    </div>
  );
}

export function CommunicationTab({ customer }) {
  const logs = [...(customer.communicationLogs ?? [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Communication Log</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{logs.length} interaction{logs.length !== 1 ? 's' : ''} on record</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}>
          <Plus className="h-4 w-4" /> Log Interaction
        </button>
      </div>

      {/* Channel filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CHANNEL_LABELS.map(({ key, label, icon: Icon, accent, bg }) => (
          <span key={key} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium cursor-pointer"
            style={{ background: bg, color: accent }}>
            <Icon className="h-3 w-3" /> {label}
          </span>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 rounded-xl"
          style={{ background: 'hsl(45 15% 97%)', border: '1px dashed hsl(45 15% 82%)' }}>
          <MessageSquare className="h-10 w-10" style={{ color: 'hsl(84 20% 65%)' }} />
          <p className="font-medium text-sm" style={{ color: 'hsl(90 12% 28%)' }}>No interactions recorded</p>
          <p className="text-xs" style={{ color: 'hsl(90 8% 52%)' }}>Phone calls, SMS, emails, and notes will appear here</p>
        </div>
      ) : (
        <div className="rounded-xl p-5" style={{ background: 'hsl(45 30% 99%)', border: '1px solid hsl(45 15% 88%)' }}>
          {logs.map((log) => (
            <LogEntry key={log.id ?? log.log_id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
