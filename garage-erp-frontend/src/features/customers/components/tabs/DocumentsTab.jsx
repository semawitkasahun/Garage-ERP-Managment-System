import { Upload, Download, Trash2, FileText, Shield, Car, FileCheck, Paperclip } from 'lucide-react';

const DOC_CATEGORIES = [
  { key: 'driver_license',       label: "Driver's License",      icon: FileCheck, accent: 'hsl(210 55% 42%)', bg: 'hsl(210 50% 95%)' },
  { key: 'insurance',            label: 'Insurance',             icon: Shield,    accent: 'hsl(84 30% 36%)',  bg: 'hsl(84 20% 95%)' },
  { key: 'vehicle_registration', label: 'Vehicle Registration',  icon: Car,       accent: 'hsl(265 42% 42%)', bg: 'hsl(265 35% 95%)' },
  { key: 'contract',             label: 'Contracts',             icon: FileText,  accent: 'hsl(42 65% 38%)',  bg: 'hsl(42 55% 95%)' },
  { key: 'attachment',           label: 'Attachments',           icon: Paperclip, accent: 'hsl(22 65% 38%)',  bg: 'hsl(22 55% 95%)' },
];

function DocCategory({ category, docs }) {
  const Icon = category.icon;
  return (
    <div className="rounded-xl p-4" style={{ background: 'hsl(45 30% 99%)', border: '1px solid hsl(45 15% 88%)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: category.bg }}>
            <Icon className="h-4 w-4" style={{ color: category.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'hsl(90 12% 18%)' }}>{category.label}</p>
            <p className="text-[10px]" style={{ color: 'hsl(90 8% 52%)' }}>{docs.length} file{docs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{ border: '1px solid hsl(45 15% 83%)', color: 'hsl(90 8% 42%)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 93%)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
          <Upload className="h-3 w-3" /> Upload
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-lg border-dashed border-2 py-6 flex flex-col items-center gap-1.5"
          style={{ borderColor: 'hsl(45 15% 85%)' }}>
          <Icon className="h-6 w-6" style={{ color: 'hsl(45 15% 72%)' }} />
          <p className="text-xs" style={{ color: 'hsl(90 8% 58%)' }}>No {category.label.toLowerCase()} uploaded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.document_id ?? doc.id} className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: 'hsl(45 15% 96%)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(90 8% 52%)' }} />
                <p className="text-sm truncate" style={{ color: 'hsl(90 12% 22%)' }}>{doc.file_name ?? doc.title ?? 'Document'}</p>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button title="Download" className="rounded p-1 transition-colors" style={{ color: 'hsl(210 55% 42%)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(210 50% 93%)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button title="Delete" className="rounded p-1 transition-colors" style={{ color: 'hsl(0 58% 44%)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(0 55% 96%)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentsTab({ customer }) {
  // Documents would come from a separate API call; for now use empty arrays
  const docs = [];

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Documents</h3>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>Customer documents and attachments</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DOC_CATEGORIES.map((cat) => (
          <DocCategory
            key={cat.key}
            category={cat}
            docs={docs.filter(d => d.category === cat.key)}
          />
        ))}
      </div>
    </div>
  );
}
