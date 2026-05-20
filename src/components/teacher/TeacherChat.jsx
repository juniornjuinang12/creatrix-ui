import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MoreVertical, Paperclip, Smile, Send, Mic, Phone, Video as VideoIcon, Check, CheckCheck, MessageCircle, X, Image as ImageIcon, Video, FileText, Loader, Globe } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';

export default function TeacherChat() {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');
  const studentName = searchParams.get('studentName');
  const contactColor = searchParams.get('studentColor');
  
  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(0);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // Nouveaux états pour Emojis et Audio
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Nouveaux états pour ElevenLabs
  const [isDubbing, setIsDubbing] = useState({});
  const [showTranslationMenu, setShowTranslationMenu] = useState(null);

  const EMOJIS = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾','❤️','🔥','👍','🎉','✨'];
  const LANGUAGES = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'Anglais' },
    { code: 'es', name: 'Espagnol' },
    { code: 'de', name: 'Allemand' },
    { code: 'it', name: 'Italien' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ja', name: 'Japonais' },
    { code: 'zh', name: 'Chinois' }
  ];

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  // 1. Récupérer les contacts et les derniers messages (WhatsApp style)
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchContactsAndMessages = async () => {
      const { data: usersData } = await supabase.from('users').select('*').neq('id', currentUser.uid);
      const { data: msgsData } = await supabase.from('direct_messages').select('*').ilike('chatId', `%${currentUser.uid}%`);
      
      let users = usersData || [];
      let msgs = msgsData || [];
      
      const contactsWithActivity = users.map(u => {
        const chatId = [currentUser.uid, u.id].sort().join('_');
        const chatMsgs = msgs.filter(m => m.chatId === chatId).sort((a, b) => {
          const timeA = a.created_at || a.createdAt ? new Date(a.created_at || a.createdAt).getTime() : 0;
          const timeB = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt).getTime() : 0;
          return timeA - timeB;
        });
        const lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : null;
        
        return {
          ...u,
          lastMessage: lastMsg ? (lastMsg.text || 'Pièce jointe') : 'Nouveau membre',
          lastMessageTime: lastMsg ? new Date(lastMsg.createdAt || lastMsg.created_at).getTime() : 0,
          time: lastMsg ? lastMsg.time : '',
          unread: 0
        };
      });
      
      // WhatsApp style sort
      contactsWithActivity.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      setContacts(contactsWithActivity);
    };

    fetchContactsAndMessages();
    
    const subUsers = supabase.channel('public:users:teacher_chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchContactsAndMessages();
      }).subscribe();

    const subMsgs = supabase.channel('public:direct_messages:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
         if (payload.new && payload.new.chatId && payload.new.chatId.includes(currentUser.uid)) {
            fetchContactsAndMessages();
         }
      }).subscribe();
      
    return () => { supabase.removeChannel(subUsers); supabase.removeChannel(subMsgs); };
  }, [currentUser]);

  // 1.5. Sélection automatique via URL
  useEffect(() => {
    if (studentId && contacts.length > 0) {
      const foundInFirebase = contacts.find(c => c.id === studentId || c.uid === studentId);
      if (foundInFirebase) {
        setActiveChat(foundInFirebase);
      }
    }
  }, [studentId, contacts]);

  // 2. Récupérer les messages pour le chat actif
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const chatId = [currentUser.uid, activeChat.id || activeChat.uid].sort().join('_');
    
    const fetchMessages = async () => {
      // Nous enlevons order('createdAt') car la colonne s'appelle souvent created_at, ce qui fait crasher la requête
      const { data, error } = await supabase.from('direct_messages').select('*').eq('chatId', chatId);
      if (error) console.error("Erreur de récupération des messages:", error);
      if (data) {
        const sortedData = data.sort((a, b) => {
          const timeA = a.created_at || a.createdAt ? new Date(a.created_at || a.createdAt).getTime() : 0;
          const timeB = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt).getTime() : 0;
          return timeA - timeB;
        });
        setMessages(sortedData);
        if (sortedData.length > prevMessagesLength.current && prevMessagesLength.current !== 0) {
          const lastMsg = sortedData[sortedData.length - 1];
          if (lastMsg && lastMsg.senderId !== currentUser.uid) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
          }
        }
        prevMessagesLength.current = sortedData.length;
      }
    };
    
    fetchMessages();
    
    const subscription = supabase.channel(`public:direct_messages:${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `chatId=eq.${chatId}` }, () => {
        fetchMessages();
      }).subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [activeChat, currentUser]);

  const getMediaType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf') return 'pdf';
    return 'document';
  };

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

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `vocal_${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(file);
        // On arrête les pistes du micro
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erreur d'accès au micro:", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((inputText.trim() === '' && !selectedFile) || !activeChat || !currentUser || isUploading) return;

    const chatId = [currentUser.uid, activeChat.id || activeChat.uid].sort().join('_');
    const messageText = inputText;
    
    setInputText('');
    setIsUploading(true);
    setUploadProgress(0);

    let mediaUrl = null;
    let mediaType = null;
    let mediaName = null;

    try {
      if (selectedFile) {
        mediaType = getMediaType(selectedFile);
        mediaName = selectedFile.name;
        const filePath = `direct_messages/${chatId}/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
        }, 200);

        const { error: uploadError } = await supabase.storage
          .from('creatrix_storage')
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });
          
        clearInterval(progressInterval);

        if (uploadError) throw new Error(uploadError.message);
        
        setUploadProgress(100);
        const { data: urlData } = supabase.storage.from('creatrix_storage').getPublicUrl(filePath);
        mediaUrl = urlData.publicUrl;
      }

      // OPTIMISTIC UPDATE
      const tempMsg = {
        id: Date.now(), // ID temporaire
        chatId: chatId,
        text: messageText,
        senderId: currentUser.uid,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        createdAt: new Date().toISOString(),
        mediaUrl,
        mediaType,
        mediaName
      };
      setMessages(prev => [...prev, tempMsg]);

      const { error } = await supabase.from('direct_messages').insert([{
        chatId: chatId,
        text: messageText,
        senderId: currentUser.uid,
        time: tempMsg.time,
        status: 'sent',
        mediaUrl,
        mediaType,
        mediaName
      }]);
      if (error) throw error;
      
      removeSelectedFile();
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      alert(`Erreur d'envoi: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTranslateVideo = async (msg, targetLang) => {
    try {
      setShowTranslationMenu(null);
      setIsDubbing(prev => ({ ...prev, [msg.id]: true }));
      
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      
      // 1. Create dubbing project
      const formData = new FormData();
      formData.append('source_url', msg.mediaUrl);
      formData.append('target_lang', targetLang);
      formData.append('watermark', 'true');
      
      const createRes = await fetch('https://api.elevenlabs.io/v1/dubbing', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData
      });
      
      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.detail?.message || "Erreur création projet ElevenLabs");
      }
      const { dubbing_id } = await createRes.json();
      
      // 2. Polling for status
      let isDone = false;
      while (!isDone) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const statusRes = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbing_id}`, {
          headers: { 'xi-api-key': apiKey }
        });
        const statusData = await statusRes.json();
        if (statusData.status === 'dubbed') isDone = true;
        if (statusData.status === 'failed') throw new Error("Le doublage a échoué.");
      }
      
      // 3. Download the file
      const downloadRes = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbing_id}/audio/${targetLang}`, {
        headers: { 'xi-api-key': apiKey }
      });
      
      if (!downloadRes.ok) throw new Error("Erreur de téléchargement du doublage");
      const videoBlob = await downloadRes.blob();
      const translatedFile = new File([videoBlob], `translated_${targetLang}_${Date.now()}.mp4`, { type: 'video/mp4' });
      
      // 4. Upload to Supabase
      const chatId = [currentUser.uid, activeChat.id || activeChat.uid].sort().join('_');
      const filePath = `direct_messages/${chatId}/${translatedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('creatrix_storage')
        .upload(filePath, translatedFile, { cacheControl: '3600', upsert: false });
        
      if (uploadError) throw new Error(uploadError.message);
      
      const { data: urlData } = supabase.storage.from('creatrix_storage').getPublicUrl(filePath);
      const newMediaUrl = urlData.publicUrl;
      
      // 5. Create new message
      const langObj = LANGUAGES.find(l => l.code === targetLang);
      const langName = langObj ? langObj.name : targetLang;
      
      const tempMsg = {
        id: Date.now(),
        chatId: chatId,
        text: `🎥 Vidéo traduite en ${langName}`,
        senderId: currentUser.uid,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        createdAt: new Date().toISOString(),
        mediaUrl: newMediaUrl,
        mediaType: 'video',
        mediaName: `translated_${targetLang}.mp4`
      };
      setMessages(prev => [...prev, tempMsg]);
      
      await supabase.from('direct_messages').insert([{
        chatId: chatId,
        text: tempMsg.text,
        senderId: currentUser.uid,
        time: tempMsg.time,
        status: 'sent',
        mediaUrl: newMediaUrl,
        mediaType: 'video',
        mediaName: tempMsg.mediaName
      }]);

      await supabase.from('translated_videos').insert([{
        userId: currentUser.uid,
        originalName: msg.mediaName || 'video.mp4',
        videoUrl: newMediaUrl,
        language: targetLang
      }]);
      
    } catch (error) {
      console.error("Erreur de traduction:", error);
      alert(`Erreur de traduction : ${error.message}`);
    } finally {
      setIsDubbing(prev => ({ ...prev, [msg.id]: false }));
    }
  };

  const renderMedia = (msg) => {
    if (!msg.mediaUrl) return null;
    if (msg.mediaType === 'image') {
      return <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer"><img src={msg.mediaUrl} alt="Image" className="max-w-full rounded-xl mt-2 max-h-64 object-cover cursor-pointer" /></a>;
    }
    if (msg.mediaType === 'video') {
      return (
        <div className="relative mt-2">
          <video src={msg.mediaUrl} controls className="max-w-full rounded-xl max-h-64" />
          
          <div className="absolute top-2 right-2 z-10">
            {isDubbing[msg.id] ? (
              <div className="bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-2 animate-pulse">
                <Loader className="w-3 h-3 animate-spin" /> Traduction...
              </div>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setShowTranslationMenu(showTranslationMenu === msg.id ? null : msg.id)}
                  className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors shadow-lg flex items-center gap-2"
                  title="Traduire cette vidéo avec ElevenLabs"
                >
                  <Globe className="w-4 h-4" />
                </button>
                
                <AnimatePresence>
                  {showTranslationMenu === msg.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute top-full right-0 mt-2 bg-[#0B0F19] border border-white/10 rounded-xl shadow-2xl p-2 w-40 z-20 flex flex-col gap-1"
                    >
                      <span className="text-xs text-slate-400 font-medium px-2 py-1 uppercase tracking-wider">Langue cible</span>
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => handleTranslateVideo(msg, lang.code)}
                          className="text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      );
    }
    if (msg.mediaType === 'audio') {
      return <audio src={msg.mediaUrl} controls className="max-w-full mt-2 h-10" />;
    }
    return (
      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-black/20 rounded-xl mt-2 hover:bg-black/30 transition-colors text-white">
        {msg.mediaType === 'pdf' ? <FileText className="w-5 h-5 text-rose-400" /> : <Paperclip className="w-5 h-5 text-indigo-400" />}
        <span className="text-sm truncate max-w-[200px]">{msg.mediaName || 'Fichier'}</span>
      </a>
    );
  };

  const filteredContacts = contacts.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-[calc(100vh-100px)] w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-6 pb-4 flex gap-6">
      
      {/* ---------------- SIDEBAR (Contacts) ---------------- */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-[380px] hidden md:flex flex-col bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      >
        {/* Header Sidebar */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Discussions</h2>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-300" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher ou démarrer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder-slate-500 text-sm"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 pb-2">
          {filteredContacts.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => setActiveChat(contact)}
              className={`group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-200 mb-1 ${activeChat?.id === contact.id ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5'}`}
            >
              {/* Avatar */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner ${contact.avatarColor || 'bg-indigo-500'}`}>
                  {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                </div>
                {contact.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-fuchsia-500 rounded-full border-2 border-[#0B0F19] flex items-center justify-center text-[10px] font-bold text-white">
                    {contact.unread}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-white font-semibold text-sm truncate">{contact.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium ${contact.unread > 0 ? 'text-fuchsia-400' : 'text-slate-500'}`}>
                      {contact.role === 'student' ? 'Élève' : 'Professeur'}
                    </span>
                  </div>
                </div>
                <p className={`text-xs truncate ${contact.unread > 0 ? 'text-amber-300 font-medium' : 'text-slate-500'}`}>
                  {contact.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ---------------- MAIN CHAT AREA ---------------- */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative"
      >
        {/* Glow de fond du chat */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>

        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-inner ${activeChat.avatarColor || 'bg-indigo-500'}`}>
                  {activeChat.name ? activeChat.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h2 className="text-white font-bold">{activeChat.name}</h2>
                  <p className="text-indigo-400 text-xs font-medium">En ligne</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-slate-300">
                  <VideoIcon className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-slate-300">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-slate-300">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 z-10 custom-scrollbar space-y-6">
              <div className="flex justify-center mb-6">
                <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-medium">
                  Aujourd'hui
                </span>
              </div>

              <AnimatePresence>
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                        <div 
                          className={`px-5 py-3 rounded-3xl relative shadow-lg ${
                            isMe 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm' 
                            : 'bg-white/10 border border-white/5 text-slate-200 rounded-bl-sm backdrop-blur-md'
                          }`}
                        >
                          {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                          {renderMedia(msg)}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-500 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span>{msg.time}</span>
                          {isMe && (
                            msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-cyan-400" /> : <Check className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-xl z-10 rounded-b-[32px] relative">
              
              {/* Emoji Picker Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 20, scale: 0.95 }} 
                    className="absolute bottom-full left-4 mb-4 bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl p-3 w-72 h-64 overflow-y-auto hide-scrollbar z-50 grid grid-cols-6 gap-2 content-start"
                  >
                    {EMOJIS.map((emoji, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:bg-white/10 rounded-lg p-1 transition-colors flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview Fichier sélectionné */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center gap-3 mb-3 p-3 bg-white/10 rounded-xl border border-white/10 max-w-sm">
                    {getMediaType(selectedFile) === 'image' && <ImageIcon className="w-5 h-5 text-indigo-400" />}
                    {getMediaType(selectedFile) === 'video' && <VideoIcon className="w-5 h-5 text-fuchsia-400" />}
                    {getMediaType(selectedFile) === 'audio' && <Mic className="w-5 h-5 text-amber-400" />}
                    {getMediaType(selectedFile) === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
                    {getMediaType(selectedFile) === 'document' && <Paperclip className="w-5 h-5 text-slate-400" />}
                    <span className="text-sm text-slate-300 truncate flex-1">{selectedFile.name}</span>
                    <button type="button" onClick={removeSelectedFile} className="p-1 hover:bg-white/20 rounded-md text-slate-400 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${showEmojiPicker ? 'bg-white/20 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}>
                  <Smile className="w-6 h-6" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isRecording} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200 shrink-0 disabled:opacity-50">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  {isRecording ? (
                    <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-full pl-5 pr-12 py-3.5 flex items-center gap-3 text-rose-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-medium text-sm">Enregistrement vocal... {formatDuration(recordingDuration)}</span>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      placeholder={isUploading ? `Envoi en cours... ${uploadProgress}%` : "Écrivez un message..."}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onFocus={() => setShowEmojiPicker(false)}
                      disabled={isUploading}
                      className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-12 py-3.5 text-white placeholder-slate-500 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
                    />
                  )}
                </div>

                {isRecording ? (
                  <button type="button" onClick={stopRecording} className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shrink-0 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                    <Check className="w-6 h-6" />
                  </button>
                ) : (inputText.trim() === '' && !selectedFile) ? (
                  <button type="button" onMouseDown={startRecording} disabled={isUploading} className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/30 transition-colors shrink-0 disabled:opacity-50">
                    <Mic className="w-5 h-5" />
                  </button>
                ) : (
                  <motion.button 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    type="submit" 
                    disabled={isUploading}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 transition-all shrink-0 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isUploading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-1" />}
                  </motion.button>
                )}
              </form>
            </div>
          </>
        ) : (
          /* Empty State if no chat is selected (rare but good to have) */
          <div className="flex-1 flex flex-col items-center justify-center z-10 p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <MessageCircle className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Vos Messages</h2>
            <p className="text-slate-400 max-w-sm">Sélectionnez une conversation pour commencer à discuter avec vos élèves et groupes de classe.</p>
          </div>
        )}
      </motion.div>

      {/* Global styles for custom scrollbar within this component */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
