import { Outlet, NavLink } from 'react-router-dom';
import { Home, Image, Video, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DesignerLayout() {
  const navItems = [
    { path: '/designer/home', icon: Home, label: 'Studio' },
    { path: '/designer/image-gen', icon: Image, label: 'Générateur' },
    { path: '/designer/video-translate', icon: Video, label: 'Traducteur' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Contenu Principal */}
      <main className="pb-24">
        <Outlet />
      </main>

      {/* Navigation Mobile/Desktop (Barre en bas) */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-0 left-0 w-full z-50 px-4 sm:px-6 pb-6 pt-2 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pointer-events-none"
      >
        <div className="max-w-xs mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex justify-between items-center shadow-[0_10px_40px_rgba(0,0,0,0.3)] pointer-events-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300
                ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="designer-nav-indicator"
                      className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.2)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-6 h-6 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-pink-400' : ''}`} />
                  <span className={`text-[10px] font-medium mt-1 relative z-10 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </motion.nav>
    </div>
  );
}
