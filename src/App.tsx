import React, { useEffect, useState } from 'react';
import { CyberMapCanvas } from './components/CyberMapCanvas';
import { GolShowroomView } from './components/GolShowroomView';
import { CyberModals, DockModalType, TrackItem } from './components/CyberModals';
import { TelemetryArcGauge } from './components/TelemetryArcGauge';

type Gear = '1' | '2' | '3' | '4' | '5';

const TRACKS: TrackItem[] = [
  {
    id: '1',
    title: 'Under the Bridge',
    artist: 'Red Hot Chili Peppers',
    durationSec: 264,
    gradient: 'linear-gradient(135deg, #00E5FF 0%, #00B4D8 45%, #0077B6 100%)',
  },
  {
    id: '2',
    title: 'Midnight City',
    artist: 'M83',
    durationSec: 243,
    gradient: 'linear-gradient(135deg, #09090B 0%, #00B4D8 58%, #00E5FF 100%)',
  },
  {
    id: '3',
    title: 'Nightcall',
    artist: 'Kavinsky',
    durationSec: 258,
    gradient: 'linear-gradient(135deg, #141417 0%, #0077B6 55%, #00E5FF 100%)',
  },
];

const QUICK_ROUTES = [
  { name: 'Centro Empresarial', eta: '11:25 AM', mins: 36, km: 24, bat: 78 },
  { name: 'Av. Paulista, 1500', eta: '11:08 AM', mins: 19, km: 11, bat: 81 },
];

