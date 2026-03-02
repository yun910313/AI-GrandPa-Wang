
import React, { useRef, useState, useEffect, useCallback } from 'react';
// 移除前端 GoogleGenAI，改由後端處理 API Key
// import { GoogleGenAI } from '@google/genai';

type VisionMode = 'med' | 'text' | 'safety' | 'food' | 'find' | 'general';

interface VisionAssistantProps {
  onBack?: () => void;
}

const VisionAssistant: React.FC<VisionAssistantProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [mode, setMode] = useState<VisionMode>('med');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [zoom, setZoom] = useState<number>(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);

  // 鏡頭切換相關
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  // 尋物目標
  const [findTarget, setFindTarget] = useState<string>('');
  const [isListeningTarget, setIsListeningTarget] = useState(false);
  const targetRecognitionRef = useRef<any>(null);

  const modes = [
    { id: 'med', label: '看藥物', icon: 'fa-pills', color: 'bg-rose-500', hint: '請將藥袋對準圓框' },
    { id: 'safety', label: '居家安全', icon: 'fa-shield-virus', color: 'bg-orange-500', hint: '請環繞拍攝四周環境' },
    { id: 'food', label: '辨識食物', icon: 'fa-utensils', color: 'bg-emerald-500', hint: '請拍攝想吃的食物' },
    { id: 'text', label: '讀文字', icon: 'fa-file-alt', color: 'bg-blue-500', hint: '請對準文字內容' },
    { id: 'find', label: '找東西', icon: 'fa-search', color: 'bg-purple-500', hint: '請掃描可能的遺失區域' },
    { id: 'general', label: '看四周', icon: 'fa-eye', color: 'bg-slate-500', hint: '讓我為您描述世界' },
  ] as const;

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    speak("正在啟動辨識，請稍微拿穩手機。");
    setIsAnalyzing(true);
    setResult("正在辨識中，請稍候...");
    setIsCollapsed(false);

    let modePrompt = "";
    switch (mode) {
      case 'med': modePrompt = "這是一張藥物或處方照片。請辨識藥名、劑量，並說明用途。"; break;
      case 'safety': modePrompt = "請檢查環境中是否有危險因素，例如地上的水漬、雜亂電線或尖銳物。"; break;
      case 'food': modePrompt = "請辨識這份食物是什麼，粗估熱量與營養。"; break;
      case 'text': modePrompt = "請朗讀照片中的所有文字內容。"; break;
      case 'find':
        modePrompt = `請在此場景中尋找「${findTarget || '眼鏡、鑰匙、遙控器'}」。如果看到了，請具體描述它的方位（如：在桌子的左上角、在電視櫃下方）。如果沒看到，請列出看到的所有物品。`;
        break;
      case 'general': modePrompt = "請用溫暖的口吻描述這個場景，讓視力不好的長者也能理解。"; break;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0) {
      console.warn("相機尚未就緒 (寬度為 0)");
      setResult("相機啟動中，請稍候再試一次。");
      return;
    }

    const canvas = canvasRef.current;
    // 優化：限制影像解析度以提升傳輸速度
    const MAX_DIMENSION = 1024;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
      if (width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      }
    } else {
      if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    // 降低品質至 0.5 以減少 base64 長度，提升傳輸效率
    const base64Image = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    console.log(`[Vision] 前端圖片優化完成 - 解析度: ${width}x${height}, 大小: ${Math.round(base64Image.length / 1024)} KB`);

    try {
      console.log(`[Vision] 正在發送請求至後端... 模式: ${mode}`);
      // 方案 B：呼叫後端中轉 API
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image,
          modePrompt,
          mode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "辨識失敗");
      }

      const data = await response.json();
      const text = data.text || "抱歉，我看不太清楚，請再試一次。";
      setResult(text);

      const segments = text.split(/【|】/);
      const summary = segments.find((_, i) => segments[i - 1] === '大意') || segments[0];
      speak(summary);
    } catch (err: any) {
      console.error("辨識錯誤:", err);
      setResult(err.message || "連線異常，請過一會再試一次。");
      speak(err.message || "連線異常，請過一會再試一次。");
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, mode, speak, findTarget]);

  // 取得所有設備清單
  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      console.log("[Vision] 偵測到之視訊設備:", videoDevices);
    } catch (err) {
      console.error("無法取得設備列表:", err);
    }
  }, []);

  const startCamera = async (deviceId?: string) => {
    try {
      // 停止舊串流
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
        audio: false
      };

      console.log(`[Vision] 正在啟動相機 (ID: ${deviceId || '預設值'})...`);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      if (deviceId) setSelectedDeviceId(deviceId);

      // 取得縮放能力
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.zoom) {
        setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step || 0.1 });
        setZoom(capabilities.zoom.min);
      } else {
        setZoomRange(null);
      }

      // 啟動成功後稍等片刻再更新設備清單（確保硬體標籤已正確載入）
      setTimeout(() => {
        refreshDevices();
      }, 500);

      speak(deviceId ? "相機切換完成。" : "影像辨識功能已開啟，您可以按下按鈕辨識物品。");
    } catch (err) {
      console.error("無法開啟相機:", err);
      speak("相機開啟失敗，請檢查權限設定。");
    }
  };

  useEffect(() => {
    startCamera();
    // 額外保險：掛載後 1 秒強制再掃一遍設備
    setTimeout(refreshDevices, 1000);

    // 初始化尋物語音辨識
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'zh-TW';
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript.replace(/[。？！]/g, '');
        setFindTarget(text);
        speak(`好的，我會幫您尋找${text}。請按下下方的立即辨識按鈕。`);
        setIsListeningTarget(false);
      };
      recognition.onend = () => setIsListeningTarget(false);
      targetRecognitionRef.current = recognition;
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // 監控硬體變更（如插拔 USB 鏡頭）
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log("[Vision] 偵測到硬體變更，重新掃描相機...");
      refreshDevices();
    };
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    // 初始掃描
    refreshDevices();

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  const applyZoom = (value: number) => {
    if (!zoomRange) return;
    const boundedValue = Math.min(Math.max(value, zoomRange.min), zoomRange.max);
    setZoom(boundedValue);
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) track.applyConstraints({ // @ts-ignore
        advanced: [{ zoom: boundedValue }]
      }).catch(() => { });
    }
  };

  const startFindTargetVoice = () => {
    if (targetRecognitionRef.current) {
      setIsListeningTarget(true);
      speak("請問您要找什麼？請說出物品名稱。");
      targetRecognitionRef.current.start();
    }
  };

  const getSegments = (text: string) => {
    if (!text) return [];
    return text.split(/【|】/).filter(s => s.trim() !== "").reduce((acc: any[], curr, i, arr) => {
      if (i % 2 === 0 && arr[i + 1]) acc.push({ title: curr, content: arr[i + 1] });
      return acc;
    }, []);
  };

  const segments = getSegments(result);

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
      {/* 相機預覽區域 */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 z-50 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center border border-white/20 active:bg-white/20"
          >
            <i className="fas fa-chevron-left text-xl"></i>
          </button>
        )}

        {/* 鏡頭切換按鍵 (頂部顯眼處) */}
        <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2">
          <button
            onClick={() => {
              refreshDevices();
              setShowDeviceSelector(!showDeviceSelector);
            }}
            className={`px-4 py-3 rounded-xl backdrop-blur-md border border-white/30 flex items-center gap-2 transition-all shadow-xl ${showDeviceSelector ? 'bg-blue-600 text-white' : 'bg-black/60 text-white active:bg-white/20'
              }`}
          >
            <i className="fas fa-sync-alt"></i>
            <span className="font-bold">更換相機 ({devices.length})</span>
          </button>

          {showDeviceSelector && (
            <div className="mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              {devices.map((device, idx) => (
                <button
                  key={device.deviceId}
                  onClick={() => {
                    startCamera(device.deviceId);
                    setShowDeviceSelector(false);
                  }}
                  className={`w-full px-4 py-4 text-left text-white font-bold border-b border-white/10 last:border-0 hover:bg-white/10 flex items-center justify-between ${selectedDeviceId === device.deviceId ? 'bg-blue-600' : ''
                    }`}
                >
                  <div className="flex items-center gap-3 truncate max-w-[200px]">
                    <i className={`fas ${device.label.toLowerCase().includes('usb') ? 'fa-video' : 'fa-camera'} opacity-70`}></i>
                    <span className="truncate text-base">{device.label || `相機 ${idx + 1}`}</span>
                  </div>
                  {selectedDeviceId === device.deviceId && <i className="fas fa-check text-xs"></i>}
                </button>
              ))}
              {devices.length === 0 && <p className="text-center py-4 text-white/40 font-bold">搜尋中...</p>}
            </div>
          )}
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-20">
          {zoomRange && (
            <div className="bg-black/60 backdrop-blur-xl p-3 rounded-full flex flex-col items-center gap-4 border border-white/20 shadow-2xl">
              <button
                onClick={() => { applyZoom(zoom + 0.5); speak("放大畫面"); }}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                <i className="fas fa-plus text-sm"></i>
              </button>
              <div className="h-36 flex items-center justify-center relative">
                <input type="range" min={zoomRange.min} max={zoomRange.max} step={zoomRange.step} value={zoom} onChange={(e) => applyZoom(parseFloat(e.target.value))} className="appearance-none bg-white/30 h-1.5 rounded-full outline-none vertical-range cursor-pointer" />
              </div>
              <button
                onClick={() => { applyZoom(zoom - 0.5); speak("縮小畫面"); }}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                <i className="fas fa-minus text-sm"></i>
              </button>
            </div>
          )}
        </div>

        {/* 尋物模式專屬語音輸入 UI */}
        {mode === 'find' && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-full px-6">
            <button
              onClick={startFindTargetVoice}
              className={`w-full py-4 rounded-3xl backdrop-blur-md border-2 transition-all flex items-center justify-center gap-4 ${isListeningTarget
                ? 'bg-emerald-500 border-white animate-pulse'
                : 'bg-black/40 border-white/20'
                }`}
            >
              <i className={`fas ${isListeningTarget ? 'fa-circle' : 'fa-microphone'} text-white`}></i>
              <span className="text-white font-black text-xl">
                {isListeningTarget ? '正在聽...' : (findTarget ? `正在找：${findTarget}` : '告訴我要找什麼')}
              </span>
            </button>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="w-72 h-72 border-2 border-white/30 rounded-[48px] relative overflow-hidden">
            {isAnalyzing && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_2s_linear_infinite]"></div>
            )}
            <div className="absolute inset-0 border-4 border-white/5 rounded-[48px]"></div>
          </div>
          <p className="mt-8 text-white font-black tracking-widest bg-black/40 px-6 py-2 rounded-full text-lg shadow-xl">
            {modes.find(m => m.id === mode)?.label} 模式
          </p>
        </div>

        <div className="absolute bottom-6 left-0 right-0 px-4 z-30">
          {/* 已移至下方白板區 */}
        </div>
      </div>

      <div
        className={`bg-white rounded-t-[40px] shadow-2xl relative z-40 flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? 'h-24' : 'max-h-[65%] h-auto'
          }`}
      >
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-full py-4 flex flex-col items-center gap-1 group">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full group-hover:bg-slate-300 transition-colors"></div>
        </button>

        <div className="px-6 pb-8 flex flex-col gap-4 overflow-hidden h-full">
          {/* 模式選擇 3 攔 Grid */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id as VisionMode);
                  speak(`切換到${m.label}模式`);
                  if (m.id !== 'find') setFindTarget('');
                }}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[24px] font-black transition-all ${mode === m.id
                  ? `${m.color} text-white shadow-lg scale-[0.97]`
                  : 'bg-slate-100 text-slate-500'
                  }`}
              >
                <i className={`fas ${m.icon} text-2xl`}></i>
                <span className="text-base">{m.label}</span>
              </button>
            ))}
          </div>


          {!isCollapsed && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {isAnalyzing ? (
                <div className="text-center py-10">
                  <i className="fas fa-circle-notch animate-spin text-4xl text-blue-600"></i>
                </div>
              ) : segments.length > 0 ? (
                segments.map((seg, idx) => (
                  <div
                    key={idx}
                    onClick={() => speak(seg.content)}
                    className="p-6 rounded-[40px] bg-slate-50 border border-slate-100 space-y-3 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="text-xl font-black text-blue-600 uppercase tracking-widest">{seg.title}</span>
                    <p className="text-3xl text-slate-700 font-black leading-relaxed">{seg.content.trim()}</p>
                  </div>
                ))
              ) : result ? (
                // 顯示非格式化的結果（如錯誤訊息或一般回覆）
                <div
                  onClick={() => speak(result)}
                  className="p-8 rounded-[40px] bg-rose-50 border border-rose-100 active:bg-rose-100 transition-colors cursor-pointer"
                >
                  <p className="text-2xl text-rose-700 font-bold leading-relaxed text-center">{result}</p>
                </div>
              ) : (
                <p
                  onClick={() => speak(mode === 'find' ? "請對準可能遺失物品的區域，然後按下方的立即辨識按鈕。" : "請對準物品並按下方的辨識按鈕。")}
                  className="text-slate-400 text-center font-black py-6 cursor-pointer text-2xl"
                >
                  {mode === 'find' ? '請對準遺失區域並辨識' : '請對準物品並按下方的按鈕'}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => captureAndAnalyze()}
            disabled={isAnalyzing}
            className={`w-full py-6 rounded-[32px] text-2xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0 ${isAnalyzing ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white'
              }`}
          >
            {isAnalyzing ? '辨識中...' : <><i className="fas fa-camera"></i> 立即辨識</>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .vertical-range { writing-mode: bt-lr; -webkit-appearance: slider-vertical; width: 12px; height: 100%; }
      `}</style>
    </div>
  );
};

export default VisionAssistant;
