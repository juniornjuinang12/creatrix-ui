import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import RoleSelection from './components/RoleSelection';
import TeacherLayout from './components/teacher/TeacherLayout';
import TeacherHome from './components/teacher/TeacherHome';
import TeacherChat from './components/teacher/TeacherChat';
import TeacherAIAssistant from './components/teacher/TeacherAIAssistant';
import TeacherProfile from './components/teacher/TeacherProfile';
import TeacherClassView from './components/teacher/TeacherClassView';
import TeacherResources from './components/teacher/TeacherResources';
import TeacherToolSummary from './components/teacher/TeacherToolSummary';

// Imports Étudiants
import StudentLayout from './components/student/StudentLayout';
import StudentHome from './components/student/StudentHome';
import StudentCommunity from './components/student/StudentCommunity';
import StudentQuizzes from './components/student/StudentQuizzes';
import StudentTools from './components/student/StudentTools';
import StudentVideoTranslate from './components/student/StudentVideoTranslate';
import StudentAIAssistant from './components/student/StudentAIAssistant';
import StudentChat from './components/student/StudentChat';
import StudentProfile from './components/student/StudentProfile';
import StudentClassView from './components/student/StudentClassView';


import { AuthProvider, useAuth } from './contexts/AuthContext';

// Composant pour l'effet de fond global (blobs)
const GlobalBackground = () => (
  <>
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-20 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-brand-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
    </div>
  </>
);

const GlobalNav = () => {
  const location = useLocation();
  // Masquer le logo global dans les espaces spécifiques (chat, IA, accueil)
  if (location.pathname.startsWith('/teacher') || location.pathname.startsWith('/student')) return null;
  
  return (
    <nav className="fixed w-full z-50 top-0 p-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-accent to-brand-secondary flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <span className="font-display font-bold text-2xl tracking-tight">Creatix<span className="text-brand-accent">.</span></span>
            </div>
        </div>
    </nav>
  );
};

// Composant pour protéger les routes
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white', minHeight: '100vh' }}>
          <h1>Erreur Critique de l'Application</h1>
          <p>{this.state.error?.toString()}</p>
          <pre>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
      <div className="min-h-screen text-white font-sans selection:bg-brand-secondary selection:text-white relative">
        <GlobalBackground />
        
        <GlobalNav />

        <Routes>
          <Route path="/" element={<Navigate to="/signup" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          
          {/* Espace Enseignant (Protégé) */}
          <Route path="/teacher" element={
            <PrivateRoute>
              <TeacherLayout />
            </PrivateRoute>
          }>
            <Route path="home" element={<TeacherHome />} />
            <Route path="chat" element={<TeacherChat />} />
            <Route path="ai-assistant" element={<TeacherAIAssistant />} />
            <Route path="profile" element={<TeacherProfile />} />
            <Route path="class/:classId" element={<TeacherClassView />} />
            <Route path="resources" element={<TeacherResources />} />
            <Route path="tools/summary" element={<TeacherToolSummary />} />
            <Route path="tools/video-translate" element={<StudentVideoTranslate />} />
          </Route>

          {/* Espace Élève (Protégé) */}
          <Route path="/student" element={
            <PrivateRoute>
              <StudentLayout />
            </PrivateRoute>
          }>
            <Route path="home" element={<StudentHome />} />
            <Route path="community" element={<StudentCommunity />} />
            <Route path="quizzes" element={<StudentQuizzes />} />
            <Route path="tools" element={<StudentTools />} />
            <Route path="tools/summary" element={<TeacherToolSummary />} /> {/* On réutilise le même composant pour le moment */}
            <Route path="tools/video-translate" element={<StudentVideoTranslate />} />
            <Route path="ai-assistant" element={<StudentAIAssistant />} />
            <Route path="chat" element={<StudentChat />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="class/:classId" element={<StudentClassView />} />
          </Route>
        </Routes>
      </div>
    </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
