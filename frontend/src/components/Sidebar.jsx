import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Calendar,
  Clock,
  History,
  ShieldAlert,
  Search,
  PlusCircle,
  Bell,
  User,
  X,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;

  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/doctors', label: 'Doctor Management', icon: UserCheck },
          { to: '/admin/patients', label: 'Patient Records', icon: Users },
          { to: '/appointments/manage', label: 'All Appointments', icon: Calendar },
          { to: '/appointments/history', label: 'Appointment History', icon: History },
          { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
        ];
      case 'DOCTOR':
        return [
          { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/appointments/manage', label: 'Assigned Appointments', icon: Calendar },
          { to: '/doctor/availability', label: 'Availability & Slots', icon: Clock },
          { to: '/appointments/history', label: 'Appointment History', icon: History },
          { to: '/profile', label: 'Doctor Profile', icon: User },
        ];
      case 'PATIENT':
        return [
          { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/doctors', label: 'Find Doctors', icon: Search },
          { to: '/book-appointment', label: 'Book Appointment', icon: PlusCircle },
          { to: '/appointments/history', label: 'My Appointments', icon: History },
          { to: '/notifications', label: 'Notifications', icon: Bell },
          { to: '/profile', label: 'My Profile', icon: User },
        ];
      default:
        return [
          { to: '/doctors', label: 'Find Doctors', icon: Search },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 left-0 z-50 md:z-30 w-64 h-full md:h-[calc(100vh-4rem)] bg-white border-r border-slate-100 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100">
          <span className="font-bold text-slate-800 text-sm">Navigation</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Menu
          </p>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-sky-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-700">Hospital Hotline</p>
            <p className="text-xs font-semibold text-sky-600 mt-0.5">+1 (800) 467-7482</p>
            <p className="text-[10px] text-slate-400 mt-1">24/7 Emergency Support</p>
          </div>
        </div>
      </aside>
    </>
  );
}
