import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🚀 [SIGNUP] Début de l'inscription pour:", formData.email);
      
      // 1. Créer l'utilisateur dans Supabase Auth
      console.log("🚀 [SIGNUP] Appel supabase.auth.signUp...");
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      console.log("🚀 [SIGNUP] Résultat supabase.auth.signUp:", { data, authError });
      
      if (authError) throw authError;
      
      const user = data?.user;
      if (!user) throw new Error("Erreur lors de la création du compte. Aucun utilisateur retourné.");

      console.log("🚀 [SIGNUP] Insertion dans public.users pour l'ID:", user.id);
      
      // 2. Enregistrer le profil dans public.users
      const { error: dbError } = await supabase.from('users').insert([{
        id: user.id,
        uid: user.id,
        name: formData.name,
        email: formData.email,
        role: 'pending',
        avatarColor: 'bg-indigo-500'
      }]);
      
      console.log("🚀 [SIGNUP] Résultat insertion BDD:", { dbError });

      if (dbError) throw dbError;

      // 3. Gestion de la suite
      console.log("🚀 [SIGNUP] Inscription réussie en base. Session présente ?", !!data.session);
      
      if (!data.session) {
        // Cas où la confirmation d'email est activée sur Supabase
        setIsLoading(false);
        setError("Compte créé avec succès ! Veuillez vérifier votre boîte email pour valider votre compte.");
      } else {
        // Redirection immédiate vers role-selection
        console.log("🚀 [SIGNUP] Redirection immédiate vers /role-selection !");
        window.location.href = '/role-selection';
      }
      
    } catch (err) {
      console.error("❌ [SIGNUP] Erreur d'inscription interceptée:", err);
      setIsLoading(false);
      
      const errorMessage = err?.message || err?.error_description || "";
      const errorCode = err?.code || "";
      
      if (errorMessage.includes('already registered') || errorMessage.includes('already in use') || errorCode === '23505') {
        setError('Cette adresse email est déjà utilisée. Veuillez vous connecter.');
      } else if (errorMessage.includes('Password should be')) {
        setError('Le mot de passe doit faire au moins 6 caractères.');
      } else {
        setError(errorMessage || 'Une erreur est survenue lors de la création du compte.');
      }
    }
  };

  // On écoute AuthContext pour la redirection
  useEffect(() => {
    const checkRoleAndNavigate = async () => {
      if (currentUser) {
        try {
          console.log("🚀 [SIGNUP useEffect] Vérification du rôle pour currentUser:", currentUser.id || currentUser.uid);
          // On vérifie le rôle
          const { data: userDoc, error } = await supabase.from('users').select('role').eq('id', currentUser.id || currentUser.uid).single();
          
          console.log("🚀 [SIGNUP useEffect] Résultat BDD:", JSON.stringify({ userDoc, error }, null, 2));
          
          if (userDoc && userDoc.role && userDoc.role !== 'pending') {
            console.log("🚀 [SIGNUP useEffect] Redirection vers:", `/${userDoc.role}/home`);
            navigate(`/${userDoc.role}/home`, { replace: true });
          } else {
            console.log("🚀 [SIGNUP useEffect] Redirection vers /role-selection car rôle est pending ou inexistant");
            navigate('/role-selection', { replace: true });
          }
        } catch (e) {
          console.error("❌ [SIGNUP useEffect] Erreur récupération rôle :", e);
          navigate('/role-selection', { replace: true });
        }
      }
    };
    checkRoleAndNavigate();
  }, [currentUser, navigate]);

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
            <h2 className="text-3xl font-display font-bold mb-2">Rejoindre <span className="text-gradient">Creatix</span></h2>
            <p className="text-gray-400 text-sm">Créez votre compte pour accéder à l'écosystème</p>
          </div>

          {error ? (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ Nom */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all text-white placeholder-gray-500"
                placeholder="Nom complet"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

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

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 mt-6 rounded-xl font-bold text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span key="loading" className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </span>
              ) : (
                <span key="idle" className="flex items-center justify-center gap-2">
                  <span>Créer mon compte</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-8">
            Vous avez déjà un compte ? <Link to="/login" className="text-brand-accent hover:text-white transition-colors">Connectez-vous</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
