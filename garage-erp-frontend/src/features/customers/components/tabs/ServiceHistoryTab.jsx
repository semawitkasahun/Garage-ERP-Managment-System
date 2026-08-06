import { Wrench } from 'lucide-react';

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function ServiceHistoryTab({ customer }) {
  // Derive service history from completed work orders
  const completedWOs = (customer.workOrders ?? [])
    .filter(wo => wo.status === 'completed')
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Service History</h3>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>
          {completedWOs.length} completed service{completedWOs.length !== 1 ? 's' : ''} on record
        </p>
      </div>

      {completedWOs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 rounded-xl"
          style={{ background: 'hsl(45 15% 97%)', border: '1px dashed hsl(45 15% 82%)' }}>
          <Wrench className="h-10 w-10" style={{ color: 'hsl(84 20% 65%)' }} />
          <p className="font-medium text-sm" style={{ color: 'hsl(90 12% 28%)' }}>No service history yet</p>
          <p className="text-xs" style={{ color: 'hsl(90 8% 52%)' }}>Completed work orders will appear here</p>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Vertical timeline line */}
          <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: 'hsl(45 15% 87%)' }} />

          <div className="space-y-4">
            {completedWOs.map((wo, i) => {
              const jobCards = wo.jobCards ?? [];
              const services = jobCards.map(jc => jc.description || jc.section?.name || 'Service').filter(Boolean);
              return (
                <div key={wo.work_order_id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-4 flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ background: 'hsl(84 25% 36%)', border: '2px solid hsl(84 20% 89%)' }} />

                  <div className="rounded-xl p-4 ml-2 transition-shadow hover:shadow-sm"
                    style={{ background: 'hsl(45 30% 99%)', border: '1px solid hsl(45 15% 88%)' }}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'hsl(90 12% 18%)' }}>
                          WO-{String(wo.work_order_id).padStart(4, '0')}
                          {wo.vehicle && (
                            <span className="ml-2 font-normal" style={{ color: 'hsl(90 8% 48%)' }}>
                              · {wo.vehicle.make} {wo.vehicle.model}
                              {wo.vehicle.plate_number && ` (${wo.vehicle.plate_number})`}
                            </span>
                          )}
                        </p>
                        {services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {services.slice(0, 4).map((s, si) => (
                              <span key={si} className="text-[11px] rounded-full px-2 py-0.5"
                                style={{ background: 'hsl(84 15% 92%)', color: 'hsl(84 25% 32%)' }}>
                                {s}
                              </span>
                            ))}
                            {services.length > 4 && (
                              <span className="text-[11px] rounded-full px-2 py-0.5"
                                style={{ background: 'hsl(45 15% 92%)', color: 'hsl(90 8% 48%)' }}>
                                +{services.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs" style={{ color: 'hsl(90 8% 48%)' }}>{fmt(wo.completed_at)}</p>
                        <p className="font-mono text-xs mt-0.5" style={{ color: 'hsl(84 30% 36%)', fontWeight: 600 }}>
                          {jobCards.length} job card{jobCards.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
