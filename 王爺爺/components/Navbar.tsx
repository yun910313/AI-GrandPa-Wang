
import React, { useCallback } from 'react';
import { AppTab } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: AppTab.HOME, icon: 'fa-home', label: '首頁' },
    { id: AppTab.MEDS, icon: 'fa-pills', label: '吃藥' },
    { id: AppTab.VISION, icon: 'fa-eye', label: '影像辨識' },
    { id: AppTab.HEALTH, icon: 'fa-heartbeat', label: '健康' },
    { id: AppTab.CHAT, icon: 'fa-comment-dots', label: '聊天' },
  ];

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleTabClick = (tab: { id: AppTab; label: string }) => {
    setActiveTab(tab.id);
    speak(`前往${tab.label}`);
  };

  return (
    <nav className="w-full bg-white border-t-2 border-slate-200 flex justify-around items-center py-4 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab)}
          className={`flex flex-col items-center gap-2 transition-all ${
            activeTab === tab.id ? 'text-blue-600 scale-110' : 'text-slate-400'
          }`}
        >
          <i className={`fas ${tab.icon} text-2xl`}></i>
          <span className="text-sm font-black tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
