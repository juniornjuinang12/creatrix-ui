import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowRight, Users, LayoutGrid, Book, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

export default function StudentHome() {
  const { currentUser, userData } = useAuth();
  const [classes, setClasses] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [activeTab, setActiveTab] = useState('classes');
  const [joiningClassId, setJoiningClassId] = useState(null);
  const navigate = useNavigate();

  const handleJoinClass = async (classObj) => {
    if (!currentUser) return;
    
    // Si l'élève est déjà dans la classe, on y accède directement
    if (classObj.studentIds && classObj.studentIds.includes(currentUser.uid)) {
      window.location.href = `/student/class/${classObj.id}`;
      return;
    }

    setJoiningClassId(classObj.id);
    try {
      const { data: cls, error: fetchError } = await supabase.from('classes').select('studentIds, "studentsCount"').eq('id', classObj.id).single();
      
      if (fetchError) {
        console.error("Erreur lors de la lecture de la classe:", fetchError);
        alert(`Erreur lecture BDD: ${fetchError.message}`);
        setJoiningClassId(null);
        return;
      }

      const currentIds = cls?.studentIds || [];
      const currentCount = cls?.["studentsCount"] || 0;

      if (!currentIds.includes(currentUser.uid)) {
        const { error: updateError } = await supabase.from('classes').update({
          studentIds: [...currentIds, currentUser.uid],
          "studentsCount": currentCount + 1
        }).eq('id', classObj.id);

        if (updateError) {
          console.error("Erreur lors de l'inscription BDD:", updateError);
          alert(`Impossible de rejoindre: ${updateError.message}\n(Avez-vous bien les colonnes studentIds et studentsCount ?)`);
          setJoiningClassId(null);
          return;
        }
      }
      
      // Redirection après succès
      window.location.href = `/student/class/${classObj.id}`;
    } catch (error) {
      console.error("Exception lors de l'inscription à la classe", error);
      alert("Impossible de rejoindre la classe: " + error.message);
      setJoiningClassId(null);
    }
  };

  useEffect(() => {
    let subClasses = null;
    let subPdfs = null;

    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
      if (data) setClasses(data);
    };

    const fetchPdfs = async () => {
      const { data, error } = await supabase.from('pdfs').select('*');
      if (error) {
        console.error("❌ Erreur lors du chargement des PDFs :", error);
      }
      if (data) {
        // Tri en JS pour éviter l'erreur SQL si created_at n'existe pas
        const sortedData = data.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
        setPdfs(sortedData);
      }
    };

    fetchClasses();
    fetchPdfs();

    subClasses = supabase.channel('public:classes:student')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        fetchClasses();
      })
      .subscribe();

    subPdfs = supabase.channel('public:pdfs:student')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pdfs' }, () => {
        fetchPdfs();
      })
      .subscribe();

    return () => {
      if (subClasses) supabase.removeChannel(subClasses);
      if (subPdfs) supabase.removeChannel(subPdfs);
    };
  }, []);

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-7xl mx-auto">
      
      {/* En-tête de bienvenue */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Salut, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{userData?.name || 'Élève'}</span> ! 👋
          </h1>
          <p className="text-slate-400 font-medium">Prêt à apprendre aujourd'hui ?</p>
        </div>
        
        <div className="relative">
          <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Bell className="w-6 h-6 text-slate-300" />
          </button>
        </div>
      </motion.div>

      {/* Navigation par Onglets */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex p-1 bg-white/5 border border-white/10 rounded-2xl w-full max-w-fit backdrop-blur-md mb-8"
      >
        <button
          onClick={() => setActiveTab('classes')}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'classes' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {activeTab === 'classes' && (
            <motion.div layoutId="student-tab-indicator" className="absolute inset-0 bg-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          )}
          <LayoutGrid className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Classes</span>
        </button>

        <button
          onClick={() => setActiveTab('pdfs')}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'pdfs' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {activeTab === 'pdfs' && (
            <motion.div layoutId="student-tab-indicator" className="absolute inset-0 bg-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          )}
          <Book className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Cours (PDF)</span>
        </button>
      </motion.div>

      {/* Contenu Actif */}
      <div className="relative">
        <AnimatePresence mode="wait">
          
          {/* ONGLET CLASSES */}
          {activeTab === 'classes' && (
            <motion.div
              key="classes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((cls, i) => (
                    <motion.div 
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.05] transition-all group overflow-hidden relative cursor-pointer"
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cls.color || 'from-indigo-500 to-purple-500'} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity`} />
                      <h3 className="text-2xl font-bold text-white mb-1 relative z-10">{cls.name}</h3>
                      <p className="text-slate-400 text-sm font-medium mb-6 relative z-10">{cls.subject || 'Matière non définie'}</p>
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-slate-300 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg text-sm font-bold">
                          <Users className="w-4 h-4 text-emerald-400" /> {cls.studentsCount || 0} Élèves
                        </span>
                        <button 
                          onClick={() => handleJoinClass(cls)}
                          disabled={joiningClassId === cls.id}
                          className="flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                        >
                          {joiningClassId === cls.id ? 'Inscription...' : 
                            (cls.studentIds && cls.studentIds.includes(currentUser?.uid) ? 'Accéder' : 'Rejoindre')} 
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                  <LayoutGrid className="w-16 h-16 text-white/10 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Aucune classe n'a été créée par les professeurs.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ONGLET PDFS */}
          {activeTab === 'pdfs' && (
            <motion.div
              key="pdfs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {pdfs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {pdfs.map((pdf, i) => (
                    <motion.div
                      key={pdf.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative cursor-pointer"
                    >
                      {/* Couverture du Livre */}
                      <div className={`aspect-[3/4] rounded-2xl bg-gradient-to-br ${pdf.color || 'from-blue-600 to-cyan-600'} p-1 mb-4 shadow-[10px_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[15px_15px_40px_rgba(0,0,0,0.6)]`}>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/20 to-transparent w-[30%] opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 ease-out skew-x-[-20deg]" />
                        <div className="w-full h-full bg-[#0B0F19]/60 backdrop-blur-sm rounded-xl p-5 flex flex-col relative border border-white/10">
                          <div className="absolute top-0 left-0 bottom-0 w-4 bg-black/20 border-r border-white/5 rounded-l-xl" />
                          <div className="pl-4 h-full flex flex-col">
                            <div className="flex justify-between items-start mb-auto">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 bg-black/30 px-2 py-1 rounded-md">
                                {pdf.subject || 'Cours'}
                              </span>
                            </div>
                            <div className="mt-8 mb-6">
                              <Book className="w-10 h-10 text-white/30 mb-4" />
                              <h3 className="text-xl font-black text-white leading-tight line-clamp-3">
                                {pdf.title}
                              </h3>
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/20 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#0B0F19] shrink-0">
                                {pdf.teacherName ? pdf.teacherName.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <span className="text-xs font-semibold text-white/90 truncate">
                                {pdf.teacherName || 'Professeur'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Informations sous le livre */}
                      <div className="px-2">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                          <span>{pdf.size || 'Taille inconnue'}</span>
                          <span>{pdf.created_at ? new Date(pdf.created_at).toLocaleDateString() : 'Récent'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <a 
                            href={pdf.url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!pdf.url) {
                                e.preventDefault();
                                alert("L'URL du PDF n'est pas disponible.");
                              }
                            }}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-slate-300 transition-colors flex items-center justify-center gap-2 group-hover:text-amber-400 group-hover:border-amber-500/30"
                          >
                            <Download className="w-4 h-4" /> Ouvrir le PDF
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                  <Book className="w-16 h-16 text-white/10 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Aucun PDF n'a été publié par les professeurs.</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
