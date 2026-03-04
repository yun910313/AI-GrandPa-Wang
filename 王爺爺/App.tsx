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
  const isFirstRender = React.useRef(true);
  const silenceNextNavigation = React.useRef(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('wang_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setInitialized(true);
  }, []);

  // --- 背景 GPS 定位回報 ---
  useEffect(() => {
    if (!user || !user.elderly_id) return;

    let watchId: number | null = null;

    const sendLocation = async (lat: number, lng: number) => {
      try {
        await fetch('/api/gps-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            elderly_id: user.elderly_id,
            latitude: lat,
            longitude: lng,
            address: "長輩端自動定位"
          })
        });
      } catch (err) {
        console.warn("GPS reporting failed", err);
      }
    };

    if ("geolocation" in navigator) {
      // 首次立即獲取
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.warn("GPS Init Error", err),
        { enableHighAccuracy: true }
      );

      // 持續監控
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          sendLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.warn("GPS Watch Error", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  const speak = useCallback((text: string, ignoreCancel = false) => {
    if ('speechSynthesis' in window) {
      if (!ignoreCancel) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // --- 切換功能語音提醒 ---
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (silenceNextNavigation.current) {
      silenceNextNavigation.current = false;
      return;
    }

    const labels: Record<AppTab, string> = {
      [AppTab.HOME]: '首頁',
      [AppTab.MEDS]: '服藥清單',
      [AppTab.HEALTH]: '健康數據',
      [AppTab.CHAT]: '聊天助理',
      [AppTab.VISION]: '影像辨識功能',
    };

    if (activeTab === AppTab.VISION) {
      speak(`已切換到${labels[activeTab]}`, true);
    } else {
      speak(`現在切換到${labels[activeTab]}`);
    }
  }, [activeTab, speak]);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    localStorage.setItem('wang_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    speak("已登出");
    setUser(null);
    localStorage.removeItem('wang_user');
  };

  const goToHome = (silent = false) => {
    if (silent) silenceNextNavigation.current = true;
    setActiveTab(AppTab.HOME);
  };

  const handleNavigate = (tab: AppTab, silent = false) => {
    if (silent) silenceNextNavigation.current = true;
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
        return <Dashboard onVoiceCall={() => handleNavigate(AppTab.CHAT)} onNavigate={handleNavigate} elderlyId={user.elderly_id} />;
      case AppTab.MEDS:
        return <MedicationList onBack={() => goToHome()} elderlyId={user.elderly_id} />;
      case AppTab.HEALTH:
        return <HealthMonitor onBack={() => goToHome()} elderlyId={user.elderly_id} />;
      case AppTab.CHAT:
        return <LiveVoiceChat onBack={() => goToHome(true)} />;
      case AppTab.VISION:
        return <VisionAssistant onBack={() => goToHome()} />;
      default:
        return <Dashboard onVoiceCall={() => handleNavigate(AppTab.CHAT)} onNavigate={handleNavigate} elderlyId={user.elderly_id} />;
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
