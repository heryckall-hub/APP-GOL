import React, { useState } from 'react';

export type DockModalType =
  | null
  | 'vehicle'
  | 'navigation'
  | 'music'
  | 'phone'
  | 'cameras'
  | 'obd'
  | 'settings'
  | 'apps';

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  gradient: string;
}

export interface CyberModalsProps {
  activeModal: DockModalType;
  onClose: () => void;
  onOpenModal: (modal: DockModalType) => void;
  useSolidSurface: boolean;
  // Vehicle state
  viewMode: 'map' | 'gol';
  setViewMode: (m: 'map' | 'gol') => void;
  sentryMode: boolean;
  setSentryMode: React.Dispatch<React.SetStateAction<boolean>>;
  locked: boolean;
  setLocked: React.Dispatch<React.SetStateAction<boolean>>;
  // Navigation state
  routeActive: boolean;
  destination: string;
  onStartRoute: (dest: string, eta: string, mins: number, km: number, arrivalBat: number) => void;
  onEndRoute: () => void;
  // Music state
  tracks: TrackItem[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onSelectTrack: (idx: number) => void;
  onTogglePlay: () => void;
  // Settings state
  unitMode: 'KM/H' | 'MPH';
  setUnitMode: (u: 'KM/H' | 'MPH') => void;
  brightness: number;
  setBrightness: (b: number) => void;
  autopilotEnabled: boolean;
  setAutopilotEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  // OBD2 telemetry
  obdConnected: boolean;
  setObdConnected: React.Dispatch<React.SetStateAction<boolean>>;
  rpm: number;
  motorTemp: number;
  batteryVoltage: number;
  intakeTemp: number;
  engineLoad: number;
  instantKml: number;
  avgKml: number;
}

const QUICK_DESTINATIONS = [
  { name: 'Centro Empresarial', eta: '11:25 AM', mins: 36, km: 24, bat: 78 },
  { name: 'Av. Paulista, 1500', eta: '11:08 AM', mins: 19, km: 11, bat: 81 },
  { name: 'Aeroporto Internacional', eta: '11:48 AM', mins: 54, km: 42, bat: 71 },
  { name: 'Supercharger Jardins', eta: '10:59 AM', mins: 12, km: 6, bat: 83 },
];

export const CyberModals: React.FC<CyberModalsProps> = ({
  activeModal,
  onClose,
  onOpenModal,
  useSolidSurface,
  viewMode,
  setViewMode,
  sentryMode,
  setSentryMode,
  locked,
  setLocked,
  routeActive,
  destination,
  onStartRoute,
  onEndRoute,
  tracks,
  currentTrackIndex,
  isPlaying,
  onSelectTrack,
  onTogglePlay,
  unitMode,
  setUnitMode,
  brightness,
  setBrightness,
  autopilotEnabled,
  setAutopilotEnabled,
  obdConnected,
  setObdConnected,
  rpm,
  motorTemp,
  batteryVoltage,
  intakeTemp,
  engineLoad,
  instantKml,
  avgKml,
}) => {
  const [navSearch, setNavSearch] = useState('');
  const [dialNumber, setDialNumber] = useState('');
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [selectedCam, setSelectedCam] = useState<'FRONTAL' | 'TRASEIRA' | 'ESQUERDA' | 'DIREITA'>('FRONTAL');
  const [dtcList, setDtcList] = useState<string[]>(['P0130 — Sonda Lambda (Banco 1 Sensor 1)']);
  const [dtcScanned, setDtcScanned] = useState(false);

  if (!activeModal) return null;

  const surfaceClass = useSolidSurface ? 'cyber-surface-solid' : 'cyber-surface-glass';

  const modalTitleMap: Record<Exclude<DockModalType, null>, string> = {
    vehicle: 'CONTROLES DO VEÍCULO // GOL G2',
    navigation: 'SISTEMA DE NAVEGAÇÃO VETORIAL',
    music: 'MÍDIA & ÁUDIO ESPACIAL',
    phone: 'TELEFONE BLUETOOTH HANDS-FREE',
    cameras: 'MATRIZ DE CÂMERAS 360° // SENTINELA',
    obd: 'TELEMETRIA OBD2 ELM327 // SAÚDE DO MOTOR',
    settings: 'CONFIGURAÇÕES DO SISTEMA HMI',
    apps: 'ECOSSISTEMA DE APLICATIVOS',
  };

  const handleNavSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = navSearch.trim();
    if (!cleaned) return;
    onStartRoute(cleaned, '11:32 AM', 28, 18, 79);
    setNavSearch('');
    onClose();
  };

