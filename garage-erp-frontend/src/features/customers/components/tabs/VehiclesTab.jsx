import { Car, Plus, Pencil, History, Gauge, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

function VehicleCard({ vehicle, customerId }) {
  return (
    <div className="rounded-xl overflow-hidden transition-shadow hover:shadow-md"
      style={{ border: '1px solid hsl(45 15% 88%)', background: 'hsl(45 30% 99%)' }}>
      {/* Vehicle photo placeholder */}
      <div className="flex items-center justify-center h-36 w-full"
        style={{ background: 'linear-gradient(135deg, hsl(84 15% 93%) 0%, hsl(45 15% 91%) 100%)' }}>
        <Car className="h-14 w-14" style={{ color: 'hsl(84 20% 68%)' }} />
      </div>

      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-display text-base font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>
              {vehicle.make} {vehicle.model}
            </p>
            <p className="text-sm" style={{ color: 'hsl(90 8% 48%)' }}>{vehicle.year ?? '—'}</p>
          </div>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: 'hsl(145 35% 93%)', color: 'hsl(145 40% 32%)' }}>
            Active
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg p-2.5" style={{ background: 'hsl(45 15% 95%)' }}>
            <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(90 8% 52%)' }}>Plate</p>
            <p className="text-xs font-semibold font-mono mt-0.5" style={{ color: 'hsl(90 12% 18%)' }}>{vehicle.plate_number ?? '—'}</p>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: 'hsl(45 15% 95%)' }}>
            <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(90 8% 52%)' }}>Mileage</p>
            <p className="text-xs font-semibold font-mono mt-0.5" style={{ color: 'hsl(90 12% 18%)' }}>
              {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '—'}
            </p>
          </div>
          <div className="col-span-2 rounded-lg p-2.5" style={{ background: 'hsl(45 15% 95%)' }}>
            <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(90 8% 52%)' }}>VIN</p>
            <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'hsl(90 12% 18%)' }}>{vehicle.vin ?? '—'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors"
            style={{ border: '1px solid hsl(45 15% 83%)', color: 'hsl(90 8% 38%)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 94%)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <Link to={`/vehicles/${vehicle.vehicle_id}/history`}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors no-underline"
            style={{ border: '1px solid hsl(45 15% 83%)', color: 'hsl(90 8% 38%)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 94%)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <History className="h-3 w-3" /> History
          </Link>
        </div>
      </div>
    </div>
  );
}

export function VehiclesTab({ customer }) {
  const vehicles = customer.vehicles ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>
            Registered Vehicles
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} on file</p>
        </div>
        <Link
          to={`/customers/${customer.customer_id}/add-vehicle`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white no-underline"
          style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
        >
          <Plus className="h-4 w-4" /> Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 rounded-xl"
          style={{ background: 'hsl(45 15% 97%)', border: '1px dashed hsl(45 15% 82%)' }}>
          <Car className="h-10 w-10" style={{ color: 'hsl(84 20% 65%)' }} />
          <p className="font-medium text-sm" style={{ color: 'hsl(90 12% 28%)' }}>No vehicles registered</p>
          <p className="text-xs" style={{ color: 'hsl(90 8% 52%)' }}>Add a vehicle to start tracking service history</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.vehicle_id} vehicle={v} customerId={customer.customer_id} />
          ))}
        </div>
      )}
    </div>
  );
}
