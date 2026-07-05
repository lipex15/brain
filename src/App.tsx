/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Settings,
  Smartphone,
  TrendingUp,
  DollarSign,
  AlertOctagon,
  SlidersHorizontal,
  Search,
  Database,
  Terminal,
  Layers,
  Trash2,
  Volume2,
  VolumeX,
  Zap,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  MessageSquare,
  HelpCircle,
  Menu,
  X,
  FileText,
  Sun,
  Moon,
  Bot
} from 'lucide-react';

const DeathstuffsLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(239,68,68,0.75)]" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#glow)" />
    <circle cx="50" cy="50" r="42" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5 3" />
    <circle cx="50" cy="50" r="39" fill="none" stroke="#ef4444" strokeWidth="0.5" opacity="0.6" />

    {/* Dark Hood */}
    <path d="M 50,15 C 32,15 25,32 25,52 C 25,56 27,62 30,68 C 31,64 33,52 38,48 C 39,49 41,50 43,51 C 41,45 43,38 48,36 C 49,36 50,36 50,36 C 50,36 51,36 52,36 C 57,38 59,45 57,51 C 59,50 61,49 62,48 C 67,52 69,64 70,68 C 73,62 75,56 75,52 C 75,32 68,15 50,15 Z" fill="#0b0f19" stroke="#ef4444" strokeWidth="1.2" />

    {/* Skull Face */}
    <path d="M 38,50 C 38,42 42,40 50,40 C 58,40 62,42 62,50 C 62,58 60,65 58,74 C 58,75 56,77 55,77 C 54,77 53,75 53,74 L 53,68 L 51,68 L 51,74 C 51,75 50,75 50,75 C 50,75 49,75 49,74 L 49,68 L 47,68 L 47,74 C 47,75 46,77 45,77 C 44,77 42,75 42,74 C 40,65 38,58 38,50 Z" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.2" />

    {/* Eye Sockets */}
    <path d="M 41,50 C 41,46 45,46 45,50 C 45,53 42,53 41,50 Z" fill="#000" stroke="#ef4444" strokeWidth="0.5" />
    <path d="M 59,50 C 59,46 55,46 55,50 C 55,53 58,53 59,50 Z" fill="#000" stroke="#ef4444" strokeWidth="0.5" />
    <circle cx="43" cy="50" r="1.5" fill="#ef4444" />
    <circle cx="57" cy="50" r="1.5" fill="#ef4444" />

    {/* Nose Cavity */}
    <path d="M 50,56 L 47.5,60.5 L 52.5,60.5 Z" fill="#000" />

    {/* Teeth Lines */}
    <line x1="44" y1="64" x2="56" y2="64" stroke="#0f172a" strokeWidth="1.2" />
    <line x1="46" y1="61" x2="46" y2="67" stroke="#0f172a" strokeWidth="1" />
    <line x1="49.5" y1="61" x2="49.5" y2="67" stroke="#0f172a" strokeWidth="1" />
    <line x1="53" y1="61" x2="53" y2="67" stroke="#0f172a" strokeWidth="1" />
  </svg>
);
import { AppSettings, NotificationItem, SystemStatus, LiveLog, DEFAULT_SETTINGS, NotificationPlatform, NotificationPriority, NotificationCategory, NotificationStatus, ResolutionStatus } from './types';
import NotificationCard from './components/NotificationCard';
import SettingsPanel from './components/SettingsPanel';
import WhatsAppConnector from './components/WhatsAppConnector';
import EstoquePanel from './components/EstoquePanel';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'painel' | 'config' | 'logs' | 'estoque'>('painel');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Logo / Photo detection
  const [avatarUrl, setAvatarUrl] = useState<string>('/assets/logo.png');
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  useEffect(() => {
    // Check if user uploaded deathstuffs_logo.png exists, fallback to local logo.png or custom SVG
    const img = new Image();
    img.src = '/assets/deathstuffs_logo.png';
    img.onload = () => setAvatarUrl('/assets/deathstuffs_logo.png');
    img.onerror = () => {
      const img2 = new Image();
      img2.src = '/assets/logo.png';
      img2.onload = () => setAvatarUrl('/assets/logo.png');
      img2.onerror = () => setAvatarUrl('svg');
    };
  }, []);

  // App State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    discord: { connected: false, botUser: null, statusText: 'Desconectado' },
    whatsapp: { status: 'desconectado', qrCode: null, statusText: 'Desconectado' },
    storagePath: ''
  });
  const [logs, setLogs] = useState<LiveLog[]>([]);

  // Sound settings (Local override)
  const [soundMuted, setSoundMuted] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<NotificationPlatform | 'tudo'>('tudo');
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'tudo'>('tudo');
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | 'tudo'>('tudo');
  const [filterResolution, setFilterResolution] = useState<ResolutionStatus | 'tudo'>('tudo');
  const [sortBy, setSortBy] = useState<'novos' | 'antigos' | 'preco_alto' | 'preco_baixo'>('novos');
  const [showFilters, setShowFilters] = useState(false);

  // Ref for event listener
  const sseRef = useRef<EventSource | null>(null);

  // Warranty Emergency Alert State
  const [activeWarrantyAlerts, setActiveWarrantyAlerts] = useState<any[]>([]);
  const [activeWarranties, setActiveWarranties] = useState<any[]>([]);

  // --- AUDIO SYNTHESIS ENGINE ---
  // Uses Web Audio API to create a crystal-clear cash-register chime or synth ring.
  // Completely offline-ready and doesn't rely on asset files.
  const playAlertSound = () => {
    if (soundMuted || !settings.general.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Tone 1: Base high bell (F#5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(739.99, audioCtx.currentTime); // F#5
      osc1.frequency.exponentialRampToValueAtTime(1108.73, audioCtx.currentTime + 0.12); // C#6

      // Tone 2: Harmonious cash ring (F#6)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1479.98, audioCtx.currentTime); // F#6

      gain1.gain.setValueAtTime(0.22, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.45);

      gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.35);

      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio playback blocked: user interaction required first.');
    }
  };

  const playEmergencySound = () => {
    if (soundMuted || !settings.general.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) { }
  };

  // --- COMPONENT LIFECYCLE (DATA FETCHING & SSE) ---
  useEffect(() => {
    // Initial fetches
    fetchSettings();
    fetchNotifications();
    fetchSystemStatus();
    fetchActiveWarranties();

    // Periodic sweep for active warranties count (every 30s)
    const warrantyInterval = setInterval(() => {
      fetchActiveWarranties();
    }, 30000);

    // Setup Server-Sent Events (SSE) for real-time live synchronization
    const sseUrl = '/api/events';
    const sse = new EventSource(sseUrl);
    sseRef.current = sse;

    sse.addEventListener('message', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const { type, data } = payload;

        if (type === 'init_logs') {
          setLogs(data);
        } else if (type === 'log') {
          setLogs((prev) => [data, ...prev].slice(0, 300));
        } else if (type === 'status_discord') {
          setSystemStatus((prev) => ({ ...prev, discord: data }));
        } else if (type === 'status_whatsapp') {
          setSystemStatus((prev) => ({ ...prev, whatsapp: data }));
        } else if (type === 'notifications_refresh') {
          setNotifications(data);
        } else if (type === 'stock_refresh') {
          window.dispatchEvent(new Event('stock_refresh'));
          fetchActiveWarranties();
        } else if (type === 'notification_new') {
          setNotifications((prev) => [data, ...prev]);
          playAlertSound();

          // Trigger native browser notification if enabled
          if (settings.general.browserAlerts && Notification.permission === 'granted') {
            const body = data.price ? `R$ ${data.price.toFixed(2)} - Comprador: ${data.buyerName}` : data.description;
            new Notification(`${data.title}: ${data.itemName}`, {
              body,
              icon: '/favicon.ico'
            });
          }
        } else if (type === 'warranty_alert') {
          setActiveWarrantyAlerts(prev => {
            // Avoid pushing duplicates if event triggers multiple times
            if (prev.find(a => a.itemId === data.itemId)) return prev;
            return [...prev, data];
          });
          playEmergencySound();
          fetchActiveWarranties();
          if (Notification.permission === 'granted') {
            new Notification(`GARANTIA EXPIRANDO: ${data.productName}`, {
              body: `A conta ${data.login} expirará em breve! Verifique no LZT.`,
              requireInteraction: true
            });
          }
        }
      } catch (err) {
        console.error('SSE parsing error:', err);
      }
    });

    sse.onerror = (err) => {
      console.error('SSE Error. Reconnecting...', err);
    };

    // Request browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      clearInterval(warrantyInterval);
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [settings.general.browserAlerts, soundMuted, settings.general.soundEnabled]);

  // Handle visual themes (Dark / Light)
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.general.theme === 'escuro') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.general.theme]);

  // --- API BACKEND COMMUNICATORS ---
  const fetchActiveWarranties = async () => {
    try {
      const res = await fetch('/api/stock/warranties/active');
      if (res.ok) {
        const data = await res.json();
        setActiveWarranties(data);
      }
    } catch (e) {
      console.error('Error fetching active warranties:', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (e) {
      console.error('Error fetching status:', e);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        fetchSystemStatus(); // Pull any updated bot states
        return true;
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
    return false;
  };

  const handleTestDiscord = async (draftSettings: AppSettings) => {
    try {
      await handleSaveSettings(draftSettings);
      const res = await fetch('/api/discord/test', { method: 'POST' });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Erro ao se conectar com o servidor local.' };
    }
  };

  const handleTestWhatsApp = async (draftSettings: AppSettings) => {
    try {
      await handleSaveSettings(draftSettings);
      const res = await fetch('/api/whatsapp/test', { method: 'POST' });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Erro ao se conectar com o servidor local.' };
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      // Wait slightly then fetch new status (to show qr again in waiting mode)
      setTimeout(fetchSystemStatus, 1500);
    } catch (e) {
      console.error('Falha ao desconectar WhatsApp', e);
    }
  };

  const handleTriggerWhatsAppScanSim = async () => {
    try {
      await fetch('/api/whatsapp/scan-sim', { method: 'POST' });
      fetchSystemStatus();
    } catch (e) {
      console.error('Error simulating scan:', e);
    }
  };

  const handleUpdateNotification = async (id: string, updates: Partial<NotificationItem>) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => prev.map((n) => (n.id === id ? data : n)));
      }
    } catch (e) {
      console.error('Error updating notification:', e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  const handleClearDatabase = async () => {
    if (confirm('Tem certeza absoluta que deseja LIMPAR TODAS as notificações registradas? Esta ação não pode ser desfeita.')) {
      try {
        const res = await fetch('/api/notifications/clear', { method: 'POST' });
        if (res.ok) {
          setNotifications([]);
        }
      } catch (e) {
        console.error('Error clearing DB:', e);
      }
    }
  };

  const handleResetSettings = async () => {
    if (confirm('Confirmar reset das configurações para os padrões originais de fábrica?')) {
      handleSaveSettings(DEFAULT_SETTINGS);
    }
  };

  // --- SIMULATION TRIGGERS ---
  const handleTriggerSimulation = async (platform: NotificationPlatform, type: 'venda' | 'reclamacao' | 'pergunta') => {
    try {
      await fetch('/api/notifications/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, type })
      });
    } catch (e) {
      console.error('Error triggering simulation:', e);
    }
  };

  // --- STATISTICS COMPUTING ---
  const salesCount = notifications.filter((n) => n.category === 'venda').length;
  const totalRevenue = notifications
    .filter((n) => n.category === 'venda' && n.price)
    .reduce((sum, n) => sum + (n.price || 0), 0);

  const pendingComplaints = notifications.filter(
    (n) => n.category === 'reclamacao' && n.resolution === 'pendente'
  ).length;
  const pendingQuestions = notifications.filter(
    (n) => n.category === 'pergunta' && n.resolution === 'pendente'
  ).length;
  const pendingDisputes = pendingComplaints + pendingQuestions;

  const unreadCount = notifications.filter((n) => n.status === 'nao_vista').length;

  // Platform specific breakdown values
  const ggmaxStats = {
    sales: notifications.filter((n) => n.platform === 'ggmax' && n.category === 'venda').length,
    revenue: notifications.filter((n) => n.platform === 'ggmax' && n.category === 'venda' && n.price).reduce((sum, n) => sum + (n.price || 0), 0)
  };

  const gamemarketStats = {
    sales: notifications.filter((n) => n.platform === 'gamemarket' && n.category === 'venda').length,
    revenue: notifications.filter((n) => n.platform === 'gamemarket' && n.category === 'venda' && n.price).reduce((sum, n) => sum + (n.price || 0), 0)
  };

  const desapegoStats = {
    sales: notifications.filter((n) => n.platform === 'desapego' && n.category === 'venda').length,
    revenue: notifications.filter((n) => n.platform === 'desapego' && n.category === 'venda' && n.price).reduce((sum, n) => sum + (n.price || 0), 0)
  };

  // --- FILTERING AND SORTING APPLICATION ---
  const filteredNotifications = notifications
    .filter((n) => {
      // 1. Platform filter
      if (filterPlatform !== 'tudo' && n.platform !== filterPlatform) return false;
      // 2. Category filter
      if (filterCategory !== 'tudo' && n.category !== filterCategory) return false;
      // 3. Status filter
      if (filterStatus !== 'tudo' && n.status !== filterStatus) return false;
      // 4. Resolution filter
      if (filterResolution !== 'tudo' && n.resolution !== filterResolution) return false;
      // 5. Search text query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesBuyer = n.buyerName?.toLowerCase().includes(query);
        const matchesItem = n.itemName?.toLowerCase().includes(query);
        const matchesTitle = n.title?.toLowerCase().includes(query);
        const matchesDesc = n.description?.toLowerCase().includes(query);
        const matchesNotes = n.notes?.toLowerCase().includes(query);
        return matchesBuyer || matchesItem || matchesTitle || matchesDesc || matchesNotes;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'novos') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'antigos') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'preco_alto') {
        return (b.price || 0) - (a.price || 0);
      } else if (sortBy === 'preco_baixo') {
        return (a.price || 0) - (b.price || 0);
      }
      return 0;
    });

  return (
    <div
      className="min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 flex flex-col transition-colors relative"
      style={{
        backgroundColor: settings.general.backgroundImage ? undefined : (settings.general.theme === 'escuro' ? '#020617' : '#f8fafc'),
        backgroundImage: settings.general.backgroundImage ? `url(${settings.general.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlay if image is set, to ensure text legibility */}
      {settings.general.backgroundImage && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/80 backdrop-blur-sm z-0 pointer-events-none" />
      )}

      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-xs px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {avatarUrl && avatarUrl !== 'svg' ? (
            <img
              src={avatarUrl}
              className="w-10 h-10 rounded-full border border-rose-500/40 shadow-xs shadow-rose-500/10 object-cover"
              alt="Logo"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-rose-500">
              <Bot className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5 leading-none">
              deathstuffs brain
              <span className="text-[10px] bg-rose-500/10 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/25 font-bold px-1.5 py-0.5 rounded-md">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-none">Central de Notificações & Automação</p>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            id="nav-painel"
            onClick={() => setActiveTab('painel')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'painel'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            Painel Central
          </button>

          <button
            id="nav-estoque"
            onClick={() => setActiveTab('estoque')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'estoque'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            Estoque
          </button>

          <button
            id="nav-config"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'config'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            Configurações
          </button>

          <button
            id="nav-logs"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'logs'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            Logs
          </button>
        </nav>

        {/* Global Controls & Mobile Toggles */}
        <div className="flex items-center gap-3">

          {/* Status Cards (Moved from footer) */}
          <div className="hidden lg:flex items-center justify-end gap-2 pr-3 border-r border-slate-200 dark:border-slate-800">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors shadow-xs ${systemStatus.discord.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20'
                : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20'
                }`}
              title={`Discord: ${systemStatus.discord.statusText}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${systemStatus.discord.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              Discord
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors shadow-xs ${systemStatus.whatsapp.status === 'conectado'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20'
                : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20'
                }`}
              title={`WhatsApp: ${systemStatus.whatsapp.statusText}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${systemStatus.whatsapp.status === 'conectado' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              WhatsApp
            </span>

            {activeWarranties.length > 0 && (
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/20 shadow-xs animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                <span>{activeWarranties.length} {activeWarranties.length === 1 ? 'GARANTIA' : 'GARANTIAS'}</span>
              </div>
            )}
          </div>

          {/* Quick Theme toggler */}
          <button
            id="btn-quick-theme-toggle"
            onClick={() => {
              const nextTheme = settings.general.theme === 'escuro' ? 'claro' : 'escuro';
              handleSaveSettings({
                ...settings,
                general: { ...settings.general, theme: nextTheme }
              });
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 shadow-2xs transition-all cursor-pointer"
            title={settings.general.theme === 'escuro' ? "Ativar Modo Claro" : "Ativar Modo Noturno"}
          >
            {settings.general.theme === 'escuro' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Quick Audio alert toggler */}
          <button
            id="btn-quick-sound-toggle"
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 shadow-2xs transition-all cursor-pointer"
            title={soundMuted ? "Ativar som de alertas" : "Mutar som de alertas"}
          >
            {soundMuted || !settings.general.soundEnabled ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>

          <div className="hidden md:flex flex-col text-right text-[11px] border-l border-slate-200 dark:border-slate-800 pl-3 leading-tight">
            <span className="text-slate-400">Discord Bot</span>
            <span className={`font-bold ${systemStatus.discord.connected ? 'text-emerald-500' : 'text-slate-500'}`}>
              {systemStatus.discord.connected ? 'Ativo' : 'Offline'}
            </span>
          </div>

          <button
            id="btn-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-slate-500"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col py-2 px-4 shadow-sm"
          >
            {[
              { id: 'painel', label: 'Painel Central' },
              { id: 'estoque', label: 'Estoque de Contas' },
              { id: 'config', label: 'Configurações' },
              { id: 'logs', label: 'Histórico de Logs' }
            ].map((tab) => (
              <button
                id={`btn-mobile-tab-${tab.id}`}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`py-2.5 text-left text-xs font-semibold px-2 rounded-lg transition-colors ${activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN BODY CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">

        {/* --- DYNAMIC WEB WEBHOOK SIMULATOR PLAYGROUND BAR (EXCELLENT FOR TESTING!) --- */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 shadow-sm transition-all">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${showSimulator ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              <h2 className="text-xs font-bold text-slate-805 dark:text-slate-200">
                Simulador de Webhooks {showSimulator ? '' : '(Testes)'}
              </h2>
            </div>
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 dark:text-indigo-400 rounded-md transition-all cursor-pointer"
            >
              {showSimulator ? 'Ocultar Simulador' : 'Abrir Simulador'}
            </button>
          </div>

          {showSimulator && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal max-w-xl">
                  Dispare transações fictícias instantaneamente para testar alarmes sonoros, logs, prioridades e despacho para o WhatsApp!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-sim-ggmax-venda"
                  onClick={() => handleTriggerSimulation('ggmax', 'venda')}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 transition-all cursor-pointer"
                >
                  + Venda GGMAX
                </button>

                <button
                  id="btn-sim-gamemarket-venda"
                  onClick={() => handleTriggerSimulation('gamemarket', 'venda')}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 transition-all cursor-pointer"
                >
                  + Venda GameMarket
                </button>

                <button
                  id="btn-sim-desapego-venda"
                  onClick={() => handleTriggerSimulation('desapego', 'venda')}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 transition-all cursor-pointer"
                >
                  + Venda Desapego
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                <button
                  id="btn-sim-reclamacao"
                  onClick={() => handleTriggerSimulation('ggmax', 'reclamacao')}
                  className="px-2.5 py-1.5 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 border border-rose-400/40 rounded-lg shadow-2xs text-white transition-all cursor-pointer"
                >
                  🚨 Reclamação (Suporte)
                </button>
              </div>
            </div>
          )}
        </section>

        {/* TAB 1: PAINEL CENTRAL (MAIN CONSOLE) */}
        {activeTab === 'painel' && (
          <div className="space-y-6">

            {/* 1. BENTO STATISTICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Stat Card 1: Total Sales Revenue */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faturamento Total</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                    R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Soma das vendas registradas</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* Stat Card 2: Total Sales count */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Vendas</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                    {salesCount}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Transações concluídas</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Stat Card 3: Pending disputes split by type */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-2xs">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pendências Abertas</p>
                  <div className="flex items-end gap-3 mt-1.5">
                    <div>
                      <span className={`text-xl md:text-2xl font-black tracking-tight ${pendingComplaints > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {pendingComplaints}
                      </span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Reclamações</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                    <div>
                      <span className={`text-xl md:text-2xl font-black tracking-tight ${pendingQuestions > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                        {pendingQuestions}
                      </span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Perguntas</p>
                    </div>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${pendingDisputes > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  <AlertOctagon className={`w-6 h-6 ${pendingDisputes > 0 ? 'animate-pulse' : ''}`} />
                </div>
              </div>

              {/* Stat Card 4: Unread warnings */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Novas Alertas</p>
                  <h3 className={`text-xl md:text-2xl font-black tracking-tight mt-1 ${unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-950 dark:text-white'}`}>
                    {unreadCount}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Notificações não lidas</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unreadCount > 0 ? 'bg-indigo-500/10 text-indigo-600 animate-pulse' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  <Bell className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* --- Marketplace Breakdown Mini Row --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-100/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              {/* GGMAX info */}
              <div className="flex items-center justify-between px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  GGMAX
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {ggmaxStats.sales} vendas ({ggmaxStats.revenue ? `R$ ${ggmaxStats.revenue.toFixed(0)}` : 'R$ 0'})
                </span>
              </div>
              {/* GameMarket info */}
              <div className="flex items-center justify-between px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  GameMarket
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {gamemarketStats.sales} vendas ({gamemarketStats.revenue ? `R$ ${gamemarketStats.revenue.toFixed(0)}` : 'R$ 0'})
                </span>
              </div>
              {/* Desapego info */}
              <div className="flex items-center justify-between px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Desapego
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {desapegoStats.sales} vendas ({desapegoStats.revenue ? `R$ ${desapegoStats.revenue.toFixed(0)}` : 'R$ 0'})
                </span>
              </div>
            </div>

            {/* 2. SEARCH, FILTERS & ACTION CONTROLS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search box */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="search-notifications"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar por comprador, item vendido, anotações internas do vendedor..."
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                  />
                </div>

                {/* Filter and toggle controls */}
                <div className="flex items-center gap-2">
                  <button
                    id="btn-toggle-filters"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${showFilters || filterPlatform !== 'tudo' || filterCategory !== 'tudo' || filterStatus !== 'tudo' || filterResolution !== 'tudo'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                      : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtros {showFilters ? 'Ativos' : 'Filtrar'}
                  </button>

                  <select
                    id="select-sort-by"
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="novos">Mais Recentes</option>
                    <option value="antigos">Mais Antigos</option>
                    <option value="preco_alto">Maior Valor</option>
                    <option value="preco_baixo">Menor Valor</option>
                  </select>
                </div>
              </div>

              {/* COLLAPSIBLE ADVANCED FILTERS PANEL */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-slate-100 dark:border-slate-800/60 pt-3"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Platforms selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origem / Plataforma</label>
                        <select
                          id="filter-platform"
                          value={filterPlatform}
                          onChange={(e: any) => setFilterPlatform(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300"
                        >
                          <option value="tudo">Todas</option>
                          <option value="ggmax">GGMAX</option>
                          <option value="gamemarket">GameMarket</option>
                          <option value="desapego">Desapego Games</option>
                          <option value="outros">Outros</option>
                        </select>
                      </div>

                      {/* Categories selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria de Alerta</label>
                        <select
                          id="filter-category"
                          value={filterCategory}
                          onChange={(e: any) => setFilterCategory(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300"
                        >
                          <option value="tudo">Todos</option>
                          <option value="venda">Vendas</option>
                          <option value="reclamacao">Reclamações</option>
                          <option value="pergunta">Perguntas</option>
                          <option value="outros">Outros</option>
                        </select>
                      </div>

                      {/* Seen status selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leitura / Visualização</label>
                        <select
                          id="filter-status"
                          value={filterStatus}
                          onChange={(e: any) => setFilterStatus(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300"
                        >
                          <option value="tudo">Todos</option>
                          <option value="nao_vista">Não Vistas (Novas)</option>
                          <option value="vista">Vistas (Lidas)</option>
                        </select>
                      </div>

                      {/* Resolution selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado da Resolução</label>
                        <select
                          id="filter-resolution"
                          value={filterResolution}
                          onChange={(e: any) => setFilterResolution(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300"
                        >
                          <option value="tudo">Todos</option>
                          <option value="pendente">Pendente</option>
                          <option value="resolvida">Resolvida</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear filter shortcut */}
                    {(filterPlatform !== 'tudo' || filterCategory !== 'tudo' || filterStatus !== 'tudo' || filterResolution !== 'tudo' || searchQuery !== '') && (
                      <div className="flex justify-end pt-2">
                        <button
                          id="btn-clear-filters"
                          onClick={() => {
                            setFilterPlatform('tudo');
                            setFilterCategory('tudo');
                            setFilterStatus('tudo');
                            setFilterResolution('tudo');
                            setSearchQuery('');
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                        >
                          Limpar Todos os Filtros
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. CARDS LIST FOR ACTIVE ALERTS */}
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-12 px-6 text-center shadow-2xs">
                  <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma notificação encontrada</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Nenhum registro corresponde aos filtros definidos. Dispare uma transação usando o <strong className="font-semibold text-slate-700 dark:text-slate-200">Simulador de Webhooks</strong> acima para testar!
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notif) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      onUpdate={handleUpdateNotification}
                      onDelete={handleDeleteNotification}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: SETTINGS MANAGER */}
        {activeTab === 'config' && (
          <div className="animate-fadeIn">
            <SettingsPanel
              settings={settings}
              systemStatus={systemStatus}
              onSave={handleSaveSettings}
              onTestDiscord={handleTestDiscord}
              onTestWhatsApp={handleTestWhatsApp}
              onDisconnectWhatsApp={handleDisconnectWhatsApp}
              onReset={handleResetSettings}
              onClearDatabase={handleClearDatabase}
              onTriggerScanSim={handleTriggerWhatsAppScanSim}
            />
          </div>
        )}

        {/* TAB 4: HISTORIC LOGS LIST */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  Logs Integrados de Atividade do Sistema
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Registros de conexões com Discord, WhatsApp e disparos de triggers em tempo real.</p>
              </div>

              <button
                id="btn-clear-logs-ui"
                onClick={() => setLogs([])}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Logs
              </button>
            </div>

            {/* Logs List Container */}
            <div className="font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-slate-500 italic py-12 text-center">Nenhum evento registrado no console do sistema.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 border-b border-slate-850/40 pb-2 leading-relaxed">
                    <span className="text-slate-500 select-none flex-shrink-0">
                      [{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}]
                    </span>

                    <span className={`font-semibold flex-shrink-0 select-none ${log.source === 'discord' ? 'text-indigo-400' :
                      log.source === 'whatsapp' ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                      [{log.source.toUpperCase()}]
                    </span>

                    <span className={`font-semibold flex-shrink-0 select-none ${log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'warn' ? 'text-amber-400' :
                        log.type === 'error' ? 'text-rose-400' : 'text-blue-400'
                      }`}>
                      [{log.type.toUpperCase()}]
                    </span>

                    <span className="text-slate-200 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ESTOQUE PANEL */}
        {activeTab === 'estoque' && (
          <div className="animate-fadeIn">
            <EstoquePanel
              notifications={notifications}
              onUpdateNotification={handleUpdateNotification}
            />
          </div>
        )}

      </main>

      {/* --- WARRANTY EMERGENCY MODALS --- */}
      <AnimatePresence>
        {activeWarrantyAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          >
            {activeWarrantyAlerts.map(alert => (
              <motion.div
                key={alert.itemId}
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 shadow-2xl max-w-md w-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm animate-bounce">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Aviso de Garantia LZT!</h2>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mt-1 leading-tight">
                      Uma conta está prestes a perder a garantia. Verifique imediatamente!
                    </p>
                  </div>
                </div>

                <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-500">Produto</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{alert.productName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-500">Conta / Login</span>
                    <span className="text-xs font-bold font-mono bg-slate-200 dark:bg-slate-800 rounded px-1 text-slate-800 dark:text-slate-200">{alert.login}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-slate-500">Expira em</span>
                    <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">
                      ~ 20 MINUTOS
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveWarrantyAlerts(prev => prev.filter(a => a.itemId !== alert.itemId))}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-rose-600/20 cursor-pointer"
                  >
                    Estou Ciente — Fechar Alerta
                  </button>
                  <p className="text-[9px] text-center text-slate-400 font-medium">Acesse o painel do LZT e confirme se a conta permanece ativa.</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SYSTEM STATUS OVERALL RUNNING FOOTER */}
      <footer className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-850/60 px-4 md:px-8 py-2 flex items-center justify-between gap-3 text-[10px] text-slate-500 relative z-10">
        <span>© {new Date().getFullYear()} deathStuffs brain</span>
        <span className="font-medium text-slate-400">Pronto para operação</span>
      </footer>

    </div>
  );
}
