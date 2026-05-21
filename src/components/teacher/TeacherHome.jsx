import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, FileText, Search, User, Globe, Lock, GraduationCap, Play, Languages, FileVideo, Users, LayoutGrid, Wrench, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

// --- DONNÉES FACTICES (Pour les élèves et Outils) ---
const mockTools = [
  { id: 'summary', name: 'Résumé PDF avec IA', desc: 'Extrayez instantanément les concepts clés d\'un long document.', icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'translate', name: 'Traducteur Vidéo IA', desc: 'Traduisez et doublez vos vidéos éducatives en plusieurs langues.', icon: Languages, color: 'text-amber-400', bg: 'bg-amber-400/10' },
];

export default function TeacherHome() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // 1. Récupération des classes depuis Supabase
  useEffect(() => {
    if (!currentUser) return;
    let subscription = null;

    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('*').eq('teacherId', currentUser.uid).order('created_at', { ascending: false });
      if (data) setClasses(data);
    };

    fetchClasses();

    subscription = supabase.channel('public:classes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        fetchClasses();
      })
      .subscribe();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  // 2. Récupération des élèves (users) depuis Supabase
  useEffect(() => {
    if (!currentUser) return;
    let subscription = null;

    const fetchStudents = async () => {
      const { data } = await supabase.from('users').select('*').neq('uid', currentUser.uid);
      if (data) {
        setStudents(data.map(d => ({
          ...d,
          name: d.name || 'Élève',
          color: d.avatarColor || 'bg-fuchsia-500',
          isPublic: true,
          lastActive: 'En ligne'
        })));
      }
    };

    fetchStudents();

    subscription = supabase.channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClass = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Voulez-vous vraiment supprimer cette classe ? Cette action est irréversible.")) {
      try {
        await supabase.from('classes').delete().eq('id', id);
      } catch (error) {
        console.error("Erreur lors de la suppression de la classe:", error);
      }
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !currentUser) return;
    
    const colors = ['from-blue-500 to-cyan-500', 'from-fuchsia-500 to-pink-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-indigo-500 to-purple-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      const { error } = await supabase.from('classes').insert([{
        name: newClassName,
        studentsCount: 0,
        subject: 'Matière à définir',
        color: randomColor,
        teacherId: currentUser.uid
      }]);
      
      if (error) throw error;
      
      setNewClassName('');
      setShowCreateClass(false);
    } catch (error) {
      console.error("Erreur lors de la création de la classe:", error);
      alert("Erreur: Impossible de créer la classe. Détails: " + error.message);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-7xl mx-auto">
      
      {/* En-tête et Onglets */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Espace <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">Enseignant</span>
          </h1>

          {/* Barre de recherche globale */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder={`Rechercher ${activeTab === 'classes' ? 'une classe' : activeTab === 'eleves' ? 'un élève' : 'un outil'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Système d'Onglets */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl w-full max-w-fit mx-auto md:mx-0 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('classes')}
            className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'classes' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeTab === 'classes' && (
              <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            )}
            <LayoutGrid className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Classes</span>
          </button>

          <button
            onClick={() => setActiveTab('eleves')}
            className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'eleves' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeTab === 'eleves' && (
              <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            )}
            <Users className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Élèves</span>
          </button>

          <button
            onClick={() => setActiveTab('outils')}
            className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'outils' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeTab === 'outils' && (
              <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            )}
            <Wrench className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Outils IA</span>
          </button>
        </div>
      </motion.div>

      {/* Contenu Dynamique */}
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
              {/* Entête Classes */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Vos Classes</h2>
                <button 
                  onClick={() => setShowCreateClass(!showCreateClass)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors font-semibold text-sm"
                >
                  <Plus className="w-4 h-4" /> Créer une classe
                </button>
              </div>

              {/* Formulaire Création Classe */}
              <AnimatePresence>
                {showCreateClass && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateClass}
                    className="mb-8 p-6 bg-white/5 border border-indigo-500/30 rounded-2xl overflow-hidden"
                  >
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nom de la nouvelle classe</label>
                        <input 
                          type="text" 
                          required
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Ex: Terminale S3" 
                          className="w-full px-4 py-3 bg-[#0B0F19] border border-white/10 rounded-xl outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-white"
                        />
                      </div>
                      <button type="submit" className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors">
                        Créer
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls, i) => (
                  <div 
                    key={cls.id} 
                    onClick={() => navigate(`/teacher/class/${cls.id}`)}
                    className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.05] transition-all group overflow-hidden relative cursor-pointer"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cls.color} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity`} />
                    <button 
                      onClick={(e) => handleDeleteClass(e, cls.id)}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-20"
                      title="Supprimer la classe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h3 className="text-2xl font-bold text-white mb-1 relative z-10">{cls.name}</h3>
                    <p className="text-slate-400 text-sm font-medium mb-6 relative z-10">{cls.subject}</p>
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-slate-300 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg text-sm font-bold">
                        <Users className="w-4 h-4 text-indigo-400" /> {cls.studentsCount} Élèves
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                        <FileText className="w-5 h-5 text-white group-hover:text-indigo-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredClasses.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <p>Aucune classe trouvée.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ONGLET ELEVES (Grille d'annuaire) */}
          {activeTab === 'eleves' && (
            <motion.div
              key="eleves"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredStudents.map((student, i) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.05] hover:border-white/20 transition-all flex flex-col"
                  >
                    <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${student.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity rounded-full`} />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-inner ${student.color}`}>
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {student.isPublic ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                            <Globe className="w-3 h-3" /> Public
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-400/10 px-2 py-1 rounded-lg">
                            <Lock className="w-3 h-3" /> Privé
                          </div>
                        )}
                        <span className="text-xs text-slate-500">{student.lastActive}</span>
                      </div>
                    </div>

                    <div className="mb-6 relative z-10">
                      <h3 className="text-lg font-bold text-white truncate">{student.name}</h3>
                      <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                        <User className="w-4 h-4" /> Élève
                      </p>
                    </div>

                    <div className="flex-1"></div>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      <button 
                        onClick={() => navigate(`/teacher/chat?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&studentColor=${student.color.split(' ')[0]}`)}
                        className="flex flex-col items-center justify-center gap-2 py-3 bg-white/5 hover:bg-fuchsia-500/20 hover:text-fuchsia-400 border border-transparent hover:border-fuchsia-500/30 rounded-xl transition-all text-slate-300"
                        title="Discuter en privé"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-xs font-semibold">Discuter</span>
                      </button>
                      
                      <button 
                        className="flex flex-col items-center justify-center gap-2 py-3 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 border border-transparent hover:border-blue-500/30 rounded-xl transition-all text-slate-300"
                        title="Envoyer un cours"
                      >
                        <FileText className="w-5 h-5" />
                        <span className="text-xs font-semibold">Cours</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <p>Aucun élève trouvé avec ce nom.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ONGLET OUTILS */}
          {activeTab === 'outils' && (
            <motion.div
              key="outils"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6"
            >
              {mockTools.map((tool, i) => (
                <div key={tool.id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.05] transition-all group overflow-hidden relative cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${tool.bg}`}>
                    <tool.icon className={`w-8 h-8 ${tool.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{tool.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{tool.desc}</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (tool.id === 'summary') navigate('/teacher/tools/summary');
                        if (tool.id === 'translate') navigate('/teacher/tools/video-translate');
                      }}
                      className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors"
                    >
                      Utiliser l'outil
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      
    </div>
  );
}
