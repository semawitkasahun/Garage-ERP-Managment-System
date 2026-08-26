export const SERVICE_CATEGORIES = [
  {
    id: 'engine',
    name: 'Engine',
    icon: 'Engine',
    color: 'bg-red-100 text-red-800',
    services: [
      'Engine Oil Change',
      'Engine Diagnostics',
      'Engine Repair',
      'Timing Belt Replacement',
      'Head Gasket Replacement',
      'Engine Overhaul',
    ],
  },
  {
    id: 'oil_lubrication',
    name: 'Oil & Lubrication',
    icon: 'Droplets',
    color: 'bg-amber-100 text-amber-800',
    services: [
      'Oil Change',
      'Oil Filter Replacement',
      'Fluid Top-up',
      'Lubrication Service',
    ],
  },
  {
    id: 'brakes',
    name: 'Brakes',
    icon: 'Circle',
    color: 'bg-blue-100 text-blue-800',
    services: [
      'Brake Inspection',
      'Brake Pad Replacement',
      'Brake Disc Replacement',
      'Brake Fluid Change',
      'Brake Line Repair',
      'ABS System Service',
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: 'Zap',
    color: 'bg-yellow-100 text-yellow-800',
    services: [
      'Battery Replacement',
      'Alternator Repair',
      'Starter Motor Repair',
      'Wiring Repair',
      'Light System Repair',
      'Electrical Diagnostics',
    ],
  },
  {
    id: 'battery',
    name: 'Battery',
    icon: 'Battery',
    color: 'bg-green-100 text-green-800',
    services: [
      'Battery Testing',
      'Battery Replacement',
      'Battery Charging',
      'Battery Cable Repair',
    ],
  },
  {
    id: 'ac_cooling',
    name: 'AC / Cooling',
    icon: 'Snowflake',
    color: 'bg-cyan-100 text-cyan-800',
    services: [
      'AC Inspection',
      'AC Recharge',
      'Compressor Replacement',
      'Coolant Flush',
      'Radiator Repair',
      'Thermostat Replacement',
    ],
  },
  {
    id: 'tires_wheels',
    name: 'Tires & Wheels',
    icon: 'Circle',
    color: 'bg-purple-100 text-purple-800',
    services: [
      'Tire Rotation',
      'Tire Balancing',
      'Wheel Alignment',
      'Tire Replacement',
      'Wheel Repair',
      'Tire Pressure Check',
    ],
  },
  {
    id: 'suspension',
    name: 'Suspension',
    icon: 'Car',
    color: 'bg-orange-100 text-orange-800',
    services: [
      'Shock Absorber Replacement',
      'Strut Replacement',
      'Spring Replacement',
      'Suspension Inspection',
      'Control Arm Replacement',
      'Ball Joint Replacement',
    ],
  },
  {
    id: 'transmission',
    name: 'Transmission',
    icon: 'Settings',
    color: 'bg-pink-100 text-pink-800',
    services: [
      'Transmission Fluid Change',
      'Transmission Repair',
      'Clutch Replacement',
      'Transmission Rebuild',
      'Differential Service',
    ],
  },
  {
    id: 'body_exterior',
    name: 'Body / Exterior',
    icon: 'Car',
    color: 'bg-indigo-100 text-indigo-800',
    services: [
      'Paint Touch-up',
      'Dent Repair',
      'Scratch Repair',
      'Body Panel Replacement',
      'Window Replacement',
      'Door Handle Repair',
    ],
  },
  {
    id: 'diagnostics',
    name: 'Diagnostics',
    icon: 'Search',
    color: 'bg-gray-100 text-gray-800',
    services: [
      'Computer Diagnostics',
      'Scan Tool Analysis',
      'Performance Testing',
      'Emission Testing',
      'Road Test',
    ],
  },
  {
    id: 'preventive_maintenance',
    name: 'Preventive Maintenance',
    icon: 'Shield',
    color: 'bg-teal-100 text-teal-800',
    services: [
      'Scheduled Maintenance',
      'Multi-point Inspection',
      'Preventive Service',
      'Seasonal Service',
      'Fleet Maintenance',
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'MoreHorizontal',
    color: 'bg-gray-100 text-gray-800',
    services: [
      'Custom Service',
      'Emergency Repair',
      'Walk-in Service',
      'Consultation',
    ],
  },
];

export const JOB_CARD_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: 'Clock' },
  { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-800', icon: 'User' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: 'Play' },
  { value: 'waiting_for_parts', label: 'Waiting for Parts', color: 'bg-yellow-100 text-yellow-800', icon: 'Package' },
  { value: 'waiting_for_approval', label: 'Waiting for Approval', color: 'bg-orange-100 text-orange-800', icon: 'AlertCircle' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: 'CheckCircle' },
  { value: 'quality_check', label: 'Quality Check', color: 'bg-amber-100 text-amber-800', icon: 'Shield' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-800', icon: 'CheckCircle' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: 'XCircle' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-gray-100 text-gray-800', icon: 'Pause' },
];

export const JOB_CARD_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

export const getCategoryForService = (serviceName) => {
  for (const category of SERVICE_CATEGORIES) {
    if (category.services.some(service => 
      service.toLowerCase().includes(serviceName.toLowerCase()) ||
      serviceName.toLowerCase().includes(service.toLowerCase())
    )) {
      return category;
    }
  }
  return SERVICE_CATEGORIES.find(cat => cat.id === 'other');
};

export const getServicesByCategory = (categoryId) => {
  const category = SERVICE_CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.services : [];
};