import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';

export default function StudentQuizzes() {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: [selectedOptions] }

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data } = await supabase.from('quizzes').select('*').eq('status', 'published');
      if (data) setQuizzes(data);
    };
    fetchQuizzes();
    
    const sub = supabase.channel('public:quizzes:student')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes', filter: 'status=eq.published' }, () => {
        fetchQuizzes();
      }).subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Timer logic for the active question
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [activeQuiz, timeLeft]);

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(quiz.questions[0]?.timeLimit || 30);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(activeQuiz.questions[currentQuestionIndex + 1].timeLimit || 30);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = () => {
    alert("Quiz terminé et envoyé au professeur !");
    setActiveQuiz(null);
  };

  const toggleAnswer = (qId, optionIndex, isMultiple) => {
    setAnswers(prev => {
      const currentAns = prev[qId] || [];
      if (isMultiple) {
        if (currentAns.includes(optionIndex)) {
          return { ...prev, [qId]: currentAns.filter(i => i !== optionIndex) };
        } else {
          return { ...prev, [qId]: [...currentAns, optionIndex] };
        }
      } else {
        return { ...prev, [qId]: [optionIndex] };
      }
    });
  };

  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentQuestionIndex];
    const currentAns = answers[currentQ.id] || [];

    return (
      <div className="min-h-screen px-6 pt-12 pb-24 max-w-4xl mx-auto flex flex-col justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 h-1 bg-white/10 w-full">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((currentQuestionIndex) / activeQuiz.questions.length) * 100}%` }} />
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-emerald-400 font-bold mb-1">Question {currentQuestionIndex + 1} sur {activeQuiz.questions.length}</p>
              <h2 className="text-2xl font-bold text-white">{activeQuiz.title}</h2>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${timeLeft <= 5 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Clock className="w-5 h-5" /> {timeLeft}s
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl text-white font-medium">{currentQ.text}</h3>
            {currentQ.multiple && <p className="text-slate-400 text-sm mt-2">Plusieurs réponses possibles.</p>}
          </div>

          <div className="space-y-4 mb-10">
            {currentQ.options.map((opt, i) => {
              const isSelected = currentAns.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleAnswer(currentQ.id, i, currentQ.multiple)}
                  className={`w-full text-left px-6 py-4 rounded-2xl border transition-all flex items-center gap-4 ${
                    isSelected ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#0B0F19] border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'}`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              {currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Terminer' : 'Suivant'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Mes <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Évaluations</span>
        </h1>
        <p className="text-slate-400 font-medium">Testez vos connaissances avec les quiz de vos professeurs.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
            <ClipboardList className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400">Aucune évaluation disponible pour le moment.</p>
          </div>
        ) : (
          quizzes.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden"
            >
              <div className="mb-6 relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">{quiz.title}</h3>
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> {quiz.questionsCount} questions
                </p>
                <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4" /> Chronométré
                </p>
              </div>
              <div className="mt-auto relative z-10">
                <button 
                  onClick={() => startQuiz(quiz)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-transparent hover:border-emerald-500/30 rounded-xl transition-all font-bold text-sm"
                >
                  Démarrer le Quiz
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
