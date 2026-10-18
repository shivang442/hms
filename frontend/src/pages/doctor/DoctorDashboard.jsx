import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Phone,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, confirmed: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    appointmentId: null,
    targetStatus: '',
    patientName: '',
  });

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const profile = await doctorService.getMyDoctorProfile();
      setDoctorProfile(profile);

      // Fetch today's schedule
      const today = new Date().toISOString().split('T')[0];
      const schedule = await appointmentService.getDoctorDailySchedule(profile.id, today);
      setTodayAppointments(schedule || []);

      // Fetch overall appointment counts
      const allAppts = await appointmentService.getAppointments({ doctorId: profile.id, size: 100 });
      const items = allAppts.content || [];
      setStats({
        total: allAppts.totalElements || 0,
        confirmed: items.filter((a) => a.status === 'CONFIRMED').length,
        completed: items.filter((a) => a.status === 'COMPLETED').length,
        pending: items.filter((a) => a.status === 'PENDING').length,
      });
    } catch (err) {
      setMessage({ text: err.message || 'Failed to load doctor dashboard', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const handleStatusChangeRequest = (appt, targetStatus) => {
    setConfirmDialog({
      isOpen: true,
      appointmentId: appt.id,
      targetStatus,
      patientName: appt.patientName,
    });
  };

  const executeStatusChange = async () => {
    const { appointmentId, targetStatus } = confirmDialog;
    try {
      await appointmentService.updateStatus(appointmentId, targetStatus, `Marked as ${targetStatus} by doctor`);
      setMessage({ text: `Appointment updated to ${targetStatus}!`, type: 'success' });
      setConfirmDialog({ isOpen: false, appointmentId: null, targetStatus: '', patientName: '' });
      fetchDoctorData();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update status', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            Physician Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome, {doctorProfile?.fullName || user?.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specialization: {doctorProfile?.specialization} • Fee: ${Number(doctorProfile?.consultationFee || 0).toFixed(2)}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDoctorData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/doctor/availability"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Manage Availability</span>
          </Link>
        </div>
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

      {/* Doctor Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Today's Consultations"
          value={todayAppointments.length}
          icon={Calendar}
          color="teal"
          subtitle="Scheduled for today"
        />
        <StatCard
          title="Confirmed Appointments"
          value={stats.confirmed}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Ready for consultation"
        />
        <StatCard
          title="Completed Consultations"
          value={stats.completed}
          icon={UserCheck}
          color="blue"
          subtitle="Past finished visits"
        />
        <StatCard
          title="Total Assigned Patients"
          value={stats.total}
          icon={Stethoscope}
          color="indigo"
          subtitle="Lifetime patient visits"
        />
      </div>

      {/* Today's Schedule Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Appointment Schedule</h2>
            <p className="text-xs text-slate-500">Live consultation queue for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <Link
            to="/appointments/manage"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
          >
            View All Assigned →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Time Window</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading schedule...</span>
                    </div>
                  </td>
                </tr>
              ) : todayAppointments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                    No consultations scheduled for today
                  </td>
                </tr>
              ) : (
                todayAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-500" />
                        <span>
                          {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">{appt.patientName}</p>
                      {appt.patientPhone && (
                        <p className="text-[11px] text-slate-400 flex items-center mt-0.5">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          {appt.patientPhone}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-600 max-w-xs truncate font-medium">
                      {appt.reason || 'Routine consultation'}
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={appt.status} />
                    </td>

                    <td className="py-4 px-6 text-right">
                      {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChangeRequest(appt, 'COMPLETED')}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChangeRequest(appt, 'CANCELLED')}
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
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={executeStatusChange}
        title={confirmDialog.targetStatus === 'COMPLETED' ? 'Mark Consultation Completed' : 'Cancel Appointment'}
        message={`Are you sure you want to mark the appointment with ${confirmDialog.patientName} as ${confirmDialog.targetStatus}?`}
        confirmText={confirmDialog.targetStatus === 'COMPLETED' ? 'Mark Completed' : 'Cancel Appointment'}
        danger={confirmDialog.targetStatus === 'CANCELLED'}
      />
    </div>
  );
}
