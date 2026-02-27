import React, { useState, useEffect } from 'react';
import {
  Heart,
  Pill,
  ClipboardList,
  MapPin,
  ChevronRight,
  Bell,
  User,
  Home,
  Activity,
  Plus,
  ArrowLeft,
  Thermometer,
  Wind,
  Edit2,
  Trash2,
  Phone,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { MedicalRecord, Medication, TestResult, GPSLog, DoctorNote, VitalSigns, UserProfile, ElderlyProfile, EmergencyContact } from './types';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};

const safeFetch = async (url: string, setter: (data: any) => void) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const text = await res.text();
    if (!text || !text.trim()) return;
    const data = JSON.parse(text);
    setter(data);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
};

// --- Components ---

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void; key?: React.Key }) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md active:scale-[0.98]",
      className
    )}
  >
    {children}
  </div>
);

const VitalCard = ({ label, value, unit, icon: Icon, colorClass }: { label: string; value: string | number; unit: string; icon: any; colorClass: string }) => (
  <div className="bg-white rounded-2xl p-3 border border-slate-100 flex flex-col gap-1">
    <div className={cn("p-1.5 rounded-lg w-fit mb-1", colorClass)}>
      <Icon size={16} />
    </div>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-slate-900">{value}</span>
      <span className="text-[10px] text-slate-500">{unit}</span>
    </div>
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'warning' | 'danger' | 'success' }) => {
  const variants = {
    default: "bg-slate-100 text-slate-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
    success: "bg-emerald-50 text-emerald-600",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider", variants[variant])}>
      {children}
    </span>
  );
};

// --- Views ---

