import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Video, Languages, ArrowRight, Loader2, PlayCircle, Upload } from 'lucide-react';

export default function DesignerVideoTranslate() {
  const [videoFile, setVideoFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedVideoUrl, setTranslatedVideoUrl] = useState(null);
  const fileInputRef = useRef(null);

  const languages = [
    { code: 'en', name: 'Anglais' },
    { code: 'es', name: 'Espagnol' },
    { code: 'de', name: 'Allemand' },
    { code: 'it', name: 'Italien' },
    { code: 'ja', name: 'Japonais' },
  ];

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleTranslate = (e) => {
    e.preventDefault();
    if (!videoFile) return;

    setIsTranslating(true);
    
    // Simulation du temps de traitement
    setTimeout(() => {
      setIsTranslating(false);
      setTranslatedVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
      alert("Traduction terminée ! (Simulation)");
    }, 4000);
  };

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
          <Languages className="w-10 h-10 text-orange-500" /> Traducteur <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Vocal IA</span>
        </h1>
        <p className="text-slate-400 font-medium">Doublez vos créations vidéo pour un public mondial avec l'IA.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <form onSubmit={handleTranslate} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3">Vidéo Source</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${videoFile ? 'border-orange-500 bg-orange-500/10' : 'border-white/20 hover:border-orange-500/50 hover:bg-white/5'}`}
              >
                {videoFile ? (
                  <>
                    <Video className="w-10 h-10 text-orange-400 mb-2" />
                    <span className="text-white font-medium text-center px-4">{videoFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-500 mb-2" />
                    <span className="text-slate-400 font-medium text-center">Cliquez pour uploader une vidéo (MP4)</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*" className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3">Langue du doublage</label>
              <select 
                value={targetLanguage} 
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-[#0B0F19] border border-white/10 rounded-xl outline-none focus:border-orange-500/50 text-white"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={!videoFile || isTranslating}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isTranslating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Traduction...</>
              ) : (
                <>Démarrer le doublage <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Prévisualisation</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-[#0B0F19] overflow-hidden min-h-[250px]">
            {translatedVideoUrl ? (
              <video src={translatedVideoUrl} controls className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <PlayCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">La vidéo finale sera affichée ici.</p>
              </div>
            )}
          </div>
          
          {translatedVideoUrl && (
            <button className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
              Exporter la vidéo
            </button>
          )}
        </motion.div>

      </div>
    </div>
  );
}
