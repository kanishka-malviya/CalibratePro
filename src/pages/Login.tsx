import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ClipboardCheck, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#E4E3E0] border border-[#141414] p-12 shadow-[16px_16px_0px_0px_#141414]"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#141414] text-[#E4E3E0] flex items-center justify-center mx-auto mb-6">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2 uppercase">CALIBRATE PRO</h1>
          <p className="text-xs font-mono uppercase tracking-widest opacity-50 italic">Internal Management System v1.0</p>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-center leading-relaxed opacity-70">
            Secure portal for calibration report generation and automated reminder management.
          </p>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#141414] text-[#E4E3E0] py-4 px-6 text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
        </div>

        <div className="mt-12 pt-8 border-top border-[#141414] opacity-30 text-[9px] font-mono uppercase text-center space-y-1">
          <p>© 2026 PRECISION MEASUREMENTS LTD</p>
          <p>AUTHORIZED ACCESS ONLY • SYSTEM AUDITED</p>
        </div>
      </motion.div>
    </div>
  );
}
