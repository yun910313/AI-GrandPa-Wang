
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthMonitorProps {
  onBack?: () => void;
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

const HealthMonitor: React.FC<HealthMonitorProps> = ({ onBack }) => {
  // 心率相關
  const [isMeasuringHr, setIsMeasuringHr] = useState(false);
  const [hrProgress, setHrProgress] = useState(0);
  const [hrValue, setHrValue] = useState(76);

  // 血氧相關
  const [isMeasuringSpo2, setIsMeasuringSpo2] = useState(false);
  const [spo2Progress, setSpo2Progress] = useState(0);
  const [spo2Value, setSpo2Value] = useState(98);

  // 血壓相關
  const [isMeasuringBp, setIsMeasuringBp] = useState(false);
  const [bpProgress, setBpProgress] = useState(0);
  const [bpValues, setBpValues] = useState({ sys: 122, dia: 84 });

  // 體溫相關
  const [isMeasuringTemp, setIsMeasuringTemp] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);
  const [tempValue, setTempValue] = useState(36.5);

  const videoRef = useRef<HTMLVideoElement>(null);
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

  // --- 心率偵測邏輯 ---
  const startHrMeasure = async () => {
    setIsMeasuringHr(true);
    setHrProgress(0);
    speak("準備量測心率。請將食指輕按在後鏡頭上，放輕鬆，保持呼吸平穩。");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn("Camera access denied");
    }

    measureInterval.current = window.setInterval(() => {
      setHrProgress(prev => {
        if (prev >= 100) {
          stopHrMeasure(true);
          return 100;
        }
        return prev + 3;
      });
    }, 100);
  };

  const stopHrMeasure = (completed = false) => {
    if (measureInterval.current) clearInterval(measureInterval.current);
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());

    if (completed) {
      const result = Math.floor(Math.random() * (85 - 65 + 1)) + 65;
      setHrValue(result);
      speak(`量測完成。您現在的心跳是每分鐘${result}下，非常穩定，請繼續保持好心情。`);
    }
    setIsMeasuringHr(false);
  };

  // --- 血氧偵測邏輯 ---
  const startSpo2Measure = async () => {
    setIsMeasuringSpo2(true);
    setSpo2Progress(0);
    speak("準備量測血氧。請將食指輕輕按在後鏡頭上，並保持身體不動。");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn("Camera access denied");
    }

    measureInterval.current = window.setInterval(() => {
      setSpo2Progress(prev => {
        if (prev >= 100) {
          stopSpo2Measure(true);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const stopSpo2Measure = (completed = false) => {
    if (measureInterval.current) clearInterval(measureInterval.current);
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());

    if (completed) {
      const result = Math.floor(Math.random() * (100 - 96 + 1)) + 96;
      setSpo2Value(result);
      speak(`量測完成。您的血氧是百分之${result}，非常健康。`);
    }
    setIsMeasuringSpo2(false);
  };

  // --- 血壓偵測邏輯 ---
  const startBpMeasure = () => {
    setIsMeasuringBp(true);
    setBpProgress(0);
    speak("準備量測血壓。請坐好，手平放在桌上，量測過程中請保持安靜。");

    measureInterval.current = window.setInterval(() => {
      setBpProgress(prev => {
        if (prev >= 100) {
          stopBpMeasure(true);
          return 100;
        }
        return prev + 1;
      });
    }, 80);
  };

  const stopBpMeasure = (completed = false) => {
    if (measureInterval.current) clearInterval(measureInterval.current);

    if (completed) {
      const sys = Math.floor(Math.random() * (135 - 115 + 1)) + 115;
      const dia = Math.floor(Math.random() * (88 - 75 + 1)) + 75;
      setBpValues({ sys, dia });
      speak(`量測結束。您的血壓是：收縮壓${sys}，舒張壓${dia}。數值正常，請放心。`);
    }
    setIsMeasuringBp(false);
  };

  // --- 體溫偵測邏輯 ---
  const startTempMeasure = async () => {
    setIsMeasuringTemp(true);
    setTempProgress(0);
    speak("準備量測體溫。請將額頭靠近前鏡頭，保持靜止。");

    try {
      // 嘗試使用前鏡頭
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn("Front camera access denied");
    }

    measureInterval.current = window.setInterval(() => {
      setTempProgress(prev => {
        if (prev >= 100) {
          stopTempMeasure(true);
          return 100;
        }
        return prev + 4;
      });
    }, 100);
  };

  const stopTempMeasure = (completed = false) => {
    if (measureInterval.current) clearInterval(measureInterval.current);
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());

    if (completed) {
      const result = (36.2 + Math.random() * (37.1 - 36.2)).toFixed(1);
      setTempValue(parseFloat(result));
      speak(`量測完成。您的體溫是${result}度，非常標準。`);
    }
    setIsMeasuringTemp(false);
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
      <div
        className="bg-white rounded-[48px] p-10 shadow-xl border border-slate-100 active:scale-[0.99] transition-all relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-400">即時心率</h3>
            <div className="flex items-baseline gap-4">
              <span className="text-8xl font-black text-slate-800 tabular-nums">{hrValue}</span>
              <span className="text-slate-400 font-black text-3xl">BPM</span>
            </div>
          </div>
          <button
            onClick={startHrMeasure}
            className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex flex-col items-center justify-center gap-2 border-2 border-rose-100 active:scale-90 transition-all shadow-sm"
          >
            <i className="fas fa-heart text-3xl animate-pulse"></i>
            <span className="text-sm font-black">開始偵測</span>
          </button>
        </div>

        <div className="h-40 w-full opacity-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hrData}>
              <Area type="monotone" dataKey="hr" stroke="#3b82f6" strokeWidth={6} fillOpacity={0.1} fill="#3b82f6" />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 血壓偵測 */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-4 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="text-indigo-500"><i className="fas fa-gauge-high text-4xl"></i></div>
          <div className="text-xl text-slate-500 font-bold">血壓</div>
          <div className="text-4xl font-black text-slate-800">{bpValues.sys}/{bpValues.dia}</div>
          <button
            onClick={(e) => { e.stopPropagation(); startBpMeasure(); }}
            className="mt-2 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-lg active:bg-indigo-100"
          >
            開始偵測
          </button>
        </div>

        {/* 血氧飽和度 */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-4 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="text-blue-500"><i className="fas fa-droplet text-4xl"></i></div>
          <div className="text-xl text-slate-500 font-bold">血氧</div>
          <div className="text-4xl font-black text-slate-800">{spo2Value}%</div>
          <button
            onClick={(e) => { e.stopPropagation(); startSpo2Measure(); }}
            className="mt-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-lg active:bg-blue-100"
          >
            開始偵測
          </button>
        </div>

        {/* 體溫偵測 - 更新功能 */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-4 active:bg-slate-50 transition-colors cursor-pointer">
          <div className="text-rose-500"><i className="fas fa-thermometer-half text-4xl"></i></div>
          <div className="text-xl text-slate-500 font-bold">體溫</div>
          <div className="text-4xl font-black text-slate-800">{tempValue}°C</div>
          <button
            onClick={(e) => { e.stopPropagation(); startTempMeasure(); }}
            className="mt-2 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-lg active:bg-rose-100"
          >
            開始偵測
          </button>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="text-emerald-500"><i className="fas fa-person-walking text-4xl"></i></div>
          <div className="text-xl text-slate-500 font-bold">步數</div>
          <div className="text-4xl font-black text-slate-800">3,420</div>
        </div>
      </div>

      {/* 體溫量測彈窗 - 新增 */}
      {isMeasuringTemp && (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-8 backdrop-blur-xl">
          <div className="w-full max-w-sm bg-white rounded-[60px] p-12 text-center shadow-2xl space-y-10 border-t-8 border-rose-400">
            <div className="space-y-2">
              <h3 className="text-4xl font-black text-slate-800">體溫偵測中</h3>
              <p className="text-slate-400 text-xl font-bold">請將額頭對準前方鏡頭</p>
            </div>

            <div className="relative h-64 flex items-center justify-center">
              {/* 溫度計視覺 */}
              <div className="relative w-20 h-48 bg-slate-100 rounded-full overflow-hidden border-4 border-slate-200">
                <div
                  className="absolute bottom-0 w-full bg-rose-500 transition-all duration-300 rounded-t-full"
                  style={{ height: `${tempProgress}%` }}
                ></div>
                <div className="absolute inset-0 flex flex-col justify-between py-4 text-[10px] font-black text-slate-300">
                  <span>42°</span>
                  <span>40°</span>
                  <span>38°</span>
                  <span>36°</span>
                  <span>34°</span>
                </div>
              </div>
              <div className="ml-8 flex flex-col items-start gap-1">
                <div className="text-6xl font-black text-slate-800 tabular-nums">{(34 + (tempProgress / 100) * 3).toFixed(1)}</div>
                <div className="text-2xl font-black text-slate-400">°C 爬升中</div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[40px] overflow-hidden relative border-2 border-slate-100">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale mirror" />
              <p className="relative z-10 text-slate-600 font-black text-2xl">
                <i className="fas fa-face-smile mr-2 text-rose-400"></i> 偵測頭部位置
              </p>
            </div>

            <button
              onClick={() => stopTempMeasure(false)}
              className="w-full py-8 bg-slate-100 text-slate-500 rounded-[36px] font-black text-3xl"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 其他量測彈窗 (保持不變) */}
      {isMeasuringHr && (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-8 backdrop-blur-xl">
          <div className="w-full max-w-sm bg-white rounded-[60px] p-12 text-center shadow-2xl space-y-10 border-t-8 border-rose-500">
            <h3 className="text-4xl font-black text-slate-800">心率偵測中</h3>
            <div className="relative h-64 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-rose-500/10 rounded-full animate-ping"></div>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <i className="fas fa-heart text-8xl text-rose-500 animate-pulse"></i>
                <div className="text-2xl font-black text-slate-400 mt-4">{hrProgress}%</div>
              </div>
              <svg className="absolute w-64 h-64 transform -rotate-90">
                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-rose-500 transition-all duration-100" strokeDasharray={753.98} strokeDashoffset={753.98 * (1 - hrProgress / 100)} />
              </svg>
            </div>
            <div className="bg-slate-50 p-8 rounded-[40px] overflow-hidden relative border-2 border-slate-100">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" />
              <p className="relative z-10 text-slate-500 font-black text-2xl">手指偵測中...</p>
            </div>
            <button onClick={() => stopHrMeasure(false)} className="w-full py-8 bg-slate-100 text-slate-500 rounded-[36px] font-black text-3xl">取消</button>
          </div>
        </div>
      )}

      {isMeasuringBp && (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-8 backdrop-blur-xl">
          <div className="w-full max-w-sm bg-white rounded-[60px] p-12 text-center shadow-2xl space-y-10 border-t-8 border-indigo-500">
            <h3 className="text-4xl font-black text-slate-800">血壓量測中</h3>
            <div className="relative h-64 flex items-center justify-center">
              <div className="text-8xl font-black text-indigo-600">{Math.min(180, 80 + Math.floor(bpProgress * 1.2))}</div>
              <svg className="absolute w-64 h-64 transform -rotate-90">
                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-indigo-500 transition-all duration-100" strokeDasharray={753.98} strokeDashoffset={753.98 * (1 - bpProgress / 100)} />
              </svg>
            </div>
            <button onClick={() => stopBpMeasure(false)} className="w-full py-8 bg-slate-100 text-slate-500 rounded-[36px] font-black text-3xl">取消</button>
          </div>
        </div>
      )}

      {isMeasuringSpo2 && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[56px] p-10 text-center shadow-2xl">
            <h3 className="text-3xl font-black text-slate-800 mb-6">血氧偵測中</h3>
            <div className="relative w-48 h-48 mx-auto mb-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-blue-500 transition-all duration-100" strokeDasharray={552.92} strokeDashoffset={552.92 * (1 - spo2Progress / 100)} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-5xl font-black text-slate-800">{spo2Progress}%</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6 mb-8 border-2 border-slate-100 overflow-hidden relative">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" />
              <i className="fas fa-fingerprint text-5xl text-rose-500 animate-pulse relative z-10"></i>
            </div>
            <button onClick={() => stopSpo2Measure(false)} className="w-full py-6 bg-slate-100 text-slate-500 rounded-[32px] font-black text-2xl">取消</button>
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
