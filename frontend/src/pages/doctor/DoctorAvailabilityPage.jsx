import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { availabilityService } from '../../services/availabilityService';
import { Clock, Calendar, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    availableDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30,
  });

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const profile = await doctorService.getMyDoctorProfile();
      setDoctorProfile(profile);

      const list = await availabilityService.getDoctorAvailability(profile.id);
      setAvailabilities(list || []);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to load availability', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      await availabilityService.setAvailability({
        doctorId: doctorProfile.id,
        availableDate: formData.availableDate,
        startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
        endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
        slotDurationMinutes: parseInt(formData.slotDurationMinutes, 10),
      });

      setMessage({ text: 'Consultation shift saved successfully!', type: 'success' });
      fetchAvailability();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to save shift', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
          Consultation Roster
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Availability & Shift Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure active consultation windows and appointment slot intervals for patients
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Set Shift Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs h-fit">
          <h2 className="text-base font-bold text-slate-900 mb-1">Set Consultation Shift</h2>
          <p className="text-xs text-slate-500 mb-4">Define available consultation hours for a date</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Consultation Date *
              </label>
              <input
                type="date"
                required
                name="availableDate"
                value={formData.availableDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  required
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Slot Duration (Minutes)
              </label>
              <select
                name="slotDurationMinutes"
                value={formData.slotDurationMinutes}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="15">15 Minutes</option>
                <option value="20">20 Minutes</option>
                <option value="30">30 Minutes (Recommended)</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Saving Shift...' : 'Save Shift Schedule'}</span>
            </button>
          </form>
        </div>

        {/* Existing Schedules Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Current Consultation Shifts</h2>
            <p className="text-xs text-slate-500">Upcoming days with active booking availability</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Available Date</th>
                  <th className="py-3.5 px-4">Shift Hours</th>
                  <th className="py-3.5 px-4">Slot Size</th>
                  <th className="py-3.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400">
                      Loading schedule windows...
                    </td>
                  </tr>
                ) : availabilities.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 font-medium">
                      No availability shifts configured. Use the form to add consultation windows.
                    </td>
                  </tr>
                ) : (
                  availabilities.map((avail) => (
                    <tr key={avail.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <span>
                            {new Date(avail.availableDate + 'T00:00:00').toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-700">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {avail.startTime?.substring(0, 5)} - {avail.endTime?.substring(0, 5)}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-600">
                        {avail.slotDurationMinutes} mins / slot
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
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
