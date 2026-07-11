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
  Bot,
  CheckCircle,
  AlertTriangle,
  CalendarClock
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
import { AppSettings, NotificationItem, SystemStatus, LiveLog, DEFAULT_SETTINGS, NotificationPlatform, NotificationPriority, NotificationCategory, NotificationStatus, ResolutionStatus, type AppReminder } from './types';
import NotificationCard from './components/NotificationCard';
import SettingsPanel from './components/SettingsPanel';
import WhatsAppConnector from './components/WhatsAppConnector';
import EstoquePanel from './components/EstoquePanel';
import SubscriptionsPanel from './components/SubscriptionsPanel';
import { calculateNotificationRevenue } from './notificationAccounting';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'painel' | 'config' | 'logs' | 'estoque' | 'assinaturas'>('painel');
  const [settingsTabRequest, setSettingsTabRequest] = useState<{
    tab: 'discord' | 'whatsapp' | 'geral' | 'lembretes' | 'dados' | 'guia';
    key: number;
  }>({ tab: 'discord', key: 0 });
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
    updater: { status: 'none', progress: 0 },
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
  const [activeReminderAlerts, setActiveReminderAlerts] = useState<any[]>([]);
  const [activeGeneralReminderAlerts, setActiveGeneralReminderAlerts] = useState<any[]>([]);
  const [activeSubscriptionAlerts, setActiveSubscriptionAlerts] = useState<any[]>([]);
  const [activeWarranties, setActiveWarranties] = useState<any[]>([]);
  const [stockAlertFilter, setStockAlertFilter] = useState<'all' | 'warranty' | 'reminder'>('all');

  // General reminder notes
  const [reminders, setReminders] = useState<AppReminder[]>([]);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDraft, setReminderDraft] = useState('');
  const [scheduleReminder, setScheduleReminder] = useState(false);
  const [generalReminderAmount, setGeneralReminderAmount] = useState('1');
  const [generalReminderUnit, setGeneralReminderUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [savingReminder, setSavingReminder] = useState(false);
  const [showReminderComposer, setShowReminderComposer] = useState(false);

  // Global Stock Cache for Notification Matching
  const [stockProducts, setStockProducts] = useState<any[]>([]);
  const [globalStockSearch, setGlobalStockSearch] = useState<string>('');

  const openSettingsTab = (tab: 'discord' | 'whatsapp' | 'geral' | 'lembretes' | 'dados' | 'guia') => {
    setSettingsTabRequest({ tab, key: Date.now() });
    setActiveTab('config');
    setGlobalStockSearch('');
    setMobileMenuOpen(false);
  };

  const openStockAlertFilter = (filter: 'warranty' | 'reminder') => {
    setStockAlertFilter(filter);
    setGlobalStockSearch('');
    setActiveTab('estoque');
    setMobileMenuOpen(false);
  };

  // --- AUDIO SYNTHESIS ENGINE ---
  // Uses Web Audio API to create distinct offline alert signatures.
  // Completely offline-ready and doesn't rely on asset files.
  const createAudioContext = () => new (window.AudioContext || (window as any).webkitAudioContext)();

  const playTone = (
    audioCtx: AudioContext,
    frequency: number,
    startOffset: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const startAt = audioCtx.currentTime + startOffset;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.005, startAt + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration);
  };

  const playAlertSound = () => {
    if (soundMuted || !settings.general.soundEnabled) return;
    try {
      const audioCtx = createAudioContext();

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

  const playIncomingNotificationSound = (notification: NotificationItem) => {
    if (notification.category === 'venda') {
      playAlertSound();
      return;
    }
    if (soundMuted || !settings.general.soundEnabled) return;
    try {
      const audioCtx = createAudioContext();
      if (notification.category === 'reclamacao') {
        playTone(audioCtx, 220, 0.00, 0.16, 'sawtooth', 0.18);
        playTone(audioCtx, 174.61, 0.20, 0.16, 'sawtooth', 0.18);
        playTone(audioCtx, 220, 0.40, 0.24, 'square', 0.16);
      } else if (notification.category === 'pergunta') {
        playTone(audioCtx, 523.25, 0.00, 0.16, 'triangle', 0.14);
        playTone(audioCtx, 783.99, 0.18, 0.24, 'triangle', 0.13);
      } else if (notification.category === 'financeiro') {
        playTone(audioCtx, 293.66, 0.00, 0.12, 'sine', 0.13);
        playTone(audioCtx, 369.99, 0.14, 0.12, 'sine', 0.12);
        playTone(audioCtx, 440.00, 0.28, 0.22, 'sine', 0.11);
      } else {
        playTone(audioCtx, 392.00, 0.00, 0.20, 'sine', 0.11);
      }
    } catch (e) { }
  };

  const playWarrantySound = () => {
    if (soundMuted || !settings.general.soundEnabled) return;
    try {
      const audioCtx = createAudioContext();
      playTone(audioCtx, 440, 0.00, 0.18, 'square', 0.24);
      playTone(audioCtx, 1046.5, 0.20, 0.18, 'square', 0.22);
      playTone(audioCtx, 440, 0.40, 0.24, 'sawtooth', 0.20);
    } catch (e) { }
  };

  const playGeneralReminderSound = () => {
    if (soundMuted || !settings.general.soundEnabled) return;
    try {
      const audioCtx = createAudioContext();
      playTone(audioCtx, 659.25, 0.00, 0.22, 'sine', 0.16);
      playTone(audioCtx, 523.25, 0.24, 0.24, 'sine', 0.14);
      playTone(audioCtx, 392.00, 0.50, 0.36, 'sine', 0.12);
    } catch (e) { }
  };

  const playAccountAlertSound = () => {
    if (soundMuted || !settings.general.soundEnabled) return;
    try {
      const audioCtx = createAudioContext();
      playTone(audioCtx, 329.63, 0.00, 0.16, 'triangle', 0.16);
      playTone(audioCtx, 493.88, 0.13, 0.16, 'triangle', 0.15);
      playTone(audioCtx, 659.25, 0.26, 0.28, 'triangle', 0.14);
    } catch (e) { }
  };

  const playSubscriptionSound = () => {
    if (soundMuted || !settings.general.soundEnabled) return;
    try {
      const audioCtx = createAudioContext();
      playTone(audioCtx, 196.00, 0.00, 0.12, 'sawtooth', 0.14);
      playTone(audioCtx, 880.00, 0.16, 0.10, 'square', 0.12);
      playTone(audioCtx, 196.00, 0.30, 0.12, 'sawtooth', 0.14);
      playTone(audioCtx, 987.77, 0.46, 0.24, 'square', 0.12);
    } catch (e) { }
  };

  // --- COMPONENT LIFECYCLE (DATA FETCHING & SSE) ---
  useEffect(() => {
    // Initial fetches
    fetchSettings();
    fetchNotifications();
    fetchSystemStatus();
    fetchActiveWarranties();
    fetchGlobalStock();
    fetchReminders();

    // Listen to local stock updates
    const handleStockRefresh = () => fetchGlobalStock();
    window.addEventListener('stock_refresh', handleStockRefresh);

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
        } else if (type === 'updater_state') {
          setSystemStatus((prev) => ({ ...prev, updater: data }));
        } else if (type === 'notifications_refresh') {
          setNotifications(data);
        } else if (type === 'stock_refresh') {
          window.dispatchEvent(new Event('stock_refresh'));
          fetchActiveWarranties();
        } else if (type === 'reminders_refresh') {
          setReminders(data);
        } else if (type === 'subscriptions_refresh') {
          window.dispatchEvent(new Event('subscriptions_refresh'));
        } else if (type === 'notification_new') {
          setNotifications((prev) => [data, ...prev]);
          playIncomingNotificationSound(data);

          // Trigger native browser notification if enabled
          if (settings.general.browserAlerts && Notification.permission === 'granted') {
            const clean = (value?: string) => String(value || '')
              .replace(/\[([^\n]*?)\]\((https?:\/\/[^)\s]+)\)/g, '$1')
              .replace(/\*{1,3}|_{2,3}|~{2}|`+/g, '')
              .trim();
            const details = [
              data.itemName && !/^(produto|item) desconhecido$/i.test(data.itemName) ? clean(data.itemName) : '',
              typeof data.price === 'number' ? data.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
              data.buyerName && data.buyerName !== 'N/A' ? `Cliente: ${clean(data.buyerName)}` : '',
              data.orderId ? `Pedido: ${clean(data.orderId)}` : '',
            ].filter(Boolean);
            new Notification(clean(data.title), {
              body: details.join(' • ') || clean(data.description),
              icon: '/favicon.ico'
            });
          }
        } else if (type === 'warranty_alert') {
          setActiveWarrantyAlerts(prev => {
            // Avoid pushing duplicates if event triggers multiple times
            if (prev.find(a => a.itemId === data.itemId)) return prev;
            return [...prev, data];
          });
          playWarrantySound();
          fetchActiveWarranties();
          if (Notification.permission === 'granted') {
            new Notification(`GARANTIA EXPIRANDO: ${data.productName}`, {
              body: `A conta ${data.login} expirará em breve! Verifique no LZT.`,
              requireInteraction: true
            });
          }
        } else if (type === 'general_reminder_alert') {
          setActiveGeneralReminderAlerts(prev => {
            if (prev.find(a => a.id === data.id)) return prev;
            return [...prev, data];
          });
          playGeneralReminderSound();
          fetchReminders();
          if (Notification.permission === 'granted') {
            new Notification('LEMBRETE DO PAINEL', {
              body: data.note || 'Você tem um lembrete pendente.',
              requireInteraction: true
            });
          }
        } else if (type === 'account_reminder_alert') {
          setActiveReminderAlerts(prev => {
            if (prev.find(a => a.itemId === data.itemId)) return prev;
            return [...prev, data];
          });
          playAccountAlertSound();
          fetchGlobalStock();
          if (Notification.permission === 'granted') {
            new Notification(`LEMBRETE: ${data.productName}`, {
              body: `${data.login} - ${data.reminderNote || 'Verificar conta'}`,
              requireInteraction: true
            });
          }
        } else if (type === 'subscription_alert') {
          setActiveSubscriptionAlerts(prev => {
            if (prev.find(a => a.id === data.id && a.stage === data.stage)) return prev;
            return [...prev, data];
          });
          playSubscriptionSound();
          window.dispatchEvent(new Event('subscriptions_refresh'));
          if (Notification.permission === 'granted') {
            new Notification(`ASSINATURA: ${data.customerName}`, {
              body: `${data.platformName} - ${data.stageTitle}`,
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
      window.removeEventListener('stock_refresh', handleStockRefresh);
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [settings.general.browserAlerts, soundMuted, settings.general.soundEnabled]);

  // Handle visual themes (Dark / Light)
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-preto');

    if (settings.general.theme === 'escuro') {
      root.classList.add('dark');
    } else if (settings.general.theme === 'preto') {
      root.classList.add('dark', 'theme-preto');
    }
  }, [settings.general.theme]);

  // --- API BACKEND COMMUNICATORS ---
  const getGeneralReminderHours = () => {
    if (!scheduleReminder) return undefined;
    const amount = parseFloat(generalReminderAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return undefined;
    if (generalReminderUnit === 'minutes') return amount / 60;
    if (generalReminderUnit === 'days') return amount * 24;
    return amount;
  };

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) setReminders(await res.json());
    } catch (e) {
      console.error('Error fetching reminders:', e);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = reminderTitle.trim();
    const cleanNote = reminderDraft.trim();
    if (!cleanTitle && !cleanNote) return;
    setSavingReminder(true);
    try {
      const reminderHours = getGeneralReminderHours();
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: cleanTitle && cleanNote ? `${cleanTitle}\n${cleanNote}` : (cleanTitle || cleanNote),
          reminderHours
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
        setReminderTitle('');
        setReminderDraft('');
        setScheduleReminder(false);
        setGeneralReminderAmount('1');
        setGeneralReminderUnit('hours');
        setShowReminderComposer(false);
      }
    } catch (e) {
      console.error('Error creating reminder:', e);
    } finally {
      setSavingReminder(false);
    }
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}/complete`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
      }
    } catch (e) {
      console.error('Error completing reminder:', e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
      }
    } catch (e) {
      console.error('Error deleting reminder:', e);
    }
  };

  const formatReminderDate = (dateString?: string | null) => {
    if (!dateString) return 'Sem alerta';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const fetchGlobalStock = async () => {
    try {
      const res = await fetch('/api/stock/products');
      if (res.ok) setStockProducts(await res.json());
    } catch (e) { }
  };

  const activeAccountReminderCount = stockProducts.reduce(
    (total, product) => total + (product.activeReminderCount || 0),
    0
  );

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
      setSystemStatus((prev) => ({ ...prev, ...data }));
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
      const result = await res.json();
      fetchSystemStatus();
      setTimeout(fetchSystemStatus, 1500);
      setTimeout(fetchSystemStatus, 5000);
      return result;
    } catch (e) {
      return { success: false, message: 'Erro ao se conectar com o servidor local.' };
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      // Wait slightly then fetch new status (to show qr again in waiting mode)
      fetchSystemStatus();
      setTimeout(fetchSystemStatus, 1500);
      setTimeout(fetchSystemStatus, 5000);
    } catch (e) {
      console.error('Falha ao desconectar WhatsApp', e);
    }
  };

  const handleReconnectWhatsApp = async () => {
    try {
      const res = await fetch('/api/whatsapp/reconnect', { method: 'POST' });
      const result = await res.json();
      fetchSystemStatus();
      setTimeout(fetchSystemStatus, 1000);
      setTimeout(fetchSystemStatus, 2500);
      setTimeout(fetchSystemStatus, 6000);
      setTimeout(fetchSystemStatus, 12000);
      return result;
    } catch (e) {
      return { success: false, message: 'Erro ao iniciar a reconexão do WhatsApp.' };
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
  const totalRevenue = calculateNotificationRevenue(notifications);

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
    revenue: calculateNotificationRevenue(notifications, 'ggmax')
  };

  const gamemarketStats = {
    sales: notifications.filter((n) => n.platform === 'gamemarket' && n.category === 'venda').length,
    revenue: calculateNotificationRevenue(notifications, 'gamemarket')
  };

  const desapegoStats = {
    sales: notifications.filter((n) => n.platform === 'desapego' && n.category === 'venda').length,
    revenue: calculateNotificationRevenue(notifications, 'desapego')
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
        backgroundColor: settings.general.theme === 'escuro' ? '#020617' : settings.general.theme === 'preto' ? '#000000' : '#f8fafc',
        backgroundImage: settings.general.backgroundImage ? `url("${settings.general.backgroundImage}")` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >


      {/* 0. UPDATER BANNER */}
      {systemStatus.updater && systemStatus.updater.status !== 'none' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 w-[95%] max-w-lg">
          <div className="bg-slate-900/95 backdrop-blur-lg border border-slate-700/50 shadow-2xl rounded-2xl p-4 flex items-center space-x-4">
            {systemStatus.updater.status === 'downloading' ? (
              <>
                <div className="relative flex-none">
                  <div className="w-10 h-10 border-2 border-indigo-500/20 rounded-full"></div>
                  <div className="w-10 h-10 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-indigo-400">{Math.round(systemStatus.updater.progress || 0)}%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 font-bold text-sm tracking-tight truncate">Baixando Atualização...</p>
                  <div className="flex justify-between items-center mt-1.5 mb-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Progresso</span>
                    {systemStatus.updater.bytesPerSecond && (
                      <span className="text-[10px] font-mono text-slate-400">{(systemStatus.updater.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.round(systemStatus.updater.progress || 0)}%` }}></div>
                  </div>
                </div>
              </>
            ) : systemStatus.updater.status === 'ready' ? (
              <>
                <div className="bg-emerald-500/10 p-2 rounded-full text-emerald-400 flex-none border border-emerald-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-400 font-bold text-sm tracking-tight truncate">Atualização Pronta</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">Uma nova versão foi baixada. Deseja aplicar agora?</p>
                </div>
                <div className="flex gap-2 ml-2">
                  <button onClick={() => setSystemStatus((prev) => ({ ...prev, updater: { status: 'none', progress: 0 } }))} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded-xl transition-all cursor-pointer">
                    Fechar
                  </button>
                  <button onClick={() => fetch('/api/system/updater-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'install' }) })} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap cursor-pointer">
                    Instalar e Abrir
                  </button>
                </div>
              </>
            ) : systemStatus.updater.status === 'error' ? (
              <>
                <div className="bg-rose-500/10 p-2 rounded-full text-rose-400 flex-none border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-rose-400 font-bold text-sm tracking-tight truncate">Falha na Atualização</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-h-8 overflow-hidden">{systemStatus.updater.error || 'Erro desconhecido'}</p>
                </div>
                <button onClick={() => fetch('/api/system/updater-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check' }) })} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl transition-colors cursor-pointer">
                  Retentar
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3 text-slate-300 w-full justify-center py-1">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Verificando...</span>
              </div>
            )}
          </div>
        </div>
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
            onClick={() => { setActiveTab('painel'); setGlobalStockSearch(''); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'painel'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            Painel Central
          </button>

          <button
            id="nav-estoque"
            onClick={() => { setActiveTab('estoque'); setGlobalStockSearch(''); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'estoque'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            Estoque
          </button>

          <button
            id="nav-assinaturas"
            onClick={() => { setActiveTab('assinaturas'); setGlobalStockSearch(''); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'assinaturas'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            Assinaturas
          </button>

          <button
            id="nav-config"
            onClick={() => openSettingsTab('discord')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'config'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            Configurações
          </button>

          <button
            id="nav-logs"
            onClick={() => { setActiveTab('logs'); setGlobalStockSearch(''); }}
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

          </div>

          {/* Quick reminders shortcut */}
          <button
            id="btn-open-reminders-settings"
            onClick={() => openSettingsTab('lembretes')}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 shadow-2xs transition-all cursor-pointer"
            title="Ver lembretes"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden xl:inline text-[10px] font-black uppercase tracking-wider">Lembretes</span>
          </button>

          {/* Quick Theme toggler */}
          <button
            id="btn-quick-theme-toggle"
            onClick={() => {
              const currentTheme = settings.general.theme;
              let nextTheme: 'claro' | 'escuro' | 'preto' = 'claro';
              if (currentTheme === 'claro') nextTheme = 'escuro';
              else if (currentTheme === 'escuro') nextTheme = 'preto';
              else if (currentTheme === 'preto') nextTheme = 'claro';

              handleSaveSettings({
                ...settings,
                general: { ...settings.general, theme: nextTheme }
              });
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 shadow-2xs transition-all cursor-pointer"
            title={settings.general.theme === 'claro' ? "Ativar Escuro" : settings.general.theme === 'escuro' ? "Ativar All Black" : "Ativar Claro"}
          >
            {settings.general.theme === 'claro' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : settings.general.theme === 'escuro' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" fill="currentColor" />
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
              { id: 'assinaturas', label: 'Assinaturas' },
              { id: 'config', label: 'Configurações' },
              { id: 'logs', label: 'Histórico de Logs' }
            ].map((item) => (
              <button
                id={`btn-mobile-tab-${item.id}`}
                key={item.id}
                onClick={() => {
                  if (item.id === 'config') {
                    openSettingsTab('discord');
                  } else {
                    setActiveTab(item.id as any);
                    setGlobalStockSearch('');
                    setMobileMenuOpen(false);
                  }
                }}
                className={`py-2.5 text-left text-xs font-semibold px-2 rounded-lg transition-colors ${activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN BODY CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">

        {(reminders.length > 0 || activeAccountReminderCount > 0 || activeWarranties.length > 0) && (
          <section className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xs">
            <span className="hidden sm:inline text-[9px] font-black uppercase text-slate-400 mr-1">Alertas ativos</span>

            {reminders.length > 0 && (
              <button
                onClick={() => openSettingsTab('lembretes')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors cursor-pointer"
                title="Abrir meus lembretes"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{reminders.length} {reminders.length === 1 ? 'lembrete ativo' : 'lembretes ativos'}</span>
              </button>
            )}

            {activeAccountReminderCount > 0 && (
              <button
                onClick={() => openStockAlertFilter('reminder')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
                title="Ver contas com alerta ativo"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{activeAccountReminderCount} {activeAccountReminderCount === 1 ? 'alerta de conta ativo' : 'alertas de contas ativos'}</span>
              </button>
            )}

            {activeWarranties.length > 0 && (
              <button
                onClick={() => openStockAlertFilter('warranty')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-500/20 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors cursor-pointer"
                title="Ver contas com garantia LZT ativa"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{activeWarranties.length} {activeWarranties.length === 1 ? 'garantia LZT ativa' : 'garantias LZT ativas'}</span>
              </button>
            )}
          </section>
        )}

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

            {false && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Bloco de Lembretes</h2>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{reminders.length} {reminders.length === 1 ? 'bilhete ativo' : 'bilhetes ativos'}</p>
                  </div>
                </div>
                {reminders.some(r => r.remindAt && !r.alertSent) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 px-2.5 py-1 rounded-lg">
                    <Bell className="w-3 h-3" />
                    Agendado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
                <form onSubmit={handleCreateReminder} className="space-y-3">
                  <textarea
                    value={reminderDraft}
                    onChange={(e) => setReminderDraft(e.target.value)}
                    rows={4}
                    placeholder="Escrever anotação..."
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        onClick={() => setScheduleReminder(!scheduleReminder)}
                        className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${scheduleReminder ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${scheduleReminder ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <Bell className={`w-4 h-4 ${scheduleReminder ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Agendar alerta</span>
                    </label>

                    {scheduleReminder && (
                      <div className="grid grid-cols-[1fr_120px] gap-2 w-full md:w-[260px]">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={generalReminderAmount}
                          onChange={(e) => setGeneralReminderAmount(e.target.value)}
                          className="text-xs px-2.5 py-2 border border-indigo-200 dark:border-indigo-900/50 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <select
                          value={generalReminderUnit}
                          onChange={(e) => setGeneralReminderUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                          className="text-xs px-2.5 py-2 border border-indigo-200 dark:border-indigo-900/50 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <option value="minutes">Minutos</option>
                          <option value="hours">Horas</option>
                          <option value="days">Dias</option>
                        </select>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!reminderDraft.trim() || savingReminder}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </form>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="max-h-[220px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/70">
                    {reminders.length === 0 ? (
                      <div className="p-6 text-center text-xs font-semibold text-slate-400">Nenhum bilhete ativo</div>
                    ) : (
                      reminders.map((reminder) => {
                        const due = reminder.remindAt ? new Date(reminder.remindAt).getTime() <= Date.now() : false;
                        return (
                          <div key={reminder.id} className={`p-3 ${due && !reminder.alertSent ? 'bg-rose-50/70 dark:bg-rose-950/20' : 'bg-white dark:bg-slate-900'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${reminder.remindAt ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                {reminder.remindAt ? <Bell className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">{reminder.note}</p>
                                <p className={`text-[10px] font-bold mt-1 ${due && !reminder.alertSent ? 'text-rose-500' : reminder.alertSent ? 'text-slate-400' : 'text-indigo-500'}`}>
                                  {reminder.alertSent ? 'Alerta enviado' : formatReminderDate(reminder.remindAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCompleteReminder(reminder.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                  title="Marcar como feito"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReminder(reminder.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>

            )}

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
                          <option value="financeiro">Financeiro</option>
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
                      stockProducts={stockProducts}
                      onNavigateToStock={(query: string) => {
                        setGlobalStockSearch(query);
                        setActiveTab('estoque');
                      }}
                      onUpdate={handleUpdateNotification}
                      onDelete={handleDeleteNotification}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

          </div>
        )}

        {/* TAB: SUBSCRIPTIONS */}
        {activeTab === 'assinaturas' && (
          <div className="animate-fadeIn">
            <SubscriptionsPanel />
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
              onReconnectWhatsApp={handleReconnectWhatsApp}
              onReset={handleResetSettings}
              onClearDatabase={handleClearDatabase}
              onTriggerScanSim={handleTriggerWhatsAppScanSim}
              initialTab={settingsTabRequest.tab}
              tabRequestKey={settingsTabRequest.key}
              reminders={reminders}
              onOpenReminderModal={() => setShowReminderComposer(true)}
              onCompleteReminder={handleCompleteReminder}
              onDeleteReminder={handleDeleteReminder}
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
              alertFilter={stockAlertFilter}
              onAlertFilterChange={setStockAlertFilter}
              globalSearchQuery={globalStockSearch}
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

      {/* --- SUBSCRIPTION ALERT MODALS --- */}
      <AnimatePresence>
        {activeSubscriptionAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          >
            {activeSubscriptionAlerts.map(alert => (
              <motion.div
                key={`${alert.id}-${alert.stage}`}
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl p-6 shadow-2xl max-w-md w-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm">
                    <CalendarClock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Assinatura Game Pass</h2>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1 leading-tight">
                      {alert.customerName} {alert.stageTitle}.
                    </p>
                  </div>
                </div>

                <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2 gap-3">
                    <span className="text-xs font-bold text-slate-500">Plataforma</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{alert.platformName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2 gap-3">
                    <span className="text-xs font-bold text-slate-500">Cliente</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-right">{alert.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 gap-3">
                    <span className="text-xs font-bold text-slate-500">Expira em</span>
                    <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full ring-1 ring-indigo-500/20">
                      {new Date(alert.expiresAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  {alert.chatLink && (
                    <a
                      href={alert.chatLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center"
                    >
                      Abrir Chat do Cliente
                    </a>
                  )}
                  <button
                    onClick={() => setActiveSubscriptionAlerts(prev => prev.filter(a => !(a.id === alert.id && a.stage === alert.stage)))}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    Estou ciente
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- REMINDER COMPOSER MODAL --- */}
      <AnimatePresence>
        {showReminderComposer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Cadastrar lembrete</h2>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Bilhete pessoal do painel</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReminderComposer(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateReminder} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nome do lembrete</label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="Ex: Conferir conta do cliente"
                    className="w-full text-sm px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Motivo / anotação</label>
                  <textarea
                    value={reminderDraft}
                    onChange={(e) => setReminderDraft(e.target.value)}
                    rows={4}
                    placeholder="Ex: verificar entrega do cliente, trocar senha da conta, responder suporte..."
                    className="w-full text-sm p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-3 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setScheduleReminder(!scheduleReminder)}
                      className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${scheduleReminder ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${scheduleReminder ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <Bell className={`w-4 h-4 ${scheduleReminder ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Me alertar depois</span>
                  </label>

                  {scheduleReminder && (
                    <div className="grid grid-cols-[1fr_130px] gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Tempo</label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={generalReminderAmount}
                          onChange={(e) => setGeneralReminderAmount(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-indigo-200 dark:border-indigo-900/60 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Unidade</label>
                        <select
                          value={generalReminderUnit}
                          onChange={(e) => setGeneralReminderUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                          className="w-full text-sm px-3 py-2 border border-indigo-200 dark:border-indigo-900/60 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <option value="minutes">Minutos</option>
                          <option value="hours">Horas</option>
                          <option value="days">Dias</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReminderComposer(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={(!reminderTitle.trim() && !reminderDraft.trim()) || savingReminder}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    {savingReminder ? 'Salvando...' : 'Criar lembrete'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GENERAL REMINDER MODALS --- */}
      <AnimatePresence>
        {activeGeneralReminderAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          >
            {activeGeneralReminderAlerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl p-6 shadow-2xl max-w-md w-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse" />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Lembrete do Painel</h2>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1 leading-tight">
                      Um bilhete agendado chegou ao horário marcado.
                    </p>
                  </div>
                </div>

                <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-xs font-bold text-slate-500">Anotação</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap mt-1">
                    {alert.note || 'Sem anotação'}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setActiveGeneralReminderAlerts(prev => prev.filter(a => a.id !== alert.id));
                      handleCompleteReminder(alert.id);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    Marcar como Feito
                  </button>
                  <button
                    onClick={() => setActiveGeneralReminderAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ACCOUNT REMINDER MODALS --- */}
      <AnimatePresence>
        {activeReminderAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          >
            {activeReminderAlerts.map(alert => (
              <motion.div
                key={alert.itemId}
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl p-6 shadow-2xl max-w-md w-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse" />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Alerta de Conta</h2>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1 leading-tight">
                      Você pediu para ser alertado sobre esta conta.
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
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-bold text-slate-500">Anotação</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {alert.reminderNote || 'Sem anotação'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveReminderAlerts(prev => prev.filter(a => a.itemId !== alert.itemId))}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    Estou Ciente - Fechar Alerta
                  </button>
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
