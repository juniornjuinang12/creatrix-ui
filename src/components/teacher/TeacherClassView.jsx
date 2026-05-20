import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, MessageSquare, ClipboardList, Link as LinkIcon, Plus, Clock, CheckCircle2, Copy, Loader, Send, Paperclip, Image as ImageIcon, FileText, Video, X } from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherClassView() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [activeTab, setActiveTab] = useState('mur');
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);

  // Formulaire Quiz
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, text: '', timeLimit: 30, options: ['', ''], correctAnswers: [], multiple: false }
  ]);

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mur
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Récupérer les infos de la classe
  useEffect(() => {
    const fetchClass = async () => {
      try {
        const { data } = await supabase.from('classes').select('*').eq('id', classId).single();
        if (data) setClassData(data);
      } catch (error) {
        console.error("Erreur lors de la récupération de la classe:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [classId]);

  // Récupérer les quiz de la classe
  useEffect(() => {
    let subscription = null;
    const fetchQuizzes = async () => {
      const { data } = await supabase.from('quizzes').select('*').eq('classId', classId);
      if (data) setQuizzes(data);
    };
    fetchQuizzes();
    subscription = supabase.channel(`public:quizzes:${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes', filter: `classId=eq.${classId}` }, () => {
        fetchQuizzes();
      }).subscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [classId]);

  // Récupérer les annonces (Mur)
  useEffect(() => {
    let subscription = null;
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase.from('class_posts').select('*').eq('classId', classId);
        if (error) console.error("Erreur récupération posts:", error);
        if (data) {
          const sorted = data.sort((a, b) => {
            const timeA = a.created_at || a.createdAt ? new Date(a.created_at || a.createdAt).getTime() : 0;
            const timeB = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          setPosts(sorted);
        }
      } catch (e) { console.error(e); }
    };
    fetchPosts();
    subscription = supabase.channel(`public:class_posts:${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_posts', filter: `classId=eq.${classId}` }, () => {
        fetchPosts();
      }).subscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [classId]);

  // Récupérer les messages du chat
  useEffect(() => {
    let subscription = null;
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase.from('class_messages').select('*').eq('classId', classId);
        if (error) console.error("Erreur récupération messages:", error);
        if (data) {
          const sorted = data.sort((a, b) => {
            const timeA = a.created_at || a.createdAt ? new Date(a.created_at || a.createdAt).getTime() : 0;
            const timeB = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt).getTime() : 0;
            return timeA - timeB; // ascending for messages
          });
          setMessages(sorted);
        }
      } catch (e) { console.error(e); }
    };
    fetchMessages();
    subscription = supabase.channel(`public:class_messages:${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_messages', filter: `classId=eq.${classId}` }, () => {
        fetchMessages();
      }).subscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [classId]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (Max 50MB).");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const getMediaType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'other';
  };

  const handlePublishPost = async (e) => {
    e.preventDefault();
    console.log("Bouton publier cliqué. Contenu:", newPostContent, "Fichier:", selectedFile);
    if ((!newPostContent.trim() && !selectedFile) || !currentUser) {
      console.log("Annulation: contenu vide ou utilisateur non authentifié.");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    let mediaUrl = null;
    let mediaType = null;
    let mediaName = null;

    try {
      console.log("Début de l'envoi vers Supabase Storage...");
      if (selectedFile) {
        mediaType = getMediaType(selectedFile);
        mediaName = selectedFile.name;
        const filePath = `class_media/${classId}/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
        }, 200);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('creatrix_storage')
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });
          
        clearInterval(progressInterval);

        if (uploadError) {
          throw new Error(uploadError.message || "Erreur d'upload du fichier. Le bucket 'creatrix_storage' existe-t-il en public ?");
        }
        
        setUploadProgress(100);
        const { data: urlData } = supabase.storage.from('creatrix_storage').getPublicUrl(filePath);
        mediaUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('class_posts').insert([{
        classId: classId,
        content: newPostContent.trim(),
        authorId: currentUser.uid || currentUser.id,
        authorName: userData?.name || 'Professeur',
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        mediaName: mediaName
      }]);
      
      if (error) throw new Error(error.message || "Erreur lors de la publication de l'annonce.");
      
      console.log("Publication réussie !");
      setNewPostContent('');
      removeSelectedFile();
    } catch (error) {
      console.error("ERREUR CRITIQUE publication annonce:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    try {
      const { error } = await supabase.from('class_messages').insert([{
        classId: classId,
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: userData?.name || 'Professeur',
        senderRole: 'teacher'
      }]);
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error("ERREUR CRITIQUE d'envoi du message:", error);
      alert(`Erreur d'envoi du message:\n${error.message}`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://creatrix.app/join/${classData?.id || classId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: '', timeLimit: 30, options: ['', ''], correctAnswers: [], multiple: false }]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const updateOption = (questionId, index, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const toggleCorrectAnswer = (questionId, index) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        let newCorrect = [...q.correctAnswers];
        if (q.multiple) {
          if (newCorrect.includes(index)) newCorrect = newCorrect.filter(i => i !== index);
          else newCorrect.push(index);
        } else {
          newCorrect = [index];
        }
        return { ...q, correctAnswers: newCorrect };
      }
      return q;
    }));
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('quizzes').insert([{
        classId: classId,
        title: quizTitle,
        questionsCount: questions.length,
        status: 'published',
        questions: questions,
        results: [] // Les résultats seront ajoutés par les élèves
      }]);
      if (error) throw error;
      setShowQuizForm(false);
      setQuizTitle('');
      setQuestions([{ id: 1, text: '', timeLimit: 30, options: ['', ''], correctAnswers: [], multiple: false }]);
    } catch (error) {
      console.error("Erreur lors de la création du quiz:", error);
      alert(`Erreur création quiz:\n${error.message}`);
    }
  };

  const renderMedia = (post) => {
    if (!post.mediaUrl) return null;
    
    if (post.mediaType === 'image') {
      return <img src={post.mediaUrl} alt="Attachement" className="max-w-full rounded-xl mt-4 max-h-96 object-contain bg-black/20" />;
    }
    if (post.mediaType === 'video') {
      return <video src={post.mediaUrl} controls className="max-w-full rounded-xl mt-4 max-h-96 bg-black/20" />;
    }
    if (post.mediaType === 'pdf') {
      return (
        <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl mt-4 hover:bg-white/10 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{post.mediaName || 'Document PDF'}</p>
            <p className="text-xs text-slate-400">Cliquez pour ouvrir le document</p>
          </div>
        </a>
      );
    }
    return (
      <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-sm flex items-center gap-2 mt-4">
        <Paperclip className="w-4 h-4" /> {post.mediaName || 'Fichier joint'}
      </a>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-fuchsia-500" /></div>;
  }

  if (!classData) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Classe introuvable.</div>;
  }

  return (
    <div className="min-h-screen px-6 pt-8 pb-24 max-w-5xl mx-auto">
      
      <button 
        onClick={() => navigate('/teacher/home')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
      </button>

      {/* Header Classe */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${classData.color} opacity-20 blur-3xl rounded-full`} />
        
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">{classData.name}</h1>
          <p className="text-xl text-slate-300 font-medium mb-4">{classData.subject}</p>
          <div className="flex items-center gap-3">
            <span className="bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> {classData.studentsCount || 0} Élèves inscrits
            </span>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-auto">
          <button 
            onClick={handleCopyLink}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              linkCopied ? 'bg-emerald-500 text-white' : 'bg-white text-[#0B0F19] hover:bg-slate-200'
            }`}
          >
            {linkCopied ? <CheckCircle2 className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
            {linkCopied ? 'Lien copié !' : 'Lien d\'invitation'}
          </button>
        </div>
      </div>

      {/* Navigation Interne */}
      <div className="flex border-b border-white/10 mb-8 overflow-x-auto hide-scrollbar">
        {[
          { id: 'mur', icon: MessageSquare, label: 'Mur & Annonces' },
          { id: 'chat', icon: Users, label: 'Chat de Groupe' },
          { id: 'membres', icon: Users, label: 'Membres' },
          { id: 'quiz', icon: ClipboardList, label: 'Évaluations' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'border-fuchsia-500 text-fuchsia-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20 font-medium'
            }`}
          >
            <tab.icon className="w-5 h-5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENU DES ONGLETS */}
      <AnimatePresence mode="wait">
        
        {/* MUR */}
        {activeTab === 'mur' && (
          <motion.div key="mur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            
            {/* Formulaire de publication */}
            <form onSubmit={handlePublishPost} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Annoncez quelque chose à votre classe..."
                className="w-full bg-transparent text-white outline-none resize-none min-h-[100px] mb-4 placeholder-slate-500"
              />

              {/* Preview Fichier sélectionné */}
              {selectedFile && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                  {getMediaType(selectedFile) === 'image' && <ImageIcon className="w-5 h-5 text-emerald-400" />}
                  {getMediaType(selectedFile) === 'video' && <Video className="w-5 h-5 text-fuchsia-400" />}
                  {getMediaType(selectedFile) === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
                  {getMediaType(selectedFile) === 'other' && <Paperclip className="w-5 h-5 text-slate-400" />}
                  <span className="text-sm text-slate-300 truncate flex-1">{selectedFile.name}</span>
                  <button type="button" onClick={removeSelectedFile} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-white/10 pt-4">
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,.pdf" />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 text-sm"
                  >
                    <Paperclip className="w-4 h-4" /> Joindre (Photo, Vidéo, PDF)
                  </button>
                </div>
                
                <button 
                  type="submit"
                  disabled={(!newPostContent.trim() && !selectedFile) || isUploading}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  {isUploading ? <span key="uploading" className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> {Math.round(uploadProgress)}%</span> : <span key="idle">Publier</span>}
                </button>
              </div>
            </form>

            {/* Liste des publications */}
            {posts.length === 0 ? (
               <div className="text-center py-10">
                <p className="text-slate-400">Aucune annonce publiée.</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{post.authorName || 'Professeur'}</h4>
                      <p className="text-xs text-slate-400">{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'À l\'instant'}</p>
                    </div>
                  </div>
                  {post.content && <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>}
                  {renderMedia(post)}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* CHAT */}
        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#0B0F19] border border-white/10 rounded-3xl flex flex-col h-[60vh]">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Users className="w-5 h-5 text-fuchsia-400" />
              <h3 className="font-bold text-white">Discussion de la Classe</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">Envoyez le premier message à votre classe !</div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === currentUser?.uid;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-500 mb-1 ml-2">{msg.senderName} {msg.senderRole === 'teacher' ? '(Vous)' : ''}</span>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isMe ? 'bg-indigo-500 text-white rounded-br-none' 
                        : msg.senderRole === 'teacher' ? 'bg-indigo-500 text-white rounded-bl-none' 
                        : 'bg-white/10 text-white rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez un message à la classe..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-500/50"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="w-12 h-12 bg-fuchsia-500 hover:bg-fuchsia-600 disabled:opacity-50 disabled:hover:bg-fuchsia-500 text-white rounded-xl flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}

        {/* MEMBRES */}
        {activeTab === 'membres' && (
          <motion.div key="membres" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-bold text-white">Élèves ({classData.studentsCount || 0})</h3>
              </div>
              <div className="p-6 text-center text-slate-400">
                Liste des élèves inscrits (IDs) : {classData.studentIds ? classData.studentIds.length : 0} élève(s).
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION QUIZ */}
        {activeTab === 'quiz' && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Quiz Chronométrés</h2>
              {!showQuizForm && (
                <button 
                  onClick={() => setShowQuizForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" /> Créer un Quiz
                </button>
              )}
            </div>

            {showQuizForm ? (
              <form onSubmit={handleSaveQuiz} className="bg-[#0B0F19] border border-fuchsia-500/30 rounded-3xl p-6 md:p-8 relative">
                <h3 className="text-2xl font-bold text-white mb-6">Nouveau Quiz</h3>
                
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Titre du Quiz</label>
                  <input 
                    type="text" required value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                    placeholder="Ex: Évaluation sur les Dérivées" 
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-fuchsia-500/50 text-white"
                  />
                </div>

                <div className="space-y-6 mb-8">
                  {questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-fuchsia-400">Question {qIndex + 1}</h4>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={q.multiple} 
                              onChange={(e) => updateQuestion(q.id, 'multiple', e.target.checked)}
                              className="rounded text-fuchsia-500 focus:ring-fuchsia-500 bg-white/10 border-white/20"
                            />
                            Choix Multiples
                          </label>
                          <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/10 px-3 py-1.5 rounded-lg">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <input 
                              type="number" min="5" max="300" 
                              value={q.timeLimit} 
                              onChange={(e) => updateQuestion(q.id, 'timeLimit', parseInt(e.target.value))}
                              className="w-12 bg-transparent outline-none text-white text-center"
                            /> sec
                          </div>
                        </div>
                      </div>

                      <input 
                        type="text" required value={q.text} onChange={e => updateQuestion(q.id, 'text', e.target.value)}
                        placeholder="Posez votre question ici..." 
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/10 rounded-xl outline-none focus:border-fuchsia-500/50 text-white mb-4"
                      />

                      <div className="space-y-3">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => toggleCorrectAnswer(q.id, optIndex)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                                q.correctAnswers.includes(optIndex) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-[#0B0F19] border-slate-500 text-transparent hover:border-emerald-500/50'
                              }`}
                              title="Marquer comme bonne réponse"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <input 
                              type="text" required value={opt} onChange={e => updateOption(q.id, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`} 
                              className={`flex-1 px-4 py-2 bg-[#0B0F19] border rounded-xl outline-none transition-colors ${
                                q.correctAnswers.includes(optIndex) ? 'border-emerald-500/50 text-emerald-100' : 'border-white/10 focus:border-fuchsia-500/50 text-white'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        type="button" onClick={() => addOption(q.id)}
                        className="mt-3 text-sm text-fuchsia-400 hover:text-fuchsia-300 font-medium"
                      >
                        + Ajouter une option
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mb-8">
                  <button type="button" onClick={addQuestion} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10">
                    + Ajouter une question
                  </button>
                </div>

                <div className="flex justify-end gap-4 border-t border-white/10 pt-6">
                  <button type="button" onClick={() => setShowQuizForm(false)} className="px-6 py-3 text-slate-400 hover:text-white font-bold transition-colors">
                    Annuler
                  </button>
                  <button type="submit" className="px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-fuchsia-500/20">
                    Publier le Quiz
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {quizzes.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                    <ClipboardList className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Aucun Quiz</h3>
                    <p className="text-slate-400">Créez votre première évaluation chronométrée.</p>
                  </div>
                ) : (
                  quizzes.map(quiz => (
                    <div key={quiz.id} className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{quiz.title}</h3>
                          <p className="text-slate-400 text-sm">Publié le {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'À l\'instant'} • {quiz.questionsCount} questions</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-sm font-bold border border-emerald-500/20">
                          Terminé
                        </span>
                      </div>
                      
                      {/* Résultats */}
                      <div>
                        <h4 className="font-bold text-slate-300 mb-4">Résultats des élèves</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-400 text-sm">
                                <th className="pb-3 pl-2">Élève</th>
                                <th className="pb-3">Score</th>
                                <th className="pb-3 text-right pr-2">Détails</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quiz.results?.map((res, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="py-3 pl-2 text-white font-medium">{res.studentName}</td>
                                  <td className="py-3 text-fuchsia-400 font-bold">{res.score}</td>
                                  <td className="py-3 text-right pr-2">
                                    <button className="text-sm text-indigo-400 hover:text-indigo-300">Voir</button>
                                  </td>
                                </tr>
                              )) || (
                                <tr><td colSpan="3" className="py-4 text-center text-slate-500">Aucune participation pour le moment.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
