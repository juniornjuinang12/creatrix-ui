import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Sparkles, ChevronLeft, Loader2, Bot, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Clé OpenAI fournie
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function TeacherToolSummary() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setSummary(null);
      setError(null);
    } else {
      setError("Veuillez sélectionner un fichier PDF valide.");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setSummary(null);
      setError(null);
    }
  };

  const generateSummary = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setError(null);
    setSummary(null);

    // Vérification de la taille pour éviter que le navigateur ne crashe (Out of Memory)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit for browser base64 extraction
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`Le fichier est trop lourd (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). La limite est de 10 MB pour éviter que votre navigateur ne plante.`);
      setIsGenerating(false);
      return;
    }

    try {
      // 1. Lire le fichier PDF en Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];

          const prompt = `Tu es un professeur expert. Je te fournis le fichier PDF d'un cours complet.
Lis l'intégralité du document et crée un résumé structuré et complet à destination des élèves.
Ton résumé doit inclure :
1. Un titre principal clair.
2. Une introduction résumant l'objectif global du cours.
3. Les concepts clés sous forme de liste à puces.
4. Un plan détaillé ou les chapitres principaux abordés.
5. 3 idées de questions de Quiz (QCM) pour vérifier la compréhension des élèves.
Réponds avec un beau formatage Markdown, utilise des émojis pertinents, du gras et des titres.`;

          // 3. Envoyer le document et le prompt à l'API OpenAI
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-5.5',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    {
                      type: 'file',
                      file: {
                        file_data: `data:application/pdf;base64,${base64Data}`,
                        filename: selectedFile.name
                      }
                    }
                  ]
                }
              ]
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Erreur API OpenAI');
          }

          const result = await response.json();
          const aiResponse = result.choices[0].message.content;
          setSummary(aiResponse);
        } catch (err) {
          console.error("Erreur OpenAI:", err);
          if (err.message && err.message.includes('429')) {
            setError("Limite d'utilisation atteinte. Veuillez patienter environ 30 secondes puis réessayer.");
          } else {
            setError("Impossible de générer le résumé avec ChatGPT. Détails: " + err.message);
          }
        } finally {
          setIsGenerating(false);
        }
      };

      reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier PDF.");
        setIsGenerating(false);
      };

      reader.readAsDataURL(selectedFile);

    } catch (err) {
      console.error(err);
      setError("Une erreur inattendue est survenue.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-8 pb-24 max-w-[1400px] mx-auto flex flex-col">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/home')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Résumé PDF <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Intelligent</span> <Sparkles className="w-6 h-6 text-fuchsia-400" />
            </h1>
            <p className="text-slate-400 font-medium">L'IA analyse vos cours de bout en bout et génère des synthèses parfaites.</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content: Split Layout */}
      <div className="flex-1 flex flex-row gap-8 min-h-[600px] w-full">

        {/* Left Column: PDF Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[320px] flex flex-col gap-6 shrink-0"
        >
          <div
            className={`flex-1 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ${isDragging ? 'border-fuchsia-500 bg-fuchsia-500/10' :
              selectedFile ? 'border-indigo-500/50 bg-[#0B0F19]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="application/pdf"
              className="hidden"
            />

            {!selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                  <Upload className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Glissez votre PDF ici</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-[250px]">
                  Taille maximale stricte : 10 MB. Au-delà, la page risque de planter.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/10"
                >
                  Parcourir les fichiers
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="w-full aspect-[3/4] max-w-[200px] rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-1 mb-6 shadow-2xl relative group">
                  <div className="w-full h-full bg-[#0B0F19]/80 backdrop-blur-sm rounded-xl p-4 flex flex-col border border-white/10 items-center justify-center text-center">
                    <FileText className="w-12 h-12 text-white/50 mb-4" />
                    <span className="text-white font-bold text-sm line-clamp-3 px-2 break-all">{selectedFile.name}</span>
                    <span className="text-slate-400 text-xs mt-2">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setSummary(null); }}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>

                <button
                  onClick={generateSummary}
                  disabled={isGenerating}
                  className="w-full max-w-[300px] py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                  {isGenerating ? (
                    <span key="generating" className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Analyse en cours...</span>
                    </span>
                  ) : (
                    <span key="idle" className="flex items-center gap-3">
                      <Bot className="w-6 h-6" />
                      <span>Générer le résumé</span>
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: AI Summary Result */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex-1 rounded-[32px] bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden flex flex-col relative">

            {/* Décoration en haut */}
            <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />

            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar relative">

              {!summary && !isGenerating && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 opacity-50 p-8 text-center">
                  <Sparkles className="w-16 h-16 mb-4 text-slate-600" />
                  <h3 className="text-xl font-bold mb-2 text-slate-400">Prêt à analyser</h3>
                  <p>Insérez un document à gauche et cliquez sur "Générer" pour obtenir un résumé structuré par l'IA.</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200">
                  <AlertCircle className="w-6 h-6 shrink-0 text-red-400" />
                  <p>{error}</p>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#0B0F19]/40 backdrop-blur-md z-10">
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-fuchsia-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-fuchsia-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Bot className="w-8 h-8 text-fuchsia-400 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Lecture du PDF par l'IA...</h3>
                  <p className="text-fuchsia-300/80 animate-pulse">Extraction des concepts clés et génération du résumé.</p>
                </div>
              )}

              {summary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-invert prose-fuchsia max-w-none markdown-content"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 mb-6 border-b border-white/10 pb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mt-8 mb-4 flex items-center gap-2 before:content-[''] before:w-2 before:h-2 before:bg-fuchsia-500 before:rounded-full" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-slate-200 mt-6 mb-3" {...props} />,
                      ul: ({ node, ...props }) => <ul className="space-y-2 my-4 pl-4" {...props} />,
                      li: ({ node, ...props }) => <li className="text-slate-300 leading-relaxed marker:text-fuchsia-500" {...props} />,
                      p: ({ node, ...props }) => <p className="text-slate-300 leading-relaxed mb-4 text-[15px]" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-white bg-fuchsia-500/10 px-1 rounded" {...props} />,
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
