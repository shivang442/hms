import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import {
  Search,
  Stethoscope,
  Award,
  DollarSign,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function DoctorListPage() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSpecializations = async () => {
    try {
      const specs = await doctorService.getSpecializations();
      setSpecializations(specs || []);
    } catch {
      // Ignore
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorService.searchDoctors({
        query: query || undefined,
        specialization: selectedSpec || undefined,
        activeOnly: true,
        page,
        size: 12,
      });
      setDoctors(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [query, selectedSpec, page]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-2">
          Board-Certified Medical Staff
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Find a Doctor & Book Consultation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore specialized departments, view physician credentials, and reserve available appointment slots
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search by physician name or clinical expertise..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Specialization Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => {
              setSelectedSpec('');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedSpec === ''
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Departments
          </button>
          {specializations.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => {
                setSelectedSpec(spec);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedSpec === spec
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Searching specialists...</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No doctors found</h3>
          <p className="text-xs text-slate-500 mt-1">Try refining your search terms or clearing filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-100 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/5 transition-all p-6 flex flex-col justify-between"
            >
              <div>
                {/* Doctor Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-50 to-teal-50 text-sky-700 flex items-center justify-center font-bold text-base border border-sky-100">
                      {doc.fullName.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{doc.fullName}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 mt-1">
                        <Stethoscope className="w-3 h-3 mr-1" />
                        {doc.specialization}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credentials & Details */}
                <div className="space-y-2 mb-4 text-xs">
                  {doc.qualification && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.qualification}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-xs font-semibold text-slate-700">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 text-teal-500 mr-1" />
                      {doc.experienceYears} Years Exp.
                    </span>
                    <span className="flex items-center text-slate-900 font-bold">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 mr-0.5" />
                      ${Number(doc.consultationFee).toFixed(2)}
                    </span>
                  </div>

                  {doc.biography && (
                    <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 pt-1">
                      {doc.biography}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100">
                <Link
                  to={`/book-appointment/${doc.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
