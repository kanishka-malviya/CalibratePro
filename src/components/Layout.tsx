import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Building2, 
  Microscope, 
  LayoutDashboard, 
  LogOut, 
  Bell,
  Settings
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
    { to: '/reports', icon: ClipboardCheck, label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 border-right border-[#141414] flex flex-col fixed h-full bg-[#E4E3E0] z-20">
        <div className="p-8 border-bottom border-[#141414]">
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            CALIBRATE PRO
          </h1>
          <p className="text-[10px] font-mono opacity-50 uppercase mt-1 tracking-widest leading-none">
            Precision Reporting System
          </p>
        </div>

        <nav className="flex-1 p-4 py-8 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all group
                ${isActive ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="ml-auto w-1.5 h-1.5 bg-[#E4E3E0] rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-top border-[#141414]">
          <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-[#141414]/5">
            <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center text-[#E4E3E0] text-xs font-bold uppercase overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="profile" referrerPolicy="no-referrer" />
              ) : (
                user?.email?.[0] || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.displayName || 'User'}</p>
              <p className="text-[10px] opacity-50 truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-red-500 hover:text-white transition-colors group"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <header className="mb-12 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-[#141414] rounded-full" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 italic">System Ready</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="p-2 hover:bg-[#141414]/10 transition-colors relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#E4E3E0]" />
             </button>
             <button className="p-2 hover:bg-[#141414]/10 transition-colors">
               <Settings className="w-5 h-5" />
             </button>
          </div>
        </header>

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
