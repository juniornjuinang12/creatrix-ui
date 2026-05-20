import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BookOpen, MessageCircle, Sparkles, User } from 'lucide-react';

const navItems = [
  { path: '/teacher/home', icon: Home, label: 'Accueil' },
  { path: '/teacher/resources', icon: BookOpen, label: 'Cours' },
  { path: '/teacher/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/teacher/ai-assistant', icon: Sparkles, label: 'Assistant IA' },
  { path: '/teacher/profile', icon: User, label: 'Moi' },
];

export default function TeacherLayout() {
  const location = useLocation();
  const isAIAssistant = location.pathname === '/teacher/ai-assistant';

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 relative overflow-hidden font-['DM_Sans',sans-serif]">
      {/* Background Elements (consistent with the rest of the app) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Area */}
      <div className={`relative z-10 w-full h-full overflow-y-auto ${isAIAssistant ? '' : 'pb-28'}`}>
        <Outlet />
      </div>

      {/* Floating Bottom Navigation (Dock) - Hidden on AI Assistant page */}
      {!isAIAssistant && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-6 h-6 z-10 transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`} />
                  
                  {/* Petit texte qui apparait uniquement si actif */}
                  <span className={`text-[10px] font-bold absolute bottom-2 z-10 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    {item.label}
                  </span>

                  {/* Highlight de fond si actif */}
                  {isActive && (
                    <motion.div 
                      layoutId="bottom-nav-indicator"
                      className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl z-0"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  
                  {/* Glow subtil au dessus de l'icone */}
                  {isActive && (
                    <div className="absolute -top-1 w-6 h-1 bg-indigo-400 rounded-full blur-sm opacity-50" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
