import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Pencil, Trash2, Calendar, ClipboardCheck, FileText, UserCheck, UserX } from 'lucide-react';

export function ActionMenu({ employee, onViewDetails, onEdit, onDelete, onManageAccount, onViewAttendance, onViewLeave, onViewPerformance, onToggleStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    {
      group: 'Employee',
      items: [
        { label: 'View Details', icon: Eye, onClick: () => { onViewDetails(employee); setOpen(false); } },
        { label: 'Edit', icon: Pencil, onClick: () => { onEdit(employee); setOpen(false); } },
        { label: 'Manage Account', icon: UserCheck, onClick: () => { onManageAccount(employee); setOpen(false); } },
        { label: employee.employment_status === 'active' ? 'Deactivate' : 'Activate', icon: employee.employment_status === 'active' ? UserX : UserCheck, onClick: () => { onToggleStatus(employee); setOpen(false); } },
      ],
    },
    {
      group: 'HR Information',
      items: [
        { label: 'View Attendance', icon: Calendar, onClick: () => { onViewAttendance(employee); setOpen(false); } },
        { label: 'View Leave', icon: ClipboardCheck, onClick: () => { onViewLeave(employee); setOpen(false); } },
        { label: 'View Performance', icon: FileText, onClick: () => { onViewPerformance(employee); setOpen(false); } },
      ],
    },
    {
      group: 'Danger Zone',
      items: [
        { label: 'Delete Employee', icon: Trash2, onClick: () => { onDelete(employee); setOpen(false); }, danger: true },
      ],
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border transition-colors"
        style={{
          borderColor: open ? 'hsl(84 25% 55%)' : 'hsl(45 15% 83%)',
          background: open ? 'hsl(84 20% 93%)' : 'transparent',
          color: 'hsl(90 8% 42%)',
        }}
        title="Actions"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1.5 w-52 rounded-xl overflow-hidden shadow-xl"
          style={{
            background: 'hsl(45 30% 99%)',
            border: '1px solid hsl(45 15% 85%)',
            top: '100%',
          }}
        >
          {actions.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="mx-3 my-1" style={{ height: 1, background: 'hsl(45 15% 90%)' }} />}
              <div className="px-3 pt-2 pb-0.5">
                <p className="font-mono text-[9px] tracking-[0.12em] uppercase" style={{ color: 'hsl(90 8% 58%)' }}>
                  {group.group}
                </p>
              </div>
              {group.items.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors"
                    style={{
                      color: action.danger ? 'hsl(0 65% 45%)' : 'hsl(90 15% 25%)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = action.danger 
                        ? 'hsl(0 55% 96%)' 
                        : 'hsl(84 20% 93%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
