/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Clock, 
  ExternalLink, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Eye, 
  EyeOff, 
  Save, 
  ShoppingBag, 
  ShieldAlert, 
  HelpCircle,
  TrendingUp,
  Tag
} from 'lucide-react';
import { NotificationItem, NotificationPlatform, NotificationPriority, NotificationCategory } from '../types';

interface NotificationCardProps {
  key?: any;
  notification: NotificationItem;
  onUpdate: (id: string, updates: Partial<NotificationItem>) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export default function NotificationCard({ notification, onUpdate, onDelete }: NotificationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(notification.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Platform specific configuration
  const platformConfig: Record<NotificationPlatform, {
    name: string;
    bgColor: string;
    borderColor: string;
    badgeColor: string;
    icon: React.ReactNode;
  }> = {
    ggmax: {
      name: 'GGMAX',
      bgColor: 'bg-sky-50/40 border-sky-100 hover:border-sky-300 dark:bg-sky-950/10 dark:border-sky-900/40',
      borderColor: 'border-sky-200',
      badgeColor: 'bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-400 dark:border-sky-900',
      icon: <ShoppingBag className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    gamemarket: {
      name: 'GameMarket',
      bgColor: 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/10 dark:border-emerald-900/40',
      borderColor: 'border-emerald-200',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    desapego: {
      name: 'Desapego',
      bgColor: 'bg-amber-50/40 border-amber-100 hover:border-amber-300 dark:bg-amber-950/10 dark:border-amber-900/40',
      borderColor: 'border-amber-200',
      badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-900',
      icon: <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    outros: {
      name: 'Outros',
      bgColor: 'bg-slate-50/40 border-slate-100 hover:border-slate-300 dark:bg-slate-900/20 dark:border-slate-800',
      borderColor: 'border-slate-200',
      badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-400',
      icon: <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
    }
  };

  const currentPlatform = platformConfig[notification.platform] || platformConfig.outros;

  // Priority specific configuration
  const priorityConfig: Record<NotificationPriority, {
    label: string;
    color: string;
    icon: React.ReactNode;
  }> = {
    urgente: {
      label: 'Urgente',
      color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 animate-pulse',
      icon: <AlertOctagon className="w-3.5 h-3.5 mr-1" />
    },
    alta: {
      label: 'Alta',
      color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/40',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />
    },
    normal: {
      label: 'Normal',
      color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/20',
      icon: <Info className="w-3.5 h-3.5 mr-1" />
    }
  };

  const currentPriority = priorityConfig[notification.priority] || priorityConfig.normal;

  // Category specific configuration
  const categoryConfig: Record<NotificationCategory, {
    label: string;
    color: string;
    icon: React.ReactNode;
  }> = {
    venda: {
      label: 'Venda',
      color: 'bg-emerald-100/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
      icon: <ShoppingBag className="w-3.5 h-3.5 mr-1" />
    },
    reclamacao: {
      label: 'Reclamação',
      color: 'bg-red-100/80 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60',
      icon: <ShieldAlert className="w-3.5 h-3.5 mr-1" />
    },
    pergunta: {
      label: 'Pergunta',
      color: 'bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60',
      icon: <MessageSquare className="w-3.5 h-3.5 mr-1" />
    },
    outros: {
      label: 'Outros',
      color: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
      icon: <HelpCircle className="w-3.5 h-3.5 mr-1" />
    }
  };

  const currentCategory = categoryConfig[notification.category] || categoryConfig.outros;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    // Simulate minor network delay or directly trigger
    setTimeout(() => {
      onUpdate(notification.id, { notes });
      setIsSavingNotes(false);
    }, 400);
  };

  return (
    <motion.div
      id={`card-${notification.id}`}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`border rounded-xl p-4 shadow-xs transition-all ${currentPlatform.bgColor} ${
        notification.status === 'nao_vista' 
          ? 'ring-2 ring-indigo-500/10 border-indigo-200/80 dark:ring-indigo-500/20 dark:border-indigo-950/60' 
          : ''
      }`}
    >
      {/* CARD HEADER / MAIN SUMMARY CONTAINER */}
      <div className="flex items-start justify-between gap-4">
        {/* Left Side: Icon & Key details */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700/60 flex-shrink-0 mt-0.5">
            {currentPlatform.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`text-xs px-2 py-0.5 font-semibold rounded-md border ${currentPlatform.badgeColor}`}>
                {currentPlatform.name}
              </span>
              
              <span className={`flex items-center text-[11px] px-1.5 py-0.5 font-medium rounded-md border ${currentPriority.color}`}>
                {currentPriority.icon}
                {currentPriority.label}
              </span>

              <span className={`flex items-center text-[11px] px-1.5 py-0.5 font-medium rounded-md border ${currentCategory.color}`}>
                {currentCategory.icon}
                {currentCategory.label}
              </span>

              {notification.resolution === 'resolvida' && (
                <span className="flex items-center text-[11px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 font-medium rounded-md">
                  <Check className="w-3 h-3 mr-0.5" /> Resolvida
                </span>
              )}
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base tracking-tight truncate">
              {notification.itemName !== 'Produto Desconhecido' ? notification.itemName : notification.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
              {notification.price && (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md">
                  R$ {notification.price.toFixed(2)}
                </span>
              )}
              {notification.buyerName && (
                <span>Comprador: <strong className="text-slate-700 dark:text-slate-300 font-medium">{notification.buyerName}</strong></span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(notification.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({new Date(notification.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action and Expand controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* View status Toggle */}
          <button
            id={`btn-toggle-view-${notification.id}`}
            onClick={() => onUpdate(notification.id, { status: notification.status === 'nao_vista' ? 'vista' : 'nao_vista' })}
            className={`p-1.5 rounded-lg border transition-colors ${
              notification.status === 'nao_vista'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700'
            }`}
            title={notification.status === 'nao_vista' ? 'Marcar como Vista' : 'Marcar como Não Vista'}
          >
            {notification.status === 'nao_vista' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Quick Resolution toggle */}
          {notification.category === 'reclamacao' || notification.category === 'pergunta' ? (
            <button
              id={`btn-toggle-resolve-${notification.id}`}
              onClick={() => onUpdate(notification.id, { resolution: notification.resolution === 'pendente' ? 'resolvida' : 'pendente' })}
              className={`p-1.5 rounded-lg border transition-all text-xs font-semibold px-2.5 ${
                notification.resolution === 'pendente'
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
              }`}
            >
              {notification.resolution === 'pendente' ? 'Pendente' : 'Resolvida'}
            </button>
          ) : null}

          {/* Expand Toggle */}
          <button
            id={`btn-expand-${notification.id}`}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 flex items-center justify-center"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE LOGICAL CONTENT AREA */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Message content summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conteúdo Original da Notificação</h4>
                <div className="p-3 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto font-sans">
                  {notification.description}
                </div>
                
                {/* External Links */}
                <div className="flex gap-2 pt-1">
                  {notification.discordLink && (
                    <a
                      id={`link-discord-${notification.id}`}
                      href={notification.discordLink}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30 px-2.5 py-1.5 rounded-md border border-indigo-100 dark:border-indigo-900/50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Mensagem no Discord
                    </a>
                  )}

                  <button
                    id={`btn-delete-${notification.id}`}
                    onClick={() => onDelete(notification.id)}
                    className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/30 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-md border border-rose-100 dark:border-rose-900/50 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Excluir Notificação
                  </button>
                </div>
              </div>

              {/* Internal Seller Notes editor */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Anotações Internas do Vendedor</h4>
                <div className="relative">
                  <textarea
                    id={`notes-textarea-${notification.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escreva detalhes da transação, contato do cliente, chaves de ativação enviadas ou status de suporte aqui..."
                    className="w-full h-28 p-2.5 text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                  <button
                    id={`btn-save-notes-${notification.id}`}
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="absolute bottom-2 right-2 inline-flex items-center text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 px-2.5 py-1.5 rounded-md shadow-xs font-medium transition-colors"
                  >
                    {isSavingNotes ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    ) : (
                      <Save className="w-3 h-3 mr-1.5" />
                    )}
                    {notification.notes === notes ? 'Salvo' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
