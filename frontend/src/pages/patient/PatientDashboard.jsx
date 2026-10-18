import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { patientService } from '../../services/patientService';
import StatusBadge from '../../components/StatusBadge';
import {
  Calendar,
  Clock,
  Search,
  PlusCircle,
  Stethoscope,
  Phone,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [patientProfile, setPatientProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profile, appts] = await Promise.all([
          patientService.getMyPatientProfile(),
          appointmentService.getAppointments({ size: 5 }),
        ]);
        setPatientProfile(profile);
        setAppointments(appts.content || []);
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-sky-600/20 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-3">
            Patient Health Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {patientProfile?.fullName || user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 mt-2 leading-relaxed">
            Manage your medical appointments, discover board-certified doctors, and track your clinical consultations.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/doctors"
              className="px-4 py-2.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs shadow-md transition-colors flex items-center space-x-2"
            >
              <Search className="w-4 h-4 text-sky-600" />
              <span>Find Doctors</span>
            </Link>
            <Link
              to="/book-appointment"
              className="px-4 py-2.5 rounded-xl bg-teal-500/80 hover:bg-teal-500 text-white font-bold text-xs backdrop-blur-md transition-colors flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>

        {/* Ambient Decorative Graphic */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-8 text-white/10 pointer-events-none">
          <Stethoscope className="w-64 h-64" />
        </div>
      </div>

      {/* Grid: Upcoming Appointments & Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Consultations */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Appointments</h2>
              <p className="text-xs text-slate-500">Scheduled clinical consultations</p>
            </div>
            <Link
              to="/appointments/history"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              View All History →
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No upcoming consultations</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">
                Schedule a consultation with one of our certified specialists
              </p>
              <Link
                to="/doctors"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center space-x-1"
              >
                <span>Browse Specialists</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 font-bold text-sm">
                      {appt.doctorName?.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{appt.doctorName}</p>
                      <p className="text-[11px] text-teal-700 font-semibold">{appt.doctorSpecialization}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(appt.startTime).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <StatusBadge status={appt.status} />
                    <Link
                      to="/appointments/history"
                      className="text-xs font-bold text-sky-600 hover:underline px-2 py-1"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient Profile & Health Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Patient Profile Card</h2>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Full Name</span>
              <span className="font-bold text-slate-800 text-sm">{patientProfile?.fullName}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Registered Email</span>
              <span className="font-semibold text-slate-700">{patientProfile?.email}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone</span>
              <span className="font-semibold text-slate-700">{patientProfile?.phone || 'Not added'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Emergency Contact</span>
              <span className="font-semibold text-rose-700">{patientProfile?.emergencyContact || 'None listed'}</span>
            </div>
          </div>

          <Link
            to="/profile"
            className="block w-full py-2.5 text-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
          >
            Edit Health Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
