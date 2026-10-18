import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { availabilityService } from '../../services/availabilityService';
import { appointmentService } from '../../services/appointmentService';
import {
  Calendar,
  Clock,
  Stethoscope,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  User,
  ShieldCheck,
} from 'lucide-react';

export default function BookAppointmentPage() {
  const { doctorId: initialDoctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId || '');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Date selection (default to tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(defaultDateStr);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch doctors list
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const data = await doctorService.searchDoctors({ activeOnly: true, size: 50 });
        setDoctors(data.content || []);
        if (!selectedDoctorId && data.content?.length > 0) {
          setSelectedDoctorId(String(data.content[0].id));
        }
      } catch {
        setError('Failed to fetch available doctors');
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Sync selected doctor details
  useEffect(() => {
    if (selectedDoctorId) {
      const doc = doctors.find((d) => String(d.id) === String(selectedDoctorId));
      setSelectedDoctor(doc || null);
      setSelectedSlot(null);
    }
  }, [selectedDoctorId, doctors]);

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctorId || !selectedDate) return;
      setLoadingSlots(true);
      setError('');
      try {
        const availableSlots = await availabilityService.getAvailableSlots(selectedDoctorId, selectedDate);
        setSlots(availableSlots || []);
        setSelectedSlot(null);
      } catch (err) {
        setError(err.message || 'Could not load slots for this doctor/date');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available consultation slot');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const booking = await appointmentService.bookAppointment({
        doctorId: parseInt(selectedDoctorId, 10),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim() || 'General medical consultation',
      });

      setBookingSuccess(booking);
    } catch (err) {
      // If double booking / conflict, refresh slots immediately
      setError(err.message || 'Booking conflict encountered. Please select another slot.');
      const availableSlots = await availabilityService.getAvailableSlots(selectedDoctorId, selectedDate);
      setSlots(availableSlots || []);
      setSelectedSlot(null);
    } finally {
      setSubmitting(false);
    }
  };

  const formatSlotTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (bookingSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Booking Confirmed
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
            Consultation Reserved Successfully!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Appointment reference #{bookingSuccess.id}. Confirmation notification has been dispatched.
          </p>
        </div>

        {/* Appointment Confirmation Summary */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Physician:</span>
            <span className="font-bold text-slate-900">{bookingSuccess.doctorName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Specialization:</span>
            <span className="font-semibold text-teal-700">{bookingSuccess.doctorSpecialization}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Appointment Window:</span>
            <span className="font-bold text-slate-900">
              {new Date(bookingSuccess.startTime).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Consultation Fee:</span>
            <span className="font-bold text-emerald-700">
              ${Number(bookingSuccess.consultationFee).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Patient:</span>
            <span className="font-semibold text-slate-800">{bookingSuccess.patientName}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/appointments/history"
            className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors text-center"
          >
            View My Appointments
          </Link>
          <button
            type="button"
            onClick={() => {
              setBookingSuccess(null);
              setSelectedSlot(null);
              setReason('');
            }}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
          >
            Book Another Slot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
          Live Scheduling Portal
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Book Doctor Consultation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select a board-certified physician, choose a verified open time slot, and reserve your consultation instantly
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1 & 2: Doctor and Date Picker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor Selection Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">1</span>
              <span>Select Physician</span>
            </h2>

            {loadingDoctors ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading physicians...</div>
            ) : (
              <div>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-sky-500 shadow-2xs"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fullName} — {doc.specialization} (${Number(doc.consultationFee).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected Doctor Summary Card */}
            {selectedDoctor && (
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {selectedDoctor.fullName.replace('Dr. ', '').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{selectedDoctor.fullName}</h3>
                    <p className="text-xs font-semibold text-teal-700">{selectedDoctor.specialization}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedDoctor.qualification} • {selectedDoctor.experienceYears} Years Exp.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Consultation Fee</p>
                  <p className="text-base font-extrabold text-slate-900">
                    ${Number(selectedDoctor.consultationFee).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Date & Time Slot Selection Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">2</span>
              <span>Choose Consultation Date & Time Slot</span>
            </h2>

            {/* Date Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                Consultation Date
              </label>
              <div className="relative max-w-xs">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Slots Grid */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-2">
                Available Time Slots for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </label>

              {loadingSlots ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                  <span>Computing slot availability...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-center">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-amber-900">No slots available on this date</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Dr. {selectedDoctor?.fullName?.replace('Dr. ', '')} is not scheduled for consultations on this day. Please pick another date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {slots.map((slot, index) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                          !slot.available
                            ? 'bg-slate-100/70 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                            : isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/25 scale-[1.02]'
                            : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80'
                        }`}
                      >
                        <div>{formatSlotTime(slot.startTime)}</div>
                        <span className="text-[9px] block font-normal mt-0.5 opacity-90">
                          {slot.available ? (isSelected ? 'Selected' : 'Open Slot') : 'Booked'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason for Appointment */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                Reason for Consultation / Symptoms
              </label>
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual cardiovascular follow-up, elevated blood pressure, fatigue..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Booking Summary & Final Submit Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 sticky top-24">
            <h2 className="text-base font-bold text-slate-900">Consultation Summary</h2>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-1 flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-slate-800 text-right">{selectedDoctor?.fullName || '—'}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-teal-700 text-right">{selectedDoctor?.specialization || '—'}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-bold text-sky-700 text-right">
                  {selectedSlot
                    ? `${formatSlotTime(selectedSlot.startTime)} - ${formatSlotTime(selectedSlot.endTime)}`
                    : 'Select a slot'}
                </span>
              </div>

              <div className="pt-3 flex justify-between items-center text-sm font-black">
                <span className="text-slate-800">Total Consultation Fee:</span>
                <span className="text-emerald-700 text-base">
                  ${Number(selectedDoctor?.consultationFee || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-[11px] text-sky-800 space-y-1">
              <div className="flex items-center space-x-1 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Concurrency Protection Active</span>
              </div>
              <p className="text-sky-700 text-[10px] leading-relaxed">
                Slots are locked atomically during transaction validation to eliminate double-booking.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Validating & Booking...' : 'Confirm Appointment Booking'}</span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
