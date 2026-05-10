import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { ClipboardCheck, Plus, Trash2, Edit3, X, Save, Building, Microscope, User, Mail, Search } from 'lucide-react';
import { Report } from '../types';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: '',
    tagId: '',
    notes: '',
    calibrationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    expiryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      const q = query(collection(db, 'reports'), where('userId', '==', uid), orderBy('expiryDate', 'asc'));
      const reportsSnap = await getDocs(q);

      setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      setIsLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const calDate = formData.calibrationDate ? new Date(formData.calibrationDate) : new Date();
    const expDate = formData.expiryDate ? new Date(formData.expiryDate) : new Date();

    const payload = {
      ...formData,
      notes: formData.notes || '',
      calibrationDate: Timestamp.fromDate(isNaN(calDate.getTime()) ? new Date() : calDate),
      expiryDate: Timestamp.fromDate(isNaN(expDate.getTime()) ? new Date() : expDate),
      userId: auth.currentUser.uid,
      remindersSent: editingReport?.remindersSent || []
    };

    try {
      setErrorMessage(null);
      if (editingReport?.id) {
        await updateDoc(doc(db, 'reports', editingReport.id), payload);
      } else {
        await addDoc(collection(db, 'reports'), payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      setErrorMessage(error.message.includes('{') ? 'Authorization Failure or Invalid Schema' : error.message);
      handleFirestoreError(error, OperationType.WRITE, editingReport?.id ? `reports/${editingReport.id}` : 'reports');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this record?')) {
      try {
        await deleteDoc(doc(db, 'reports', id));
        loadData();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
      }
    }
  };

  const filteredReports = reports.filter(r => 
    r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.tagId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111]/40">
            <ClipboardCheck className="w-3 h-3" />
            Registry
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">Reports Log</h2>
          <p className="text-sm font-medium text-[#111111]/50 italic">Manage and track your calibration records.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#111111]/30 group-focus-within:text-[#111111] transition-colors" />
            <input 
              type="text"
              placeholder="Search reports..."
              className="bg-white border border-[#111111]/10 rounded-full px-10 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111]/20 w-[200px] transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setEditingReport(null);
              setErrorMessage(null);
              setFormData({
                companyName: '',
                tagId: '',
                notes: '',
                calibrationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                expiryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#111111] text-white px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-[#222222] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Report
          </button>
        </div>
      </div>

      <div className="premium-card rounded-2xl overflow-hidden border-[#111111]/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111111]/[0.02] text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 border-b border-[#111111]/5">
              <th className="px-8 py-5">Company</th>
              <th className="px-8 py-5">Tag / ID</th>
              <th className="px-8 py-5">Validity Period</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111111]/5">
            {isLoading ? (
              [1, 2, 3, 4].map(i => <tr key={i} className="animate-pulse h-24 bg-[#111111]/[0.01]"></tr>)
            ) : filteredReports.map((report) => {
              const daysLeft = differenceInDays(report.expiryDate.toDate(), new Date());
              return (
                <tr key={report.id} className="hover:bg-[#FBFBFA] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold uppercase tracking-tight text-[#111111]">{report.companyName}</div>
                    <div className="text-[10px] text-[#111111]/40 mt-1 font-medium italic truncate max-w-[200px]" title={report.notes}>{report.notes || 'No notes'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-mono font-bold uppercase text-[#111111]/70">
                         {report.tagId}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1 font-mono">
                      <div className="text-[9px] text-[#111111]/30 uppercase font-bold">CAL: {format(report.calibrationDate.toDate(), 'dd/MM/yy')}</div>
                      <div className="text-[10px] text-[#111111] font-bold">DUE: {format(report.expiryDate.toDate(), 'dd/MM/yy')}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded inline-block tracking-tighter ${daysLeft < 0 ? 'bg-red-50 text-red-600' : daysLeft < 7 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'}`}>
                      {daysLeft < 0 ? 'ELAPSED' : `${daysLeft} DAYS LEFT`}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingReport(report);
                          setErrorMessage(null);
                          setFormData({
                            companyName: report.companyName,
                            tagId: report.tagId,
                            notes: report.notes || '',
                            calibrationDate: format(report.calibrationDate.toDate(), "yyyy-MM-dd'T'HH:mm"),
                            expiryDate: format(report.expiryDate.toDate(), "yyyy-MM-dd'T'HH:mm")
                          });
                          setIsModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#111111] hover:text-white transition-all duration-300"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => report.id && handleDelete(report.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && filteredReports.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-xs font-bold text-[#111111]/20 uppercase tracking-widest italic">No matching reports found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-[#FBFBFA]/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="relative w-full max-w-xl bg-white border border-[#111111]/5 p-10 rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-[#111111]">Register Report</h3>
                  <p className="text-xs font-medium text-[#111111]/40 mt-1 uppercase tracking-wider">Calibration Log Submission</p>
                </div>
                <button 
                  onClick={() => { setIsModalOpen(false); setErrorMessage(null); }}
                  className="w-10 h-10 rounded-full bg-[#111111]/5 flex items-center justify-center hover:bg-[#111111] hover:text-white transition-all duration-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMessage && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600 uppercase tracking-tight">
                  {errorMessage}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111]/40 mb-3 ml-1">Company Name</label>
                    <input 
                      required
                      placeholder="Enter company name"
                      className="w-full bg-[#FBFBFA] border border-[#111111]/5 rounded-xl px-5 py-4 text-xs font-semibold focus:outline-none focus:border-[#111111]/20 transition-all placeholder:text-[#111111]/20"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111]/40 mb-3 ml-1">Tag No. / ID</label>
                    <input 
                      required
                      placeholder="e.g. TAG-12345"
                      className="w-full bg-[#FBFBFA] border border-[#111111]/5 rounded-xl px-5 py-4 text-xs font-semibold focus:outline-none focus:border-[#111111]/20 transition-all"
                      value={formData.tagId}
                      onChange={e => setFormData({ ...formData, tagId: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111]/40 mb-3 ml-1">Notes</label>
                    <textarea 
                      placeholder="Additional details..."
                      className="w-full bg-[#FBFBFA] border border-[#111111]/5 rounded-xl px-5 py-4 text-xs font-semibold focus:outline-none focus:border-[#111111]/20 transition-all h-28 resize-none"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111]/40 mb-3 ml-1">Calibration Date</label>
                      <input 
                        required
                        type="datetime-local" 
                        className="w-full bg-[#FBFBFA] border border-[#111111]/5 rounded-xl px-5 py-4 text-[11px] font-semibold focus:outline-none focus:border-[#111111]/20 transition-all"
                        value={formData.calibrationDate}
                        onChange={e => setFormData({ ...formData, calibrationDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111]/40 mb-3 ml-1">Due Date</label>
                      <input 
                        required
                        type="datetime-local" 
                        className="w-full bg-[#FBFBFA] border border-[#111111]/5 rounded-xl px-5 py-4 text-[11px] font-semibold focus:outline-none focus:border-[#111111]/20 transition-all"
                        value={formData.expiryDate}
                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                <button type="submit" className="w-full group relative overflow-hidden bg-[#111111] text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#222222] transition-all transform hover:scale-[1.01] active:scale-[0.98]">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <Save className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    Save Report Record
                  </span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
