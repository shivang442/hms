import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import {
  Bell,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getUserNotifications(page, 15);
      setNotifications(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n))
      );
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
    } catch {
      // Ignore
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT_BOOKED':
      case 'APPOINTMENT_CONFIRMED':
        return <Calendar className="w-5 h-5 text-teal-600" />;
      case 'APPOINTMENT_CANCELLED':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'APPOINTMENT_COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            Notification Center
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Alerts & System Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stay updated with appointment confirmations, schedule changes, and hospital updates
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">You're all caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">No notifications found in your inbox</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-3xl border transition-all flex items-start justify-between gap-4 ${
                notif.status === 'UNREAD'
                  ? 'bg-white border-sky-200 shadow-sm shadow-sky-500/5'
                  : 'bg-white/80 border-slate-100 text-slate-500'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getNotifIcon(notif.notificationType)}
                </div>
                <div>
                  <p className={`text-xs leading-relaxed ${notif.status === 'UNREAD' ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(notif.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {notif.status === 'UNREAD' && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Mark read
                </button>
              )}
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
