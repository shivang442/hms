import React from 'react';
import { CheckCircle2, Clock, CheckCheck, XCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'CONFIRMED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          label: 'Confirmed',
        };
      case 'PENDING':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
          label: 'Pending',
        };
      case 'COMPLETED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <CheckCheck className="w-3.5 h-3.5 mr-1" />,
          label: 'Completed',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: null,
          label: status || 'Unknown',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
