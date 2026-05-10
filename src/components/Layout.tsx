import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  LayoutDashboard, 
  LogOut, 
  Sparkles,
  Settings,
  Circle
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
  user: any;
}

export default function Layout({ children, user }: LayoutProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reports', icon: ClipboardCheck, label: 'Registry' },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#111111] font-sans flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#111111]/5 flex flex-col fixed h-full bg-white z-20">
        <div className="px-10 py-12">
          <h1 className="text-sm font-black tracking-[0.25em] flex items-center gap-3 uppercase text-[#111111]">
            <div className="w-8 h-8 bg-[#111111] text-white flex items-center justify-center rounded-lg">
               <Sparkles className="w-4 h-4" />
            </div>
            Calibrate
          </h1>
        </div>

        <nav className="flex-1 px-6 space-y-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-6 py-4 text-[13px] font-bold transition-all uppercase tracking-widest
                ${isActive ? 'bg-[#111111]/[0.02] text-[#111111]' : 'text-[#111111]/30 hover:text-[#111111]'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="ml-auto w-1 h-1 bg-[#111111] rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#111111]/5 p-0.5">
              <div className="w-full h-full rounded-full bg-[#111111] flex items-center justify-center text-white text-[10px] font-bold uppercase overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="profile" referrerPolicy="no-referrer" />
                ) : (
                  user?.email?.[0] || 'U'
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold truncate leading-tight uppercase tracking-tight">{user?.displayName || 'Merchant Session'}</p>
              <p className="text-[9px] text-[#111111]/40 truncate font-mono">{user?.email}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-[#111111]/40 uppercase tracking-widest hover:text-[#111111] transition-colors">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-[#111111]/40 uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Terminate
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-12 min-h-screen">
        <header className="mb-20 flex justify-end">
           <div className="flex items-center gap-4 py-2 px-4 bg-[#111111]/[0.02] rounded-full border border-[#111111]/5">
              <Circle className="w-2 h-2 text-green-500 fill-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#111111]/40">System Pulse Active</span>
           </div>
        </header>

        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
