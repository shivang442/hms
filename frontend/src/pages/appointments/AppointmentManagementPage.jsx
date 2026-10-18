import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  User,
  RefreshCw,
} from 'lucide-react';

export default function AppointmentManagementPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    appointmentId: null,
    targetStatus: '',
    patientName: '',
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAppointments({
        status: selectedStatus || undefined,
        page,
        size: 10,
      });
      setAppointments(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to fetch appointments', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedStatus, page]);

  const handleActionClick = (appt, status) => {
    setConfirmDialog({
      isOpen: true,
      appointmentId: appt.id,
      targetStatus: status,
      patientName: appt.patientName,
    });
  };

  const executeStatusChange = async () => {
    const { appointmentId, targetStatus } = confirmDialog;
    try {
      await appointmentService.updateStatus(appointmentId, targetStatus, `Updated to ${targetStatus}`);
      setMessage({ text: `Appointment #${appointmentId} status changed to ${targetStatus}!`, type: 'success' });
      setConfirmDialog({ isOpen: false, appointmentId: null, targetStatus: '', patientName: '' });
      fetchAppointments();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update status', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            Operations & Scheduling
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Appointment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor consultation life cycle, manage confirmations, completions and cancellations
          </p>
        </div>

        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-2">
        {['', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setSelectedStatus(status);
              setPage(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedStatus === status
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {status === '' ? 'All Statuses' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">ID & Schedule</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Physician</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading appointments...</span>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                    No appointments found matching this status filter
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block text-xs">
                        #{appt.id} • {new Date(appt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-sky-700 font-semibold flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1 text-sky-500" />
                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800 text-xs">{appt.patientName}</p>
                      <p className="text-[10px] text-slate-400">{appt.patientPhone || 'No phone'}</p>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800 text-xs">{appt.doctorName}</p>
                      <p className="text-[10px] text-teal-700 font-semibold">{appt.doctorSpecialization}</p>
                    </td>

                    <td className="py-4 px-4 text-slate-600 max-w-xs truncate font-medium">
                      {appt.reason || 'Routine consultation'}
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={appt.status} />
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
                            <button
                              type="button"
                              onClick={() => handleActionClick(appt, 'COMPLETED')}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleActionClick(appt, 'CANCELLED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors flex items-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">Archived</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={executeStatusChange}
        title={confirmDialog.targetStatus === 'COMPLETED' ? 'Mark Consultation Completed' : 'Cancel Appointment'}
        message={`Are you sure you want to change the status of appointment #${confirmDialog.appointmentId} (${confirmDialog.patientName}) to ${confirmDialog.targetStatus}?`}
        confirmText={confirmDialog.targetStatus === 'COMPLETED' ? 'Complete' : 'Cancel Appointment'}
        danger={confirmDialog.targetStatus === 'CANCELLED'}
      />
    </div>
  );
}
