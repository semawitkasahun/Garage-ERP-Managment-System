import { useState } from 'react';
import { StickyNote, Save, Plus } from 'lucide-react';

const PRESET_EXAMPLES = [
  'Customer prefers OEM parts.',
  'Always call before repairs over ETB 15,000.',
  'Fleet account with monthly billing.',
  'Prefers morning appointments (before 10am).',
  'Do not contact via SMS — email only.',
];

export function NotesTab({ customer }) {
  const [noteText, setNoteText] = useState(customer.notes ?? '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In a real implementation this would call the update API
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Staff Notes</h3>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>
          Private notes visible only to staff. Not shared with the customer.
        </p>
      </div>

      {/* Editor */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid hsl(45 15% 88%)' }}>
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ background: 'hsl(45 15% 97%)', borderBottom: '1px solid hsl(45 15% 89%)' }}>
          <div className="flex items-center gap-2">
            <StickyNote className="h-3.5 w-3.5" style={{ color: 'hsl(42 65% 40%)' }} />
            <span className="text-xs font-medium" style={{ color: 'hsl(90 12% 30%)' }}>Customer Notes</span>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: saved ? 'hsl(145 40% 36%)' : 'hsl(84 25% 32%)' }}
          >
            <Save className="h-3 w-3" />
            {saved ? 'Saved!' : 'Save Notes'}
          </button>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 text-sm outline-none resize-none"
          style={{ background: 'hsl(45 30% 99%)', color: 'hsl(90 12% 18%)', lineHeight: 1.7 }}
          placeholder="Add private notes about this customer…"
        />
      </div>

      {/* Quick templates */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-3 w-3" style={{ color: 'hsl(90 8% 52%)' }} />
          <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'hsl(90 8% 52%)' }}>Quick Add</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_EXAMPLES.map((note) => (
            <button
              key={note}
              onClick={() => setNoteText((t) => t ? `${t}\n${note}` : note)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{ background: 'hsl(84 15% 93%)', color: 'hsl(84 30% 32%)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 20% 88%)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(84 15% 93%)'; }}
            >
              + {note}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
