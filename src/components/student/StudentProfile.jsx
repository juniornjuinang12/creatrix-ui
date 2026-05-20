import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Activity, BookOpen, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

export default function StudentProfile() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [translatedVideos, setTranslatedVideos] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchActivities = async () => {
      const { data } = await supabase.from('quiz_results').select('*').eq('studentId', currentUser.uid);
      if (data) {
        const acts = data.map(doc => ({
          id: doc.id,
          title: doc.quizTitle || 'Quiz complété',
          score: doc.score,
          date: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'À l\'instant',
          timestamp: doc.created_at ? new Date(doc.created_at).getTime() : Date.now()
        }));
        acts.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(acts);
      }
    };
    
    const fetchTranslatedVideos = async () => {
      const { data } = await supabase.from('translated_videos').select('*').eq('userId', currentUser.uid).order('created_at', { ascending: false });
      if (data) {
        setTranslatedVideos(data);
      }
    };
    
    fetchActivities();
    fetchTranslatedVideos();
    
    const sub = supabase.channel('public:quiz_results:studentProfile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_results', filter: `studentId=eq.${currentUser.uid}` }, fetchActivities)
      .subscribe();
      
    const subVideos = supabase.channel('public:translated_videos:studentProfile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'translated_videos', filter: `userId=eq.${currentUser.uid}` }, fetchTranslatedVideos)
      .subscribe();
      
    return () => { supabase.removeChannel(sub); supabase.removeChannel(subVideos); };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // On force un rechargement complet de la page pour nettoyer le cache React (AuthContext)
      // et éviter une redirection accidentelle (race condition)
      window.location.href = '/login';
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-6 max-w-3xl mx-auto flex flex-col items-center">
      
      {/* En-tête Profil */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-12 w-full"
      >
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-6 text-5xl font-bold text-white border-4 border-white/10 relative z-10">
            {userData?.name ? userData.name.substring(0, 2).toUpperCase() : (currentUser?.email?.substring(0,2).toUpperCase() || 'E')}
          </div>
          {/* Badge Élève */}
          <div className="absolute -bottom-2 -right-2 bg-[#0B0F19] p-1.5 rounded-full z-20">
            <div className="bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 text-center">
          {userData?.name || 'Élève'}
        </h1>
        <p className="text-emerald-400 font-medium mb-8 text-center bg-emerald-500/10 px-4 py-1 rounded-full border border-emerald-500/20">
          {currentUser?.email}
        </p>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-red-500 text-slate-300 hover:text-white rounded-xl transition-colors font-bold text-sm shadow-lg border border-white/10 hover:border-transparent"
        >
          <LogOut className="w-5 h-5" /> Se déconnecter
        </button>
      </motion.div>

      {/* Statistiques rapides */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full grid grid-cols-2 gap-4 mb-8"
      >
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center">
          <BookOpen className="w-8 h-8 text-emerald-400 mb-3" />
          <span className="text-3xl font-black text-white">{activities.length}</span>
          <span className="text-slate-400 text-sm mt-1">Quiz complétés</span>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center">
          <Award className="w-8 h-8 text-amber-400 mb-3" />
          <span className="text-3xl font-black text-white">0</span>
          <span className="text-slate-400 text-sm mt-1">Badges obtenus</span>
        </div>
      </motion.div>

      {/* Historique des Activités */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Mon Parcours</h2>
        </div>
        
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                key={activity.id} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-500/20`}>
                  <BookOpen className={`w-5 h-5 text-emerald-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-base truncate">{activity.title}</h4>
                  <p className="text-emerald-400 text-sm font-medium">Score: {activity.score}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-500 text-sm font-medium">{activity.date}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Activity className="w-12 h-12 mx-auto text-slate-500 mb-4 opacity-50" />
              <p>Vous n'avez pas encore passé d'évaluations.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Historique des Vidéos Traduites */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 mt-8"
      >
        <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
            <span className="text-xl">🌐</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Mes Vidéos Traduites</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {translatedVideos.length > 0 ? (
            translatedVideos.map((video) => (
              <div key={video.id} className="flex flex-col bg-[#0B0F19] rounded-2xl border border-white/10 overflow-hidden group">
                <video src={video.videoUrl} controls className="w-full h-40 object-cover bg-black" />
                <div className="p-4">
                  <h4 className="text-white font-medium text-sm truncate mb-1" title={video.originalName}>{video.originalName}</h4>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-bold px-2 py-1 bg-fuchsia-500/20 text-fuchsia-400 rounded-lg uppercase">
                      Langue : {video.language}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-400 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <span className="text-4xl mb-4 block opacity-50">🎥</span>
              <p>Vous n'avez pas encore traduit de vidéo.</p>
              <p className="text-sm mt-2 opacity-70">Utilisez le traducteur IA ou la messagerie pour commencer.</p>
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}
