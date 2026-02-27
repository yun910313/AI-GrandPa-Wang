import React, { useState, useCallback, useEffect } from 'react';
import { AppTab } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import MedicationList from './components/MedicationList.tsx';
import HealthMonitor from './components/HealthMonitor.tsx';
import LiveVoiceChat from './components/LiveVoiceChat.tsx';
import VisionAssistant from './components/VisionAssistant.tsx';
import Navbar from './components/Navbar.tsx';
import Login from './components/Login.tsx';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [user, setUser] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('wang_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setInitialized(true);
  }, []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    localStorage.setItem('wang_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    speak("已登出");
    setUser(null);
    localStorage.removeItem('wang_user');
  };

  const goToHome = () => {
    setActiveTab(AppTab.HOME);
    speak("返回首頁");
  };

  const handleNavigate = (tab: AppTab) => {
    setActiveTab(tab);
  };

  if (!initialized) {
    return null; // 或者顯示載入中
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} speak={speak} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.HOME:
        return <Dashboard onVoiceCall={() => setActiveTab(AppTab.CHAT)} onNavigate={handleNavigate} />;
      case AppTab.MEDS:
        return <MedicationList onBack={goToHome} />;
      case AppTab.HEALTH:
        return <HealthMonitor onBack={goToHome} />;
      case AppTab.CHAT:
        return <LiveVoiceChat onBack={goToHome} />;
      case AppTab.VISION:
        return <VisionAssistant onBack={goToHome} />;
      default:
        return <Dashboard onVoiceCall={() => setActiveTab(AppTab.CHAT)} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40 flex items-center justify-between h-20 shrink-0 shadow-sm">
        <h1
          onClick={() => speak("王爺爺")}
          className="text-2xl font-black text-blue-600 flex items-center gap-3 cursor-pointer"
        >
          <i className="fas fa-heart-pulse text-3xl"></i>
          王爺爺
        </h1>
        <div className="flex gap-2">
          {activeTab !== AppTab.HOME && (
            <button
              onClick={goToHome}
              aria-label="返回首頁"
              className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 active:bg-slate-200 transition-colors"
            >
              <i className="fas fa-home text-xl"></i>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
            title="登出"
          >
            <i className="fas fa-sign-out-alt text-xl"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-28">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default App;