const Dashboard = ({ onNavigate, selectedId, onSelectId, user }: { onNavigate: (view: string) => void, selectedId: string | null, onSelectId: (id: string) => void, user: any }) => {
  const [latestGps, setLatestGps] = useState<GPSLog | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [vitals, setVitals] = useState<VitalSigns | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<ElderlyProfile[]>([]);

  useEffect(() => {
    safeFetch('/api/elderly-profiles', (data) => {
      setProfiles(data);
      if (!selectedId && data.length > 0) {
        onSelectId(data[0].id);
      }
    });

    const currentId = selectedId || '';
    safeFetch(`/api/gps-latest?elderly_id=${currentId}`, setLatestGps);
    safeFetch(`/api/medications?elderly_id=${currentId}`, setMeds);
    safeFetch(`/api/vital-signs-latest?elderly_id=${currentId}`, setVitals);
    safeFetch(`/api/user-profile?id=${user?.id}`, setUserProfile);

    const interval = setInterval(() => {
      safeFetch(`/api/vital-signs-latest?elderly_id=${currentId}`, setVitals);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const selectedElderly = profiles.find(p => p.id === selectedId);

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">早安，{userProfile?.name || '...'}</h1>
            <p className="text-slate-500 text-sm">今日狀況穩定</p>
          </div>
        </div>
        <div className="flex gap-2">
          {profiles.length > 1 && (
            <select
              value={selectedId || ''}
              onChange={(e) => onSelectId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => onNavigate('profile')}
            className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50"
          >
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Profile Info Header */}
      {selectedElderly && (
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <User size={30} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{selectedElderly.name} 的管理區</h2>
            <p className="text-xs text-slate-500">{selectedElderly.age} 歲 | {selectedId ? `ID: ${selectedId}` : ''}</p>
          </div>
          <div className="ml-auto">
            <Badge variant="success">守護中</Badge>
          </div>
        </div>
      )}

      {/* GPS Status */}
      <Card onClick={() => onNavigate('gps')} className="bg-indigo-50 border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-xl text-indigo-600">
            <MapPin size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">即時定位</span>
              {selectedElderly && latestGps && selectedElderly.safe_zone_lat && selectedElderly.safe_zone_lng ? (
                (() => {
                  const dist = calculateDistance(latestGps.latitude, latestGps.longitude, selectedElderly.safe_zone_lat, selectedElderly.safe_zone_lng);
                  const isSafe = dist <= (selectedElderly.safe_zone_range || 500);
                  return <Badge variant={isSafe ? 'success' : 'danger'}>{isSafe ? '安全區域內' : `超出範圍 (${Math.round(dist)}m)`}</Badge>;
                })()
              ) : (
                <Badge variant="warning">偵測中</Badge>
              )}
            </div>
            <p className="text-slate-900 font-medium mb-1">{latestGps?.address || '讀取中...'}</p>
            <p className="text-slate-500 text-xs">最後更新: {latestGps ? format(new Date(latestGps.timestamp), 'HH:mm') : '--:--'}</p>
          </div>
          <ChevronRight className="text-slate-400 self-center" size={20} />
        </div>
      </Card>

      {/* Real-time Vital Signs */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">即時健康狀態</h2>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Live</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <VitalCard
            label="心率"
            value={vitals?.heart_rate || '--'}
            unit="BPM"
            icon={Activity}
            colorClass="bg-rose-50 text-rose-600"
          />
          <VitalCard
            label="血壓"
            value={vitals ? `${vitals.systolic}/${vitals.diastolic}` : '--/--'}
            unit="mmHg"
            icon={Heart}
            colorClass="bg-indigo-50 text-indigo-600"
          />
          <VitalCard
            label="血氧"
            value={vitals?.blood_oxygen || '--'}
            unit="%"
            icon={Wind}
            colorClass="bg-sky-50 text-sky-600"
          />
          <VitalCard
            label="體溫"
            value={vitals?.temperature || '--'}
            unit="°C"
            icon={Thermometer}
            colorClass="bg-amber-50 text-amber-600"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card onClick={() => onNavigate('medical')} className="flex flex-col gap-3">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl w-fit">
            <Heart size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">就醫紀錄</h3>
            <p className="text-slate-500 text-[10px]">上次: 2/15 榮總</p>
          </div>
        </Card>

        <Card onClick={() => onNavigate('meds')} className="flex flex-col gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
            <Pill size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">用藥資訊</h3>
            <p className="text-slate-500 text-[10px]">{meds.length} 種藥物服用中</p>
          </div>
        </Card>

      </div>
    </div>
  );
};

const MedicalRecordsView = ({ onBack, selectedId }: { onBack: () => void, selectedId: string | null }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hospital: '',
    department: '',
    doctor: '',
    diagnosis: '',
    notes: ''
  });

  const fetchRecords = () => {
    safeFetch(`/api/medical-records?elderly_id=${selectedId || ''}`, setRecords);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleEdit = (record: MedicalRecord) => {
    setFormData({
      date: record.date,
      hospital: record.hospital,
      department: record.department,
      doctor: record.doctor,
      diagnosis: record.diagnosis,
      notes: record.notes
    });
    setEditingId(record.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除這筆紀錄嗎？')) return;
    try {
      const response = await fetch(`/api/medical-records/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('刪除失敗');
      fetchRecords();
    } catch (error) {
      console.error('Delete error:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/medical-records/${editingId}` : '/api/medical-records';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, elderly_id: selectedId })
    });

    if (!response.ok) {
      alert('儲存失敗，請稍後再試');
      return;
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      hospital: '',
      department: '',
      doctor: '',
      diagnosis: '',
      notes: ''
    });
    fetchRecords();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      hospital: '',
      department: '',
      doctor: '',
      diagnosis: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={isAdding ? handleCancel : onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {isAdding ? (editingId ? '編輯就醫紀錄' : '新增就醫紀錄') : '就醫紀錄'}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">就醫日期</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">醫院名稱</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 榮總"
                    value={formData.hospital}
                    onChange={e => setFormData({ ...formData, hospital: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">科別</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 心臟內科"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">主治醫師</label>
                <input
                  type="text"
                  placeholder="例如: 王醫師"
                  value={formData.doctor}
                  onChange={e => setFormData({ ...formData, doctor: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">診斷結果</label>
                <textarea
                  required
                  rows={3}
                  placeholder="請輸入醫師診斷內容..."
                  value={formData.diagnosis}
                  onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">備註事項</label>
                <textarea
                  rows={2}
                  placeholder="例如: 下次預約日期、注意事項等"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-rose-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-[0.98] transition-all"
                >
                  {editingId ? '更新紀錄' : '儲存紀錄'}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {records.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
                <p>尚無就醫紀錄</p>
              </div>
            ) : (
              records.map(record => (
                <Card key={record.id} className="space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">{record.date}</p>
                      <h3 className="font-bold text-slate-900 text-lg">{record.hospital} - {record.department}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="編輯"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="刪除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-700 mb-1">診斷結果</p>
                    <p className="text-sm text-slate-600">{record.diagnosis}</p>
                  </div>
                  {record.notes && (
                    <div className="text-sm text-slate-500 italic">
                      備註: {record.notes}
                    </div>
                  )}
                </Card>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-rose-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-rose-700 transition-colors z-10"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

const MedicationView = ({ onBack, selectedId, user }: { onBack: () => void, selectedId: string | null, user: any }) => {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    reminder_time: ''
  });

  const fetchMeds = () => safeFetch(`/api/medications?elderly_id=${selectedId || ''}`, setMeds);

  useEffect(() => {
    fetchMeds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const url = editingId ? `/api/medications/${editingId}` : '/api/medications';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, elderly_id: selectedId, user_id: user?.id })
      });

      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', dosage: '', reminder_time: '' });
        fetchMeds();
      } else {
        const text = await res.text();
        alert(`儲存失敗: ${text}`);
      }
    } catch (err: any) {
      alert(`連線錯誤: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除此藥物嗎？')) return;
    const res = await fetch(`/api/medications/${id}`, { method: 'DELETE' });
    if (res.ok) fetchMeds();
  };

  const handleEdit = (med: Medication) => {
    setFormData({
      name: med.name,
      dosage: med.dosage,
      reminder_time: med.reminder_time
    });
    setEditingId(med.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={isAdding ? () => setIsAdding(false) : onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {isAdding ? (editingId ? '編輯藥物' : '新增藥物') : '用藥資訊'}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">藥品名稱</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">每次劑量</label>
                  <input
                    type="text" required placeholder="例如: 2 顆"
                    value={formData.dosage}
                    onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">提醒時間</label>
                  <input
                    type="time" required
                    value={formData.reminder_time}
                    onChange={e => setFormData({ ...formData, reminder_time: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">取消</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all pointer-events-auto cursor-pointer"
                >
                  {submitting ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-6">
              <div className="flex items-center gap-3 text-emerald-700 mb-2">
                <Activity size={20} />
                <span className="font-bold">用藥提醒</span>
              </div>
              <p className="text-sm text-emerald-600">
                {meds.length > 0 ? `目前有 ${meds.length} 種藥物服用中。` : '目前尚無用藥紀錄。'}
              </p>
            </div>

            {meds.map(med => (
              <Card key={med.id} className="flex items-center gap-4 relative group">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Pill size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{med.name}</h3>
                  <p className="text-xs text-slate-500">{med.dosage} | {med.reminder_time}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button onClick={() => handleEdit(med)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(med.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-colors z-10"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

const TestResultsView = ({ onBack, selectedId }: { onBack: () => void, selectedId: string | null }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    test_name: '',
    value: 0,
    unit: '',
    reference_range: '',
    status: '正常'
  });

  const fetchResults = () => safeFetch(`/api/test-results?elderly_id=${selectedId || ''}`, setResults);

  useEffect(() => {
    fetchResults();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/test-results/${editingId}` : '/api/test-results';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, elderly_id: selectedId })
    });

    if (res.ok) {
      setIsAdding(false);
      setEditingId(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        test_name: '',
        value: 0,
        unit: '',
        reference_range: '',
        status: '正常'
      });
      fetchResults();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除此檢查結果嗎？')) return;
    const res = await fetch(`/api/test-results/${id}`, { method: 'DELETE' });
    if (res.ok) fetchResults();
  };

  const handleEdit = (result: TestResult) => {
    setFormData({
      date: result.date,
      test_name: result.test_name,
      value: result.value,
      unit: result.unit,
      reference_range: result.reference_range,
      status: result.status
    });
    setEditingId(result.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={isAdding ? () => setIsAdding(false) : onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {isAdding ? (editingId ? '編輯檢查結果' : '新增檢查結果') : '檢查結果'}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">檢查日期</label>
                <input
                  type="date" required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">項目名稱</label>
                <input
                  type="text" required placeholder="例如: 糖化血色素"
                  value={formData.test_name}
                  onChange={e => setFormData({ ...formData, test_name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">數值</label>
                  <input
                    type="number" step="0.1" required
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">單位</label>
                  <input
                    type="text" required placeholder="例如: %"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">參考範圍</label>
                <input
                  type="text" required placeholder="例如: 4.0-5.6"
                  value={formData.reference_range}
                  onChange={e => setFormData({ ...formData, reference_range: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">狀態</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="正常">正常</option>
                  <option value="偏高">偏高</option>
                  <option value="偏低">偏低</option>
                  <option value="異常">異常</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">取消</button>
                <button type="submit" className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100">儲存</button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {results.map(result => (
              <Card key={result.id} className="space-y-3 relative group">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{result.date}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.status === '正常' ? 'success' : 'warning'}>{result.status}</Badge>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(result)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(result.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900">{result.test_name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-indigo-600">{result.value}</span>
                  <span className="text-sm text-slate-500">{result.unit}</span>
                </div>
                <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
                  參考範圍: {result.reference_range}
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors z-10"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

const GPSView = ({ onBack, selectedId }: { onBack: () => void, selectedId: string | null }) => {
  const [latest, setLatest] = useState<GPSLog | null>(null);
  const [elderly, setElderly] = useState<ElderlyProfile | null>(null);

  useEffect(() => {
    const currentId = selectedId || '';
    safeFetch(`/api/gps-latest?elderly_id=${currentId}`, setLatest);
    safeFetch(`/api/elderly-profile/${currentId}`, setElderly);

    const interval = setInterval(() => {
      safeFetch(`/api/gps-latest?elderly_id=${currentId}`, setLatest);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const lat = latest?.latitude ?? 22.6273;
  const lng = latest?.longitude ?? 120.3014;
  const delta = 0.008;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="space-y-4 pb-24 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">GPS 定位追蹤</h1>
        <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">
          即時
        </span>
      </div>

      {/* Real Map */}
      <div className="flex-1 rounded-3xl relative overflow-hidden min-h-[360px] shadow-md border border-slate-200">
        <iframe
          key={`${lat},${lng}`}
          src={mapUrl}
          className="w-full h-full min-h-[360px] border-0"
          loading="lazy"
          title="GPS 地圖定位"
        />

        {/* Overlay info card */}
        <div className="absolute bottom-4 left-4 right-4">
          <Card className={cn(
            "bg-white/90 backdrop-blur-md border-none shadow-xl",
            latest && elderly?.safe_zone_lat && elderly?.safe_zone_lng &&
              calculateDistance(latest.latitude, latest.longitude, elderly.safe_zone_lat, elderly.safe_zone_lng) > (elderly.safe_zone_range || 500)
              ? "border-l-4 border-l-rose-500" : ""
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-colors",
                latest && elderly?.safe_zone_lat && elderly?.safe_zone_lng &&
                  calculateDistance(latest.latitude, latest.longitude, elderly.safe_zone_lat, elderly.safe_zone_lng) > (elderly.safe_zone_range || 500)
                  ? "bg-rose-600 animate-bounce" : "bg-indigo-600"
              )}>
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{elderly?.name || '讀取中...'}</p>
                <p className="text-xs text-slate-500 truncate">{latest?.address || '定位中...'}</p>
              </div>
              <div className="text-right text-[10px] text-slate-400 flex-shrink-0">
                <p>{latest ? format(new Date(latest.timestamp), 'HH:mm') : '--:--'}</p>
                {latest && elderly?.safe_zone_lat && elderly?.safe_zone_lng ? (
                  (() => {
                    const dist = calculateDistance(latest.latitude, latest.longitude, elderly.safe_zone_lat, elderly.safe_zone_lng);
                    const isSafe = dist <= (elderly.safe_zone_range || 500);
                    return <p className={cn("font-bold", isSafe ? "text-emerald-600" : "text-rose-600")}>
                      {isSafe ? "安全區域" : `危險！超出 ${Math.round(dist)}m`}
                    </p>;
                  })()
                ) : <p className="text-slate-400">尚未設定圍籬</p>}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-slate-900">位置資訊</h3>
        <Card className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">目前地址</span>
            <span className="font-medium text-slate-900 text-right max-w-[60%]">{latest?.address || '讀取中...'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">緯度</span>
            <span className="font-medium text-slate-700 font-mono">{lat.toFixed(5)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">經度</span>
            <span className="font-medium text-slate-700 font-mono">{lng.toFixed(5)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">更新時間</span>
            <span className="font-medium text-slate-700">{latest ? format(new Date(latest.timestamp), 'yyyy/MM/dd HH:mm') : '--'}</span>
          </div>
        </Card>

        <h3 className="font-bold text-slate-900">安全設定</h3>
        <Card className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">電子圍籬</p>
              <p className="text-xs text-slate-500">住家半徑 {elderly?.safe_zone_range || 500} 公尺</p>
            </div>
          </div>
          <div className="w-12 h-6 bg-indigo-600 rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </Card>
      </div>
    </div>
  );
};



const ProfileView = ({ onBack, onNavigate, user }: { onBack: () => void; onNavigate: (view: string) => void, user: any }) => {
  const [notifications, setNotifications] = useState(true);
  const [gpsTracking, setGpsTracking] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    safeFetch(`/api/user-profile?id=${user?.id}`, setProfile);
  }, []);

  const menuItems = [
    { icon: User, label: '個人資料', color: 'text-blue-600', bg: 'bg-blue-50', view: 'edit-profile' },
    { icon: Heart, label: '長輩資料', color: 'text-rose-600', bg: 'bg-rose-50', view: 'edit-elderly' },
    { icon: Phone, label: '緊急聯絡人', color: 'text-emerald-600', bg: 'bg-emerald-50', view: 'edit-emergency' },
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">我的帳號</h1>
      </div>

      {/* User Header */}
      <div className="flex items-center gap-4 p-2">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <User size={40} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{profile?.name || '讀取中...'}</h2>
          <p className="text-slate-500 text-sm">{profile?.role || '家屬管理員'}</p>
          <div className="mt-1">
            <Badge variant="success">已認證帳號</Badge>
          </div>
        </div>
      </div>

      {/* Profile Menu */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">帳號管理</h3>
        <Card className="p-0 overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(item.view)}
              className={cn(
                "w-full flex justify-between items-center p-4 hover:bg-slate-50 transition-colors",
                idx !== menuItems.length - 1 && "border-b border-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", item.bg, item.color)}>
                  <item.icon size={20} />
                </div>
                <span className="font-bold text-slate-900 text-sm">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ))}
        </Card>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">系統設定</h3>
        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Bell size={20} />
              </div>
              <span className="text-sm font-bold">推播通知</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative",
                notifications ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                notifications ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <MapPin size={20} />
              </div>
              <span className="text-sm font-bold">GPS 背景追蹤</span>
            </div>
            <button
              onClick={() => setGpsTracking(!gpsTracking)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative",
                gpsTracking ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                gpsTracking ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </Card>
      </div>

      {/* Backup Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">資料管理</h3>
        <Card className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ClipboardList size={20} />
            </div>
            <span className="text-sm font-bold">資料備份 (JSON)</span>
          </div>
          <button
            onClick={() => window.open('/api/backup', '_blank')}
            className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            下載備份
          </button>
        </Card>
      </div>

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.removeItem('user');
          window.location.reload();
        }}
        className="w-full py-4 flex items-center justify-center gap-2 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-colors"
      >
        <LogOut size={20} />
        <span>登出系統</span>
      </button>

      <div className="text-center">
        <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em]">安心長照 © 2026</p>
      </div>
    </div>
  );
};

const EditProfileView = ({ onBack, user }: { onBack: () => void, user: any }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      await safeFetch(`/api/user-profile?id=${user?.id}`, setProfile);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const res = await fetch(`/api/user-profile?id=${user?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (res.ok) {
      alert('個人資料已更新');
      onBack();
    }
  };

  if (loading) return <div className="p-8 text-center">載入中...</div>;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">編輯個人資料</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">姓名</label>
          <input
            type="text"
            required
            value={profile?.name || ''}
            onChange={e => setProfile(p => p ? { ...p, name: e.target.value } : null)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">身分角色</label>
          <input
            type="text"
            required
            value={profile?.role || ''}
            onChange={e => setProfile(p => p ? { ...p, role: e.target.value } : null)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">電話</label>
          <input
            type="tel"
            required
            value={profile?.phone || ''}
            onChange={e => setProfile(p => p ? { ...p, phone: e.target.value } : null)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">電子郵件</label>
          <input
            type="email"
            required
            value={profile?.email || ''}
            onChange={e => setProfile(p => p ? { ...p, email: e.target.value } : null)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">居住地址</label>
          <input
            type="text"
            value={profile?.address || ''}
            onChange={e => setProfile(p => p ? { ...p, address: e.target.value } : null)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          儲存修改
        </button>
      </form>
    </div>
  );
};

const EditElderlyView = ({ onBack, user }: { onBack: () => void, user: any }) => {
  const [profiles, setProfiles] = useState<ElderlyProfile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<ElderlyProfile>>({
    name: '',
    age: 0,
    gender: '男',
    blood_type: '',
    birthday: '',
    height: '',
    weight: '',
    primary_hospital: '',
    safe_zone_address: '',
    safe_zone_range: 500,
    safe_zone_lat: undefined,
    safe_zone_lng: undefined,
    account: '',
    password: '',
    medical_history: ''
  });

  const fetchProfiles = async () => {
    setLoading(true);
    await safeFetch('/api/elderly-profiles', setProfiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const url = editingId ? `/api/elderly-profile/${editingId}` : '/api/elderly-profile';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method === 'POST' ? { ...formData, associated_user_id: user?.id } : formData)
      });

      if (res.ok) {
        alert(editingId ? '長輩資料已更新' : '長輩資料已新增');
        setIsAdding(false);
        setEditingId(null);
        fetchProfiles();
      } else {
        const text = await res.text();
        try {
          const errorData = JSON.parse(text);
          alert(`發生錯誤: ${errorData.message || '無法儲存'}`);
        } catch (e) {
          alert(`伺服器錯誤 (代碼 ${res.status}): ${text.slice(0, 100)}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(`連線失敗: ${err.message || '請檢查伺服器狀態'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除這位長輩的資料嗎？')) return;
    const res = await fetch(`/api/elderly-profile/${id}`, { method: 'DELETE' });
    if (res.ok) fetchProfiles();
  };

  const handleEdit = (profile: ElderlyProfile) => {
    setFormData(profile);
    setEditingId(profile.id);
    setIsAdding(true);
  };

  if (loading && profiles.length === 0) return <div className="p-8 text-center">載入中...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-32"
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={isAdding ? () => { setIsAdding(false); setEditingId(null); } : onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {isAdding ? (editingId ? '編輯長輩資料' : '新增長輩資料') : '長輩資料列表'}
        </h1>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">姓名</label>
            <input
              type="text"
              required
              placeholder="請輸入姓名"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">年齡</label>
              <input
                type="number"
                required
                min="0"
                placeholder="歲"
                value={formData.age === 0 ? '' : (formData.age || '')}
                onChange={e => {
                  const age = Number(e.target.value);
                  if (age >= 0) {
                    const today = new Date();
                    const birthYear = today.getFullYear() - age;
                    const currentBirthday = formData.birthday ? new Date(formData.birthday) : new Date(birthYear, 0, 1);
                    const newBirthday = new Date(birthYear, currentBirthday.getMonth(), currentBirthday.getDate());
                    setFormData({ ...formData, age, birthday: newBirthday.toISOString().split('T')[0] });
                  } else {
                    setFormData({ ...formData, age: Number(e.target.value) });
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">性別</label>
              <select
                value={formData.gender || '男'}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">出生日期</label>
            <input
              type="date"
              required
              value={formData.birthday || ''}
              onChange={e => {
                const bday = e.target.value;
                if (bday) {
                  const birthDate = new Date(bday);
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  setFormData({ ...formData, birthday: bday, age });
                } else {
                  setFormData({ ...formData, birthday: bday });
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">身高</label>
              <input
                type="text" placeholder="例如: 170cm"
                value={formData.height || ''}
                onChange={e => setFormData({ ...formData, height: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">體重</label>
              <input
                type="text" placeholder="例如: 65kg"
                value={formData.weight || ''}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">血型</label>
            <select
              value={formData.blood_type || ''}
              onChange={e => setFormData({ ...formData, blood_type: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="">未選擇</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">主要就診醫院</label>
            <input
              type="text"
              value={formData.primary_hospital || ''}
              onChange={e => setFormData({ ...formData, primary_hospital: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">長輩登入帳號</label>
              <input
                type="text"
                placeholder="例如: wang88"
                value={formData.account || ''}
                onChange={e => setFormData({ ...formData, account: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">長輩登入密碼</label>
              <input
                type="text"
                placeholder="設定密碼"
                value={formData.password || ''}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">電子圍籬安全地址</label>
            <input
              type="text"
              value={formData.safe_zone_address || ''}
              onChange={e => setFormData({ ...formData, safe_zone_address: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">電子圍籬範圍 (公尺)</label>
            <input
              type="number"
              value={formData.safe_zone_range || 500}
              onChange={e => setFormData({ ...formData, safe_zone_range: Number(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">中心緯度 (Latitude)</label>
              <input
                type="number" step="any"
                placeholder="例如: 22.6273"
                value={formData.safe_zone_lat ?? ''}
                onChange={e => setFormData({ ...formData, safe_zone_lat: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">中心經度 (Longitude)</label>
              <input
                type="number" step="any"
                placeholder="例如: 120.3014"
                value={formData.safe_zone_lng ?? ''}
                onChange={e => setFormData({ ...formData, safe_zone_lng: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">過往病史</label>
            <textarea
              rows={4}
              value={formData.medical_history || ''}
              onChange={e => setFormData({ ...formData, medical_history: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 disabled:opacity-50 transition-all pointer-events-auto cursor-pointer"
          >
            {submitting ? '儲存中...' : (editingId ? '儲存修改' : '立即新增')}
          </motion.button>
        </form>
      ) : (
        <div className="space-y-4">
          {profiles.map(p => (
            <Card key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.age} 歲 | {p.gender}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18} /></button>
              </div>
            </Card>
          ))}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setFormData({
                name: '', age: 0, gender: '男', blood_type: '', birthday: '', height: '', weight: '',
                primary_hospital: '', safe_zone_address: '', safe_zone_range: 500, medical_history: ''
              });
              setEditingId(null);
              setIsAdding(true);
            }}
            className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium flex items-center justify-center gap-2 hover:border-rose-200 hover:text-rose-600 transition-all cursor-pointer"
          >
            <Plus size={20} />
            <span>新增長輩資料</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
const EditEmergencyView = ({ onBack }: { onBack: () => void }) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', relationship: '', phone: '' });

  const fetchContacts = () => safeFetch('/api/emergency-contacts', setContacts);

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/emergency-contacts/${editingId}` : '/api/emergency-contacts';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', relationship: '', phone: '' });
      fetchContacts();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除此聯絡人嗎？')) return;
    const res = await fetch(`/api/emergency-contacts/${id}`, { method: 'DELETE' });
    if (res.ok) fetchContacts();
  };

  const handleEdit = (contact: EmergencyContact) => {
    setFormData({ name: contact.name, relationship: contact.relationship, phone: contact.phone });
    setEditingId(contact.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={isAdding ? () => setIsAdding(false) : onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {isAdding ? (editingId ? '編輯聯絡人' : '新增聯絡人') : '緊急聯絡人'}
        </h1>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">姓名</label>
            <input
              type="text" required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">關係</label>
            <input
              type="text" required
              value={formData.relationship}
              onChange={e => setFormData({ ...formData, relationship: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">電話</label>
            <input
              type="tel" required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">取消</button>
            <button type="submit" className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-100">儲存</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {contacts.map(contact => (
            <Card key={contact.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{contact.name} ({contact.relationship})</p>
                  <p className="text-xs text-slate-500">{contact.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(contact)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(contact.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </Card>
          ))}
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium flex items-center justify-center gap-2 hover:border-emerald-200 hover:text-emerald-600 transition-all"
          >
            <Plus size={20} />
            <span>新增緊急聯絡人</span>
          </button>
        </div>
      )}
    </div>
  );
};

const LoginView = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setError(data.message || '帳號或密碼錯誤');
      }
    } catch (err) {
      setError('連線失敗，請檢查網路狀態');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-4">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Heart size={40} fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">歡迎回來</h1>
        <p className="text-slate-500">請登入以管理家人健康</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">帳號</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              placeholder="請輸入帳號"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">密碼</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              placeholder="請輸入密碼"
            />
          </div>
          {error && <p className="text-rose-600 text-xs text-center font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? '登入中...' : '立即登入'}
          </button>
        </form>
      </Card>
      <p className="text-center mt-8 text-slate-400 text-[10px] leading-relaxed">
        預設測試帳號: testuser / 密碼: password123<br />
        管理員帳號: admin / 密碼: 123456 (需先建立)
      </p>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedElderlyId, setSelectedElderlyId] = useState<string | null>(null);

  useEffect(() => {
    // Try to restore selected elderly ID
    const savedId = localStorage.getItem('selectedElderlyId');
    if (savedId && savedId !== 'NaN') setSelectedElderlyId(savedId);
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAuthChecked(true);
  }, []);

  const renderView = () => {
    if (!user) return <LoginView onLoginSuccess={setUser} />;

    switch (currentView) {
      case 'medical': return <MedicalRecordsView onBack={() => setCurrentView('dashboard')} selectedId={selectedElderlyId} />;
      case 'meds': return <MedicationView onBack={() => setCurrentView('dashboard')} selectedId={selectedElderlyId} user={user} />;
      case 'tests': return <TestResultsView onBack={() => setCurrentView('dashboard')} selectedId={selectedElderlyId} />;
      case 'gps': return <GPSView onBack={() => setCurrentView('dashboard')} selectedId={selectedElderlyId} />;
      case 'profile': return <ProfileView onBack={() => setCurrentView('dashboard')} onNavigate={setCurrentView} user={user} />;
      case 'edit-profile': return <EditProfileView onBack={() => setCurrentView('profile')} user={user} />;
      case 'edit-elderly': return <EditElderlyView onBack={() => setCurrentView('profile')} user={user} />;
      case 'edit-emergency': return <EditEmergencyView onBack={() => setCurrentView('profile')} />;
      default: return <Dashboard onNavigate={setCurrentView} selectedId={selectedElderlyId} onSelectId={(id) => {
        setSelectedElderlyId(id);
        localStorage.setItem('selectedElderlyId', id.toString());
      }} user={user} />;
    }
  };

  if (!authChecked) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">載入中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-md mx-auto px-6 pt-8 min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={user ? currentView : 'login'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation */}
        {user && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-4 flex justify-around items-center z-50">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={cn("flex flex-col items-center gap-1", currentView === 'dashboard' ? "text-indigo-600" : "text-slate-400")}
            >
              <Home size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">首頁</span>
            </button>
            <button
              onClick={() => setCurrentView('gps')}
              className={cn("flex flex-col items-center gap-1", currentView === 'gps' ? "text-indigo-600" : "text-slate-400")}
            >
              <MapPin size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">定位</span>
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={cn("flex flex-col items-center gap-1", currentView === 'profile' ? "text-indigo-600" : "text-slate-400")}
            >
              <User size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">我的</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
