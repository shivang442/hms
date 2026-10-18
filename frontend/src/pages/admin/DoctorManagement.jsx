import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  UserCheck,
  Search,
  Plus,
  Edit2,
  Power,
  PowerOff,
  Stethoscope,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    specialization: '',
    qualification: '',
    experienceYears: 0,
    consultationFee: '',
    biography: '',
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    doctorId: null,
    action: 'deactivate',
    doctorName: '',
  });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorService.searchDoctors({
        query: query || undefined,
        specialization: selectedSpec || undefined,
        activeOnly,
        page,
        size: 10,
      });
      setDoctors(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to fetch doctors', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const specs = await doctorService.getSpecializations();
      setSpecializations(specs || []);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [query, selectedSpec, activeOnly, page]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      specialization: specializations[0] || 'Cardiology',
      qualification: '',
      experienceYears: 5,
      consultationFee: '150.00',
      biography: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (doc) => {
    setSelectedDoctor(doc);
    setFormData({
      fullName: doc.fullName,
      specialization: doc.specialization,
      qualification: doc.qualification || '',
      experienceYears: doc.experienceYears,
      consultationFee: doc.consultationFee,
      biography: doc.biography || '',
      active: doc.active,
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await doctorService.createDoctor(formData);
      setMessage({ text: 'Doctor onboarded successfully!', type: 'success' });
      setShowAddModal(false);
      fetchDoctors();
      fetchSpecializations();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to add doctor', type: 'error' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await doctorService.updateDoctor(selectedDoctor.id, formData);
      setMessage({ text: 'Doctor profile updated successfully!', type: 'success' });
      setShowEditModal(false);
      fetchDoctors();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update doctor', type: 'error' });
    }
  };

  const handleToggleStatus = (doc) => {
    setConfirmDialog({
      isOpen: true,
      doctorId: doc.id,
      action: doc.active ? 'deactivate' : 'activate',
      doctorName: doc.fullName,
    });
  };

  const executeToggleStatus = async () => {
    const { doctorId, action } = confirmDialog;
    try {
      if (action === 'deactivate') {
        await doctorService.deactivateDoctor(doctorId);
        setMessage({ text: `Dr. ${confirmDialog.doctorName} deactivated`, type: 'success' });
      } else {
        await doctorService.activateDoctor(doctorId);
        setMessage({ text: `Dr. ${confirmDialog.doctorName} reactivated`, type: 'success' });
      }
      setConfirmDialog({ isOpen: false, doctorId: null, action: 'deactivate', doctorName: '' });
      fetchDoctors();
    } catch (err) {
      setMessage({ text: err.message || 'Status update failed', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            Clinical Staff Directory
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Doctor Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain specialist credentials, consultation rates, availability and active status
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Notification Toast */}
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
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by doctor name or specialty..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSpec}
            onChange={(e) => {
              setSelectedSpec(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked);
                setPage(0);
              }}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
            />
            <span>Active Only</span>
          </label>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Doctor Details</th>
                <th className="py-3.5 px-4">Specialization</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Consultation Fee</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading specialists...</span>
                    </div>
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                    No doctors match the selected search criteria
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm border border-teal-100 flex-shrink-0">
                          {doc.fullName.replace('Dr. ', '').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{doc.fullName}</p>
                          <p className="text-[11px] text-slate-400">{doc.email}</p>
                          {doc.qualification && (
                            <p className="text-[10px] text-slate-500 font-medium">{doc.qualification}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                        <Stethoscope className="w-3 h-3 mr-1" />
                        {doc.specialization}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {doc.experienceYears} Years
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900">
                      ${Number(doc.consultationFee).toFixed(2)}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          doc.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {doc.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(doc)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            doc.active
                              ? 'text-rose-500 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={doc.active ? 'Deactivate Doctor' : 'Activate Doctor'}
                        >
                          {doc.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
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

      {/* Add Doctor Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Onboard New Doctor">
        <form onSubmit={handleAddSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Dr. Gregory House"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Email *</label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="house@hospital.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Specialization *</label>
              <input
                type="text"
                required
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="e.g. Cardiology"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Qualifications</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                placeholder="MD, FACC"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Experience (Yrs)</label>
              <input
                type="number"
                min="0"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Consultation Fee ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleInputChange}
                placeholder="150.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Biography</label>
            <textarea
              rows="3"
              name="biography"
              value={formData.biography}
              onChange={handleInputChange}
              placeholder="Background, clinical interests, education..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
            >
              Add Doctor
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Doctor Profile">
        <form onSubmit={handleEditSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Specialization</label>
              <input
                type="text"
                required
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Qualifications</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Experience (Yrs)</label>
              <input
                type="number"
                min="0"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Consultation Fee ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Biography</label>
            <textarea
              rows="3"
              name="biography"
              value={formData.biography}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Activation/Deactivation */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={executeToggleStatus}
        title={confirmDialog.action === 'deactivate' ? 'Deactivate Doctor' : 'Activate Doctor'}
        message={
          confirmDialog.action === 'deactivate'
            ? `Are you sure you want to deactivate Dr. ${confirmDialog.doctorName}? Patients will no longer be able to schedule new appointments with this doctor.`
            : `Are you sure you want to reactivate Dr. ${confirmDialog.doctorName}? The doctor will immediately become available in search and scheduling.`
        }
        confirmText={confirmDialog.action === 'deactivate' ? 'Deactivate' : 'Activate'}
        danger={confirmDialog.action === 'deactivate'}
      />
    </div>
  );
}
