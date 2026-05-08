import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Send,
  Building2,
  Calendar
} from 'lucide-react';
import { format, addDays, isBefore, differenceInDays } from 'date-fns';
import { Report } from '../types';
import { motion } from 'motion/react';

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
  }

  const handleSendReminders = async () => {
    if (isLoading || stats.expiring7d + stats.expiring3d === 0) {
      alert('No reports are currently due for reminders (7 or 3 days).');
      return;
    }

    try {
      setIsLoading(true);
      const now = new Date();
      const next7d = addDays(now, 7);
      const next3d = addDays(now, 3);

      const toNotify: { id: string; email: string; company: string; instruments: string; type: string; tag: string }[] = [];

      allReports.forEach(r => {
        const expiry = r.expiryDate.toDate();
        const sent = r.remindersSent || [];

        if (isBefore(expiry, now)) {
          // Record is expired
          if (!sent.includes('expired')) {
            toNotify.push({ id: r.id!, email: r.companyEmail, company: r.companyName, instruments: r.instrumentList, type: 'OVERDUE', tag: 'expired' });
          }
        } else if (isBefore(expiry, next3d)) {
          // Due in 3 days
          if (!sent.includes('3d')) {
            toNotify.push({ id: r.id!, email: r.companyEmail, company: r.companyName, instruments: r.instrumentList, type: 'DUE IN 3 DAYS', tag: '3d' });
          }
        } else if (isBefore(expiry, next7d)) {
          // Due in 7 days
          if (!sent.includes('7d')) {
            toNotify.push({ id: r.id!, email: r.companyEmail, company: r.companyName, instruments: r.instrumentList, type: 'DUE IN 7 DAYS', tag: '7d' });
          }
        }
      });

      if (toNotify.length === 0) {
        alert('No unsent reminders found for today. (Reminders are only sent once for each milestone)');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/reminders/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [...new Set(toNotify.map(n => n.email))],
          subject: 'URGENT: Calibration Status Update',
          body: `
            <div style="font-family: sans-serif; padding: 20px; background: #f4f4f4;">
              <h1 style="color: #141414;">Instrument Calibration Alert</h1>
              <p>The following instruments require your immediate attention:</p>
              <ul style="list-style: none; padding: 0;">
                ${toNotify.map(n => `<li style="padding: 15px; background: white; margin-bottom: 10px; border-left: 4px solid #141414; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${n.company}</div>
                  <div style="color: #666; font-size: 14px;">Instruments: ${n.instruments}</div>
                  <div style="color: #ef4444; font-weight: bold; margin-top: 5px;">STATUS: ${n.type}</div>
                </li>`).join('')}
              </ul>
              <p>Please schedule a recalibration session as soon as possible.</p>
            </div>
          `
        })
      });

      const result = await response.json();
      if (result.success) {
        // Update Firestore so we don't send these again
        await Promise.all(toNotify.map(item => {
          const report = allReports.find(ar => ar.id === item.id);
          const newSent = [...(report?.remindersSent || []), item.tag];
          return updateDoc(doc(db, 'reports', item.id), { remindersSent: newSent });
        }));
        
        alert(`Successfully dispatched emails for ${toNotify.length} reports.`);
        loadData(); // Refresh local state
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(`Alert Error: ${error.message === 'RESEND_API_KEY not configured' ? 'RESEND_API_KEY missing in Secrets.' : 'Check logs.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: 'Active Fleet', value: stats.active, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Due in 7 Days', value: stats.expiring7d, icon: Clock, color: 'text-amber-500' },
    { label: 'Due in 3 Days', value: stats.expiring3d, icon: AlertTriangle, color: 'text-orange-600' },
    { label: 'Expired Records', value: stats.expired, icon: AlertTriangle, color: 'text-red-600' },
  ];

  if (isLoading && allReports.length === 0) return <div className="p-8 animate-pulse text-xs font-mono">LOADING SYSTEM REGISTRY...</div>;

  return (
    <div className="space-y-12">
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Fleet Overview</h2>
            <p className="text-sm italic opacity-50 font-serif">Consolidated calibration cycle metrics</p>
          </div>
          <button 
            onClick={handleSendReminders}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 text-xs font-bold uppercase tracking-wider hover:invert hover:scale-105 transition-all disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            Dispatch Due Alerts
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_#141414] active:translate-y-1 active:shadow-none transition-all"
            >
              <stat.icon className={`w-6 h-6 mb-4 ${stat.color}`} />
              <p className="text-4xl font-mono font-bold leading-none mb-1">{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Calibration Timeline
        </h3>
        <div className="border border-[#141414] bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#141414]/5">
              <tr className="border-bottom border-[#141414]">
                <th className="p-4 text-[10px] font-mono uppercase opacity-50">Client</th>
                <th className="p-4 text-[10px] font-mono uppercase opacity-50">Instruments</th>
                <th className="p-4 text-[10px] font-mono uppercase opacity-50">Expiry Date</th>
                <th className="p-4 text-[10px] font-mono uppercase opacity-50">Recalibration Due In</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {allReports.map(report => {
                const daysLeft = differenceInDays(report.expiryDate.toDate(), new Date());
                return (
                  <tr key={report.id} className="border-bottom border-[#141414]/10 hover:bg-[#141414]/5 transition-colors">
                    <td className="p-4 font-bold uppercase">{report.companyName}</td>
                    <td className="p-4 opacity-70 truncate max-w-[300px]">{report.instrumentList}</td>
                    <td className="p-4">{format(report.expiryDate.toDate(), 'dd MMM yyyy')}</td>
                    <td className="p-4">
                      <div className={`px-3 py-1 inline-block font-bold
                        ${daysLeft < 0 ? 'bg-red-500 text-white' : daysLeft < 7 ? 'bg-orange-500 text-white' : 'bg-[#141414]/5 text-[#141414]'}
                      `}>
                        {daysLeft < 0 ? 'OVERDUE' : `${daysLeft} DAYS`}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
