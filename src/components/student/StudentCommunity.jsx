import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, User, Globe, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';

export default function StudentCommunity() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchStudents = async () => {
      const { data } = await supabase.from('users').select('*').eq('role', 'student').neq('id', currentUser.uid);
      if (data) setStudents(data);
    };
    
    fetchStudents();
    
    const sub = supabase.channel('public:users:community')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: 'role=eq.student' }, () => {
        fetchStudents();
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [currentUser]);

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              La <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Communauté</span>
            </h1>
            <p className="text-slate-400 font-medium">Discutez et créez des groupes avec vos camarades.</p>
          </div>

          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher un élève..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-white placeholder-slate-500"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredStudents.map((student, i) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.05] transition-all flex flex-col"
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-inner bg-emerald-500">
                {student.name ? student.name.substring(0, 2).toUpperCase() : 'EL'}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                <Globe className="w-3 h-3" /> En ligne
              </div>
            </div>

            <div className="mb-6 relative z-10">
              <h3 className="text-lg font-bold text-white truncate">{student.name}</h3>
              <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                <User className="w-4 h-4" /> Camarade
              </p>
            </div>

            <div className="mt-auto relative z-10">
              <button 
                onClick={() => navigate(`/student/chat?contactId=${student.id}&contactName=${encodeURIComponent(student.name || '')}`)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 rounded-xl transition-all text-slate-300 font-bold text-sm"
              >
                <MessageCircle className="w-5 h-5" /> Discuter
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredStudents.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p>Aucun autre élève trouvé.</p>
        </div>
      )}
    </div>
  );
}
