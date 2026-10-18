import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/patientService';
import Modal from '../../components/Modal';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Detail Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.searchPatients({
        query: query || undefined,
        page,
        size: 10,
      });
      setPatients(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to fetch patients', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [query, page]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
            Patient Registry
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Patient Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access demographic information, verified contact details and emergency contacts
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search patient by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Date of Birth</th>
                <th className="py-3.5 px-4">Emergency Contact</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading patient records...</span>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                    No patient records found
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-100">
                          {patient.fullName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{patient.fullName}</p>
                          <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <Mail className="w-3 h-3 inline mr-1 text-slate-400" />
                            {patient.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {patient.phone ? (
                        <span className="flex items-center text-slate-600">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {patient.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {patient.dateOfBirth ? (
                        <span className="flex items-center text-slate-600">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {patient.dateOfBirth}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {patient.emergencyContact || '—'}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 text-slate-600 font-semibold text-xs transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>View</span>
                      </button>
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

      {/* Patient Profile Detail Modal */}
      {selectedPatient && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Patient Record: ${selectedPatient.fullName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-bold text-base flex items-center justify-center">
                {selectedPatient.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">{selectedPatient.fullName}</p>
                <p className="text-slate-500">{selectedPatient.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                  Patient ID #{selectedPatient.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date of Birth</span>
                <span className="font-semibold text-slate-800">{selectedPatient.dateOfBirth || 'Not provided'}</span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Phone Number</span>
                <span className="font-semibold text-slate-800">{selectedPatient.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Residential Address</span>
              <span className="font-semibold text-slate-800">{selectedPatient.address || 'No address registered'}</span>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-rose-500 block mb-1">Emergency Contact</span>
              <span className="font-semibold text-rose-900">{selectedPatient.emergencyContact || 'No emergency contact registered'}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
