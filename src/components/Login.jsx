import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirection automatique quand AuthContext a détecté la connexion
  useEffect(() => {
    const checkRoleAndNavigate = async () => {
      if (currentUser) {
        try {
          console.log("🚀 [LOGIN useEffect] Vérification du rôle pour currentUser:", currentUser.id || currentUser.uid);
          // On vérifie manuellement le rôle car userData peut être en retard
          const { data: userDoc, error } = await supabase.from('users').select('role').eq('id', currentUser.id || currentUser.uid).single();
          
          console.log("🚀 [LOGIN useEffect] Résultat BDD:", { userDoc, error });
          
          if (userDoc && userDoc.role && userDoc.role !== 'pending') {
            console.log("🚀 [LOGIN useEffect] Redirection vers:", `/${userDoc.role}/home`);
            navigate(`/${userDoc.role}/home`, { replace: true });
          } else {
            console.log("🚀 [LOGIN useEffect] Redirection vers /role-selection car rôle est pending ou inexistant");
            navigate('/role-selection', { replace: true });
          }
        } catch (e) {
          console.error("❌ [LOGIN useEffect] Erreur récupération rôle :", e);
          navigate('/role-selection', { replace: true });
        }
      }
    };
    checkRoleAndNavigate();
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Connexion avec Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (authError) throw authError;
      
      // 2. Redirection immédiate
      try {
        const { data: userDoc } = await supabase.from('users').select('role').eq('id', data.user.id).single();
        if (userDoc && userDoc.role && userDoc.role !== 'pending') {
          window.location.href = `/${userDoc.role}/home`;
        } else {
          window.location.href = '/role-selection';
        }
      } catch (e) {
        window.location.href = '/role-selection';
      }
      
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setIsLoading(false);
      if (err.message.includes('Invalid login credentials')) {
        setError("L'adresse email ou le mot de passe est incorrect.");
      } else if (err.message.includes('Email not confirmed')) {
        setError("Vous devez confirmer votre adresse email. Vérifiez votre boîte de réception.");
      } else {
        setError(err.message || "Une erreur est survenue lors de la connexion.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 sm:p-10 border-t border-white/20 relative overflow-hidden shadow-2xl">
          {/* Ligne lumineuse en haut de la carte */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent"></div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold mb-2">Bon retour sur <span className="text-gradient">Creatix</span></h2>
            <p className="text-gray-400 text-sm">Connectez-vous pour accéder à votre espace de travail</p>
          </div>

          {error ? (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ Email */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
              </div>
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/50 transition-all text-white placeholder-gray-500"
                placeholder="Adresse email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {/* Champ Mot de passe */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-brand-secondary transition-colors" />
              </div>
              <input 
                type="password" 
                required
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-brand-secondary/50 focus:ring-1 focus:ring-brand-secondary/50 transition-all text-white placeholder-gray-500"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div className="flex justify-end">
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Mot de passe oublié ?</a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 mt-2 rounded-xl font-bold text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span key="loading" className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </span>
              ) : (
                <span key="idle" className="flex items-center justify-center gap-2">
                  <span>Se connecter</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-8">
            Nouveau sur Creatix ? <Link to="/signup" className="text-brand-accent hover:text-white transition-colors">Créez un compte</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
