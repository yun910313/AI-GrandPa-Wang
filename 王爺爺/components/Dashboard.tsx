
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, EmergencyContact, AppTab, Medication } from '../types';

interface DashboardProps {
  onVoiceCall: () => void;
  onNavigate: (tab: AppTab) => void;
  elderlyId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onVoiceCall, onNavigate, elderlyId }) => {
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [currentSOSIndex, setCurrentSOSIndex] = useState(-1);

  const [pendingMeds, setPendingMeds] = useState<Medication[]>([]);
  const hasSpokenReminder = useRef(false);

  const countdownInterval = useRef<number | null>(null);

  const speak = useCallback((text: string, forceInterrupt = false) => {
    if ('speechSynthesis' in window) {
      if (forceInterrupt) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const [profile, setProfile] = useState<UserProfile>({
    name: '王爺爺',
    gender: 'male',
    medicalHistory: '載入中...',
    emergencyContacts: []
  });

  const [editForm, setEditForm] = useState<UserProfile>(profile);

  const [vitalSigns, setVitalSigns] = useState({ hr: 0, steps: 0 });

  // 獲取後端資料
  const fetchData = useCallback(async () => {
    try {
      // 獲取長輩基本資料
      const url = elderlyId ? `/api/elderly-profile/${elderlyId}` : '/api/elderly-profile';
      const elderlyRes = await fetch(url);
      const elderlyData = await elderlyRes.json();

      // 獲取緊急聯絡人
      const contactUrl = elderlyId ? `/api/emergency-contacts?elderly_id=${elderlyId}` : '/api/emergency-contacts';
      const contactRes = await fetch(contactUrl);
      const contactData = await contactRes.json();

      if (elderlyData) {
        setProfile({
          id: elderlyData.id,
          name: elderlyData.name,
          gender: elderlyData.gender === '男' ? 'male' : 'female',
          medicalHistory: elderlyData.medical_history || '無',
          emergencyContacts: contactData.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            relationship: c.relationship
          }))
        });
      }

      // 獲取最新生理指標
      const vitalUrl = elderlyId ? `/api/vital-signs-latest?elderly_id=${elderlyId}` : '/api/vital-signs-latest';
      const vitalRes = await fetch(vitalUrl);
      const vitalData = await vitalRes.json();
      if (vitalData) {
        setVitalSigns({
          hr: vitalData.heart_rate || 0,
          steps: vitalData.steps || 0
        });
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    }
  }, [elderlyId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 每10秒更新一次基本資料與健康指標
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const url = elderlyId ? `/api/medications?elderly_id=${elderlyId}` : '/api/medications';
        const res = await fetch(url);
        const currentMeds: Medication[] = await res.json();

        const filtered = currentMeds.filter(m => m.is_taken !== 1);
        setPendingMeds(filtered);
      } catch (error) {
        console.error('Fetch meds error in Dashboard:', error);
      }
    };
    fetchMeds();
    const interval = setInterval(fetchMeds, 30000); // 每30秒更新一次藥物清單
    return () => clearInterval(interval);
  }, [elderlyId]);

  // 新增獨立的語音提醒 Effect，支援組件卸載時自動清除計時器
  useEffect(() => {
    let timerId: number | null = null;

    if (pendingMeds.length > 0 && !hasSpokenReminder.current) {
      timerId = window.setTimeout(() => {
        speak(`王爺爺，記得要吃藥喔！您今天還有${pendingMeds[0].name}等藥物還沒吃，身體要顧好喔。`);
        hasSpokenReminder.current = true;
      }, 3000);
    }

    return () => {
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [pendingMeds, speak]);

  useEffect(() => {
    if (isCountingDown) {
      setCountdown(5);
      countdownInterval.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current!);
            setIsCountingDown(false);
            startSOSSequence();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [isCountingDown, profile.emergencyContacts]); // Added dependency

  const initiateSOS = () => {
    setShowSOSConfirm(false);
    setIsCountingDown(true);
    speak("即將啟動緊急求援，倒數五秒。", true);
  };

  const startSOSSequence = () => {
    setIsSOSActive(true);
    setCurrentSOSIndex(0);
    const firstContact = profile.emergencyContacts[0];
    if (firstContact) {
      speak(`正在撥打給第一順位聯絡人：${firstContact.name}`, true);
    }
  };

  const nextSOSStep = () => {
    if (currentSOSIndex < profile.emergencyContacts.length - 1) {
      const nextIdx = currentSOSIndex + 1;
      setCurrentSOSIndex(nextIdx);
      speak(`正在撥打給第${nextIdx + 1}順位聯絡人：${profile.emergencyContacts[nextIdx].name}`, true);
    } else {
      setCurrentSOSIndex(999);
      speak("正在撥打 1 1 9 緊急救援中心。", true);
    }
  };

  const prevSOSStep = () => {
    if (currentSOSIndex === 999) {
      const lastIdx = profile.emergencyContacts.length - 1;
      setCurrentSOSIndex(lastIdx);
      speak(`返回撥打給第${lastIdx + 1}順位聯絡人：${profile.emergencyContacts[lastIdx].name}`, true);
    } else if (currentSOSIndex > 0) {
      const prevIdx = currentSOSIndex - 1;
      setCurrentSOSIndex(prevIdx);
      speak(`返回撥打給第${prevIdx + 1}順位聯絡人：${profile.emergencyContacts[prevIdx].name}`, true);
    }
  };

  const cancelSOS = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    setIsCountingDown(false);
    setIsSOSActive(false);
    setCurrentSOSIndex(-1);
    setCountdown(5);
    speak("已取消求助。", true);
  };

  const saveProfile = async () => {
    try {
      // 更新長輩資料
      if (profile.id) {
        await fetch(`/api/elderly-profile/${profile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editForm.name,
            gender: editForm.gender === 'male' ? '男' : '女',
            medical_history: editForm.medicalHistory
          })
        });
      }

      // 更新聯絡人與排序
      if (profile.id) {
        await fetch('/api/emergency-contacts/sync-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            elderly_id: profile.id,
            contacts: editForm.emergencyContacts
          })
        });
      }

      await fetchData();

      setShowEditProfile(false);
      speak("個人資料與聯絡清單已同步至伺服器儲存。");
    } catch (error) {
      console.error('Save profile error:', error);
      speak("儲存失敗，請檢查網路連線。");
    }
  };

  const addContact = () => {
    setEditForm({
      ...editForm,
      emergencyContacts: [...editForm.emergencyContacts, { name: '', phone: '', relationship: '' }]
    });
    speak("已新增一個空白聯絡欄位");
  };

  const removeContact = (index: number) => {
    const updated = editForm.emergencyContacts.filter((_, i) => i !== index);
    setEditForm({ ...editForm, emergencyContacts: updated });
    speak("已刪除該名聯絡人");
  };

  const moveContact = (index: number, direction: 'up' | 'down') => {
    const updated = [...editForm.emergencyContacts];
    if (direction === 'up' && index > 0) {
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      speak(`已將${updated[index].name || '此人'}上移至第 ${index} 順位`);
    } else if (direction === 'down' && index < updated.length - 1) {
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      speak(`已將${updated[index].name || '此人'}下移至第 ${index + 2} 順位`);
    }
    setEditForm({ ...editForm, emergencyContacts: updated });
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...editForm.emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, emergencyContacts: updated });
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* User Profile Card */}
      <div
        onClick={() => speak(`使用者是${profile.name}，目前病歷紀錄有：${profile.medicalHistory || '無'}`)}
        className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl border-4 border-white shadow-md">
            <i className={`fas ${profile.gender === 'male' ? 'fa-user-tie' : profile.gender === 'female' ? 'fa-user-nurse' : 'fa-user'}`}></i>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              {profile.name}
            </h2>
            <p className="text-slate-500 text-lg font-bold mt-1 line-clamp-1">
              {profile.medicalHistory || '無病歷記錄'}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditForm(JSON.parse(JSON.stringify(profile)));
              setShowEditProfile(true);
            }}
            className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center active:scale-90 transition-all shadow-sm"
          >
            <i className="fas fa-user-edit text-xl"></i>
          </button>
        </div>
      </div>

      {/* 高飽和度吃藥提醒區塊 */}
      <div
        onClick={() => { onNavigate(AppTab.MEDS); }}
        className={`rounded-[56px] p-10 shadow-[0_20px_50px_rgba(255,165,0,0.3)] transition-all active:scale-[0.96] cursor-pointer overflow-hidden relative border-b-8 ${pendingMeds.length > 0
          ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-red-700'
          : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-green-700'
          }`}
      >
        <div className="absolute top-0 right-0 p-8 opacity-20 text-[140px] pointer-events-none rotate-12">
          <i className={`fas ${pendingMeds.length > 0 ? 'fa-bell animate-swing' : 'fa-check-circle'}`}></i>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg ${pendingMeds.length > 0 ? 'bg-yellow-400 text-red-600' : 'bg-white text-emerald-600'}`}>
              <i className={`fas ${pendingMeds.length > 0 ? 'fa-pills' : 'fa-award'}`}></i>
            </div>
            <h3 className="text-4xl font-black tracking-tight leading-none">
              {pendingMeds.length > 0 ? '該吃藥囉！' : '藥吃完囉！'}
            </h3>
          </div>

          {pendingMeds.length > 0 ? (
            <div className="space-y-6">
              <p className="text-2xl font-bold text-yellow-100">以下藥物還沒標記服用：</p>
              <div className="grid grid-cols-1 gap-4">
                {pendingMeds.slice(0, 2).map((med) => (
                  <div
                    key={med.id}
                    onClick={(e) => { e.stopPropagation(); speak(`藥品：${med.name}。請於${med.reminder_time}服用。`); }}
                    className="bg-white/95 text-slate-800 p-6 rounded-[32px] flex items-center justify-between shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-clock text-2xl"></i>
                      </div>
                      <div>
                        <div className="text-2xl font-black">{med.name}</div>
                        <div className="text-lg font-bold text-slate-500">{med.reminder_time} 點鐘服用</div>
                      </div>
                    </div>
                    <i className="fas fa-volume-up text-orange-400 text-2xl animate-pulse"></i>
                  </div>
                ))}
                {pendingMeds.length > 2 && (
                  <div className="text-center py-2">
                    <span className="bg-black/20 px-6 py-2 rounded-full text-xl font-black">及其他 {pendingMeds.length - 2} 項藥物</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-3xl font-black text-white">身體勇健一百分！</p>
              <div className="bg-white/20 p-6 rounded-[36px] backdrop-blur-sm border border-white/30">
                <p className="text-xl font-bold leading-relaxed">
                  您今天已經完成所有藥物服用了，記得多喝水、保持愉快心情喔！
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SOS Button Section */}
      <div className="bg-white rounded-[40px] p-10 text-center shadow-xl border border-red-50">
        <h2 onClick={() => speak("這裡是緊急求助按鈕區域")} className="text-2xl font-black text-slate-800 mb-8 cursor-pointer">緊急求助</h2>
        <button
          onClick={() => setShowSOSConfirm(true)}
          className="w-52 h-52 rounded-full bg-red-600 text-white shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center mx-auto relative border-8 border-red-50"
        >
          <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20"></div>
          <i className="fas fa-phone-alt text-5xl mb-3 relative z-10"></i>
          <span className="text-4xl font-black relative z-10">SOS</span>
        </button>
        <p className="mt-8 text-slate-500 font-bold text-lg">按下將依序聯繫下方清單</p>
      </div>

      {/* 高飽和度功能按鈕網格 */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => { onNavigate(AppTab.MEDS); }}
          className="bg-orange-600 h-32 rounded-[32px] flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-all"
        >
          <i className="fas fa-pills text-3xl mb-2"></i>
          <span className="text-xl font-black">吃藥</span>
        </button>
        <button
          onClick={() => { onNavigate(AppTab.VISION); }}
          className="bg-blue-600 h-32 rounded-[32px] flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-all"
        >
          <i className="fas fa-eye text-3xl mb-2"></i>
          <span className="text-xl font-black">辨識</span>
        </button>
        <button
          onClick={() => { onNavigate(AppTab.HEALTH); }}
          className="bg-green-600 h-32 rounded-[32px] flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-all"
        >
          <i className="fas fa-heartbeat text-3xl mb-2"></i>
          <span className="text-xl font-black">健康</span>
        </button>
      </div>

      {/* AI 照顧者對話 */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <h3 className="text-2xl font-black text-slate-800">暖心助理</h3>
        <button
          onClick={() => {
            onVoiceCall();
          }}
          className="relative group active:scale-95 transition-all"
        >
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden relative">
            <i className="fas fa-user-nurse text-white text-[100px] mt-4"></i>
            <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm py-1">
              <i className="fas fa-microphone text-white text-sm"></i>
            </div>
          </div>
          <div className="mt-4 bg-white px-6 py-2 rounded-full shadow-md border border-slate-100">
            <span className="text-blue-600 font-black text-lg tracking-wider">點我聊天</span>
          </div>
        </button>
      </div>

      {/* Emergency Contacts List (Home Display) */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 onClick={() => speak("這是您的緊急聯絡清單")} className="text-2xl font-black text-slate-800 flex items-center gap-3 cursor-pointer">
            <i className="fas fa-users text-blue-500"></i>
            緊急聯絡清單
          </h3>
          <button
            onClick={() => {
              setEditForm(JSON.parse(JSON.stringify(profile)));
              setShowEditProfile(true);
            }}
            className="text-blue-600 font-black text-lg"
          >
            管理 <i className="fas fa-chevron-right ml-1"></i>
          </button>
        </div>
        <div className="space-y-4">
          {profile.emergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              onClick={() => speak(`第${idx + 1}順位聯絡人：${contact.name}`)}
              className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 active:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 font-black text-xl shadow-sm">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xl font-black text-slate-800">{contact.name}</div>
                  <div className="text-slate-500 font-bold">{contact.phone}</div>
                </div>
              </div>
              <a
                href={`tel:${contact.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl"
              >
                <i className="fas fa-phone"></i>
              </a>
            </div>
          ))}
          {profile.emergencyContacts.length === 0 && (
            <div className="text-center py-6 text-slate-400 font-bold">尚未設定聯絡人</div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div
          onClick={() => { onNavigate(AppTab.HEALTH); }}
          className="bg-white p-6 rounded-[36px] shadow-sm border border-slate-100 text-center active:bg-slate-50 cursor-pointer"
        >
          <div className="text-rose-500 mb-3"><i className="fas fa-heart-pulse text-3xl"></i></div>
          <div className="text-4xl font-black text-slate-800">{vitalSigns.hr || '--'}下</div>
          <div className="text-lg text-slate-500 font-bold mt-1">最新心率</div>
        </div>
        <div
          onClick={() => speak(`您今天走了 ${vitalSigns.steps} 步。`)}
          className="bg-white p-6 rounded-[36px] shadow-sm border border-slate-100 text-center active:bg-slate-50 cursor-pointer"
        >
          <div className="text-emerald-500 mb-3"><i className="fas fa-walking text-3xl"></i></div>
          <div className="text-4xl font-black text-slate-800">{vitalSigns.steps.toLocaleString()}</div>
          <div className="text-lg text-slate-500 font-bold mt-1">今日步數</div>
        </div>
      </div>

      {/* SOS Countdown Overlay */}
      {isCountingDown && (
        <div className="fixed inset-0 bg-orange-600 z-[110] flex flex-col items-center justify-center p-8 text-white">
          <h3 className="text-4xl font-black mb-6 relative z-10">即將啟動救援</h3>
          <div className="text-[160px] font-black leading-none mb-16 relative z-10 tabular-nums">
            {countdown}
          </div>
          <button
            onClick={cancelSOS}
            className="w-72 h-72 rounded-full bg-white text-orange-600 shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-all border-[12px] border-orange-400 relative z-10"
          >
            <i className="fas fa-times text-6xl mb-3"></i>
            <span className="text-4xl font-black">取消求救</span>
          </button>
        </div>
      )}

      {/* SOS Active Modal */}
      {isSOSActive && (
        <div className="fixed inset-0 bg-red-600 z-[100] flex flex-col items-center justify-center p-8 text-white">
          <div className="text-center mb-10 relative z-10">
            <h3 className="text-5xl font-black mb-3 animate-bounce">緊急救援中</h3>
          </div>

          <div className="w-full max-sm bg-white/10 backdrop-blur-lg rounded-[48px] p-10 border border-white/20 relative z-10">
            {currentSOSIndex === 999 ? (
              <div className="text-center space-y-8">
                <div className="w-28 h-28 bg-white text-red-600 rounded-full flex items-center justify-center mx-auto text-5xl shadow-xl">
                  <i className="fas fa-ambulance"></i>
                </div>
                <h4 className="text-4xl font-black">撥打 119</h4>
                <div className="space-y-4">
                  <a
                    href="tel:119"
                    className="block w-full py-8 bg-white text-red-600 rounded-[32px] font-black text-3xl shadow-lg active:scale-95 transition-all"
                  >
                    <i className="fas fa-phone-alt mr-3"></i>立即撥號
                  </a>
                  <button
                    onClick={prevSOSStep}
                    className="w-full py-5 bg-transparent border-2 border-white/30 text-white rounded-[32px] font-black text-xl flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-chevron-left"></i> 回上一位
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8">
                <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mx-auto text-5xl border-2 border-white/30">
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <h4 className="text-4xl font-black mb-2">{profile.emergencyContacts[currentSOSIndex]?.name}</h4>
                  <p className="text-red-100 font-bold text-2xl">{profile.emergencyContacts[currentSOSIndex]?.phone}</p>
                </div>
                <div className="space-y-4">
                  <a
                    href={`tel:${profile.emergencyContacts[currentSOSIndex]?.phone}`}
                    className="block w-full py-6 bg-white text-red-600 rounded-[32px] font-black text-2xl shadow-lg"
                  >
                    撥號中...
                  </a>
                  <div className="flex gap-4">
                    <button
                      onClick={prevSOSStep}
                      disabled={currentSOSIndex === 0}
                      className={`flex-1 py-5 bg-transparent border-2 border-white/30 text-white rounded-[32px] font-black text-xl ${currentSOSIndex === 0 ? 'opacity-30' : 'active:bg-white/10'}`}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button
                      onClick={nextSOSStep}
                      className="flex-[2] py-5 bg-transparent border-2 border-white/30 text-white rounded-[32px] font-black text-xl"
                    >
                      下一位 <i className="fas fa-chevron-right ml-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={cancelSOS}
            className="mt-12 w-full py-8 bg-slate-900/60 text-white rounded-[40px] font-black text-2xl border-2 border-white/20 backdrop-blur-sm active:scale-95 transition-all"
          >
            結束求援
          </button>
        </div>
      )}

      {/* SOS Confirmation Modal */}
      {showSOSConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[48px] p-10 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-black text-slate-800 mb-6">啟動求援？</h3>
            <div className="flex flex-col gap-4">
              <button
                onClick={initiateSOS}
                className="w-full py-6 bg-red-600 text-white rounded-[32px] font-black text-2xl shadow-xl"
              >
                確認求救
              </button>
              <button
                onClick={() => setShowSOSConfirm(false)}
                className="w-full py-5 bg-slate-100 text-slate-500 rounded-[32px] font-black text-xl"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Contacts Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-end justify-center backdrop-blur-sm">
          <div className="bg-white rounded-t-[50px] p-8 w-full max-w-lg shadow-2xl flex flex-col h-[92vh]">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-3xl font-black text-slate-800">資料設定</h3>
              <button onClick={() => { setShowEditProfile(false); speak("關閉設定視窗"); }} className="text-slate-300 text-5xl active:text-slate-500"><i className="fas fa-times-circle"></i></button>
            </div>

            <div className="space-y-8 overflow-y-auto pr-2 flex-1 custom-scrollbar px-2">
              {/* 個人基本資料 */}
              <div className="space-y-6 bg-slate-50 p-6 rounded-[36px] border border-slate-100">
                <div className="space-y-4">
                  <label className="block text-xl font-black text-slate-500">您的姓名</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-700 shadow-sm"
                    placeholder="請輸入姓名"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-xl font-black text-slate-500">性別</label>
                  <div className="flex gap-4">
                    {['male', 'female', 'other'].map(g => (
                      <button
                        key={g}
                        onClick={() => { setEditForm({ ...editForm, gender: g as any }); speak(`選取${g === 'male' ? '男' : g === 'female' ? '女' : '其他'}`); }}
                        className={`flex-1 py-4 rounded-2xl font-black text-xl border-4 transition-all ${editForm.gender === g ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        {g === 'male' ? '男' : g === 'female' ? '女' : '其他'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xl font-black text-slate-500">病歷/過敏記錄</label>
                  <textarea
                    value={editForm.medicalHistory}
                    onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-700 h-32 resize-none shadow-sm"
                    placeholder="例如：高血壓、支氣管炎..."
                  />
                </div>
              </div>

              {/* 緊急聯絡人管理 */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b-4 border-slate-100 pb-4">
                  <label className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <i className="fas fa-phone-volume text-red-500"></i>
                    聯絡人順序
                  </label>
                  <button
                    onClick={addContact}
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-black text-lg shadow-md active:scale-95 transition-all"
                  >
                    <i className="fas fa-plus mr-2"></i>新增
                  </button>
                </div>

                <div className="space-y-6">
                  {editForm.emergencyContacts.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold text-xl">尚未設定任何聯絡人</p>
                    </div>
                  ) : (
                    editForm.emergencyContacts.map((contact, idx) => (
                      <div key={idx} className="p-6 bg-white rounded-[40px] border-2 border-slate-100 shadow-md relative group">
                        <div className="flex justify-between items-center mb-5">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-lg">
                              {idx + 1}
                            </span>
                            <span className="text-slate-400 font-black">優先順位</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => moveContact(idx, 'up')}
                              disabled={idx === 0}
                              className={`w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 active:bg-blue-100 active:text-blue-600 ${idx === 0 ? 'opacity-20 pointer-events-none' : ''}`}
                            >
                              <i className="fas fa-chevron-up text-xl"></i>
                            </button>
                            <button
                              onClick={() => moveContact(idx, 'down')}
                              disabled={idx === editForm.emergencyContacts.length - 1}
                              className={`w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 active:bg-blue-100 active:text-blue-600 ${idx === editForm.emergencyContacts.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}
                            >
                              <i className="fas fa-chevron-down text-xl"></i>
                            </button>
                            <button
                              onClick={() => removeContact(idx)}
                              className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center active:bg-red-100"
                            >
                              <i className="fas fa-trash-alt text-xl"></i>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="relative">
                            <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => updateContact(idx, 'name', e.target.value)}
                              placeholder="聯絡人姓名"
                              className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-700"
                            />
                          </div>
                          <div className="relative">
                            <i className="fas fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                            <input
                              type="tel"
                              value={contact.phone}
                              onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                              placeholder="聯絡電話"
                              className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 操作按鈕固定於底部 */}
            <div className="flex gap-4 mt-8 pt-4 border-t-2 border-slate-50 px-2 pb-6 shrink-0">
              <button
                onClick={() => { setShowEditProfile(false); speak("已取消修改"); }}
                className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[32px] font-black text-2xl active:bg-slate-200"
              >
                取消
              </button>
              <button
                onClick={saveProfile}
                className="flex-[2] py-6 bg-blue-600 text-white rounded-[32px] font-black text-2xl shadow-xl active:scale-95 transition-all"
              >
                儲存更新
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes swing {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(25deg); }
        }
        .animate-swing { animation: swing 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Dashboard;
