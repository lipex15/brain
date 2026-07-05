/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  HelpCircle, 
  RefreshCw,
  Send,
  Zap
} from 'lucide-react';
import { SystemStatus, LiveLog } from '../types';

interface WhatsAppConnectorProps {
  whatsappStatus: SystemStatus['whatsapp'];
  whatsappLogs: LiveLog[];
  onTriggerScanSim: () => void;
  onSendTestMessage: () => Promise<{ success: boolean; message: string }>;
  enabled: boolean;
}

export default function WhatsAppConnector({
  whatsappStatus,
  whatsappLogs,
  onTriggerScanSim,
  onSendTestMessage,
  enabled
}: WhatsAppConnectorProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await onSendTestMessage();
    setTesting(false);
    setTestResult(res);
    setTimeout(() => setTestResult(null), 5000);
  };

  if (!enabled) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-xs">
        <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Alertas WhatsApp Inativos</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
          O encaminhamento de mensagens para o WhatsApp está desativado. Ative a integração e configure um número de telefone destinatário na aba <strong className="font-semibold text-slate-700 dark:text-slate-300">Configurações</strong> para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. CONNECTION STATUS & QR CODE PANEL */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5 self-start">
          <QrCode className="w-4 h-4 text-emerald-500" />
          Conexão WhatsApp Web
        </h4>

        {whatsappStatus.status === 'desconectado' && (
          <div className="space-y-3 py-6">
            <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500">Inicializando serviço...</p>
          </div>
        )}

        {whatsappStatus.status === 'conectando' && (
          <div className="space-y-4 py-8">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Buscando sessão...</p>
              <p className="text-[11px] text-slate-400 mt-1">Carregando Puppeteer e Chromium no segundo plano.</p>
            </div>
          </div>
        )}

        {whatsappStatus.status === 'esperando_qr' && (
          <div className="space-y-4 w-full">
            {whatsappStatus.qrCode ? (
              <div className="p-3 bg-white border border-slate-150 rounded-xl max-w-[200px] mx-auto shadow-xs">
                <img 
                  src={whatsappStatus.qrCode} 
                  alt="WhatsApp Login QR Code" 
                  referrerPolicy="no-referrer"
                  className="w-full h-auto aspect-square"
                />
              </div>
            ) : (
              <div className="w-[180px] h-[180px] bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Escaneie com seu celular</p>
              <p className="text-[10px] text-slate-500 leading-normal max-w-[240px] mx-auto">
                Abra o WhatsApp em seu celular, vá em <strong className="font-semibold">Dispositivos Conectados</strong> e aponte a câmera para a imagem acima.
              </p>

              {/* SIMULATION SCAN ACTION FOR CLOUD PREVIEW */}
              <div className="pt-2">
                <button
                  id="btn-scan-sim"
                  onClick={onTriggerScanSim}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-xs transition-all inline-flex items-center gap-1.5 w-full justify-center cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Simular Escaneamento QR
                </button>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                  (Para fins de teste no navegador AI Studio, clique acima para simular a leitura do QR e autenticar na nuvem!)
                </p>
              </div>
            </div>
          </div>
        )}

        {whatsappStatus.status === 'conectado' && (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-150 dark:border-emerald-900 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Sessão Ativa & Conectada</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Serviço pronto para despachar notificações.
              </p>
            </div>

            <div className="pt-4 w-full">
              <button
                id="btn-send-whatsapp-test"
                onClick={handleSendTest}
                disabled={testing}
                className="w-full py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {testing ? (
                  <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Disparar Alerta de Teste
              </button>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-[11px] text-left mt-2 flex items-start gap-1.5 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-800 border border-rose-100 dark:bg-rose-950/20'}`}>
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. REAL-TIME LOGS TERMINAL PANEL */}
      <div className="md:col-span-2 bg-slate-900 dark:bg-slate-950 text-slate-300 border border-slate-800 rounded-2xl p-4 flex flex-col h-64 md:h-auto shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Terminal de Logs do WhatsApp
          </h4>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md font-mono text-emerald-400 border border-slate-700">
            ONLINE
          </span>
        </div>

        {/* Logs stream wrapper */}
        <div id="whatsapp-logs-stream" className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pr-2 custom-scrollbar">
          {whatsappLogs.length === 0 ? (
            <p className="text-slate-500 italic py-8 text-center">Nenhum log gerado para o WhatsApp nas últimas sessões.</p>
          ) : (
            whatsappLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 flex-shrink-0 select-none">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                
                <span className={`font-semibold flex-shrink-0 select-none ${
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'warn' ? 'text-amber-400' :
                  log.type === 'error' ? 'text-rose-400' : 'text-blue-400'
                }`}>
                  [{log.type.toUpperCase()}]
                </span>
                
                <span className="text-slate-300 break-words">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
