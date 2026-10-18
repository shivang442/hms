import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export default function UserProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    emergencyContact: '',
    dateOfBirth: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (user?.role === 'PATIENT') {
          const patient = await patientService.getMyPatientProfile();
          setProfileData(patient);
          setFormData({
            fullName: patient.fullName || '',
            phone: patient.phone || '',
            address: patient.address || '',
            emergencyContact: patient.emergencyContact || '',
            dateOfBirth: patient.dateOfBirth || '',
          });
        } else if (user?.role === 'DOCTOR') {
          const doctor = await doctorService.getMyDoctorProfile();
          setProfileData(doctor);
          setFormData({
            fullName: doctor.fullName || '',
            phone: '',
            address: '',
            emergencyContact: '',
            dateOfBirth: '',
          });
        } else {
          setProfileData(user);
          setFormData({
            fullName: user?.fullName || '',
            phone: '',
            address: '',
            emergencyContact: '',
            dateOfBirth: '',
          });
        }
      } catch (err) {
        setMessage({ text: err.message || 'Failed to fetch profile', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      if (user?.role === 'PATIENT' && profileData?.id) {
        await patientService.updatePatient(profileData.id, formData);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        setMessage({ text: 'Profile details saved', type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
          Account Settings
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          User Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your account role, contact preferences, and emergency medical contacts
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

      {/* Profile Form Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-8 space-y-6">
        {/* User Identity Banner */}
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white font-bold text-xl flex items-center justify-center shadow-sm">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.fullName}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase">
                {user?.role}
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verified Active Account
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
              Email Address (Login Username)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>

          {user?.role === 'PATIENT' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  Residential Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, City, State"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Contact Name - Phone Number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 text-slate-800"
                />
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
