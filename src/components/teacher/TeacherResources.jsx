import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book, User, Download, Plus, Filter, MoreVertical, Upload, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';

export default function TeacherResources() {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfs, setPdfs] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' ou 'mine'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // 1. Récupération des PDF depuis Supabase
  useEffect(() => {
    let subscription = null;
    const fetchPdfs = async () => {
      try {
        const { data, error } = await supabase.from('pdfs').select('*');
        if (error) {
          console.error("Erreur récupération PDFs:", error);
        }
        if (data) {
          // Tri en JS pour éviter les erreurs SQL si la colonne created_at n'existe pas
          const sortedData = data.sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
          });
          setPdfs(sortedData);
        }
      } catch (e) {
        console.error("Exception fetchPdfs:", e);
      }
    };
    fetchPdfs();
    subscription = supabase.channel('public:pdfs:teacher')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pdfs' }, fetchPdfs)
      .subscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, []);

  const filteredPdfs = pdfs.filter(pdf => {
    const matchesSearch = (pdf.title && pdf.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (pdf.subject && pdf.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || pdf.teacherId === currentUser?.uid;
    return matchesSearch && matchesFilter;
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    
    // Limitation de taille : 50 MB
    if (file.size > 50 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (Max 50MB).");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const colors = ['from-fuchsia-600 to-purple-600', 'from-blue-600 to-cyan-600', 'from-amber-600 to-orange-600', 'from-emerald-600 to-teal-600', 'from-rose-600 to-pink-600'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const filePath = `pdfs/${currentUser.uid || currentUser.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // On lance l'intervalle
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('creatrix_storage')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      clearInterval(progressInterval);

      if (uploadError) {
        throw new Error(uploadError.message || "Erreur lors de l'upload vers Supabase Storage");
      }

      setUploadProgress(100);

      const { data: urlData } = supabase.storage.from('creatrix_storage').getPublicUrl(filePath);
      const downloadURL = urlData.publicUrl;
          
      const { error: dbError } = await supabase.from('pdfs').insert([{
        title: file.name.replace('.pdf', ''),
        subject: 'Non défini',
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        pages: '?',
        url: downloadURL,
        teacherId: currentUser.uid || currentUser.id,
        teacherName: currentUser.displayName || currentUser.name || 'Professeur',
        color: randomColor
      }]);
      
      if (dbError) throw new Error(dbError.message || "Erreur lors de l'enregistrement dans la base");
      
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      console.error("Erreur critique upload:", err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-7xl mx-auto">
      
      {/* En-tête Global avec Recherche (Identique à l'accueil) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
              Bibliothèque de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Ressources</span>
            </h1>
            <p className="text-slate-400 font-medium">Gérez et partagez vos cours au format PDF avec vos élèves.</p>
          </div>

          {/* Barre de recherche globale */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher un PDF ou une matière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setFilterType('all')}
              className={`flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterType === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Book className="w-4 h-4 inline" /> Tous les PDF
            </button>
            <button 
              onClick={() => setFilterType('mine')}
              className={`flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterType === 'mine' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <User className="w-4 h-4 inline" /> Mes publications
            </button>
          </div>
          
          <input 
            type="file" 
            accept=".pdf" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
          >
            {isUploading ? (
              <span key="uploading" className="flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin" /> {Math.round(uploadProgress)}%
              </span>
            ) : (
              <span key="idle" className="flex items-center gap-2">
                <Upload className="w-5 h-5" /> Publier un PDF
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Grille de type Bibliothèque (4 colonnes, cartes verticales) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
      >
        {filteredPdfs.map((pdf, i) => (
          <motion.div
            key={pdf.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative cursor-pointer"
          >
            {/* Couverture du Livre (Aspect vertical 3:4) */}
            <div className={`aspect-[3/4] rounded-2xl bg-gradient-to-br ${pdf.color} p-1 mb-4 shadow-[10px_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[15px_15px_40px_rgba(0,0,0,0.6)]`}>
              
              {/* Effet de brillance (Glass) */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/20 to-transparent w-[30%] opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 ease-out skew-x-[-20deg]" />
              
              {/* Contenu de la couverture */}
              <div className="w-full h-full bg-[#0B0F19]/60 backdrop-blur-sm rounded-xl p-5 flex flex-col relative border border-white/10">
                
                {/* Bande de "Reliure" sur le côté gauche pour simuler un livre */}
                <div className="absolute top-0 left-0 bottom-0 w-4 bg-black/20 border-r border-white/5 rounded-l-xl" />

                <div className="pl-4 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-auto">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 bg-black/30 px-2 py-1 rounded-md">
                      {pdf.subject}
                    </span>
                    <button className="text-white/50 hover:text-white transition-colors" title="Options">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-8 mb-6">
                    <Book className="w-10 h-10 text-white/30 mb-4" />
                    <h3 className="text-xl font-black text-white leading-tight line-clamp-3">
                      {pdf.title}
                    </h3>
                  </div>

                  {/* Espace Professeur sur la couverture */}
                  <div className="mt-auto pt-4 border-t border-white/20 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#0B0F19] shrink-0">
                      {pdf.teacherName.charAt(4)}
                    </div>
                    <span className="text-xs font-semibold text-white/90 truncate">
                      {pdf.teacherName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations sous le livre */}
            <div className="px-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>{pdf.size}</span>
                <span>{pdf.created_at ? new Date(pdf.created_at).toLocaleDateString() : 'À l\'instant'}</span>
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
                  <Download className="w-4 h-4" /> Lire & Télécharger
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredPdfs.length === 0 && (
        <div className="text-center py-32 text-slate-400">
          <Book className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Aucun PDF trouvé</h3>
          <p>Essayez une autre recherche ou publiez un nouveau document.</p>
        </div>
      )}

    </div>
  );
}
