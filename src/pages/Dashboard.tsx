import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Calendar,
  ChevronRight,
  ShieldCheck,
  History
} from 'lucide-react';
import { format, addDays, isBefore, differenceInDays } from 'date-fns';
import { Report } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    active: 0,
    expiring7d: 0,
    expiring3d: 0,
    expired: 0
  });
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!auth.currentUser) return;
    
    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const reports: Report[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as Report);
      });

      const now = new Date();
      const next7d = addDays(now, 7);
      const next3d = addDays(now, 3);

      const newStats = {
        active: 0,
        expiring7d: 0,
        expiring3d: 0,
        expired: 0
      };

      reports.forEach(r => {
        const expiry = r.expiryDate.toDate();
        if (isBefore(expiry, now)) {
          newStats.expired++;
        } else if (isBefore(expiry, next3d)) {
          newStats.expiring3d++;
          newStats.active++;
        } else if (isBefore(expiry, next7d)) {
          newStats.expiring7d++;
          newStats.active++;
        } else {
          newStats.active++;
        }
      });

      setStats(newStats);
      setAllReports(reports.sort((a, b) => a.expiryDate.seconds - b.expiryDate.seconds));
      setIsLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    }
  }

  const elapsedRecords = allReports.filter(r => {
    const days = differenceInDays(r.expiryDate.toDate(), new Date());
    return days < 0;
  });

  if (isLoading && allReports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111]/40">
          <Sparkles className="w-3 h-3" />
          Dashboard v2.0
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-[#111111]">
          Overview
        </h1>
        <p className="text-sm font-medium text-[#111111]/50 max-w-xl leading-relaxed">
          Quick summary of your registered reports and status updates.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Registered Reports', value: allReports.length, icon: ShieldCheck, color: 'bg-blue-50 text-blue-600' },
          { label: 'Elapsed Reports', value: elapsedRecords.length, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
          { label: 'Active Reports', value: stats.active, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 premium-card hover:-translate-y-1"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-6`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#111111]/40">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </section>

      <AnimatePresence>
        {elapsedRecords.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#111111]/5 pb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111]/60 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Elapsed Reports
              </h3>
              <span className="text-[10px] font-bold text-red-600 uppercase">
                Attention Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {elapsedRecords.map((record, i) => {
                const days = Math.abs(differenceInDays(record.expiryDate.toDate(), new Date()));
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 premium-card flex items-start gap-4 border-red-100 bg-red-50/5"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-100 text-red-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-sm truncate uppercase tracking-tight">{record.companyName}</h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-red-600 text-white">
                          {days}D OVERDUE
                        </span>
                      </div>
                      <p className="text-[10px] text-[#111111]/50 font-mono mb-3">Tag: {record.tagId}</p>
                      <div className="text-[10px] text-[#111111]/70 line-clamp-1 italic">
                        {record.notes || 'No notes provided'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {elapsedRecords.length === 0 && !isLoading && (
        <section className="py-20 text-center premium-card rounded-3xl border-dashed">
          <CheckCircle2 className="w-12 h-12 text-green-500/20 mx-auto mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#111111]/40">All reports are current</h3>
          <p className="text-[11px] text-[#111111]/30 mt-2">No elapsed reports detected in the registry.</p>
        </section>
      )}
    </div>
  );
}
