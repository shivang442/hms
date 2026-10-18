import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import StatusBadge from '../../components/StatusBadge';
import {
  History,
  Calendar,
  Clock,
  Stethoscope,
  DollarSign,
  FileText,
  User,
  RefreshCw,
} from 'lucide-react';

export default function AppointmentHistoryPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAppointments({
        page,
        size: 10,
      });
      setAppointments(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            Historical Records
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Appointment History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of past and upcoming consultations, clinical notes and booking statuses
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading consultation records...</div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No appointment records found</h3>
            <p className="text-xs text-slate-500 mt-1">Book your first consultation to start your health journal</p>
          </div>
        ) : (
          appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs hover:border-sky-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-50 to-teal-50 text-sky-700 flex items-center justify-center font-bold text-base border border-sky-100 flex-shrink-0">
                  <Calendar className="w-6 h-6 text-sky-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {user?.role === 'PATIENT' ? appt.doctorName : appt.patientName}
                    </h3>
                    <StatusBadge status={appt.status} />
                    <span className="text-[10px] text-slate-400 font-medium">#{appt.id}</span>
                  </div>

                  <p className="text-xs font-semibold text-teal-700">
                    {appt.doctorSpecialization} • Dr. {appt.doctorName?.replace('Dr. ', '')}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {new Date(appt.startTime).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <span className="flex items-center text-slate-700 font-bold">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 mr-0.5" />
                      ${Number(appt.consultationFee).toFixed(2)}
                    </span>
                  </div>

                  {appt.reason && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 max-w-xl">
                      <span className="font-bold text-slate-700">Notes: </span>
                      {appt.reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right text-xs text-slate-400 flex flex-col justify-between self-start md:self-center">
                <span>Booked on {new Date(appt.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex space-x-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