export function App() {
  // Real-time system clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Core vehicle & UI states
  const [gear, setGear] = useState<Gear>('3');
  const [locked, setLocked] = useState(false);
  const [driverLocked, setDriverLocked] = useState(true);
  const [batteryPct] = useState(84);
  const [speedKmh, setSpeedKmh] = useState(61);
  const [viewMode, setViewMode] = useState<'map' | 'gol'>('gol');
  const [activeModal, setActiveModal] = useState<DockModalType>(null);

  // Vehicle telemetry for Gol G2 Showroom & Vehicle Modal
  const [sentryMode, setSentryMode] = useState(true);

  // OBD2 & Voice state
  const [obdConnected, setObdConnected] = useState(true);
  const [voiceListening, setVoiceListening] = useState(false);

  // Settings
  const [unitMode, setUnitMode] = useState<'KM/H' | 'MPH'>('KM/H');
  const [brightness, setBrightness] = useState(100);
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);

  // Climate & Volume
  const [cabinTemp, setCabinTemp] = useState(21);
  const [volumePct, setVolumePct] = useState(65);
  const [muted, setMuted] = useState(false);

  // Media player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackElapsed, setTrackElapsed] = useState(102);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setTrackElapsed((prev) => {
        if (prev + 1 >= currentTrack.durationSec) {
          setCurrentTrackIndex((idx) => (idx + 1) % TRACKS.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, currentTrack.durationSec]);

  // Navigation / Trip Card state
  const [routeActive, setRouteActive] = useState(true);
  const [destination, setDestination] = useState('Centro Empresarial');
  const [tripEta, setTripEta] = useState('11:25 AM');
  const [tripMins, setTripMins] = useState(36);
  const [tripKm, setTripKm] = useState(24);
  const [arrivalBattery, setArrivalBattery] = useState(78);
  const [searchInput, setSearchInput] = useState('');

  // Gear selection updates speed naturally for 5-speed manual transmission
  const handleSelectGear = (nextGear: Gear) => {
    setGear(nextGear);
    const targetByGear: Record<Gear, number> = {
      '1': 20,
      '2': 40,
      '3': 61,
      '4': 85,
      '5': 110,
    };
    setSpeedKmh(targetByGear[nextGear]);
  };

  const handleStartRoute = (
    destName: string,
    eta = '11:32 AM',
    mins = 28,
    km = 18,
    arrBat = 79
  ) => {
    setDestination(destName);
    setTripEta(eta);
    setTripMins(mins);
    setTripKm(km);
    setArrivalBattery(arrBat);
    setRouteActive(true);
  };

  const handleSearchRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    handleStartRoute(trimmed, '11:34 AM', 26, 17, 79);
    setSearchInput('');
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((idx) => (idx - 1 + TRACKS.length) % TRACKS.length);
    setTrackElapsed(0);
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((idx) => (idx + 1) % TRACKS.length);
    setTrackElapsed(0);
  };

  const displayedSpeed =
    unitMode === 'MPH' ? Math.round(speedKmh * 0.621371) : speedKmh;

  // Dynamic OBD2 sensor computations linked to 5-speed gear & speed
  const gearRatioFactor: Record<Gear, number> = {
    '1': 115,
    '2': 68,
    '3': 46,
    '4': 34,
    '5': 26,
  };
  const rpm =
    speedKmh === 0
      ? 850
      : Math.min(6800, Math.round(900 + speedKmh * gearRatioFactor[gear]));
  const motorTemp = 92;
  const batteryVoltage = speedKmh === 0 ? 12.6 : 14.1;
  const intakeTemp = 31;
  const engineLoad =
    speedKmh === 0
      ? 16
      : Math.min(98, Math.max(18, Math.round(14 + speedKmh * 0.42)));
  const instantKml =
    speedKmh === 0
      ? 0
      : Number(Math.max(5.8, Math.min(24.5, 22.8 - Math.abs(speedKmh - 65) * 0.095)).toFixed(1));
  const avgKml = 13.5;

  // Power / Regen ratio based on speed & gear
  const powerSegments = 16;
  const activePowerSegments =
    speedKmh === 0
      ? 0
      : Math.min(powerSegments, Math.max(2, Math.round((speedKmh / 140) * powerSegments)));

  const formattedClock = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPct = Math.min(100, (trackElapsed / currentTrack.durationSec) * 100);

  const cardSurfaceClass = 'cyber-surface-glass';

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col bg-[#09090B] text-[#FFFFFF] select-none"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* 1. TOP STATUS BAR (42px height) */}
      <header className="h-[42px] shrink-0 w-full bg-[#09090B] border-b border-[#2A2A2E] px-4 flex items-center justify-between z-40">
        {/* Left: 1-5 Gear Selector, Lock Icon, Battery 84% + geometric bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-[#2A2A2E] bg-[#141417]">
            {(['1', '2', '3', '4', '5'] as Gear[]).map((g) => {
              const active = gear === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSelectGear(g)}
                  className={`w-7 h-[26px] font-rajdhani font-bold text-sm transition-colors cursor-pointer flex items-center justify-center ${
                    active
                      ? 'cyber-hawaii-gradient text-[#09090B]'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Lock Toggle */}
          <button
            type="button"
            onClick={() => setLocked((v) => !v)}
            title={locked ? 'Veículo Trancado' : 'Veículo Destrancado'}
            className={`w-7 h-[26px] border flex items-center justify-center transition-colors cursor-pointer ${
              locked
                ? 'border-[#00B4D8] bg-gradient-to-br from-[#00E5FF]/20 to-[#0077B6]/20 text-[#00E5FF]'
                : 'border-[#2A2A2E] bg-[#141417] text-[#8E8E93] hover:text-white'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {locked ? (
                <>
                  <rect x="4" y="11" width="16" height="10" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </>
              ) : (
                <>
                  <rect x="4" y="11" width="16" height="10" />
                  <path d="M8 11V7a4 4 0 0 1 7.6-1.7" />
                </>
              )}
            </svg>
          </button>

          {/* Battery 84% + Geometric Segmented Bar */}
          <div className="flex items-center gap-2">
            <span className="font-jetbrains text-xs font-semibold text-white">
              {batteryPct}%
            </span>
            <div className="flex items-center gap-[2px] p-[2px] border border-[#2A2A2E] bg-[#141417]">
              {Array.from({ length: 10 }).map((_, idx) => {
                const filled = idx < Math.round(batteryPct / 10);
                return (
                  <span
                    key={idx}
                    className={`w-[5px] h-[10px] ${
                      filled
                        ? idx >= 8
                          ? 'cyber-hawaii-gradient'
                          : 'bg-white'
                        : 'bg-[#2A2A2E]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Driver Profile / Padlock Icon + Map / 3D Switcher */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDriverLocked((v) => !v)}
            title="Perfil do Condutor"
            className="flex items-center gap-1.5 px-2.5 h-[26px] border border-[#2A2A2E] bg-[#141417] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="10" />
              <path d={driverLocked ? 'M8 11V7a4 4 0 0 1 8 0v4' : 'M8 11V7a4 4 0 0 1 7-2.6'} />
            </svg>
            <span className="font-jetbrains text-[10px] tracking-wider uppercase">
              {driverLocked ? 'CONDUTOR 01' : 'DESBLOQ.'}
            </span>
          </button>

          {/* Toggle Vector Map */}
          <div className="flex items-center border border-[#2A2A2E] bg-[#141417]">
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'map' ? 'gol' : 'map'))}
              className={`px-2.5 h-[26px] font-jetbrains text-[10px] tracking-wider uppercase transition-colors cursor-pointer ${
                viewMode === 'map'
                  ? 'cyber-hawaii-gradient text-[#09090B] font-bold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              MAPA VETORIAL
            </button>
          </div>
        </div>

        {/* Right: Digital Clock, Exterior Temp 26°C, 5G & Bluetooth SVG */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#8E8E93]">
            {/* 5G Signal SVG */}
            <div className="flex items-center gap-1" title="Conexão 5G Ativa">
              <svg width="14" height="12" viewBox="0 0 16 14" fill="currentColor">
                <rect x="0" y="10" width="2.5" height="4" className="text-white" />
                <rect x="4" y="7" width="2.5" height="7" className="text-white" />
                <rect x="8" y="4" width="2.5" height="10" className="text-white" />
                <rect x="12" y="1" width="2.5" height="13" className="text-[#00E5FF]" />
              </svg>
              <span className="font-jetbrains text-[10px] text-white">5G</span>
            </div>

            {/* Bluetooth SVG */}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white"
            >
              <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
            </svg>

            {/* OBD2 Status Badge */}
            <button
              type="button"
              onClick={() => setActiveModal('obd')}
              className={`px-1.5 py-0.5 border font-jetbrains text-[9px] uppercase tracking-wider cursor-pointer ${
                obdConnected
                  ? 'border-[#00B4D8] bg-[#00B4D8]/15 text-[#00E5FF]'
                  : 'border-[#2A2A2E] bg-[#141417] text-[#8E8E93]'
              }`}
              title="Diagnóstico OBD2 ELM327"
            >
              OBD2 {obdConnected ? 'ON' : 'OFF'}
            </button>
          </div>

          <span className="hidden lg:inline font-jetbrains text-[10px] uppercase text-[#8E8E93] border-l border-[#2A2A2E] pl-3">
            {formattedDate}
          </span>

          <span className="font-jetbrains text-xs text-[#8E8E93] border-l border-[#2A2A2E] pl-3">
            22°C
          </span>

          <span className="font-rajdhani text-base font-bold tracking-wider text-white tabular-nums">
            {formattedClock}
          </span>
        </div>
      </header>

      {/* 2. MAIN FULL-BLEED AREA */}
      <main className="relative flex-1 w-full overflow-hidden bg-[#09090B]">
        {/* Background: Either Dark Mode Vector Map or Gol G2 Showroom */}
        {viewMode === 'map' ? (
          <CyberMapCanvas
            routeActive={routeActive}
            speedKmh={speedKmh}
            gear={gear}
            destinationName={destination}
          />
        ) : (
          <GolShowroomView />
        )}

        {/* Top-Left HUD Column: OBD2 Gauges (MOTOR, BATERIA, VIAGEM) + VELOCIDADE / RPM */}
        <div className="absolute top-4 left-5 z-20 pointer-events-auto flex flex-col gap-2.5">
          {/* Row of OBD2 Left Gauges */}
          <div className="flex items-stretch gap-2">
            <TelemetryArcGauge
              label="MOTOR"
              value={String(motorTemp)}
              unit="°C"
              percent={(motorTemp / 120) * 100}
              onClick={() => setActiveModal('obd')}
            />
            <TelemetryArcGauge
              label="BATERIA"
              value={batteryVoltage.toFixed(1).replace('.', ',')}
              unit="V"
              percent={((batteryVoltage - 10) / 5) * 100}
              onClick={() => setActiveModal('obd')}
            />
            <button
              type="button"
              onClick={() => setActiveModal('obd')}
              className="flex flex-col justify-center px-2.5 py-1.5 bg-[#141417]/85 border border-[#2A2A2E] hover:border-[#00B4D8] transition-colors cursor-pointer cyber-chamfer-sm text-left"
            >
              <span className="font-jetbrains text-[8px] tracking-widest uppercase text-[#8E8E93]">
                VIAGEM
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-rajdhani font-bold text-lg leading-none text-white tabular-nums">
                  {avgKml.toFixed(1).replace('.', ',')}
                </span>
                <span className="font-jetbrains text-[8px] text-[#00E5FF]">KM/L</span>
              </div>
              <span className="font-jetbrains text-[8px] text-[#8E8E93] mt-0.5">
                0.5 km • 0.1 L
              </span>
            </button>
          </div>

          {/* Minimalist Speedometer + RPM + Linear Power Bar */}
          <div className="cyber-chamfer-frame w-[230px]">
            <div className={`cyber-chamfer-inner px-4 py-3 ${cardSurfaceClass}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-[#8E8E93]">
                  VELOCIDADE // {gear}ª
                </span>
                {autopilotEnabled && (
                  <span className="font-jetbrains text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-[#00E5FF]/20 to-[#0077B6]/20 border border-[#00B4D8] text-[#00E5FF]">
                    FSD
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-rajdhani text-5xl font-bold leading-none tracking-tight text-white tabular-nums">
                  {displayedSpeed}
                </span>
                <span className="font-jetbrains text-xs text-[#8E8E93] uppercase">
                  {unitMode}
                </span>
              </div>

              {/* Linear Angular Power / Regen Bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between font-jetbrains text-[9px] text-[#8E8E93] mb-1">
                  <span>{rpm.toLocaleString('pt-BR')} RPM</span>
                  <span>POTÊNCIA</span>
                </div>
                <div className="grid grid-cols-16 gap-[2px] h-[6px] bg-[#09090B] p-[1px] border border-[#2A2A2E]">
                  {Array.from({ length: powerSegments }).map((_, i) => {
                    const active = i < activePowerSegments;
                    return (
                      <div
                        key={i}
                        className={
                          active
                            ? i < 3
                              ? 'bg-white'
                              : 'cyber-hawaii-bar'
                            : 'bg-[#1C1C21]'
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Interactive Speed Test Controls */}
              <div className="mt-2.5 pt-2 border-t border-[#2A2A2E] flex items-center justify-between">
                <span className="font-jetbrains text-[9px] text-[#8E8E93]">CRUZEIRO</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSpeedKmh((s) => Math.max(0, s - 10))}
                    className="w-6 h-5 border border-[#2A2A2E] bg-[#09090B] text-xs font-jetbrains text-[#8E8E93] hover:text-white hover:border-[#00B4D8] cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeedKmh((s) => Math.min(180, s + 10))}
                    className="w-6 h-5 border border-[#2A2A2E] bg-[#09090B] text-xs font-jetbrains text-[#8E8E93] hover:text-white hover:border-[#00B4D8] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right HUD Column: OBD2 Gauges (ADMISSÃO, CARGA) + CONSUMO Card + MÚSICA abaixo do Consumo */}
        <div className="absolute top-3.5 right-5 z-20 pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-stretch gap-2">
            <TelemetryArcGauge
              label="ADMISSÃO"
              value={String(intakeTemp)}
              unit="°C"
              percent={(intakeTemp / 80) * 100}
              onClick={() => setActiveModal('obd')}
            />
            <TelemetryArcGauge
              label="CARGA"
              value={String(engineLoad)}
              unit="%"
              percent={engineLoad}
              onClick={() => setActiveModal('obd')}
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveModal('obd')}
            className="cyber-chamfer-frame w-[256px] text-left cursor-pointer"
          >
            <div className={`cyber-chamfer-inner px-4 py-2.5 ${cardSurfaceClass}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-[#8E8E93]">
                  CONSUMO
                </span>
                <span className="w-1.5 h-1.5 cyber-hawaii-gradient inline-block" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-rajdhani text-4xl font-bold leading-none tracking-tight text-white tabular-nums">
                  {instantKml.toFixed(1).replace('.', ',')}
                </span>
                <span className="font-jetbrains text-xs text-[#00E5FF] uppercase">
                  KM/L
                </span>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-[#2A2A2E] font-jetbrains text-[10px] text-[#8E8E93]">
                Média da viagem {avgKml.toFixed(1).replace('.', ',')} km/l
              </div>
            </div>
          </button>

          {/* Aba de Música posicionada embaixo do Consumo */}
          <div className="cyber-chamfer-frame w-[256px]">
            <div className={`cyber-chamfer-inner p-3 ${cardSurfaceClass}`}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-[42px] h-[42px] shrink-0 border border-[#2A2A2E] relative overflow-hidden flex items-end p-1"
                  style={{ background: currentTrack.gradient }}
                >
                  <span className="font-jetbrains text-[7px] text-white/90 tracking-widest">
                    FLAC
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-rajdhani text-base font-bold text-white truncate leading-tight">
                    {currentTrack.title}
                  </div>
                  <div className="font-jetbrains text-[10px] text-[#8E8E93] truncate">
                    {currentTrack.artist}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModal('music')}
                  aria-label="Buscar músicas"
                  className="w-7 h-7 border border-[#2A2A2E] bg-[#09090B]/80 text-[#8E8E93] hover:text-white hover:border-[#00B4D8] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </button>
              </div>

              <div className="mt-2.5">
                <div className="w-full h-[3px] bg-[#2A2A2E] overflow-hidden">
                  <div
                    className="h-full cyber-hawaii-bar transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-jetbrains text-[9px] text-[#8E8E93]">
                    {formatDuration(trackElapsed)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevTrack}
                      aria-label="Faixa anterior"
                      className="w-6 h-6 border border-[#2A2A2E] bg-[#09090B]/80 text-white hover:border-[#00B4D8] flex items-center justify-center cursor-pointer"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="19 20 9 12 19 4 19 20" />
                        <rect x="5" y="4" width="2.5" height="16" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                      className="w-7 h-6 border border-[#00E5FF] cyber-hawaii-gradient text-[#09090B] flex items-center justify-center cursor-pointer"
                    >
                      {isPlaying ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="6 4 20 12 6 20 6 4" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextTrack}
                      aria-label="Próxima faixa"
                      className="w-6 h-6 border border-[#2A2A2E] bg-[#09090B]/80 text-white hover:border-[#00B4D8] flex items-center justify-center cursor-pointer"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 4 15 12 5 20 5 4" />
                        <rect x="16.5" y="4" width="2.5" height="16" />
                      </svg>
                    </button>
                  </div>

                  <span className="font-jetbrains text-[9px] text-[#8E8E93]">
                    {formatDuration(currentTrack.durationSec)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Command Toast Banner */}
        {voiceListening && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 cyber-chamfer-frame-accent">
            <div className="cyber-chamfer-inner bg-[#141417]/95 px-4 py-2 flex items-center gap-3">
              <span className="w-2 h-2 cyber-hawaii-gradient inline-block" />
              <span className="font-jetbrains text-xs text-white tracking-wider">
                MICROFONE ATIVO // DIGA &quot;IR PARA...&quot; OU &quot;TOCAR MÚSICA&quot;
              </span>
              <button
                type="button"
                onClick={() => setVoiceListening(false)}
                className="font-jetbrains text-[10px] text-[#00E5FF] hover:underline cursor-pointer"
              >
                FECHAR
              </button>
            </div>
          </div>
        )}

        {/* Bottom Floating Row: Trip Card (left) + 6-Button Quick App Bar (right) */}
        <div className="absolute bottom-3.5 left-5 right-5 z-20 flex flex-wrap xl:flex-nowrap items-end justify-between gap-3 pointer-events-none">
          <div className="flex flex-wrap items-end gap-3 pointer-events-none">

          {/* Card 2: Navigation / Current Trip */}
          <div className="pointer-events-auto cyber-chamfer-frame w-[332px]">
            <div className={`cyber-chamfer-inner p-3.5 ${cardSurfaceClass}`}>
              {routeActive ? (
                <div className="flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-rajdhani text-2xl font-bold text-white leading-none tabular-nums">
                          {tripEta}
                        </span>
                        <span className="font-jetbrains text-[10px] text-[#00E5FF] uppercase tracking-wider">
                          CHEGADA
                        </span>
                      </div>
                      <div className="font-rajdhani text-base font-semibold text-white truncate mt-1">
                        {destination}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-jetbrains text-xs text-white font-semibold">
                        {arrivalBattery}%
                      </div>
                      <div className="font-jetbrains text-[9px] text-[#8E8E93] uppercase">
                        NA CHEGADA
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#2A2A2E] flex items-center justify-between gap-3">
                    <span className="font-jetbrains text-xs text-[#8E8E93]">
                      {tripMins} min • {tripKm} km
                    </span>
                    <button
                      type="button"
                      onClick={() => setRouteActive(false)}
                      className="px-3 py-1.5 border border-[#2A2A2E] bg-[#09090B]/90 hover:border-[#00B4D8] hover:text-[#00E5FF] font-jetbrains text-[11px] uppercase tracking-wider text-white transition-colors cursor-pointer cyber-chamfer-btn"
                    >
                      Encerrar Viagem
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-jetbrains text-[10px] uppercase tracking-widest text-[#00E5FF]">
                      SEM ROTA ATIVA
                    </span>
                    <span className="font-jetbrains text-[10px] text-[#8E8E93]">NAVEGAÇÃO</span>
                  </div>
                  <form onSubmit={handleSearchRouteSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Buscar novo destino..."
                      className="flex-1 min-w-0 bg-[#09090B] border border-[#2A2A2E] px-2.5 py-1.5 font-jetbrains text-xs text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#00B4D8]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 cyber-hawaii-gradient text-[#09090B] font-jetbrains font-bold text-[11px] uppercase cursor-pointer cyber-chamfer-btn"
                    >
                      IR
                    </button>
                  </form>
                  <div className="flex items-center gap-1.5">
                    {QUICK_ROUTES.map((r) => (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() => handleStartRoute(r.name, r.eta, r.mins, r.km, r.bat)}
                        className="flex-1 truncate px-2 py-1 border border-[#2A2A2E] bg-[#09090B]/80 hover:border-[#00B4D8] font-jetbrains text-[10px] text-[#8E8E93] hover:text-white cursor-pointer text-left"
                      >
                        → {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Bottom-Right Quick App Launcher Bar (WAZE, GOOGLE MAPS, SPOTIFY, YOUTUBE MUSIC, ANDROID AUTO, APPS) */}
          <div className="pointer-events-auto hidden md:flex items-center gap-1.5">
            {(
              [
                {
                  label: 'WAZE',
                  onClick: () => setActiveModal('navigation'),
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  ),
                },
                {
                  label: 'GOOGLE MAPS',
                  onClick: () => setViewMode('map'),
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    </svg>
                  ),
                },
                {
                  label: 'SPOTIFY',
                  onClick: () => setActiveModal('music'),
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  ),
                },
                {
                  label: 'YOUTUBE MUSIC',
                  onClick: () => setActiveModal('music'),
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <polygon points="10 8 16 12 10 16 10 8" />
                    </svg>
                  ),
                },
                {
                  label: 'ANDROID AUTO',
                  onClick: () => setActiveModal('phone'),
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3l8 16H4L12 3z" />
                    </svg>
                  ),
                },
              ] as const
            ).map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.onClick}
                className="h-[46px] px-3 bg-[#141417]/90 border border-[#2A2A2E] hover:border-[#00B4D8] text-white flex items-center gap-2 transition-colors cursor-pointer cyber-chamfer-sm"
              >
                <span className="text-[#00E5FF]">{btn.icon}</span>
                <span className="font-jetbrains text-[10px] tracking-wider whitespace-nowrap">
                  {btn.label}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setActiveModal('apps')}
              aria-label="Abrir gaveta de aplicativos"
              className="h-[46px] w-[48px] cyber-hawaii-gradient text-[#09090B] flex items-center justify-center cursor-pointer cyber-chamfer-sm"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="8" height="8" />
                <rect x="13" y="3" width="8" height="8" />
                <rect x="3" y="13" width="8" height="8" />
                <rect x="13" y="13" width="8" height="8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cyber Modals triggered from Bottom Dock */}
        <CyberModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          onOpenModal={(m) => setActiveModal(m)}
          useSolidSurface={false}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sentryMode={sentryMode}
          setSentryMode={setSentryMode}
          locked={locked}
          setLocked={setLocked}
          routeActive={routeActive}
          destination={destination}
          onStartRoute={handleStartRoute}
          onEndRoute={() => setRouteActive(false)}
          tracks={TRACKS}
          currentTrackIndex={currentTrackIndex}
          isPlaying={isPlaying}
          onSelectTrack={(idx) => {
            setCurrentTrackIndex(idx);
            setTrackElapsed(0);
            setIsPlaying(true);
          }}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          unitMode={unitMode}
          setUnitMode={setUnitMode}
          brightness={brightness}
          setBrightness={setBrightness}
          autopilotEnabled={autopilotEnabled}
          setAutopilotEnabled={setAutopilotEnabled}
          obdConnected={obdConnected}
          setObdConnected={setObdConnected}
          rpm={rpm}
          motorTemp={motorTemp}
          batteryVoltage={batteryVoltage}
          intakeTemp={intakeTemp}
          engineLoad={engineLoad}
          instantKml={instantKml}
          avgKml={avgKml}
        />
      </main>

      {/* 3. FIXED BOTTOM DOCK (68px height) */}
      <footer className="h-[68px] shrink-0 w-full bg-[#09090B] border-t border-[#2A2A2E] px-5 flex items-center justify-between z-40">
        {/* Left Edge: Interactive Climate Control < 21° > + Voice Microphone */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-[#2A2A2E] bg-[#141417] px-2 h-[42px] cyber-chamfer-sm">
            <button
              type="button"
              onClick={() => setCabinTemp((t) => Math.max(16, t - 1))}
              aria-label="Diminuir temperatura"
              className="w-7 h-7 flex items-center justify-center text-[#8E8E93] hover:text-[#00E5FF] cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="min-w-[44px] text-center">
              <span className="font-rajdhani text-2xl font-bold text-white leading-none tabular-nums">
                {cabinTemp}°
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCabinTemp((t) => Math.min(28, t + 1))}
              aria-label="Aumentar temperatura"
              className="w-7 h-7 flex items-center justify-center text-[#8E8E93] hover:text-[#00E5FF] cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setVoiceListening((v) => !v)}
            title="Comando de Voz"
            aria-label="Comando de Voz"
            className={`w-[42px] h-[42px] border flex items-center justify-center transition-colors cursor-pointer cyber-chamfer-sm ${
              voiceListening
                ? 'border-[#00E5FF] cyber-hawaii-gradient text-[#09090B]'
                : 'border-[#2A2A2E] bg-[#141417] text-[#8E8E93] hover:text-[#00E5FF] hover:border-[#00B4D8]'
            }`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>

        {/* Center: Minimalist SVG Vector Dock Icons */}
        <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Menu principal HMI">
          {(
            [
              {
                id: 'vehicle',
                label: 'Veículo',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 15v-2l3-5h8l5 3.5V15H3z" />
                    <circle cx="7" cy="16.5" r="2" />
                    <circle cx="17" cy="16.5" r="2" />
                  </svg>
                ),
              },
              {
                id: 'navigation',
                label: 'Navegação',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polygon points="12 2 19 21 12 17 5 21 12 2" />
                  </svg>
                ),
              },
              {
                id: 'music',
                label: 'Música',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 18V5l12-2v13" />
                    <rect x="4" y="15" width="5" height="5" />
                    <rect x="16" y="13" width="5" height="5" />
                  </svg>
                ),
              },
              {
                id: 'phone',
                label: 'Telefone',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                ),
              },
              {
                id: 'cameras',
                label: 'Câmeras',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" />
                  </svg>
                ),
              },
              {
                id: 'obd',
                label: 'OBD2 / Saúde',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 20a8 8 0 1 0-8-8" />
                    <path d="M12 12l4-4" />
                    <circle cx="12" cy="12" r="1.5" />
                  </svg>
                ),
              },
              {
                id: 'settings',
                label: 'Configurações',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polygon points="12 2 19 6 19 18 12 22 5 18 5 6" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
              },
              {
                id: 'apps',
                label: 'Aplicativos',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                ),
              },
            ] as const
          ).map((item) => {
            const isOpen = activeModal === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={() =>
                  setActiveModal((cur) => (cur === item.id ? null : item.id))
                }
                className={`relative w-11 h-11 flex items-center justify-center border transition-colors cursor-pointer ${
                  isOpen
                    ? 'border-[#00B4D8] bg-[#141417] text-[#00E5FF]'
                    : 'border-transparent hover:border-[#2A2A2E] hover:bg-[#141417] text-[#8E8E93] hover:text-white'
                }`}
              >
                {item.icon}
                {isOpen && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] cyber-hawaii-bar" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Edge: Interactive Volume Control < 🔊 65% > */}
        <div className="flex items-center gap-1.5 border border-[#2A2A2E] bg-[#141417] px-2 h-[42px] cyber-chamfer-sm">
          <button
            type="button"
            onClick={() => {
              setMuted(false);
              setVolumePct((v) => Math.max(0, v - 5));
            }}
            aria-label="Diminuir volume"
            className="w-7 h-7 flex items-center justify-center text-[#8E8E93] hover:text-[#00E5FF] cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
            className="flex items-center gap-1.5 px-1 text-white hover:text-[#00E5FF] cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {!muted && volumePct > 0 ? (
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              ) : (
                <line x1="16" y1="9" x2="22" y2="15" />
              )}
            </svg>
            <span className="font-jetbrains text-xs font-semibold min-w-[34px] text-right tabular-nums">
              {muted ? '0%' : `${volumePct}%`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMuted(false);
              setVolumePct((v) => Math.min(100, v + 5));
            }}
            aria-label="Aumentar volume"
            className="w-7 h-7 flex items-center justify-center text-[#8E8E93] hover:text-[#00E5FF] cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