  return (
    <div className="fixed inset-x-0 top-[42px] bottom-[68px] z-30 flex items-center justify-center bg-[#09090B]/60 p-6">
      <div className="w-full max-w-[760px] max-h-full cyber-chamfer-frame shadow-[0_24px_64px_rgba(0,0,0,0.85)]">
        <div className={`w-full max-h-[calc(100vh-158px)] flex flex-col cyber-chamfer-inner ${surfaceClass}`}>
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E] shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 cyber-hawaii-gradient inline-block" />
              <h2 className="font-rajdhani text-lg font-bold tracking-[0.14em] text-white uppercase">
                {modalTitleMap[activeModal]}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="w-9 h-9 flex items-center justify-center border border-[#2A2A2E] bg-[#09090B] text-[#8E8E93] hover:text-white hover:border-[#00B4D8] transition-colors cyber-chamfer-btn cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {activeModal === 'vehicle' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocked((v) => !v)}
                    className={`p-4 border text-left transition-colors cursor-pointer cyber-chamfer-sm ${
                      locked
                        ? 'border-[#00B4D8] bg-gradient-to-br from-[#00E5FF]/15 to-[#0077B6]/15 text-white'
                        : 'border-[#2A2A2E] bg-[#09090B]/80 text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-jetbrains uppercase tracking-widest mb-1">TRAVAS</div>
                    <div className="font-rajdhani text-base font-bold text-white">
                      {locked ? 'TRANCADO' : 'DESTRANCADO'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSentryMode((v) => !v)}
                    className={`p-4 border text-left transition-colors cursor-pointer cyber-chamfer-sm ${
                      sentryMode
                        ? 'border-[#00B4D8] bg-gradient-to-br from-[#00E5FF]/15 to-[#0077B6]/15 text-white'
                        : 'border-[#2A2A2E] bg-[#09090B]/80 text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-jetbrains uppercase tracking-widest mb-1">SENTINELA</div>
                    <div className="font-rajdhani text-base font-bold text-white">
                      {sentryMode ? 'ATIVO' : 'STANDBY'}
                    </div>
                  </button>
                </div>

                {/* Viewport Mode Switcher */}
                <div className="border border-[#2A2A2E] bg-[#09090B]/70 p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-jetbrains uppercase tracking-widest text-[#8E8E93]">
                      VISUALIZAÇÃO PRINCIPAL DO COCKPIT
                    </div>
                    <div className="text-sm font-rajdhani text-white mt-0.5">
                      Alterne entre o Mapa Vetorial Dark Mode e o Showroom Gol G2 interativo
                    </div>
                  </div>
                  <div className="flex items-center border border-[#2A2A2E]">
                    <button
                      type="button"
                      onClick={() => setViewMode('map')}
                      className={`px-4 py-2 text-xs font-jetbrains cursor-pointer ${
                        viewMode === 'map'
                          ? 'cyber-hawaii-gradient text-[#09090B] font-bold'
                          : 'bg-[#141417] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      MAPA VETORIAL
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('gol')}
                      className={`px-4 py-2 text-xs font-jetbrains cursor-pointer ${
                        viewMode === 'gol'
                          ? 'cyber-hawaii-gradient text-[#09090B] font-bold'
                          : 'bg-[#141417] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      GOL G2
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'navigation' && (
              <div className="space-y-4">
                <form onSubmit={handleNavSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    placeholder="Digite um endereço ou ponto de interesse..."
                    className="flex-1 bg-[#09090B] border border-[#2A2A2E] px-4 py-3 text-sm font-jetbrains text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#00B4D8]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 cyber-hawaii-gradient text-[#09090B] font-rajdhani font-bold tracking-wider uppercase text-sm cyber-chamfer-btn cursor-pointer"
                  >
                    TRAÇAR ROTA
                  </button>
                </form>

                <div className="flex items-center justify-between text-xs font-jetbrains text-[#8E8E93] pt-1">
                  <span>DESTINOS RECENTES / SUPERCHARGERS</span>
                  {routeActive && (
                    <button
                      type="button"
                      onClick={onEndRoute}
                      className="text-[#00E5FF] hover:underline cursor-pointer"
                    >
                      ENCERRAR ROTA ATUAL ({destination.toUpperCase()})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUICK_DESTINATIONS.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => {
                        onStartRoute(d.name, d.eta, d.mins, d.km, d.bat);
                        onClose();
                      }}
                      className="p-3.5 border border-[#2A2A2E] bg-[#09090B]/80 hover:border-[#00B4D8] text-left transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-rajdhani font-bold text-base text-white">{d.name}</div>
                        <div className="font-jetbrains text-[11px] text-[#8E8E93]">
                          {d.mins} min • {d.km} km
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-rajdhani font-bold text-sm text-[#00E5FF]">{d.eta}</div>
                        <div className="font-jetbrains text-[11px] text-[#8E8E93]">{d.bat}% bat</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeModal === 'music' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border border-[#2A2A2E] bg-[#09090B]/80 p-3.5">
                  <div>
                    <div className="text-[10px] font-jetbrains uppercase text-[#00E5FF]">
                      REPRODUZINDO AGORA // 15 ALTO-FALANTES
                    </div>
                    <div className="font-rajdhani text-lg font-bold text-white">
                      {tracks[currentTrackIndex].title} — {tracks[currentTrackIndex].artist}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onTogglePlay}
                    className="px-4 py-2 border border-[#00B4D8] bg-gradient-to-r from-[#00E5FF]/20 to-[#0077B6]/20 font-jetbrains text-xs text-white cursor-pointer"
                  >
                    {isPlaying ? 'PAUSAR' : 'TOCAR'}
                  </button>
                </div>

                <div className="space-y-2">
                  {tracks.map((track, idx) => {
                    const active = idx === currentTrackIndex;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => onSelectTrack(idx)}
                        className={`w-full flex items-center justify-between p-3 border text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-[#00B4D8] bg-gradient-to-r from-[#00E5FF]/15 to-[#0077B6]/10'
                            : 'border-[#2A2A2E] bg-[#09090B]/60 hover:border-[#8E8E93]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 border border-[#2A2A2E]"
                            style={{ background: track.gradient }}
                          />
                          <div>
                            <div className="font-rajdhani font-bold text-base text-white">
                              {track.title}
                            </div>
                            <div className="font-jetbrains text-xs text-[#8E8E93]">
                              {track.artist}
                            </div>
                          </div>
                        </div>
                        <div className="font-jetbrains text-xs text-[#8E8E93]">
                          {Math.floor(track.durationSec / 60)}:
                          {String(track.durationSec % 60).padStart(2, '0')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeModal === 'phone' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="text-[11px] font-jetbrains uppercase text-[#8E8E93]">
                    CONTATOS FAVORITOS (BLUETOOTH)
                  </div>
                  {[
                    { name: 'Base Operacional', number: '+55 11 98420-1100' },
                    { name: 'Garagem Gol G2', number: '0800 777 2099' },
                    { name: 'Marina (Escritório)', number: '+55 11 99104-8821' },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setActiveCall(`${c.name} (${c.number})`)}
                      className="w-full p-3 border border-[#2A2A2E] bg-[#09090B]/70 hover:border-[#00B4D8] text-left cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-rajdhani font-bold text-white">{c.name}</div>
                        <div className="font-jetbrains text-[11px] text-[#8E8E93]">{c.number}</div>
                      </div>
                      <span className="text-[11px] font-jetbrains text-[#00E5FF]">LIGAR</span>
                    </button>
                  ))}

                  {activeCall && (
                    <div className="mt-3 p-3 border border-[#00B4D8] bg-gradient-to-r from-[#00E5FF]/15 to-[#0077B6]/15 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-jetbrains text-[#00E5FF]">EM CHAMADA...</div>
                        <div className="font-rajdhani font-bold text-sm text-white">{activeCall}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveCall(null)}
                        className="px-3 py-1 cyber-hawaii-gradient text-[#09090B] font-jetbrains font-bold text-xs cursor-pointer"
                      >
                        ENCERRAR
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="bg-[#09090B] border border-[#2A2A2E] px-3 py-2.5 mb-2 font-jetbrains text-base text-white min-h-[42px] flex items-center justify-between">
                    <span>{dialNumber || 'DIGITAR NÚMERO'}</span>
                    {dialNumber && (
                      <button
                        type="button"
                        onClick={() => setDialNumber((n) => n.slice(0, -1))}
                        className="text-xs text-[#8E8E93] hover:text-white cursor-pointer"
                      >
                        APAGAR
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setDialNumber((n) => (n.length < 15 ? n + k : n))}
                        className="py-2.5 border border-[#2A2A2E] bg-[#09090B] hover:border-[#00B4D8] font-jetbrains text-sm text-white cursor-pointer"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => dialNumber && setActiveCall(dialNumber)}
                    className="w-full mt-2 py-2.5 cyber-hawaii-gradient text-[#09090B] font-rajdhani font-bold tracking-widest uppercase cursor-pointer"
                  >
                    CHAMAR VIA BLUETOOTH
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'cameras' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['FRONTAL', 'TRASEIRA', 'ESQUERDA', 'DIREITA'] as const).map((cam) => (
                    <button
                      key={cam}
                      type="button"
                      onClick={() => setSelectedCam(cam)}
                      className={`py-2 text-xs font-jetbrains border cursor-pointer ${
                        selectedCam === cam
                          ? 'border-[#00E5FF] cyber-hawaii-gradient text-[#09090B] font-bold'
                          : 'border-[#2A2A2E] bg-[#09090B] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      CÂM {cam}
                    </button>
                  ))}
                </div>

                {/* Simulated Cyber-Industrial Camera Feed with HUD Reticle */}
                <div className="relative h-56 border border-[#2A2A2E] bg-[#09090B] overflow-hidden flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                    <rect width="600" height="240" fill="#0D0D10" />
                    <line x1="0" y1="120" x2="600" y2="120" stroke="#1C1C21" strokeWidth="1" />
                    <line x1="300" y1="0" x2="300" y2="240" stroke="#1C1C21" strokeWidth="1" />
                    {/* Parking / proximity guide lines */}
                    <polyline
                      points="170,235 235,125 365,125 430,235"
                      fill="none"
                      stroke="#00B4D8"
                      strokeWidth="2"
                      strokeDasharray="8 6"
                    />
                    <line x1="215" y1="165" x2="385" y2="165" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.45" />
                    <line x1="192" y1="200" x2="408" y2="200" stroke="#00E5FF" strokeWidth="1.5" strokeOpacity="0.65" />
                  </svg>
                  <div className="relative z-10 text-center">
                    <div className="text-[11px] font-jetbrains text-[#00E5FF] tracking-widest">
                      FEED ATIVO // HARDWARE CAM_{selectedCam}
                    </div>
                    <div className="font-rajdhani text-2xl font-bold text-white tracking-wider mt-1">
                      VISÃO GRANDE-ANGULAR 140°
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 font-jetbrains text-[10px] text-[#8E8E93] bg-[#09090B]/80 px-2 py-1 border border-[#2A2A2E]">
                    REC ● SENTINELA {sentryMode ? 'ON' : 'OFF'}
                  </div>
                  <div className="absolute bottom-3 right-3 font-jetbrains text-[10px] text-white bg-[#09090B]/80 px-2 py-1 border border-[#2A2A2E]">
                    DISTÂNCIA TRAS.: 1.4m
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'obd' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border border-[#2A2A2E] bg-[#09090B]/80 p-3.5">
                  <div>
                    <div className="text-[10px] font-jetbrains uppercase text-[#00E5FF]">
                      ADAPTADOR BLUETOOTH ELM327 // PROTOCOLO ISO 9141-2
                    </div>
                    <div className="font-rajdhani text-lg font-bold text-white">
                      Status OBD2: {obdConnected ? 'CONECTADO EM TEMPO REAL' : 'DESCONECTADO'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setObdConnected((v) => !v)}
                    className={`px-4 py-2 text-xs font-jetbrains border cursor-pointer ${
                      obdConnected
                        ? 'border-[#00E5FF] cyber-hawaii-gradient text-[#09090B] font-bold'
                        : 'border-[#2A2A2E] bg-[#141417] text-[#8E8E93]'
                    }`}
                  >
                    {obdConnected ? 'CONECTADO' : 'CONECTAR'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'ROTAÇÃO (010C)', value: `${rpm.toLocaleString('pt-BR')} RPM` },
                    { label: 'MOTOR (0105)', value: `${motorTemp} °C` },
                    { label: 'BATERIA (ATRV)', value: `${batteryVoltage.toFixed(1).replace('.', ',')} V` },
                    { label: 'ADMISSÃO (010F)', value: `${intakeTemp} °C` },
                    { label: 'CARGA (0104)', value: `${engineLoad}%` },
                    {
                      label: 'CONSUMO INST.',
                      value: `${instantKml.toFixed(1).replace('.', ',')} KM/L (Méd. ${avgKml
                        .toFixed(1)
                        .replace('.', ',')})`,
                    },
                  ].map((sensor) => (
                    <div
                      key={sensor.label}
                      className="p-3 border border-[#2A2A2E] bg-[#09090B]/80 cyber-chamfer-sm"
                    >
                      <div className="font-jetbrains text-[10px] text-[#8E8E93]">{sensor.label}</div>
                      <div className="font-rajdhani text-lg font-bold text-white mt-0.5">
                        {sensor.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-[#2A2A2E] bg-[#09090B]/80 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-jetbrains text-xs uppercase text-[#8E8E93]">
                      DIAGNÓSTICO DE INJEÇÃO ELETRÔNICA (DTCs)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDtcScanned(true);
                          if (dtcList.length === 0) {
                            setDtcList(['Nenhuma falha registrada na ECU (Mode 03 OK)']);
                          }
                        }}
                        className="px-3 py-1.5 cyber-hawaii-gradient text-[#09090B] font-jetbrains font-bold text-xs cursor-pointer cyber-chamfer-btn"
                      >
                        LER FALHAS (03)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDtcScanned(true);
                          setDtcList([]);
                        }}
                        className="px-3 py-1.5 border border-[#2A2A2E] bg-[#141417] hover:border-[#00B4D8] text-white font-jetbrains text-xs cursor-pointer cyber-chamfer-btn"
                      >
                        LIMPAR CÓDIGOS (04)
                      </button>
                    </div>
                  </div>
                  <div className="font-jetbrains text-xs text-[#00E5FF] border-t border-[#2A2A2E] pt-2.5">
                    {!dtcScanned
                      ? 'Clique em LER FALHAS (03) para consultar a memória da injeção.'
                      : dtcList.length === 0
                      ? 'ECU limpa! Todos os códigos DTC foram resetados via Mode 04.'
                      : dtcList.map((d) => <div key={d}>• {d}</div>)}
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'settings' && (
              <div className="space-y-4">
                <div className="border border-[#2A2A2E] bg-[#09090B]/70 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-rajdhani font-bold text-base text-white">UNIDADE DE VELOCIDADE</div>
                    <div className="font-jetbrains text-xs text-[#8E8E93]">Sistema métrico ou imperial</div>
                  </div>
                  <div className="flex border border-[#2A2A2E]">
                    {(['KM/H', 'MPH'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnitMode(u)}
                        className={`px-4 py-2 text-xs font-jetbrains cursor-pointer ${
                          unitMode === u ? 'cyber-hawaii-gradient text-[#09090B] font-bold' : 'bg-[#141417] text-[#8E8E93]'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-[#2A2A2E] bg-[#09090B]/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-rajdhani font-bold text-base text-white">BRILHO DA TELA HMI</span>
                    <span className="font-jetbrains text-xs text-[#00E5FF]">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={45}
                    max={100}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-[#00B4D8] cursor-pointer"
                  />
                </div>

                <div className="border border-[#2A2A2E] bg-[#09090B]/70 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-rajdhani font-bold text-base text-white">PILOTO AUTOMÁTICO (FSD)</div>
                    <div className="font-jetbrains text-xs text-[#8E8E93]">Assistência de direção urbana</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutopilotEnabled((v) => !v)}
                    className={`px-4 py-2 text-xs font-jetbrains border cursor-pointer ${
                      autopilotEnabled
                        ? 'border-[#00E5FF] cyber-hawaii-gradient text-[#09090B] font-bold'
                        : 'border-[#2A2A2E] bg-[#141417] text-[#8E8E93]'
                    }`}
                  >
                    {autopilotEnabled ? 'ATIVADO' : 'DESATIVADO'}
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'apps' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'waze',
                    name: 'WAZE',
                    desc: 'Navegação e alertas em tempo real',
                    action: () => onOpenModal('navigation'),
                  },
                  {
                    id: 'gmaps',
                    name: 'GOOGLE MAPS',
                    desc: 'Mapa vetorial e rotas rápidas',
                    action: () => {
                      setViewMode('map');
                      onClose();
                    },
                  },
                  {
                    id: 'spotify',
                    name: 'SPOTIFY',
                    desc: 'Streaming de áudio integrado',
                    action: () => onOpenModal('music'),
                  },
                  {
                    id: 'ytmusic',
                    name: 'YOUTUBE MUSIC',
                    desc: 'Playlists e mix automotivo',
                    action: () => onOpenModal('music'),
                  },
                  {
                    id: 'androidauto',
                    name: 'ANDROID AUTO',
                    desc: 'Espelhamento e integração mobile',
                    action: () => onOpenModal('phone'),
                  },
                  {
                    id: 'obd',
                    name: 'TORQUE OBD2',
                    desc: 'Sensores do motor e leitura DTC',
                    action: () => onOpenModal('obd'),
                  },
                  {
                    id: 'model3d',
                    name: 'GOL G2 STUDIO',
                    desc: 'Visualização interativa do veículo',
                    action: () => {
                      setViewMode('gol');
                      onClose();
                    },
                  },
                  {
                    id: 'cameras',
                    name: 'SENTINELA CAM',
                    desc: 'Câmeras 360° e gravação',
                    action: () => onOpenModal('cameras'),
                  },
                  {
                    id: 'vehicle',
                    name: 'CONTROLES GOL G2',
                    desc: 'Travas, sentinela e visualização',
                    action: () => onOpenModal('vehicle'),
                  },
                ].map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={app.action}
                    className="p-4 border border-[#2A2A2E] bg-[#09090B]/80 hover:border-[#00B4D8] text-left transition-colors cursor-pointer cyber-chamfer-sm"
                  >
                    <div className="w-2 h-2 cyber-hawaii-gradient mb-2" />
                    <div className="font-rajdhani font-bold text-base text-white tracking-wider">
                      {app.name}
                    </div>
                    <div className="font-jetbrains text-[11px] text-[#8E8E93] mt-1">{app.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
