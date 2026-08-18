export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatPaymentDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPaymentDateLong(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatPeriodLabel(payment) {
  if (payment?.period_name) return payment.period_name;
  if (payment?.period_start && payment?.period_end) {
    const start = new Date(`${payment.period_start}T00:00:00`);
    const end = new Date(`${payment.period_end}T00:00:00`);
    const month = start.toLocaleDateString('en-US', { month: 'long' });
    return `${month} ${start.getDate()}–${end.getDate()}`;
  }
  return '—';
}

export function formatPeriodRangeLong(payment) {
  const label = formatPeriodLabel(payment);
  if (!payment?.period_start) return label;
  const year = new Date(`${payment.period_start}T00:00:00`).getFullYear();
  return `${label}, ${year}`;
}

export function formatPaymentReference(payment) {
  if (payment?.payment_reference) return payment.payment_reference;
  if (payment?.receipt_number && payment.status === 'paid') return payment.receipt_number;
  if (payment?.payroll_payment_id) {
    const year = payment.payment_date
      ? new Date(`${payment.payment_date}T00:00:00`).getFullYear()
      : new Date().getFullYear();
    return `PAY-${year}-${String(payment.payroll_payment_id).padStart(4, '0')}`;
  }
  return '—';
}

export function getPaymentMethodLabel(method) {
  return {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    other: 'Other',
  }[method] || method || '—';
}

export function getPaymentMethodStyle(method) {
  if (method === 'bank_transfer') {
    return { bg: 'hsl(200 40% 92%)', text: 'hsl(200 50% 30%)', label: 'Bank Transfer' };
  }
  if (method === 'cash') {
    return { bg: 'hsl(145 35% 93%)', text: 'hsl(145 45% 30%)', label: 'Cash' };
  }
  if (method === 'other') {
    return { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)', label: 'Other' };
  }
  return { bg: 'hsl(0 0% 92%)', text: 'hsl(0 0% 40%)', label: '—' };
}

export function getPaymentStatusStyle(status) {
  if (status === 'pending') {
    return {
      bg: 'hsl(30 50% 90%)',
      text: 'hsl(30 50% 35%)',
      label: 'Pending',
      icon: 'clock',
    };
  }
  return {
    bg: 'hsl(145 35% 93%)',
    text: 'hsl(145 45% 30%)',
    label: 'Paid',
    icon: 'check',
  };
}
