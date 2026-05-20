import { motion } from 'framer-motion';
import { Image, Video, Palette, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function DesignerHome() {
  const navigate = useNavigate();
  const { userData } = useAuth();

  const tools = [
    {
      id: 'image-gen',
      name: 'Générateur d\'Images',
      desc: 'Créez des illustrations, logos et ressources graphiques avec l\'IA.',
      icon: Image,
      color: 'from-pink-500 to-rose-500',
      path: '/designer/image-gen'
    },
    {
      id: 'video-translate',
      name: 'Traduction Vocale',
      desc: 'Doublez vos vidéos éducatives dans plus de 29 langues.',
      icon: Video,
      color: 'from-orange-500 to-amber-500',
      path: '/designer/video-translate'
    }
  ];

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">Créatif</span>
        </h1>
        <p className="text-slate-400 font-medium">Bienvenue {userData?.name || 'Designer'} ! Que souhaitez-vous créer aujourd'hui ?</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(tool.path)}
            className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 relative overflow-hidden group cursor-pointer hover:bg-white/[0.05] transition-all"
          >
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br ${tool.color} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity rounded-full`} />
            
            <div className="flex items-start gap-6 relative z-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${tool.color} shadow-lg`}>
                <tool.icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">{tool.name}</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{tool.desc}</p>
                <div className="flex items-center text-pink-400 font-bold text-sm group-hover:translate-x-2 transition-transform">
                  Lancer l'outil <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Historique/Galerie */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12 bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
        <Palette className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">Votre Galerie</h3>
        <p className="text-slate-400 text-sm">Vos créations récentes apparaîtront ici.</p>
      </motion.div>
    </div>
  );
}
