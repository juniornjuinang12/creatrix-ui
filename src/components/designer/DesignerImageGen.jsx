import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Sparkles, Download, Loader2 } from 'lucide-react';

export default function DesignerImageGen() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    // Utilisation de l'API gratuite Pollinations AI pour générer l'image
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&enhance=true`;

    // Précharger l'image pour éviter l'affichage progressif moche
    const img = new Image();
    img.onload = () => {
      setGeneratedImage(imageUrl);
      setIsGenerating(false);
    };
    img.onerror = () => {
      alert("Erreur lors de la génération de l'image.");
      setIsGenerating(false);
    };
    img.src = imageUrl;
  };

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-4xl mx-auto flex flex-col">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 flex items-center justify-center gap-3">
          <ImageIcon className="w-10 h-10 text-pink-500" /> Générateur <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-500">d'Images IA</span>
        </h1>
        <p className="text-slate-400 font-medium">Décrivez ce que vous souhaitez voir, et l'IA le créera pour vous.</p>
      </motion.div>

      <div className="flex-1 flex flex-col">
        {/* Formulaire */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          onSubmit={handleGenerate}
          className="bg-white/5 border border-white/10 p-2 sm:p-3 rounded-[32px] flex gap-2 sm:gap-4 mb-8 shadow-xl"
        >
          <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Un logo moderne pour un cours de mathématiques, couleurs néon..."
            className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder-slate-500 text-sm sm:text-base"
          />
          <button 
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold rounded-[24px] flex items-center gap-2 transition-all shrink-0"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span className="hidden sm:inline">{isGenerating ? 'Création...' : 'Générer'}</span>
          </button>
        </motion.form>

        {/* Espace Résultat */}
        <div className="flex-1 bg-[#0B0F19] border border-white/10 rounded-3xl overflow-hidden relative flex items-center justify-center min-h-[400px]">
          {isGenerating && (
            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
              <p className="text-pink-300 font-medium animate-pulse">L'IA peint votre imagination...</p>
            </div>
          )}

          <AnimatePresence>
            {generatedImage ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full h-full flex flex-col items-center justify-center p-6">
                <img src={generatedImage} alt="Génération IA" className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl" />
                <a 
                  href={generatedImage}
                  download="creation-creatix.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                >
                  <Download className="w-5 h-5" /> Télécharger l'image
                </a>
              </motion.div>
            ) : !isGenerating && (
              <div className="text-center p-6 opacity-40">
                <ImageIcon className="w-20 h-20 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Aucune image générée pour le moment.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
