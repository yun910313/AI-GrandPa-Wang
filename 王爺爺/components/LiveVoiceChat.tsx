
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface LiveVoiceChatProps {
  onBack: () => void;
}

type LanguageType = 'minnan' | 'mandarin';

const LiveVoiceChat: React.FC<LiveVoiceChatProps> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>('minnan');
  const [transcription, setTranscription] = useState<string>('');
  const [userSpeech, setUserSpeech] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // 進入頁面時的語音提示
  useEffect(() => {
    if (!isActive && !isConnecting) {
      const msg = selectedLanguage === 'minnan'
        ? '王爺爺你好！點一下螢幕中間我的頭像，就可以跟我聊天囉。'
        : '王爺爺您好！點擊螢幕中間我的頭像，就可以跟我聊天囉。';
      setTranscription(msg);
      // 稍微延遲播放，確保使用者已準備好
      const timer = setTimeout(() => speak(msg), 800);
      return () => clearTimeout(timer);
    }
  }, [selectedLanguage, isActive, isConnecting, speak]);

  useEffect(() => {
    if (isActive) {
      setUserSpeech('');
      setTranscription('連線成功！我正在聽您說話...');
    }
  }, [isActive]);

  // 音訊處理輔助函數
  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  function createBlob(data: Float32Array) {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  const startSession = async () => {
    if (isActive || isConnecting) return;
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `你是一個貼心的銀髮助手，形象是一位溫柔的居家照顧者。請用${selectedLanguage === 'minnan' ? '台語' : '國語'}對話。回覆要親切、簡單、口語化。`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setTranscription('我準備好了！您可以開始對我說話囉。');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) setUserSpeech(prev => prev + msg.serverContent!.inputTranscription!.text);
            if (msg.serverContent?.outputTranscription) setTranscription(prev => (prev.includes('連線') || prev.includes('點擊') ? '' : prev) + msg.serverContent!.outputTranscription!.text);
            if (msg.serverContent?.turnComplete) setUserSpeech('');

            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsAiSpeaking(true);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => { sourcesRef.current.delete(source); if (sourcesRef.current.size === 0) setIsAiSpeaking(false); };
            }
          },
          onerror: () => { setIsConnecting(false); setIsActive(false); },
          onclose: () => { setIsActive(false); setIsConnecting(false); }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { setIsConnecting(false); }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    audioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsActive(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    speak("對話結束囉，祝您有美好的一天！");
  };

  const AIAvatar = () => (
    <button
      onClick={!isActive ? startSession : undefined}
      disabled={isConnecting}
      className={`relative w-80 h-80 flex items-center justify-center transition-all focus:outline-none ${!isActive && !isConnecting ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
    >
      {/* 呼吸感背景 */}
      <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 ${isActive ? (isAiSpeaking ? 'bg-orange-400 opacity-40 scale-125' : 'bg-blue-400 opacity-20 scale-110') : 'bg-slate-200 opacity-20 scale-100'
        }`}></div>

      {/* 動態外環 */}
      <div className={`absolute inset-4 rounded-full border-2 border-dashed transition-all duration-1000 ${isActive ? 'border-orange-300/30 animate-spin-slow' : 'border-transparent'
        }`}></div>

      {/* 主頭像球體 */}
      <div className={`relative w-64 h-64 rounded-full shadow-2xl transition-all duration-500 flex flex-col items-center justify-center overflow-hidden ${isActive
          ? (isAiSpeaking ? 'bg-gradient-to-br from-blue-600 via-orange-400 to-rose-400 scale-110 ring-8 ring-orange-50' : 'bg-gradient-to-br from-slate-700 to-blue-900 scale-105')
          : isConnecting ? 'bg-slate-400 animate-pulse' : 'bg-gradient-to-br from-blue-500 to-indigo-600 scale-100 hover:shadow-blue-200 shadow-xl'
        }`}>
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>

        <div className={`relative z-10 transition-all duration-500 flex flex-col items-center ${isActive || isConnecting ? 'opacity-100' : 'opacity-100 text-white'}`}>
          {isAiSpeaking ? (
            <div className="flex gap-2 items-end h-12 mb-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-2.5 bg-white rounded-full animate-ai-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          ) : isConnecting ? (
            <div className="flex flex-col items-center gap-4">
              <i className="fas fa-circle-notch animate-spin text-7xl text-white"></i>
              <span className="text-white font-black text-xl">連線中</span>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              <i className={`fas fa-user-nurse text-[120px] text-white`}></i>
              {!isActive && (
                <div className="mt-2 bg-white text-blue-600 px-6 py-2 rounded-full text-lg font-black tracking-widest animate-bounce shadow-xl">點我開始</div>
              )}
            </div>
          )}

          {isActive && !isAiSpeaking && (
            <p className="mt-4 text-white/80 font-black tracking-widest text-sm uppercase">暖心照顧者 聽候吩咐</p>
          )}
        </div>

        <div className={`absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-white/20 to-transparent transition-opacity duration-500 ${isAiSpeaking ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-full space-y-10 pb-32">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-800 tracking-tight">暖心助理</h2>
        <div className="flex justify-center gap-4 bg-slate-100 p-2 rounded-[32px] shadow-inner">
          <button
            onClick={() => setSelectedLanguage('minnan')}
            className={`px-6 py-3 rounded-[24px] font-black text-xl transition-all ${selectedLanguage === 'minnan' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400'}`}
          >
            🇹🇼 台語
          </button>
          <button
            onClick={() => setSelectedLanguage('mandarin')}
            className={`px-6 py-3 rounded-[24px] font-black text-xl transition-all ${selectedLanguage === 'mandarin' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400'}`}
          >
            🇹🇼 國語
          </button>
        </div>
      </div>

      <AIAvatar />

      <div className="bg-white p-10 rounded-[56px] shadow-2xl border-4 border-blue-50 w-full min-h-[350px] flex flex-col gap-8 relative overflow-hidden">
        {/* 背景裝飾圖案 */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <i className="fas fa-quote-right text-[120px]"></i>
        </div>

        {userSpeech && (
          <div className="bg-blue-50 p-6 rounded-[36px] border border-blue-100 self-end max-w-[90%] shadow-sm animate-in slide-in-from-right duration-300">
            <p className="text-sm font-black text-blue-400 mb-2 uppercase tracking-widest">您的話：</p>
            <p className="text-3xl text-slate-700 font-black">「{userSpeech}」</p>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-4xl text-slate-800 leading-snug font-black transition-all">
            {transcription}
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-6">
        {isActive ? (
          <button onClick={stopSession} className="w-full py-8 bg-slate-900 text-white rounded-[40px] text-4xl font-black shadow-lg active:scale-95 flex items-center justify-center gap-4">
            <i className="fas fa-stop-circle"></i> 結束對話
          </button>
        ) : (
          <div className="text-center p-4">
            <p className="text-slate-400 font-bold text-xl animate-pulse">請點擊上方頭像開始</p>
          </div>
        )}
        <button onClick={onBack} className="w-full py-4 text-slate-400 font-black text-2xl underline underline-offset-8">返回首頁</button>
      </div>

      <style>{`
        @keyframes ai-pulse { 0%, 100% { height: 20%; } 50% { height: 100%; } }
        .animate-ai-pulse { animation: ai-pulse 0.8s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 15s linear infinite; }
      `}</style>
    </div>
  );
};

export default LiveVoiceChat;
