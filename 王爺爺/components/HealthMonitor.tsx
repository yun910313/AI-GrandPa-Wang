
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthMonitorProps {
  onBack?: () => void;
  elderlyId?: string;
}

const hrData = [
  { time: '08:00', hr: 72 },
  { time: '10:00', hr: 75 },
  { time: '12:00', hr: 88 },
  { time: '14:00', hr: 70 },
  { time: '16:00', hr: 74 },
  { time: '18:00', hr: 82 },
  { time: '20:00', hr: 78 },
];

const HealthMonitor: React.FC<HealthMonitorProps> = ({ onBack, elderlyId }) => {
  // 健康數據狀態
  const [hrValue, setHrValue] = useState(76);
  const [spo2Value, setSpo2Value] = useState(98);
  const [bpValues, setBpValues] = useState({ sys: 122, dia: 84 });
  const [tempValue, setTempValue] = useState(36.5);

  // 輸入控制
  const [activeInput, setActiveInput] = useState<'hr' | 'bp' | 'spo2' | 'temp' | null>(null);
  const [tempInput, setTempInput] = useState("");
  const [bpStep, setBpStep] = useState<'sys' | 'dia'>('sys');
  const [isListening, setIsListening] = useState(false);

  const measureInterval = useRef<number | null>(null);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    if (!elderlyId) return;
    try {
      const res = await fetch(`/api/vital-signs-latest?elderly_id=${elderlyId}`);
      const data = await res.json();
      if (data) {
        setHrValue(data.heart_rate || 76);
        setBpValues({ sys: data.systolic || 122, dia: data.diastolic || 84 });
        setSpo2Value(data.blood_oxygen || 98);
        setTempValue(data.temperature || 36.5);
      }
    } catch (e) {
      console.error("Fetch health data error", e);
    }
  }, [elderlyId]);

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 5000);
    return () => clearInterval(interval);
  }, [fetchLatest]);

  const saveVitalRecord = async (data: any) => {
    try {
      await fetch('/api/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderly_id: elderlyId || '00000000-0000-0000-0000-000000000000',
          ...data
        })
      });
      fetchLatest();
    } catch (error) {
      console.error("Save Vital Error:", error);
      speak("儲存失敗，請檢查網路。");
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      speak("您的瀏覽器暫時不支援語音辨識。");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      const digits = text.match(/\d+(\.\d+)?/);
      if (digits) {
        setTempInput(digits[0]);
        speak(`聽到了，數值是 ${digits[0]}，對嗎？`);
      } else {
        speak("抱歉，我沒聽清楚數字，請再說一次。");
      }
    };
    recognition.start();
  };

  const handleManualInput = (type: 'hr' | 'bp' | 'spo2' | 'temp') => {
    setActiveInput(type);
    setTempInput("");
    setBpStep('sys');
    const prompts: Record<string, string> = {
      hr: "王爺爺，請告訴我您的心跳是多少？",
      bp: "王爺爺，我們要紀錄血壓囉，請先輸入收縮壓。",
      spo2: "請輸入您的血氧數字。",
      temp: "請輸入您的體溫。"
    };
    speak(prompts[type]);
  };

  const confirmInput = async () => {
    const val = parseFloat(tempInput);
    if (isNaN(val)) {
      speak("請輸入正確的數字喔。");
      return;
    }

    if (activeInput === 'hr') {
      setHrValue(val);
      await saveVitalRecord({ heart_rate: val });
      speak(`記好了，心跳${val}下。`);
      setActiveInput(null);
    } else if (activeInput === 'spo2') {
      setSpo2Value(val);
      await saveVitalRecord({ blood_oxygen: val });
      speak(`血氧百分之${val}，紀錄完成。`);
      setActiveInput(null);
    } else if (activeInput === 'temp') {
      setTempValue(val);
      await saveVitalRecord({ temperature: val });
      speak(`體溫${val}度，已經幫您記下來了。`);
      setActiveInput(null);
    } else if (activeInput === 'bp') {
      if (bpStep === 'sys') {
        setBpValues(prev => ({ ...prev, sys: val }));
        setBpStep('dia');
        setTempInput("");
        speak("好的，那舒張壓是多少呢？");
      } else {
        const finalBp = { sys: bpValues.sys, dia: val };
        setBpValues(finalBp);
        await saveVitalRecord({ systolic: finalBp.sys, diastolic: finalBp.dia });
        speak(`血壓收縮壓${finalBp.sys}，舒張壓${val}，記好囉。`);
        setActiveInput(null);
      }
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-slate-500 shadow-sm active:bg-slate-100"
          >
            <i className="fas fa-chevron-left text-xl"></i>
          </button>
        )}
        <h2 className="text-4xl font-black text-slate-800">健康狀態</h2>
      </div>

      {/* 心率圖表卡片 */}
      <div className="bg-white rounded-[48px] p-10 shadow-xl border border-slate-100 transition-all">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-400">即時心率</h3>
          <div className="flex items-baseline gap-4 mt-1">
            <span className="text-8xl font-black text-slate-800 tabular-nums">{hrValue}</span>
            <span className="text-slate-400 font-black text-3xl">BPM</span>
          </div>
        </div>

        <div className="h-40 w-full opacity-60 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hrData}>
              <Area type="monotone" dataKey="hr" stroke="#3b82f6" strokeWidth={6} fillOpacity={0.1} fill="#3b82f6" />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 圖表下方手動輸入按鈕 */}
        <button
          onClick={() => handleManualInput('hr')}
          className="w-full py-6 bg-rose-500 text-white rounded-[28px] flex items-center justify-center gap-4 border-4 border-rose-400 active:scale-95 transition-all shadow-lg"
        >
          <i className="fas fa-edit text-4xl"></i>
          <span className="text-2xl font-black">手動輸入心率</span>
        </button>
      </div>


      <div className="grid grid-cols-2 gap-6">
        {/* 血壓偵測 */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-4 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="text-indigo-500"><i className="fas fa-gauge-high text-4xl"></i></div>
          <div className="text-xl text-slate-500 font-bold">血壓</div>
          <div className="text-4xl font-black text-slate-800">{bpValues.sys}/{bpValues.dia}</div>
          <button
            onClick={(e) => { e.stopPropagation(); handleManualInput('bp'); }}
            className="mt-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl active:scale-95 transition-all shadow-md"
          >
            ✏️ 手動輸入
          </button>
        </div>

        {/* 血氧飽和度 */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-4 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="text-blue-500"><i className="fas fa-droplet text-4xl"></i></div>
          <div className="text-xl text-slate-500 font-bold">血氧</div>
          <div className="text-4xl font-black text-slate-800">{spo2Value}%</div>
          <button
            onClick={(e) => { e.stopPropagation(); handleManualInput('spo2'); }}
            className="mt-2 py-4 bg-blue-600 text-white rounded-2xl font-black text-xl active:scale-95 transition-all shadow-md"
          >
            ✏️ 手動輸入
          </button>
        </div>

        {/* 體溫偵測 - 更新功能 */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-4 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="text-rose-500"><i className="fas fa-thermometer-half text-4xl"></i></div>
          <div className="text-xl text-slate-500 font-bold">體溫</div>
          <div className="text-4xl font-black text-slate-800">{tempValue}°C</div>
          <button
            onClick={(e) => { e.stopPropagation(); handleManualInput('temp'); }}
            className="mt-2 py-4 bg-rose-600 text-white rounded-2xl font-black text-xl active:scale-95 transition-all shadow-md"
          >
            ✏️ 手動輸入
          </button>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="text-emerald-500"><i className="fas fa-person-walking text-4xl"></i></div>
          <div className="text-xl text-slate-500 font-bold">步數</div>
          <div className="text-4xl font-black text-slate-800">3,420</div>
        </div>
      </div>

      {/* 統一數據輸入彈窗 */}
      {activeInput && (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-xl">
          <div className="w-full max-w-lg bg-white rounded-[60px] p-10 sm:p-14 text-center shadow-2xl space-y-10 border-t-8 border-blue-500 animate-in zoom-in-95 duration-300">
            <div className="space-y-4">
              <h3 className="text-4xl sm:text-5xl font-black text-slate-800">
                {activeInput === 'hr' && "輸入心率"}
                {activeInput === 'spo2' && "輸入血氧"}
                {activeInput === 'temp' && "輸入體溫"}
                {activeInput === 'bp' && (bpStep === 'sys' ? "輸入收縮壓" : "輸入舒張壓")}
              </h3>
              <p className="text-slate-400 text-xl font-bold">
                請輸入數字，或點擊話筒用語音說出數字
              </p>
            </div>

            <div className="relative group">
              <input
                type="number"
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                className="w-full text-center text-7xl sm:text-9xl font-black py-10 bg-slate-50 border-4 border-slate-100 rounded-[40px] focus:border-blue-500 focus:bg-white transition-all outline-none tabular-nums"
                autoFocus
              />
              <button
                onClick={startVoiceInput}
                className={`absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
              >
                <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-alt'} text-3xl`}></i>
              </button>
            </div>

            <div className="flex gap-4 sm:gap-8 pt-4">
              <button
                onClick={() => setActiveInput(null)}
                className="flex-1 py-8 bg-slate-100 text-slate-500 rounded-[36px] font-black text-2xl shadow-sm"
              >
                取消
              </button>
              <button
                onClick={confirmInput}
                className="flex-1 py-8 bg-blue-600 text-white rounded-[36px] font-black text-2xl shadow-xl active:scale-95 transition-all"
              >
                {activeInput === 'bp' && bpStep === 'sys' ? "下一步" : "確定紀錄"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  );
};

export default HealthMonitor;
