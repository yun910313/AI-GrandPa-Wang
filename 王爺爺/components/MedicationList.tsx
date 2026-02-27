
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Medication } from '../types';
import { GoogleGenAI } from '@google/genai';

interface MedicationListProps {
  onBack?: () => void;
  elderlyId?: string;
}

const MedicationList: React.FC<MedicationListProps> = ({ onBack, elderlyId }) => {
  const [meds, setMeds] = useState<Medication[]>([]);

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>('點擊按鈕，我陪您用藥');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 編輯相關狀態
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const fetchMeds = useCallback(async () => {
    try {
      const url = elderlyId ? `/api/medications?elderly_id=${elderlyId}` : '/api/medications';
      const response = await fetch(url);
      const data = await response.json();
      setMeds(data);
    } catch (error) {
      console.error('Fetch meds error:', error);
    }
  }, []);

  useEffect(() => {
    fetchMeds();
  }, [fetchMeds]);

  const toggleTaken = async (med: Medication) => {
    try {
      const newState = !med.taken;
      await fetch(`/api/medications/${med.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...med, taken: newState })
      });

      setMeds(prev => prev.map(m => m.id === med.id ? { ...m, taken: newState } : m));
      speak(newState ? `太棒了！已經幫您記好囉，${med.name}吃過啦。` : `已取消標記${med.name}`);
    } catch (error) {
      console.error('Toggle taken error:', error);
    }
  };

  const handleMedClick = (med: Medication) => {
    const text = `${med.name}，時間是${med.reminder_time}，劑量是${med.dosage}。`;
    speak(text);
  };

  const openEdit = (med: Medication) => {
    setEditingMed({ ...med });
    setShowEditModal(true);
    speak(`正在編輯${med.name}`);
  };

  const openAdd = () => {
    const newMed: any = {
      name: '',
      reminder_time: '08:00',
      dosage: '1 顆',
      taken: false
    };
    setEditingMed(newMed);
    setShowEditModal(true);
    speak("新增一項藥品提醒");
  };

  const saveMed = async () => {
    if (!editingMed) return;
    if (!editingMed.name.trim()) {
      speak("請輸入藥品名稱");
      return;
    }

    try {
      const isUpdate = !!editingMed.id;
      const url = isUpdate ? `/api/medications/${editingMed.id}` : '/api/medications';
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = { ...editingMed };
      if (elderlyId && !isUpdate) {
        payload.elderly_id = elderlyId;
      }

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      await fetchMeds();
      setShowEditModal(false);
      speak(`已儲存${editingMed.name}的提醒`);
    } catch (error) {
      console.error('Save med error:', error);
      speak("儲存失敗");
    }
  };

  const deleteMed = async (id: number | string) => {
    try {
      await fetch(`/api/medications/${id}`, { method: 'DELETE' });
      await fetchMeds();
      setShowEditModal(false);
      speak("已刪除該藥品提醒");
    } catch (error) {
      console.error('Delete med error:', error);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'zh-TW';
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setAiStatus(`聽到了：「${text}」`);
        handleVoiceCommand(text);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [meds]);

  const handleVoiceCommand = async (command: string) => {
    setAiStatus("正在思考中...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentStatus = meds.map(m => `[ID:${m.id}] ${m.name}(時間:${m.reminder_time}, 狀態:${m.taken ? '已標記吃過' : '還沒吃'})`).join(', ');

      const prompt = `
        你是一位極其親切、溫暖、有耐心的「銀髮族暖心管家」。
        目前藥物清單：${currentStatus}。
        使用者剛才說：「${command}」。

        任務：
        1. 意圖辨識：判斷使用者是否表示藥吃完了、詢問還有什麼藥、或是純問候。
        2. 模糊比對：從清單中找出最接近的項目。
        3. 溫暖回覆：給予讚美與關心。

        意圖分類：
        - "complete_one": 標記某項藥物已服用。
        - "complete_all": 標記目前所有「還沒吃」的藥物都已服用。
        - "check_status": 詢問還有哪些藥要吃。
        - "none": 純聊天或無法辨識。

        回傳 JSON 格式：
        {
          "reply": "（繁體中文）溫暖回覆",
          "action": "complete_one" | "complete_all" | "check_status" | "none",
          "targetId": "藥物ID" | null
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');

      if (result.action === 'complete_one' && result.targetId) {
        setMeds(prev => prev.map(m => String(m.id) === String(result.targetId) ? { ...m, taken: true } : m));
      } else if (result.action === 'complete_all') {
        setMeds(prev => prev.map(m => ({ ...m, taken: true })));
      }

      setAiStatus(result.reply);
      speak(result.reply);
    } catch (err) {
      const errorMsg = "抱歉，我剛剛分心了，可以請您再跟我說一遍嗎？";
      setAiStatus(errorMsg);
      speak(errorMsg);
    }
  };

  const startVoiceAssistant = () => {
    setIsVoiceActive(true);
    const pending = meds.filter(m => !m.taken);
    const greeting = pending.length > 0
      ? `您好呀！我看到您還有「${pending[0].name}」還沒吃，請問您吃了嗎？`
      : "今天的藥都乖乖吃完囉，您真的太棒了！還有什麼我可以幫您的嗎？";
    setAiStatus(greeting);
    speak(greeting);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-32">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">今日服藥</h2>
        <div className="flex gap-2">
          <button
            onClick={openAdd}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg active:scale-90 transition-all"
          >
            <i className="fas fa-plus"></i>
          </button>
          <button
            onClick={startVoiceAssistant}
            className={`px-4 py-2 sm:px-6 sm:py-4 rounded-full font-black text-lg sm:text-xl transition-all shadow-md flex items-center gap-2 sm:gap-3 ${isVoiceActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white text-blue-600 border-2 border-blue-100'
              }`}
          >
            <i className="fas fa-microphone-alt text-xl sm:text-2xl"></i>暖心管家
          </button>
        </div>
      </div>

      {isVoiceActive && (
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl border-4 border-emerald-100 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                <i className="fas fa-heart"></i>
              </div>
              <span className="text-emerald-600 font-black text-lg sm:text-xl tracking-widest">暖心服務中</span>
            </div>
            <button onClick={() => { setIsVoiceActive(false); window.speechSynthesis.cancel(); }} className="text-slate-300 text-3xl sm:text-4xl hover:text-slate-500 active:scale-90">
              <i className="fas fa-times-circle"></i>
            </button>
          </div>
          <div className="bg-slate-50 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 text-center border-2 border-slate-100 shadow-inner relative overflow-hidden">
            <p className="text-xl sm:text-3xl font-black text-slate-800 leading-snug mb-6 sm:mb-10 min-h-[4rem] sm:min-h-[5rem] transition-all">{aiStatus}</p>

            <div className="flex justify-center items-center h-32 sm:h-40">
              {!isListening ? (
                <button
                  onClick={() => { setIsListening(true); recognitionRef.current?.start(); }}
                  className="w-24 h-24 sm:w-28 sm:h-28 bg-emerald-500 text-white rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center text-4xl sm:text-5xl hover:bg-emerald-600 active:scale-90 transition-all group"
                >
                  <i className="fas fa-microphone group-hover:scale-110"></i>
                </button>
              ) : (
                <div className="flex justify-center gap-4 h-24 items-center">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                      key={i}
                      className="w-4 bg-emerald-400 rounded-full animate-wave"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                        height: '40%'
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-4 sm:mt-6 text-slate-400 font-black text-lg sm:text-xl">點擊麥克風跟我說話</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {meds.sort((a, b) => a.reminder_time.localeCompare(b.reminder_time)).map((med) => (
          <div
            key={med.id}
            onClick={() => {
              handleMedClick(med);
              toggleTaken(med);
            }}
            className={`p-5 sm:p-8 rounded-[32px] sm:rounded-[48px] flex items-center justify-between transition-all border-4 cursor-pointer active:scale-[0.98] ${med.taken
              ? 'bg-slate-50 border-slate-100 opacity-60'
              : 'bg-white border-blue-200 shadow-xl ring-4 ring-blue-50/50'
              }`}
          >
            <div className="flex items-center gap-4 sm:gap-8 overflow-hidden">
              <div className={`shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[32px] flex items-center justify-center text-3xl sm:text-5xl ${med.taken ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-2xl rotate-3'
                }`}>
                <i className={`fas ${med.taken ? 'fa-check-circle' : 'fa-pills'}`}></i>
              </div>
              <div className="space-y-1 sm:space-y-3 min-w-0">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h4 className={`text-2xl sm:text-4xl font-black ${med.taken ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {med.name}
                  </h4>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(med); }}
                    className="text-slate-300 text-xl sm:text-2xl active:text-blue-500 p-1 sm:p-2"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-lg sm:text-2xl text-slate-500 font-bold">
                  <span className="flex items-center gap-2 sm:gap-3">
                    <i className="far fa-clock text-blue-500"></i> {med.reminder_time}
                  </span>
                  <span className="hidden sm:block w-2 h-2 bg-slate-300 rounded-full"></span>
                  <span>{med.dosage}</span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTaken(med.id);
              }}
              className={`shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center transition-all ${med.taken ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'border-slate-200 text-slate-200'
                }`}
            >
              <i className="fas fa-check text-3xl sm:text-5xl"></i>
            </button>
          </div>
        ))}
      </div>

      {showEditModal && editingMed && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-end sm:items-center justify-center backdrop-blur-md p-4">
          <div className="bg-white rounded-t-[32px] sm:rounded-[60px] p-6 sm:p-12 w-full max-w-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-500 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sm:mb-10">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">{meds.find(m => m.id === editingMed.id) ? '修改提醒' : '新增提醒'}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-300 text-4xl sm:text-5xl active:text-slate-500">
                <i className="fas fa-times-circle"></i>
              </button>
            </div>

            <div className="space-y-8 sm:space-y-12 mb-10 sm:mb-16">
              <div className="space-y-3 sm:space-y-5">
                <label className="block text-xl sm:text-2xl font-black text-slate-400">藥品名稱</label>
                <input
                  type="text"
                  value={editingMed.name}
                  onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                  className="w-full px-6 py-4 sm:px-10 sm:py-6 bg-slate-50 border-4 border-slate-100 rounded-2xl sm:rounded-[36px] font-black text-2xl sm:text-3xl focus:border-blue-500 focus:bg-white transition-all outline-none shadow-sm"
                  placeholder="例如：降血壓藥"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                <div className="space-y-3 sm:space-y-5">
                  <label className="block text-xl sm:text-2xl font-black text-slate-400">提醒時間</label>
                  <input
                    type="time"
                    value={editingMed.reminder_time}
                    onChange={(e) => setEditingMed({ ...editingMed, reminder_time: e.target.value })}
                    className="w-full px-6 py-4 sm:px-10 sm:py-6 bg-slate-50 border-4 border-slate-100 rounded-2xl sm:rounded-[36px] font-black text-2xl sm:text-3xl focus:border-blue-500 focus:bg-white transition-all outline-none shadow-sm"
                  />
                </div>
                <div className="space-y-3 sm:space-y-5">
                  <label className="block text-xl sm:text-2xl font-black text-slate-400">每次劑量</label>
                  <input
                    type="text"
                    value={editingMed.dosage}
                    onChange={(e) => setEditingMed({ ...editingMed, dosage: e.target.value })}
                    className="w-full px-6 py-4 sm:px-10 sm:py-6 bg-slate-50 border-4 border-slate-100 rounded-2xl sm:rounded-[36px] font-black text-2xl sm:text-3xl focus:border-blue-500 focus:bg-white transition-all outline-none shadow-sm"
                    placeholder="1 顆"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-8 pb-6 sm:pb-10">
              <button
                onClick={saveMed}
                className="w-full py-6 sm:py-10 bg-blue-600 text-white rounded-2xl sm:rounded-[40px] font-black text-2xl sm:text-4xl shadow-2xl active:scale-95 transition-all"
              >
                儲存並返回
              </button>
              <div className="flex gap-4 sm:gap-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 sm:py-8 bg-slate-100 text-slate-500 rounded-2xl sm:rounded-[40px] font-black text-xl sm:text-2xl"
                >
                  取消
                </button>
                {meds.find(m => m.id === editingMed.id) && (
                  <button
                    onClick={() => deleteMed(editingMed.id)}
                    className="flex-1 py-4 sm:py-8 bg-red-50 text-red-500 rounded-2xl sm:rounded-[40px] font-black text-xl sm:text-2xl"
                  >
                    刪除
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 sm:p-12 rounded-[32px] sm:rounded-[60px] shadow-2xl flex items-start gap-6 sm:gap-10 text-white relative overflow-hidden active:scale-98 transition-all group">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-[100px] sm:text-[180px] rotate-12 group-hover:rotate-45 transition-transform duration-1000">
          <i className="fas fa-hand-holding-medical"></i>
        </div>
        <div className="text-4xl sm:text-7xl mt-2 text-blue-200 drop-shadow-lg shrink-0">
          <i className="fas fa-sun"></i>
        </div>
        <div className="relative z-10 space-y-2 sm:space-y-4">
          <h4 className="text-2xl sm:text-4xl font-black tracking-wide">王爺爺加油！</h4>
          <p className="text-xl sm:text-3xl font-bold leading-relaxed opacity-95">
            乖乖吃藥，身體才會有力氣陪孫子玩喔！我們都在這裡守護您，您是最棒的！
          </p>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 40%; transform: translateY(0); }
          50% { height: 100%; transform: translateY(-10%); }
        }
        .animate-wave {
          animation: wave 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MedicationList;
