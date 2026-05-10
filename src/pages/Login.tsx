import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Sparkles, LogIn } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full"
      >
        <div className="bg-white border border-[#111111]/5 p-12 rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.02)] border-b-4 border-b-[#111111]/5">
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-[#111111] text-white flex items-center justify-center mx-auto mb-8 rounded-2xl shadow-xl"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tighter mb-3 uppercase text-[#111111]">Calibrate</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111]/30">Precision Monitoring Protocol</p>
          </div>

          <div className="space-y-8">
            <p className="text-[13px] text-center leading-relaxed text-[#111111]/50 font-medium">
              Access the centralized calibration registry and operational fleet management system.
            </p>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full group relative flex items-center justify-center gap-3 bg-[#111111] text-white py-5 px-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-[#222222] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10"
            >
              <LogIn className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              Identify with Google
            </button>
          </div>

          <div className="mt-16 pt-8 border-t border-[#111111]/5 text-[9px] font-bold uppercase text-center space-y-2 tracking-widest text-[#111111]/20">
            <p>© 2026 PRECISION INFRASTRUCTURE</p>
            <p className="flex items-center justify-center gap-2">
              <span className="w-1 h-1 bg-green-500 rounded-full" />
              Secure Environment
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
