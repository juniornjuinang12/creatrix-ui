import { useState, useRef, useEffect, memo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, AlertCircle, Loader2, Menu, X, Home, BookOpen, PenTool, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const API_KEY = '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';
const SYSTEM_PROMPT = `Tu es Creatix AI, un tuteur éducatif propulsé par l'IA créé pour la plateforme Creatix. Ton rôle est d'aider les élèves à comprendre leurs cours, résoudre des problèmes, et apprendre de manière interactive. Réponds toujours de manière pédagogique, encourageante et concise.
IMPORTANT MATHÉMATIQUES : Tu DOIS écrire TOUTES les équations et formules mathématiques en format LaTeX en utilisant le délimiteur $ pour les équations en ligne (ex: $x=2$) et $$ pour les blocs d'équations (ex: $$x^2=4$$). N'utilise JAMAIS les crochets \\[ ou \\] ou les parenthèses \\( ou \\) pour délimiter les mathématiques !
IMPORTANT IMAGES ET GRAPHIQUES : Tu es capable de générer visuellement tout ce que l'utilisateur demande.
1. Pour générer des IMAGES (photos, dessins, affiches), tu DOIS obligatoirement insérer une image Markdown (avec le point d'exclamation ! au début).
Format exact : ![Image](https://image.pollinations.ai/prompt/la-description-en-anglais-separee-par-des-tirets?width=800&height=600&nologo=true)
Exemple : ![Affiche Creatix](https://image.pollinations.ai/prompt/A-beautiful-poster-for-Creatix-Global-app-with-modern-UI?width=800&height=600&nologo=true)
N'oublie JAMAIS le point d'exclamation ! au début. Ne fais pas de lien classique.
2. Pour TRACER LA COURBE D'UNE FONCTION mathématique, calcule toi-même quelques points (par exemple de -5 à 5) et génère un graphique précis via QuickChart en Markdown (toujours avec le !).
Exemple exact pour f(x)=x^2 :
![Courbe de f(x)](https://quickchart.io/chart?c={type:'line',data:{labels:[-3,-2,-1,0,1,2,3],datasets:[{label:'f(x)=x^2',data:[9,4,1,0,1,4,9],borderColor:'emerald',fill:false}]}})
Adapte les 'labels' (les x) et les 'data' (les y) pour correspondre à la fonction demandée.`;

const CodeBlock = memo(({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');
  
  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return <code className="bg-black/30 px-1.5 py-0.5 rounded text-emerald-200 text-[13px]" {...props}>{children}</code>;
  }

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/5">
        <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">{match ? match[1] : 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié' : 'Copier le code'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <code className={`text-[13px] text-slate-200 font-mono ${className || ''}`} {...props}>{children}</code>
      </div>
    </div>
  );
});

const MessageBubble = memo(forwardRef(({ msg, isUser }, ref) => {
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 sm:gap-6 w-full ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${isUser ? 'bg-slate-700 border border-slate-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/30'}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className={`p-4 sm:p-5 rounded-[24px] relative max-w-[85%] ${isUser ? 'bg-white/10 border border-white/10 text-white rounded-tr-sm backdrop-blur-md' : 'bg-[#0B0F19]/40 border border-emerald-500/10 text-slate-200 rounded-tl-sm backdrop-blur-md shadow-lg'}`}>
        {msg.image && <img src={msg.image} alt="Upload utilisateur" className="max-w-full sm:max-w-sm rounded-xl mb-3 shadow-md" />}
        {msg.text && (
          <div className="text-[14px] leading-relaxed font-light markdown-content">
            <ReactMarkdown
            remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}
            components={{
              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
              li: ({node, ...props}) => <li className="mb-1" {...props} />,
              h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
              strong: ({node, ...props}) => <strong className="font-semibold text-emerald-300" {...props} />,
              code: CodeBlock
            }}
          >
            {msg.text.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$')}
          </ReactMarkdown>
        </div>
        )}
      </div>
    </motion.div>
  );
}));

