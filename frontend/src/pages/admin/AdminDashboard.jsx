import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/StatCard';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  Activity,
  PlusCircle,
  FileText,
  ShieldAlert,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, logsData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAuditLogs(0, 6),
      ]);
      setStats(statsData);
      setAuditLogs(logsData?.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Prepare Recharts data
  const statusChartData = stats
    ? [
        { name: 'Confirmed', count: stats.confirmedAppointments, fill: '#10b981' },
        { name: 'Completed', count: stats.completedAppointments, fill: '#0284c7' },
        { name: 'Pending', count: stats.pendingAppointments, fill: '#f59e0b' },
        { name: 'Cancelled', count: stats.cancelledAppointments, fill: '#f43f5e' },
      ]
    : [];

  const specializationChartData = stats?.appointmentsBySpecialization
    ? Object.entries(stats.appointmentsBySpecialization).map(([spec, count]) => ({
        name: spec,
        value: count,
      }))
    : [];

  const PIE_COLORS = ['#0284c7', '#0d9488', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-2">
            Administrator Command Center
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Hospital Overview & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring of patients, clinical staff, schedules and system events
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors flex items-center space-x-1"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>

          <Link
            to="/admin/doctors"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Doctors</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Registered Patients"
          value={stats?.totalPatients}
          icon={Users}
          color="blue"
          subtitle="Hospital patient database"
        />
        <StatCard
          title="Active Doctors on Duty"
          value={stats?.totalDoctors}
          icon={UserCheck}
          color="teal"
          subtitle="Verified specialists"
        />
        <StatCard
          title="Total Appointments"
          value={stats?.totalAppointments}
          icon={Calendar}
          color="indigo"
          subtitle="Lifetime consultations"
        />
        <StatCard
          title="Today's Bookings"
          value={stats?.todayBookings}
          icon={Clock}
          color="emerald"
          subtitle="Scheduled for today"
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Appointment Status Distribution</h2>
              <p className="text-xs text-slate-500">Live breakdown of consultation statuses</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialization Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Appointments by Department</h2>
              <p className="text-xs text-slate-500">Volume across clinical specializations</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            {specializationChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No departmental data recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specializationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {specializationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick Administrative Actions & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Administrative Shortcuts</h2>
          <p className="text-xs text-slate-500 mb-4">Frequently accessed management modules</p>

          <div className="space-y-2.5">
            <Link
              to="/admin/doctors"
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/40 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Doctor Management</p>
                  <p className="text-[11px] text-slate-500">Add, edit, or deactivate specialists</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>

            <Link
              to="/admin/patients"
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/40 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Patient Records</p>
                  <p className="text-[11px] text-slate-500">View demographic & contact profiles</p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>

            <Link
              to="/appointments/manage"
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Hospital Appointments</p>
                  <p className="text-[11px] text-slate-500">Oversee all active bookings</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Live System Audit Stream */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Security & System Audit Log</h2>
              <p className="text-xs text-slate-500">Real-time trace of administrative activities</p>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              View Full Log →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Entity</th>
                  <th className="pb-3">User / Admin</th>
                  <th className="pb-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No recent audit events
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {log.entityType} #{log.entityId || '—'}
                      </td>
                      <td className="py-3 text-slate-600">
                        {log.userName || log.userEmail || `User #${log.userId}`}
                      </td>
                      <td className="py-3 text-right text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
