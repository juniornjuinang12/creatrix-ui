import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: Initialisation avec Supabase");
    let subscription = null;

    // Fonction pour récupérer les données de l'utilisateur
    const fetchUserData = async (userId) => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error && error.code !== 'PGRST116') {
           console.error("AuthContext: Erreur de fetch userData:", error);
        }
        if (data) {
          setUserData(data);
        } else {
          setUserData(null);
        }
      } catch (e) {
        console.error("AuthContext: Exception fetchUserData:", e);
      }
    };

    try {
      console.log("Appel de getSession()...");
      // Obtenir la session initiale
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log("getSession() résolu ! Session:", session, "Erreur:", error);
        if (error) {
          console.error("Session error:", error);
        }
        const user = session?.user ?? null;
        const currentUserObj = user ? { ...user, uid: user.id } : null;
        setCurrentUser(currentUserObj);
        setLoading(false);
      }).catch(e => {
        console.error("GetSession exception:", e);
        setLoading(false);
      });

      // Écouter les changements de session (login/logout)
      const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("AuthContext: Événement Supabase Auth:", event);
        try {
          const user = session?.user ?? null;
          const currentUserObj = user ? { ...user, uid: user.id } : null;
          setCurrentUser(currentUserObj);
          
        if (user) {
            // Ne pas await ici, on laisse charger en arrière-plan pour ne pas bloquer l'UI
            fetchUserData(user.id);
            if (subscription) supabase.removeChannel(subscription);
            subscription = supabase.channel(`public:users:id=eq.${user.id}`)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, payload => {
                setUserData(payload.new);
              })
              .subscribe();
          } else {
            setUserData(null);
            if (subscription) {
              supabase.removeChannel(subscription);
              subscription = null;
            }
          }
          setLoading(false);
        } catch (err) {
          console.error("AuthContext onAuthStateChange Error:", err);
          setLoading(false);
        }
      });
      
      subscription = authData?.subscription;

    } catch (globalErr) {
      console.error("Global init error:", globalErr);
      setLoading(false);
    }

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userData
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 mt-4 text-sm animate-pulse">Connexion à Creatix...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
