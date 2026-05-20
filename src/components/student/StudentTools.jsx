import { motion } from 'framer-motion';
import { PenTool, FileText, Video, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentTools() {
  const navigate = useNavigate();

  const tools = [
    {
      id: 'summary',
      name: 'Résumé PDF',
      description: 'Générez un résumé instantané de vos cours au format PDF avec l\'IA.',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      path: '/student/tools/summary' // On réutilisera le même composant que le prof ou on en fera un similaire
    },
    {
      id: 'translate',
      name: 'Traduction Vidéo',
      description: 'Traduisez et doublez les vidéos éducatives dans d\'autres langues.',
      icon: Video,
      color: 'from-fuchsia-500 to-pink-500',
      path: '/student/tools/video-translate'
    }
  ];

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Boîte à <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Outils IA</span>
        </h1>
        <p className="text-slate-400 font-medium">Utilisez la puissance de l'IA pour apprendre plus vite.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(tool.path)}
            className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 relative overflow-hidden group cursor-pointer hover:bg-white/[0.05] transition-all"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tool.color} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity`} />
            
            <div className="flex items-start gap-6 relative z-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${tool.color}`}>
                <tool.icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">{tool.name}</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{tool.description}</p>
                <div className="flex items-center text-emerald-400 font-bold text-sm group-hover:translate-x-2 transition-transform">
                  Ouvrir l'outil <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