export default function StudentAIAssistant() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const navItems = [
    { path: '/student/home', icon: Home, label: 'Accueil' },
    { path: '/student/community', icon: User, label: 'Communauté' },
    { path: '/student/quizzes', icon: BookOpen, label: 'Évaluations' },
    { path: '/student/tools', icon: PenTool, label: 'Outils' },
    { path: '/student/ai-assistant', icon: Sparkles, label: 'Assistant IA' },
    { path: '/student/profile', icon: User, label: 'Moi' },
  ];

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isLoading]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchChats = async () => {
      const { data } = await supabase.from('ai_chats').select('*').eq('userId', currentUser.uid).order('createdAt', { ascending: true });
      if (data) {
        if (data.length === 0) {
          await supabase.from('ai_chats').insert([{
            role: 'model',
            text: "Bonjour ! Je suis Creatix AI, ton tuteur personnel. Je suis là pour t'aider à comprendre tes cours. Quelle est ta question ?",
            userId: currentUser.uid
          }]);
        } else {
          setMessages(data);
        }
      }
    };
    
    fetchChats();
    
    const sub = supabase.channel('public:ai_chats:student')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_chats', filter: `userId=eq.${currentUser.uid}` }, fetchChats)
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [currentUser]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((inputText.trim() === '' && !selectedImage) || isLoading) return;

    let inlineData = null;
    let imageBase64ForUI = null;
    if (selectedImage) {
      inlineData = { data: imagePreview.split(',')[1], mimeType: selectedImage.type };
      imageBase64ForUI = imagePreview;
    }

    const userMessageText = inputText.trim();
    
    // OPTIMISTIC UPDATE POUR LE MESSAGE UTILISATEUR
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      text: userMessageText,
      image: imageBase64ForUI || null,
      userId: currentUser.uid
    };
    setMessages(prev => [...prev, tempUserMsg]);
    
    setInputText(''); setSelectedImage(null); setImagePreview(null); setIsLoading(true); setError(null);

    // Envoi en BDD en arrière-plan sans bloquer l'interface
    try {
      const { error: dbError } = await supabase.from('ai_chats').insert([{
        role: 'user', text: userMessageText, image: imageBase64ForUI || null, userId: currentUser.uid
      }]);
      if (dbError) console.error("Erreur insertion BDD user:", dbError.message);
    } catch(err) { 
      console.error(err);
    }

    try {
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.filter(msg => msg.id !== 1).map(msg => {
          const content = [];
          if (msg.text) content.push({ type: "text", text: msg.text });
          if (msg.image) content.push({ type: "image_url", image_url: { url: msg.image } });
          return {
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: content.length > 0 ? content : "Image envoyée"
          };
        })
      ];
      
      const currentContent = [];
      if (userMessageText !== '') currentContent.push({ type: 'text', text: userMessageText });
      else currentContent.push({ type: 'text', text: "Analyse cette image s'il te plaît." });
      if (imageBase64ForUI) currentContent.push({ type: 'image_url', image_url: { url: imageBase64ForUI } });

      apiMessages.push({ role: 'user', content: currentContent });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: apiMessages,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Erreur API OpenAI');
      }

      const result = await response.json();
      const aiResponse = result.choices[0].message.content;
      
      // OPTIMISTIC UPDATE POUR LA RÉPONSE IA
      const tempAiMsg = {
        id: Date.now() + 1,
        role: 'model',
        text: aiResponse,
        userId: currentUser.uid
      };
      setMessages(prev => [...prev, tempAiMsg]);
      
      const { error: aiDbError } = await supabase.from('ai_chats').insert([{
        role: 'model', text: aiResponse, userId: currentUser.uid
      }]);
      if (aiDbError) {
        console.error("Erreur insertion réponse IA:", aiDbError);
      }
    } catch (err) {
      if (err.message && err.message.includes('429')) setError("Limite d'utilisation atteinte. OpenAI a besoin d'une pause.");
      else setError(err.message || "Une erreur s'est produite lors de la communication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col relative bg-[#030712] overflow-hidden">
      <div className="flex-1 overflow-y-auto pt-16 pb-32 custom-scrollbar w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <AnimatePresence>
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} isUser={msg.role === 'user'} />)}
          </AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 max-w-[95%]">
              <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600"><Bot className="w-4 h-4 text-white" /></div>
              <div className="p-3 sm:p-4 rounded-2xl bg-[#0B0F19]/60 border border-emerald-500/20 flex items-center gap-2"><Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /><span className="text-[13px] text-emerald-300 font-medium animate-pulse">L'IA réfléchit...</span></div>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto max-w-lg"><AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><p className="text-sm text-red-200">{error}</p></motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full z-10 transition-all bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pt-10 pb-6">
        <div className="max-w-3xl mx-auto px-4 w-full relative">
          <AnimatePresence>
            {imagePreview && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full left-6 mb-3">
                <div className="relative inline-block"><img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-white/20" /><button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1"><X className="w-3 h-3 text-white" /></button></div>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSendMessage} className={`relative w-full flex items-end gap-2 bg-[#2f2f2f] hover:bg-[#383838] border border-white/5 p-1.5 sm:p-2 shadow-lg rounded-[24px]`}>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 mb-0.5 ml-1 text-slate-400 hover:text-white shrink-0"><ImageIcon className="w-5 h-5" /></button>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            <div className="flex-1 relative">
              <textarea placeholder="Pose une question à Creatix AI..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} className="w-full bg-transparent resize-none py-2 pl-2 pr-3 text-white placeholder-[#9b9b9b] text-[14px] outline-none min-h-[40px] max-h-[150px] custom-scrollbar" rows="1" />
            </div>
            <button disabled={(inputText.trim() === '' && !selectedImage) || isLoading} type="submit" className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 ${(inputText.trim() === '' && !selectedImage) ? 'bg-[#424242] text-[#171717]' : 'bg-white text-black'}`}><Send className="w-3.5 h-3.5 ml-0.5" /></button>
          </form>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }`}} />
    </div>
  );
}
