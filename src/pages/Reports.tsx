import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { ClipboardCheck, Plus, Trash2, Edit3, X, Save, Building2, Microscope, User, Mail } from 'lucide-react';
import { Report } from '../types';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    contactPerson: '',
    instrumentList: '',
    calibrationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    expiryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const q = query(collection(db, 'reports'), where('userId', '==', uid), orderBy('expiryDate', 'asc'));
    const reportsSnap = await getDocs(q);

    setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const calDate = formData.calibrationDate ? new Date(formData.calibrationDate) : new Date();
    const expDate = formData.expiryDate ? new Date(formData.expiryDate) : new Date();

    const payload = {
      ...formData,
      calibrationDate: Timestamp.fromDate(isNaN(calDate.getTime()) ? new Date() : calDate),
      expiryDate: Timestamp.fromDate(isNaN(expDate.getTime()) ? new Date() : expDate),
      userId: auth.currentUser.uid
    };

    try {
      setErrorMessage(null);
      const reportPath = editingReport?.id ? `reports/${editingReport.id}` : 'reports';
      if (editingReport?.id) {
        await updateDoc(doc(db, 'reports', editingReport.id), payload);
      } else {
        await addDoc(collection(db, 'reports'), payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      // For UI display, we can be slightly friendlier but still log the JSON
      setErrorMessage(error.message.includes('{') ? 'Insufficient Permissions / Invalid Data' : error.message);
      handleFirestoreError(error, OperationType.WRITE, editingReport?.id ? `reports/${editingReport.id}` : 'reports');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this report record?')) {
      try {
        await deleteDoc(doc(db, 'reports', id));
        loadData();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Calibration Records</h2>
          <p className="text-sm italic opacity-50 font-serif">Comprehensive certificate management</p>
        </div>
        <button 
          onClick={() => {
            setEditingReport(null);
            setErrorMessage(null);
            setFormData({
              companyName: '',
              companyEmail: '',
              contactPerson: '',
              instrumentList: '',
              calibrationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
              expiryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 text-xs font-bold uppercase tracking-wider hover:invert transition-all"
        >
          <Plus className="w-3 h-3" />
          Create New Report
        </button>
      </div>

      <div className="border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_#141414]">
        <table className="w-full text-left">
          <thead className="bg-[#141414] text-[#E4E3E0]">
            <tr>
              <th className="p-4 text-[10px] uppercase font-mono tracking-widest">Company & Contact</th>
              <th className="p-4 text-[10px] uppercase font-mono tracking-widest">Instruments</th>
              <th className="p-4 text-[10px] uppercase font-mono tracking-widest">Calibration Details</th>
              <th className="p-4 text-[10px] uppercase font-mono tracking-widest">Due In</th>
              <th className="p-4 text-[10px] uppercase font-mono tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/10">
            {isLoading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-16 bg-[#141414]/5"></tr>)
            ) : reports.map((report) => {
              const daysLeft = differenceInDays(report.expiryDate.toDate(), new Date());
              return (
                <tr key={report.id} className="hover:bg-[#141414]/5 transition-colors group">
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tight">
                        <Building2 className="w-3 h-3 opacity-30" />
                        {report.companyName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] opacity-60">
                        <User className="w-2.5 h-2.5" />
                        {report.contactPerson || 'No Contact'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] opacity-60 italic">
                        <Mail className="w-2.5 h-2.5" />
                        {report.companyEmail}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-start gap-2">
                       <Microscope className="w-3 h-3 mt-1 opacity-30" />
                       <span className="text-xs font-mono uppercase leading-relaxed max-w-[200px] block truncate" title={report.instrumentList}>
                         {report.instrumentList}
                       </span>
                    </div>
                  </td>
                  <td className="p-4 space-y-1">
                    <p className="text-[10px] font-mono opacity-50 uppercase">Issued: {format(report.calibrationDate.toDate(), 'dd MMM yy')}</p>
                    <p className="text-[10px] font-mono font-bold uppercase">Expires: {format(report.expiryDate.toDate(), 'dd MMM yy')}</p>
                  </td>
                  <td className="p-4">
                    <div className={`text-xs font-bold uppercase px-2 py-1 inline-block ${daysLeft < 0 ? 'bg-red-100 text-red-600' : daysLeft < 7 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {daysLeft < 0 ? 'EXPIRED' : `${daysLeft} DAYS`}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingReport(report);
                          setErrorMessage(null);
                          setFormData({
                            companyName: report.companyName,
                            companyEmail: report.companyEmail,
                            contactPerson: report.contactPerson || '',
                            instrumentList: report.instrumentList,
                            calibrationDate: format(report.calibrationDate.toDate(), "yyyy-MM-dd'T'HH:mm"),
                            expiryDate: format(report.expiryDate.toDate(), "yyyy-MM-dd'T'HH:mm")
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => report.id && handleDelete(report.id)}
                        className="p-1 hover:bg-red-500 hover:text-[#E4E3E0] transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#E4E3E0] border border-[#141414] p-12 shadow-[24px_24px_0px_0px_#141414] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Calibration Record</h3>
                <button onClick={() => { setIsModalOpen(false); setErrorMessage(null); }}><X className="w-6 h-6" /></button>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 bg-red-500 text-white text-xs font-mono uppercase tracking-widest break-words">
                  ERROR: {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1">Company Name</label>
                  <input 
                    required
                    className="w-full bg-white border border-[#141414] px-4 py-3 text-sm focus:outline-none"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1">Contact Person</label>
                    <input 
                      className="w-full bg-white border border-[#141414] px-4 py-3 text-sm focus:outline-none"
                      value={formData.contactPerson}
                      onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1">Company Email</label>
                    <input 
                      required
                      type="email"
                      className="w-full bg-white border border-[#141414] px-4 py-3 text-sm focus:outline-none"
                      value={formData.companyEmail}
                      onChange={e => setFormData({ ...formData, companyEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1">Instrument List</label>
                  <textarea 
                    required
                    placeholder="Enter instrument names (e.g. Micrometer Pro X, Caliper v2...)"
                    className="w-full bg-white border border-[#141414] px-4 py-3 text-sm focus:outline-none h-24"
                    value={formData.instrumentList}
                    onChange={e => setFormData({ ...formData, instrumentList: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1">Calibration Date</label>
                    <input 
                      required
                      type="datetime-local" 
                      className="w-full bg-white border border-[#141414] px-4 py-3 text-sm focus:outline-none"
                      value={formData.calibrationDate}
                      onChange={e => setFormData({ ...formData, calibrationDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1">Expiry Date</label>
                    <input 
                      required
                      type="datetime-local" 
                      className="w-full bg-white border border-[#141414] px-4 py-3 text-sm focus:outline-none"
                      value={formData.expiryDate}
                      onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <button type="submit" className="w-full flex items-center justify-center gap-3 bg-[#141414] text-[#E4E3E0] py-4 px-6 text-sm font-bold uppercase tracking-wider hover:invert transition-all">
                  <Save className="w-4 h-4" /> Save Record
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
