import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, MessageSquare, ClipboardList, CheckCircle2, Loader, Send, Paperclip, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentClassView() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  const [activeTab, setActiveTab] = useState('mur');
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mur
  const [posts, setPosts] = useState([]);
  
  // Quiz
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]); // Array of arrays pour questions multiples

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

  // Récupérer les annonces (Mur)
  useEffect(() => {
    let subscription = null;
    const fetchPosts = async () => {
      const { data } = await supabase.from('class_posts').select('*').eq('classId', classId).order('createdAt', { ascending: false });
      if (data) setPosts(data);
    };
    fetchPosts();
    subscription = supabase.channel(`public:class_posts:${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_posts', filter: `classId=eq.${classId}` }, () => {
        fetchPosts();
      }).subscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [classId]);

  // Récupérer les quiz
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

  // Récupérer les messages du chat
  useEffect(() => {
    let subscription = null;
    const fetchMessages = async () => {
      const { data } = await supabase.from('class_messages').select('*').eq('classId', classId).order('createdAt', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    subscription = supabase.channel(`public:class_messages:${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_messages', filter: `classId=eq.${classId}` }, () => {
        fetchMessages();
      }).subscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [classId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log("Student: Bouton envoyer chat cliqué. Message:", newMessage);
    if (!newMessage.trim() || !currentUser) {
      console.log("Student: Annulation, message vide ou utilisateur non authentifié.");
      return;
    }
    
    try {
      const { error } = await supabase.from('class_messages').insert([{
        classId: classId,
        text: newMessage,
        senderId: currentUser.uid,
        senderName: userData?.name || 'Élève',
        senderRole: 'student'
      }]);
      if (error) throw error;
      console.log("Student: Message de chat envoyé avec succès !");
      setNewMessage('');
    } catch (error) {
      console.error("Student: ERREUR CRITIQUE d'envoi du message:", error);
      alert(`Erreur d'envoi du message:\n${error.message}`);
    }
  };

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(Array(quiz.questions.length).fill([]));
  };

  const handleSelectAnswer = (qIndex, optionIndex, multiple) => {
    const newAnswers = [...selectedAnswers];
    let currentAns = [...newAnswers[qIndex]];

    if (multiple) {
      if (currentAns.includes(optionIndex)) {
        currentAns = currentAns.filter(i => i !== optionIndex);
      } else {
        currentAns.push(optionIndex);
      }
    } else {
      currentAns = [optionIndex];
    }
    
    newAnswers[qIndex] = currentAns;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !currentUser) return;
    
    // Calcul du score simple
    let score = 0;
    activeQuiz.questions.forEach((q, i) => {
      const studentAns = selectedAnswers[i].sort();
      const correctAns = [...q.correctAnswers].sort();
      // On compare les tableaux
      if (JSON.stringify(studentAns) === JSON.stringify(correctAns)) {
        score += 1;
      }
    });

    try {
      const currentResults = activeQuiz.results || [];
      const { error } = await supabase.from('quizzes').update({
        results: [...currentResults, {
          studentId: currentUser.uid,
          studentName: userData?.name || 'Élève',
          score: score,
          submittedAt: new Date().toISOString()
        }]
      }).eq('id', activeQuiz.id);
      
      if (error) throw error;
      setActiveQuiz(null);
    } catch (error) {
      console.error("Erreur lors de la soumission du quiz:", error);
      alert(`Erreur soumission quiz:\n${error.message}`);
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
      <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline text-sm flex items-center gap-2 mt-4">
        <Paperclip className="w-4 h-4" /> {post.mediaName || 'Fichier joint'}
      </a>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  if (!classData) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Classe introuvable.</div>;
  }

  return (
    <div className="min-h-screen px-6 pt-8 pb-24 max-w-5xl mx-auto">
      
      <button 
        onClick={() => navigate('/student/home')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
      </button>

      {/* Header Classe */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${classData.color || 'from-emerald-500 to-teal-500'} opacity-20 blur-3xl rounded-full`} />
        
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">{classData.name}</h1>
          <p className="text-xl text-slate-300 font-medium mb-4">{classData.subject}</p>
          <div className="flex items-center gap-3">
            <span className="bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Vous faites partie des {classData.studentsCount || 1} élèves
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Interne */}
      <div className="flex border-b border-white/10 mb-8 overflow-x-auto hide-scrollbar">
        {[
          { id: 'mur', icon: MessageSquare, label: 'Mur & Annonces' },
          { id: 'chat', icon: Users, label: 'Chat de Groupe' },
          { id: 'quiz', icon: ClipboardList, label: 'Évaluations' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20 font-medium'
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
            {posts.length === 0 ? (
               <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Mur vide</h3>
                <p className="text-slate-400">Le professeur n'a publié aucune annonce pour le moment.</p>
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
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white">Discussion de la Classe</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">Envoyez le premier message !</div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === currentUser?.uid;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-500 mb-1 ml-2">{msg.senderName} {msg.senderRole === 'teacher' ? '(Prof)' : ''}</span>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isMe ? 'bg-emerald-500 text-white rounded-br-none' 
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
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}

        {/* QUIZ */}
        {activeTab === 'quiz' && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {activeQuiz ? (
               <div className="bg-[#0B0F19] border border-emerald-500/30 rounded-3xl p-6 md:p-8 relative">
                 <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                   <h3 className="text-2xl font-bold text-white">{activeQuiz.title}</h3>
                   <span className="text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl">
                     Question {currentQuestionIndex + 1} / {activeQuiz.questionsCount}
                   </span>
                 </div>

                 {activeQuiz.questions.length > 0 && (
                   <div className="mb-8">
                     <h4 className="text-xl text-white font-medium mb-6">{activeQuiz.questions[currentQuestionIndex].text}</h4>
                     
                     <div className="space-y-4">
                       {activeQuiz.questions[currentQuestionIndex].options.map((opt, i) => {
                         const isSelected = selectedAnswers[currentQuestionIndex].includes(i);
                         return (
                           <button
                             key={i}
                             onClick={() => handleSelectAnswer(currentQuestionIndex, i, activeQuiz.questions[currentQuestionIndex].multiple)}
                             className={`w-full text-left p-4 rounded-2xl border transition-all ${
                               isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100' : 'bg-white/5 border-white/10 text-slate-300 hover:border-emerald-500/50'
                             }`}
                           >
                             <div className="flex items-center gap-3">
                               <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                                 isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 text-transparent'
                               }`}>
                                 <CheckCircle2 className="w-4 h-4" />
                               </div>
                               {opt}
                             </div>
                           </button>
                         )
                       })}
                     </div>
                   </div>
                 )}

                 <div className="flex justify-between items-center pt-6 border-t border-white/10">
                   <button 
                     onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                     disabled={currentQuestionIndex === 0}
                     className="px-6 py-3 text-slate-400 hover:text-white font-bold transition-colors disabled:opacity-50"
                   >
                     Précédent
                   </button>

                   {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                     <button 
                       onClick={handleSubmitQuiz}
                       className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                     >
                       Soumettre le Quiz
                     </button>
                   ) : (
                     <button 
                       onClick={() => setCurrentQuestionIndex(Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + 1))}
                       className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                     >
                       Suivant
                     </button>
                   )}
                 </div>
               </div>
             ) : (
               <div className="space-y-6">
                  {quizzes.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                      <ClipboardList className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-white mb-2">Aucun Quiz</h3>
                      <p className="text-slate-400">Le professeur n'a pas encore publié d'évaluation.</p>
                    </div>
                  ) : (
                    quizzes.map(quiz => {
                      const hasParticipated = quiz.results?.some(r => r.studentId === currentUser?.uid);
                      const myResult = quiz.results?.find(r => r.studentId === currentUser?.uid);

                      return (
                        <div key={quiz.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1">{quiz.title}</h3>
                              <p className="text-slate-400 text-sm">Publié le {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'À l\'instant'} • {quiz.questionsCount} questions</p>
                            </div>
                            {hasParticipated ? (
                              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-sm font-bold border border-emerald-500/20">
                                Note : {myResult.score}/{quiz.questionsCount}
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleStartQuiz(quiz)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                              >
                                Commencer
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
