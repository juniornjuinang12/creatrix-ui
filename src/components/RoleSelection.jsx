import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

const roles = [
  {
    id: 'teacher',
    title: 'Enseignant',
    subtitle: 'Formateur & Mentor',
    desc: "Créez un environnement d'apprentissage exceptionnel. Partagez vos ressources, guidez vos étudiants et transformez l'éducation avec l'IA.",
    features: ['Distribution PDF & Cours', 'Chat classe intégré', 'Traduction vidéo HeyGen IA'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#818CF8" className="w-8 h-8 stroke-[1.5px]">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        <line x1="12" y1="6" x2="12" y2="10"/>
        <line x1="10" y1="8" x2="14" y2="8"/>
      </svg>
    ),
    color: '#6366F1',
    bgGradient: 'linear-gradient(135deg,rgba(99,102,241,0.6),rgba(139,92,246,0.3),transparent)',
    iconBg: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(99,102,241,0.05))',
    iconBorder: 'rgba(99,102,241,0.3)',
    pillBg: 'rgba(99,102,241,0.12)',
    pillColor: '#818CF8',
    pillBorder: 'rgba(99,102,241,0.25)',
  },
  {
    id: 'student',
    title: 'Élève',
    subtitle: 'Apprenant & Collaborateur',
    desc: "Accédez à vos cours, connectez-vous avec vos camarades et progressez avec des outils pédagogiques augmentés par l'intelligence artificielle.",
    features: ['Accès illimité aux ressources', 'Chat étudiant & Groupes', 'Contenu traduit par IA'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#22D3EE" className="w-8 h-8 stroke-[1.5px]">
        <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    color: '#06B6D4',
    bgGradient: 'linear-gradient(135deg,rgba(6,182,212,0.6),rgba(20,184,166,0.3),transparent)',
    iconBg: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(6,182,212,0.05))',
    iconBorder: 'rgba(6,182,212,0.3)',
    pillBg: 'rgba(6,182,212,0.12)',
    pillColor: '#22D3EE',
    pillBorder: 'rgba(6,182,212,0.25)',
  },
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isHovered, setIsHovered] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleConfirm = async () => {
    setIsConfirmed(true);
    
    try {
      // On s'assure d'avoir l'utilisateur même si le cache React est lent
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || currentUser;

      if (user) {
        // Mettre à jour (ou insérer si manquant) le rôle dans Supabase
        const { error } = await supabase.from('users').upsert({ 
          id: user.id || user.uid,
          uid: user.id || user.uid,
          role: selectedRole,
          email: user.email,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          avatarColor: 'bg-indigo-500'
        }, { onConflict: 'id' });
        
        if (error) throw error;
      }

      setTimeout(() => {
        // Redirection dure pour nettoyer les états React (PrivateRoute)
        window.location.href = `/${selectedRole}/home`;
      }, 1500);

    } catch (err) {
      console.error("Erreur lors de la mise à jour du rôle :", err);
      setIsConfirmed(false);
    }
  };

  const activeRoleData = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-[#060912] font-['DM_Sans',sans-serif] text-white relative overflow-hidden flex flex-col items-center justify-center py-16 px-6">
      {/* Background canvas */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.08), transparent),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168,85,247,0.05), transparent),
            radial-gradient(ellipse 50% 30% at 10% 70%, rgba(6,182,212,0.05), transparent)
          `
        }}
      />
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 w-full max-w-[860px] flex flex-col items-center">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs font-medium tracking-widest text-[#B4B4FF] uppercase mb-8"
        >
          <motion.div 
            animate={{ scale: [1, 0.85, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
          />
          Compte créé avec succès
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-['Playfair_Display',serif] text-[clamp(42px,6vw,68px)] font-black leading-[1.1] tracking-tight text-center mb-5"
        >
          Quel est votre <em className="not-italic bg-clip-text text-transparent bg-gradient-to-br from-[#818CF8] via-[#C084FC] to-[#67E8F9]">rôle</em> ?
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-slate-400/80 text-base leading-relaxed max-w-[480px] font-light mb-14"
        >
          Chaque profil débloque un espace de travail unique, des outils dédiés et une expérience totalement personnalisée.
        </motion.p>

        {/* Cards */}
        <div className="w-full flex flex-col gap-4">
          {roles.map((role, i) => {
            const isSelected = selectedRole === role.id;
            const isHovering = isHovered === role.id;
            const activeState = isSelected || isHovering;

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + (i * 0.15) }}
                className="w-full relative"
              >
                <div 
                  className="relative rounded-[20px] p-[1.5px] cursor-pointer transition-transform duration-250 ease-out"
                  style={{ transform: activeState ? 'translateY(-2px)' : 'none' }}
                  onClick={() => setSelectedRole(role.id)}
                  onMouseEnter={() => setIsHovered(role.id)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  {/* Glowing border wrapper */}
                  <div 
                    className="absolute inset-0 rounded-[20px] transition-opacity duration-400 ease-out"
                    style={{ 
                      background: role.bgGradient,
                      opacity: activeState ? 1 : 0 
                    }}
                  />
                  
                  {/* Card Inner */}
                  <div 
                    className="relative rounded-[19px] overflow-hidden px-6 sm:px-8 py-7 flex items-center gap-5 sm:gap-7 transition-colors duration-400"
                    style={{
                      background: activeState ? `linear-gradient(135deg, rgba(${hexToRgb(role.color)}, 0.1), rgba(11,15,25,0.9))` : '#0C1120',
                      border: activeState ? '1px solid transparent' : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: activeState ? `0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(${hexToRgb(role.color)}, 0.2)` : 'none'
                    }}
                  >
                    {/* Orb */}
                    <div 
                      className="absolute -right-[60px] -top-[60px] w-[200px] h-[200px] rounded-full blur-[60px] pointer-events-none transition-opacity duration-500"
                      style={{ 
                        background: role.color,
                        opacity: activeState ? 0.5 : 0 
                      }}
                    />

                    {/* Icon */}
                    <div 
                      className="shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[18px] flex items-center justify-center relative transition-transform duration-300 ease-out z-10"
                      style={{ 
                        background: role.iconBg, 
                        border: `1px solid ${role.iconBorder}`,
                        transform: activeState ? 'scale(1.08) rotate(4deg)' : 'none',
                        boxShadow: activeState ? `0 0 20px rgba(${hexToRgb(role.color)}, 0.2)` : 'none'
                      }}
                    >
                      {role.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 z-10">
                      <div className="flex items-center flex-wrap gap-2.5 mb-2">
                        <span className="font-['Playfair_Display',serif] text-xl sm:text-[22px] font-bold text-white">
                          {role.title}
                        </span>
                        <span 
                          className="text-[10px] sm:text-[11px] font-medium tracking-[0.04em] px-3 py-1 rounded-full uppercase"
                          style={{ background: role.pillBg, color: role.pillColor, border: `1px solid ${role.pillBorder}` }}
                        >
                          {role.subtitle}
                        </span>
                        {role.isExclusive && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.06em] px-3 py-1 rounded-full uppercase"
                            style={{ background: 'rgba(168,85,247,0.1)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.3)' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            IA Studio Exclusif
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400/75 leading-[1.65] mb-4 font-light max-w-[520px]">
                        {role.desc}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {role.features.map((feat, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors duration-300"
                            style={{
                              background: activeState ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: activeState ? 'rgba(203,213,225,0.95)' : 'rgba(203,213,225,0.7)'
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: role.color }}></span>
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div 
                      className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] hidden sm:flex items-center justify-center transition-all duration-300 z-10"
                      style={{
                        background: activeState ? role.color : 'rgba(255,255,255,0.04)',
                        border: activeState ? '1px solid transparent' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: activeState ? `0 0 15px rgba(${hexToRgb(role.color)}, 0.4)` : 'none'
                      }}
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke={activeState ? "#fff" : "rgba(148,163,184,0.6)"} 
                        strokeWidth="1.5"
                        className="w-5 h-5 transition-transform duration-300"
                        style={{ transform: activeState ? 'translateX(3px)' : 'none' }}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>

                  </div>
                </div>
                {/* Selection indicator line */}
                <div 
                  className="h-0.5 rounded-sm mx-5 mt-1.5 transition-all duration-400 ease-out origin-center"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${role.color}, transparent)`,
                    opacity: isSelected ? 1 : 0,
                    transform: isSelected ? 'scaleX(1)' : 'scaleX(0)'
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <AnimatePresence>
          {selectedRole && (
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mt-10"
            >
              <button 
                onClick={handleConfirm}
                className="group relative overflow-hidden inline-flex items-center gap-3 px-10 py-4 rounded-full font-['DM_Sans',sans-serif] text-base font-medium text-white border-none cursor-pointer tracking-wide transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${activeRoleData?.color}, ${activeRoleData?.color}99)`,
                  boxShadow: `0 0 40px rgba(${hexToRgb(activeRoleData?.color)}, 0.5), 0 8px 32px rgba(0,0,0,0.4)`,
                  opacity: isConfirmed ? 0.8 : 1,
                  pointerEvents: isConfirmed ? 'none' : 'auto'
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                
                <span className="relative z-10">
                  {isConfirmed ? '✓ Rôle confirmé !' : `Confirmer — ${activeRoleData?.title}`}
                </span>
                
                {!isConfirmed && (
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                    className="relative z-10 w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper to convert hex to rgb string for rgba()
function hexToRgb(hex) {
  if (!hex) return '255,255,255';
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : '255,255,255';
}