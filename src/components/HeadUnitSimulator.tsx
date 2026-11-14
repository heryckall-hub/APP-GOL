import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  Bluetooth,
  Compass,
  MusicNote,
  Pause,
  PlayArrow,
  SkipNext,
  SkipPrevious,
  Speed,
  Warning
} from './CockpitIcons';
import { FuelTypeId, LauncherConfig, NeonThemeId } from '../data/androidProjectFiles';
import {
  ArrowLeftRight,
  Car,
  CornerUpRight,
  LayoutGrid,
  MapPin,
  Mic,
  Navigation,
  Phone,
  PlaySquare,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
  Volume1,
  Volume2,
  Wifi,
  Wrench,
  X
} from 'lucide-react';

type ResolutionPreset = '1024x600' | '1280x720';
type CarVisualMode = 'gol1999' | 'garage';
type ObdStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

interface SimulatedApp {
  label: string;
  packageName: string;
  category: string;
  accent: string;
}

interface PairedObdDevice {
  name: string;
  address: string;
}

interface DtcFault {
  code: string;
  description: string;
}

const PAIRED_BT_DEVICES: PairedObdDevice[] = [
  { name: 'OBDII ELM327 v1.5 BT', address: '00:1D:A5:68:98:8B' },
  { name: 'Vgate iCar Pro 4.0', address: '8C:DE:52:41:20:F4' },
  { name: 'KONNWEI KW902', address: 'AA:BB:CC:11:22:33' }
];

const SAMPLE_DTCS: DtcFault[] = [
  { code: 'P0171', description: 'Mistura ar/combustível muito pobre (Banco 1)' },
  { code: 'P0300', description: 'Falha de ignição aleatória em múltiplos cilindros' },
  { code: 'P0115', description: 'Sensor de temperatura do líquido de arrefecimento' }
];

const INSTALLED_APPS: SimulatedApp[] = [
  { label: 'WAZE', packageName: 'com.waze', category: 'Navegação', accent: '#38BDF8' },
  { label: 'GOOGLE MAPS', packageName: 'com.google.android.apps.maps', category: 'Navegação', accent: '#34D399' },
  { label: 'SPOTIFY', packageName: 'com.spotify.music', category: 'Música', accent: '#1DB954' },
  { label: 'YOUTUBE MUSIC', packageName: 'com.google.android.apps.youtube.music', category: 'Música', accent: '#FF3B5C' },
  { label: 'ANDROID AUTO', packageName: 'com.google.android.projection.gearhead', category: 'Projeção', accent: '#60A5FA' },
  { label: 'YOUTUBE', packageName: 'com.google.android.youtube', category: 'Vídeo', accent: '#EF4444' },
  { label: 'TELEFONE', packageName: 'com.android.dialer', category: 'Comunicação', accent: '#22D3EE' },
  { label: 'POWERAMP', packageName: 'com.maxmpz.audioplayer', category: 'Música', accent: '#FBBF24' },
  { label: 'TORQUE OBD', packageName: 'org.prowl.torque', category: 'Diagnóstico', accent: '#38BDF8' },
  { label: 'RÁDIO FM', packageName: 'com.android.fmradio', category: 'Áudio', accent: '#F59E0B' },
  { label: 'BLUETOOTH', packageName: 'com.android.settings.bluetooth', category: 'Sistema', accent: '#60A5FA' },
  { label: 'CONFIGURAÇÕES', packageName: 'com.android.settings', category: 'Sistema', accent: '#94A3B8' }
];

const TRACKS = [
  { title: 'Midnight Highway', artist: 'Spotify · BT Audio', durationSec: 214 },
  { title: 'Estrada da Serra', artist: 'YouTube Music · A2DP', durationSec: 196 },
  { title: 'Gol 1999 Night Run', artist: 'Poweramp · USB FLAC', durationSec: 238 }
];

interface WazeRoutePreset {
  id: string;
  destination: string;
  street: string;
  turnDistance: string;
  remainingKm: number;
  etaMin: number;
  radarLimit: number | null;
}

const WAZE_ROUTES: WazeRoutePreset[] = [
  {
    id: 'casa',
    destination: 'Casa',
    street: 'Av. Paulista, 1400',
    turnDistance: '350 m',
    remainingKm: 6.4,
    etaMin: 14,
    radarLimit: 60
  },
  {
    id: 'trabalho',
    destination: 'Trabalho',
    street: 'Marginal Pinheiros',
    turnDistance: '1,2 km',
    remainingKm: 12.8,
    etaMin: 22,
    radarLimit: 70
  },
  {
    id: 'posto',
    destination: 'Posto Shell',
    street: 'Av. Brasil, 890',
    turnDistance: '220 m',
    remainingKm: 2.1,
    etaMin: 5,
    radarLimit: null
  },
  {
    id: 'garagem',
    destination: 'Garagem / Oficina',
    street: 'Rua Augusta, 520',
    turnDistance: '600 m',
    remainingKm: 4.5,
    etaMin: 11,
    radarLimit: 50
  }
];

const NEON_STYLE: Record<
  NeonThemeId,
  { primary: string; glow: string; secondary: string; ambientRgba: string }
> = {
  cyan: {
    primary: '#2563EB',
    glow: '#38BDF8',
    secondary: '#22D3EE',
    ambientRgba: 'rgba(56, 189, 248, 0.24)'
  },
  red: {
    primary: '#DC2626',
    glow: '#FF2E4C',
    secondary: '#FB7185',
    ambientRgba: 'rgba(255, 46, 76, 0.24)'
  },
  amber: {
    primary: '#D97706',
    glow: '#FFB020',
    secondary: '#FBBF24',
    ambientRgba: 'rgba(255, 176, 32, 0.24)'
  }
};

function mapWmoToPtBr(code: number): string {
  if (code === 0) return 'Céu Limpo';
  if (code <= 2) return 'Poucas Nuvens';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Neblina';
  if (code >= 51 && code <= 55) return 'Garoa';
  if (code >= 61 && code <= 65) return 'Chuva';
  if (code >= 80 && code <= 82) return 'Pancadas';
  if (code >= 95) return 'Tempestade';
  return 'Céu Limpo';
}

const PremiumInstrumentGauge: React.FC<{
  label: string;
  value: string;
  unit: string;
  fraction: number;
  startColor: string;
  endColor: string;
  onClick: () => void;
}> = ({ label, value, unit, fraction, startColor, endColor, onClick }) => {
  const gradId = useId();
  const size = 66;
  const stroke = 5.5;
  const center = size / 2;
  const radius = center - stroke - 1;
  const circumference = 2 * Math.PI * radius;
  const arcLen = (270 / 360) * circumference;
  const clamped = Math.max(0, Math.min(1, fraction));
  const activeLen = arcLen * clamped;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center gap-0.5 rounded-2xl px-1.5 py-1 hover:bg-white/5 transition-all active:scale-95"
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Halo interno sutil */}
        <div
          className="absolute inset-2 rounded-full opacity-25 blur-sm transition-opacity group-hover:opacity-45"
          style={{ background: `radial-gradient(circle, ${endColor}, transparent 72%)` }}
        />
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
          {/* Trilha metálica */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(30, 44, 72, 0.85)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLen} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(135 ${center} ${center})`}
          />
          {/* Arco colorido com brilho */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={`${activeLen} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(135 ${center} ${center})`}
            style={{ filter: `drop-shadow(0 0 6px ${endColor}99)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-display text-[15px] font-bold tabular-nums text-white drop-shadow">
            {value}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold" style={{ color: endColor }}>
            {unit}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold tracking-wider text-slate-300 group-hover:text-white">
        {label}
      </span>
    </button>
  );
};

const TelemetrySparkline: React.FC<{
  values: number[];
  min: number;
  max: number;
  strokeStart: string;
  strokeEnd: string;
  alignRight?: boolean;
}> = ({ values, min, max, strokeStart, strokeEnd, alignRight }) => {
  const gradId = useId();
  const fillId = useId();
  const width = 166;
  const height = 28;
  const range = Math.max(1, max - min);

  const points = values.map((val, idx) => {
    const x = (idx / Math.max(1, values.length - 1)) * width;
    const norm = Math.max(0, Math.min(1, (val - min) / range));
    const y = height - 3 - norm * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${alignRight ? 'ml-auto' : ''}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={strokeStart} />
          <stop offset="100%" stopColor={strokeEnd} />
        </linearGradient>
        <linearGradient id={fillId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeEnd} stopOpacity="0.34" />
          <stop offset="100%" stopColor={strokeEnd} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${strokeEnd}88)` }}
      />
    </svg>
  );
};

interface HeadUnitSimulatorProps {
  config: LauncherConfig;
  onUpdateConfig: (next: LauncherConfig) => void;
}

export const HeadUnitSimulator: React.FC<HeadUnitSimulatorProps> = ({ config, onUpdateConfig }) => {
  const [resolution, setResolution] = useState<ResolutionPreset>('1280x720');
  const [carVisual, setCarVisual] = useState<CarVisualMode>('gol1999');
  const [dimmerStep, setDimmerStep] = useState<0 | 1 | 2>(0);

  // Splash Intro state
  const [showSplash, setShowSplash] = useState<boolean>(config.splashEnabled);
  const [splashStep, setSplashStep] = useState<'sliding' | 'flash' | 'fading'>('sliding');
  const [typedChars, setTypedChars] = useState(0);

  // Connectivity & OBD2
  const [wifiOn, setWifiOn] = useState(true);
  const [btOn, setBtOn] = useState(true);
  const [obdStatus, setObdStatus] = useState<ObdStatus>('CONNECTED');
  const [selectedObdDevice, setSelectedObdDevice] = useState<PairedObdDevice>(PAIRED_BT_DEVICES[0]);
  const [dtcList, setDtcList] = useState<DtcFault[]>([]);

  // Speed, Engine & Historical Sparklines
  const [gpsSpeedKmh, setGpsSpeedKmh] = useState(59);
  const [obdSpeedKmh, setObdSpeedKmh] = useState(61);
  const [rpm, setRpm] = useState(2700);
  const [motorTemp, setMotorTemp] = useState(92);
  const [batteryVolts, setBatteryVolts] = useState(14.1);
  const [intakeTemp, setIntakeTemp] = useState(31);
  const [engineLoad, setEngineLoad] = useState(40);
  const [mafGramsSec, setMafGramsSec] = useState(14.8);
  const [mapKpa, setMapKpa] = useState(58);

  const [speedHistory, setSpeedHistory] = useState<number[]>([
    42, 46, 51, 54, 58, 60, 57, 59, 63, 62, 60, 61
  ]);

  // Waze GPS Navigation
  const [wazeRouteIdx, setWazeRouteIdx] = useState(0);
  const [wazeActive, setWazeActive] = useState(true);
  const [wazeRadarAlert, setWazeRadarAlert] = useState(true);
  const [wazeDistanceLeftKm, setWazeDistanceLeftKm] = useState(WAZE_ROUTES[0].remainingKm);
  const [isWazeModalOpen, setIsWazeModalOpen] = useState(false);

  // Trip Computer
  const [tripDistanceKm, setTripDistanceKm] = useState(14.8);
  const [tripSeconds, setTripSeconds] = useState(1120);
  const [tripFuelLiters, setTripFuelLiters] = useState(1.12);

  // Clock & Weather
  const [useLiveClock, setUseLiveClock] = useState(false);
  const [liveTime, setLiveTime] = useState(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: 'numeric', minute: '2-digit' })
  );
  const [weatherTemp, setWeatherTemp] = useState(22);
  const [weatherCond, setWeatherCond] = useState('Céu Limpo');

  // Shortcuts
  const [shortcuts, setShortcuts] = useState<SimulatedApp[]>([
    INSTALLED_APPS[0],
    INSTALLED_APPS[1],
    INSTALLED_APPS[2],
    INSTALLED_APPS[3],
    INSTALLED_APPS[4]
  ]);

  // Media bar
  const [musicPermissionGranted, setMusicPermissionGranted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackIdx, setTrackIdx] = useState(0);
  const [trackProgress, setTrackProgress] = useState(78);
  const [volume, setVolume] = useState(11);
  const [showVolumeHud, setShowVolumeHud] = useState(false);

  // Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [replacingSlot, setReplacingSlot] = useState<number | null>(null);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isObdModalOpen, setIsObdModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Settings drafts
  const [draftCarName, setDraftCarName] = useState(config.carName);
  const [draftLimit, setDraftLimit] = useState(config.speedLimitKmh);
  const [draftTheme, setDraftTheme] = useState<NeonThemeId>(config.neonTheme);
  const [draftDisplacement, setDraftDisplacement] = useState(config.engineDisplacementLiters);
  const [draftFuelType, setDraftFuelType] = useState<FuelTypeId>(config.fuelType);
  const [draftFuelPrice, setDraftFuelPrice] = useState(config.fuelPriceBrl.toFixed(2));
  const [draftSplashEnabled, setDraftSplashEnabled] = useState(config.splashEnabled);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const greetingText = 'BEM VINDO';

  useEffect(() => {
    if (!showSplash) return;
    setSplashStep('sliding');
    setTypedChars(0);

    const typeInterval = setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= greetingText.length) {
          clearInterval(typeInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 45);

    const t1 = setTimeout(() => setSplashStep('flash'), 900);
    const t2 = setTimeout(() => setSplashStep('fading'), 2150);
    const t3 = setTimeout(() => setShowSplash(false), 2500);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showSplash, greetingText]);

  const activeSpeedKmh = obdStatus === 'CONNECTED' ? obdSpeedKmh : gpsSpeedKmh;

  const instantKmL = useMemo(() => {
    if (activeSpeedKmh < 2) return 0;
    const afr = config.fuelType === 'ETHANOL' ? 9.0 : 14.7;
    const density = config.fuelType === 'ETHANOL' ? 0.789 : 0.745;

    if (obdStatus === 'CONNECTED') {
      const lph = ((mafGramsSec / afr) * 3600) / (density * 1000);
      return Math.max(2.5, Math.min(32, activeSpeedKmh / Math.max(0.4, lph)));
    }
    const base = config.fuelType === 'ETHANOL' ? 8.6 : 12.2;
    const dispFactor = Math.max(0.65, Math.min(1.35, 1.6 / Math.max(0.8, config.engineDisplacementLiters)));
    const aeroPenalty = activeSpeedKmh > 95 ? 0.86 : 1.0;
    return Number((base * dispFactor * aeroPenalty).toFixed(1));
  }, [activeSpeedKmh, config.fuelType, config.engineDisplacementLiters, obdStatus, mafGramsSec]);

  const tripAvgKmL = useMemo(() => {
    if (tripFuelLiters <= 0.01 || tripDistanceKm <= 0.05) return 0;
    return Math.max(2, Math.min(32, tripDistanceKm / tripFuelLiters));
  }, [tripDistanceKm, tripFuelLiters]);

  const tripCostBrl = useMemo(
    () => tripFuelLiters * config.fuelPriceBrl,
    [tripFuelLiters, config.fuelPriceBrl]
  );

  const tripAvgSpeed = useMemo(() => {
    if (tripSeconds <= 0) return 0;
    return tripDistanceKm / (tripSeconds / 3600);
  }, [tripDistanceKm, tripSeconds]);

  const estimatedGear = useMemo(() => {
    if (activeSpeedKmh <= 1 && rpm < 1100) return 'N';
    if (activeSpeedKmh < 22) return '1ª';
    if (activeSpeedKmh < 44) return '2ª';
    if (activeSpeedKmh < 70) return '3ª';
    if (activeSpeedKmh < 98) return '4ª';
    return '5ª';
  }, [activeSpeedKmh, rpm]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('pt-BR', { hour: 'numeric', minute: '2-digit' }));
      if (isPlaying && musicPermissionGranted) {
        setTrackProgress((p) => {
          const max = TRACKS[trackIdx].durationSec;
          if (p + 1 >= max) {
            setTrackIdx((idx) => (idx + 1) % TRACKS.length);
            return 0;
          }
          return p + 1;
        });
      }
      if (activeSpeedKmh >= 2) {
        const deltaKm = activeSpeedKmh / 3600;
        const kmL = Math.max(3, instantKmL || 12);
        setTripDistanceKm((d) => d + deltaKm);
        setTripSeconds((s) => s + 1);
        setTripFuelLiters((l) => l + deltaKm / kmL);
        if (wazeActive) {
          setWazeDistanceLeftKm((rem) => (rem - deltaKm <= 0.2 ? WAZE_ROUTES[wazeRouteIdx].remainingKm : rem - deltaKm));
        }
      }
      setSpeedHistory((prev) => [...prev.slice(1), activeSpeedKmh]);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, musicPermissionGranted, trackIdx, activeSpeedKmh, instantKmL, wazeActive, wazeRouteIdx]);

  const connectObdDevice = (device: PairedObdDevice) => {
    setSelectedObdDevice(device);
    setObdStatus('CONNECTING');
    showToast(`Conectando ELM327 (${device.name})...`);
    setTimeout(() => {
      setObdStatus('CONNECTED');
      showToast(`OBD2 Conectado · ECU em tempo real`);
    }, 1000);
  };

  const fetchOpenMeteo = async () => {
    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-23.5505&longitude=-46.6333&current=temperature_2m,weather_code&timezone=auto'
      );
      if (res.ok) {
        const json = await res.json();
        if (json?.current) {
          setWeatherTemp(Math.round(json.current.temperature_2m));
          setWeatherCond(mapWmoToPtBr(Number(json.current.weather_code)));
          showToast(`Open-Meteo: ${Math.round(json.current.temperature_2m)}°C`);
          return;
        }
      }
    } catch {
      // Fallback
    }
    showToast(`Clima atual: ${weatherTemp}°C · ${weatherCond}`);
  };

  const applyDrivePreset = (nextSpeed: number, nextRpm: number, nextLoad: number, nextMaf: number) => {
    setObdSpeedKmh(nextSpeed);
    setGpsSpeedKmh(Math.max(0, nextSpeed - 2));
    setRpm(nextRpm);
    setEngineLoad(nextLoad);
    setMafGramsSec(nextMaf);
    setMapKpa(Math.min(101, 28 + Math.round(nextLoad * 0.72)));
  };

  const adjustVolume = (delta: number) => {
    setVolume((prev) => Math.max(0, Math.min(15, prev + delta)));
    setShowVolumeHud(true);
    setTimeout(() => setShowVolumeHud(false), 1600);
  };

  const handleShortcutClick = (app: SimulatedApp) => {
    if (app.packageName.includes('spotify')) {
      setMusicPermissionGranted(true);
      setTrackIdx(0);
      setIsPlaying(true);
      showToast('Spotify ativo no player');
    } else if (app.packageName.includes('youtube.music')) {
      setMusicPermissionGranted(true);
      setTrackIdx(1);
      setIsPlaying(true);
      showToast('YouTube Music ativo no player');
    } else {
      showToast(`Abrindo ${app.label} (${app.packageName})`);
    }
  };

  const handleSelectDrawerApp = (app: SimulatedApp) => {
    if (replacingSlot !== null) {
      setShortcuts((prev) => prev.map((item, i) => (i === replacingSlot ? app : item)));
      showToast(`Atalho #${replacingSlot + 1} alterado para ${app.label}`);
      setReplacingSlot(null);
      setIsDrawerOpen(false);
      setDrawerSearch('');
    } else {
      setIsDrawerOpen(false);
      setDrawerSearch('');
      handleShortcutClick(app);
    }
  };

  const filteredApps = useMemo(() => {
    const q = drawerSearch.trim().toLowerCase();
    if (!q) return INSTALLED_APPS;
    return INSTALLED_APPS.filter(
      (a) => a.label.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q)
    );
  }, [drawerSearch]);

  const neon = NEON_STYLE[config.neonTheme];
  const isOverLimit = activeSpeedKmh > config.speedLimitKmh;
  const activeRpmBars = Math.max(1, Math.min(18, Math.round((rpm / 7000) * 18)));
  const dimmerAlpha = dimmerStep === 0 ? 0 : dimmerStep === 1 ? 0.3 : 0.56;
  const currentWazeRoute = WAZE_ROUTES[wazeRouteIdx];
  const wazeEtaMinutes = Math.max(
    1,
    Math.round((wazeDistanceLeftKm / Math.max(25, activeSpeedKmh || 35)) * 60)
  );

  const formatTripDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const renderShortcutIcon = (pkg: string) => {
    const lower = pkg.toLowerCase();
    if (lower.includes('waze') || lower.includes('maps')) return <Compass className="h-4 w-4 shrink-0" />;
    if (lower.includes('spotify') || lower.includes('music') || lower.includes('poweramp') || lower.includes('fmradio'))
      return <MusicNote className="h-4 w-4 shrink-0" />;
    if (lower.includes('gearhead')) return <Car className="h-4 w-4 shrink-0" />;
    if (lower.includes('youtube')) return <PlaySquare className="h-4 w-4 shrink-0" />;
    if (lower.includes('dialer')) return <Phone className="h-4 w-4 shrink-0" />;
    return <LayoutGrid className="h-4 w-4 shrink-0" />;
  };

  const openSettings = () => {
    setDraftCarName(config.carName);
    setDraftLimit(config.speedLimitKmh);
    setDraftTheme(config.neonTheme);
    setDraftDisplacement(config.engineDisplacementLiters);
    setDraftFuelType(config.fuelType);
    setDraftFuelPrice(config.fuelPriceBrl.toFixed(2));
    setDraftSplashEnabled(config.splashEnabled);
    setIsSettingsOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Moldura Automotiva Usinada (Chassi Alumínio Escuro) */}
      <div className="flex justify-center">
        <div
          className={`relative w-full rounded-[30px] p-[11px] transition-all duration-200 ${
            resolution === '1024x600' ? 'max-w-[1024px] aspect-[1024/600]' : 'max-w-[1280px] aspect-[16/9]'
          }`}
          style={{
            background: 'linear-gradient(145deg, #242A36 0%, #0E1117 45%, #1A202B 100%)',
            boxShadow: `0 28px 80px rgba(0, 0, 0, 0.85), 0 0 42px ${neon.ambientRgba}`
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-[#060911] ring-1 ring-white/10">
            {dimmerAlpha > 0 && (
              <div
                className="pointer-events-none absolute inset-0 z-40 bg-black transition-opacity duration-200"
                style={{ opacity: dimmerAlpha }}
              />
            )}

            {/* Cenário Fotográfico + Iluminação Volumétrica */}
            <div className="pointer-events-none absolute inset-0">
              <img
                src={
                  carVisual === 'gol1999'
                    ? '/assets/aistudio/WhatsApp_Image_2026-11-14_at_00.23.10_520da369.jpeg'
                    : '/src/assets/images/garagem_noturna_carro_1794656024079.jpg'
                }
                alt={config.carName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center"
              />
              {/* Luz ambiente volumétrica colorida atrás do carro */}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 50% 48%, ${neon.ambientRgba} 0%, transparent 56%)`
                }}
              />
              {/* Luz neon sutil no chão sob o Gol 1999 */}
              <div
                className="absolute left-1/2 top-[68%] h-10 w-[44%] -translate-x-1/2 rounded-full blur-2xl"
                style={{ backgroundColor: neon.glow, opacity: 0.28 }}
              />
              {/* Scrim cinematográfico top/bottom para contraste cristalino */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(5,8,16,0.82) 0%, rgba(5,8,16,0.08) 28%, rgba(5,8,16,0.05) 62%, rgba(4,7,14,0.92) 96%)'
                }}
              />
            </div>

            {/* Interface Principal */}
            <div className="relative z-10 flex h-full w-full flex-col justify-between px-5 py-3.5 text-white select-none">
              {/* TOPO: Conectividade + Gauges Coloridos + Relógio + Clima */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWifiOn((w) => !w);
                        showToast(!wifiOn ? 'Wi-Fi conectado' : 'Wi-Fi desconectado');
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      <Wifi className={`h-4 w-4 ${wifiOn ? 'text-cyan-300' : 'text-slate-600'}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBtOn((b) => !b);
                        showToast(!btOn ? 'Bluetooth ativo' : 'Bluetooth desligado');
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      <Bluetooth className={`h-4 w-4 ${btOn ? 'text-sky-400' : 'text-slate-600'}`} />
                    </button>

                    {/* Status OBD2 Premium */}
                    <button
                      type="button"
                      onClick={() => setIsObdModalOpen(true)}
                      className="flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold backdrop-blur-md transition-all hover:brightness-125"
                      style={{
                        background: 'linear-gradient(180deg, rgba(22,34,58,0.85) 0%, rgba(11,18,34,0.92) 100%)',
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 14px ${
                          obdStatus === 'CONNECTED' ? 'rgba(52,211,153,0.22)' : 'rgba(0,0,0,0.4)'
                        }`,
                        border:
                          obdStatus === 'CONNECTED'
                            ? '1px solid rgba(52,211,153,0.45)'
                            : '1px solid rgba(148,163,184,0.22)'
                      }}
                    >
                      <Wrench
                        className={`h-3.5 w-3.5 ${
                          obdStatus === 'CONNECTED'
                            ? 'text-emerald-400'
                            : obdStatus === 'CONNECTING'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span>
                        OBD2:{' '}
                        {obdStatus === 'CONNECTED'
                          ? 'Conectado'
                          : obdStatus === 'CONNECTING'
                          ? 'Conectando'
                          : 'Desconectado'}
                      </span>
                      {dtcList.length > 0 && (
                        <span className="font-mono font-bold text-rose-400">({dtcList.length})</span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <PremiumInstrumentGauge
                      label="MOTOR"
                      value={`${motorTemp}`}
                      unit="°C"
                      fraction={motorTemp / 120}
                      startColor="#10B981"
                      endColor={motorTemp >= 104 ? '#FF2E4C' : '#38BDF8'}
                      onClick={() => setIsObdModalOpen(true)}
                    />
                    <PremiumInstrumentGauge
                      label="BATERIA"
                      value={batteryVolts.toFixed(1).replace('.', ',')}
                      unit="V"
                      fraction={(batteryVolts - 10) / 5}
                      startColor="#22D3EE"
                      endColor={batteryVolts <= 11.8 ? '#F59E0B' : '#818CF8'}
                      onClick={() => setIsObdModalOpen(true)}
                    />

                    {/* Card Compacto VIAGEM Premium */}
                    <button
                      type="button"
                      onClick={() => setIsTripModalOpen(true)}
                      className="cockpit-card-glass cockpit-glow-cyan flex flex-col items-center justify-center rounded-2xl px-3.5 py-2 transition-all hover:brightness-125 active:scale-95"
                    >
                      <span className="cockpit-label text-sky-300">VIAGEM</span>
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="font-display text-base font-extrabold tabular-nums text-white">
                          {instantKmL.toFixed(1).replace('.', ',')}
                        </span>
                        <span className="text-[10px] font-bold text-cyan-300">km/l</span>
                      </div>
                      <span className="mt-0.5 font-mono text-[10px] font-semibold tabular-nums text-emerald-300">
                        {tripDistanceKm.toFixed(1)} km · R$ {tripCostBrl.toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Centro Superior: Relógio Cristalino + Data */}
                <button
                  type="button"
                  onClick={() => {
                    setUseLiveClock((v) => !v);
                    showToast(!useLiveClock ? 'Relógio em tempo real' : 'Relógio modo demonstração');
                  }}
                  className="flex flex-col items-center rounded-2xl px-5 py-1 hover:bg-white/5 transition-colors"
                >
                  <span
                    className="font-display text-[42px] font-extrabold leading-none tracking-tight tabular-nums text-white"
                    style={{ textShadow: `0 0 24px ${neon.ambientRgba}` }}
                  >
                    {useLiveClock ? liveTime : '7:44'}
                  </span>
                  <span className="mt-1 text-xs font-medium tracking-wide text-slate-200/90">
                    {useLiveClock
                      ? new Date().toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })
                      : 'Terça-feira, 10 de novembro'}
                  </span>
                </button>

                {/* Direita Superior: Clima + Admissão e Carga */}
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={fetchOpenMeteo}
                    className="flex h-8 items-center gap-2 rounded-xl bg-white/5 px-3 ring-1 ring-white/10 hover:bg-white/10 transition-colors"
                  >
                    <Sun className="h-4 w-4 text-amber-300" style={{ filter: 'drop-shadow(0 0 6px #FBBF24)' }} />
                    <span className="font-display text-lg font-bold tabular-nums text-white">
                      {weatherTemp}°
                    </span>
                    <span className="text-[11px] font-medium text-slate-300">{weatherCond}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <PremiumInstrumentGauge
                      label="ADMISSÃO"
                      value={`${intakeTemp}`}
                      unit="°C"
                      fraction={intakeTemp / 70}
                      startColor="#2DD4BF"
                      endColor="#0EA5E9"
                      onClick={() => setIsObdModalOpen(true)}
                    />
                    <PremiumInstrumentGauge
                      label="CARGA"
                      value={`${engineLoad}`}
                      unit="%"
                      fraction={engineLoad / 100}
                      startColor="#38BDF8"
                      endColor={engineLoad >= 80 ? '#F43F5E' : '#F59E0B'}
                      onClick={() => setIsObdModalOpen(true)}
                    />
                  </div>
                </div>
              </div>

              {/* MEIO: Velocímetro Unificado (KM/H + Sparkline + RPM Arco + Shift-Light) | Gol | Waze GPS */}
              <div className="flex flex-1 items-center justify-between py-1">
                {/* Asa Esquerda: Tudo Unificado dentro do Layout da Velocidade */}
                <div
                  className="cockpit-card-metallic relative flex w-[258px] flex-col justify-between rounded-2xl px-3.5 py-2.5 text-left backdrop-blur-xl transition-all"
                  style={{
                    borderLeft: `3px solid ${isOverLimit ? '#FF2E4C' : neon.glow}`,
                    boxShadow: isOverLimit
                      ? '0 14px 36px rgba(255,46,76,0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
                      : `0 14px 36px rgba(0,0,0,0.58), 0 0 24px ${neon.ambientRgba}, inset 0 1px 0 rgba(255,255,255,0.16)`
                  }}
                >
                  {/* Cabeçalho do Card de Velocidade */}
                  <div className="flex items-center justify-between">
                    <span className="cockpit-label">VELOCIDADE</span>
                    <span
                      className="font-mono text-[10px] font-bold"
                      style={{ color: isOverLimit ? '#FF2E4C' : neon.glow }}
                    >
                      {isOverLimit
                        ? 'LIMITE!'
                        : `${estimatedGear} · ${obdStatus === 'CONNECTED' ? 'OBD2' : 'GPS'}`}
                    </span>
                  </div>

                  {/* Corpo Principal: Velocímetro + Sparkline à esquerda | Conta-giros Arco RPM integrado à direita */}
                  <div className="mt-1 flex items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsDriveModalOpen(true)}
                      className="flex min-w-0 flex-1 flex-col rounded-xl text-left transition-opacity hover:opacity-90 active:scale-[0.98]"
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="cockpit-readout font-display text-[44px] font-black leading-none"
                          style={{
                            color: isOverLimit ? '#FF2E4C' : '#FFFFFF',
                            textShadow: isOverLimit
                              ? '0 0 20px rgba(255,46,76,0.65)'
                              : `0 0 22px ${neon.ambientRgba}`
                          }}
                        >
                          {activeSpeedKmh}
                        </span>
                        <span
                          className="text-[11px] font-extrabold tracking-wider"
                          style={{ color: isOverLimit ? '#FF2E4C' : neon.glow }}
                        >
                          KM/H
                        </span>
                      </div>

                      <div className="mt-1.5 w-full">
                        <TelemetrySparkline
                          values={speedHistory}
                          min={0}
                          max={140}
                          strokeStart={neon.primary}
                          strokeEnd={isOverLimit ? '#FF2E4C' : neon.secondary}
                        />
                      </div>
                    </button>

                    {/* Conta-giros Arco Colorido Integrado dentro da Velocidade */}
                    <button
                      type="button"
                      onClick={() => setIsObdModalOpen(true)}
                      title="Abrir Drive Lab / OBD2"
                      className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
                    >
                      <svg width={76} height={76} viewBox="0 0 76 76" className="overflow-visible">
                        <defs>
                          <linearGradient id="rpmArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38BDF8" />
                            <stop offset="50%" stopColor="#10B981" />
                            <stop offset="80%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#FF2E4C" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx={38}
                          cy={38}
                          r={31}
                          fill="none"
                          stroke="rgba(30, 44, 72, 0.85)"
                          strokeWidth={6}
                          strokeDasharray={`${(270 / 360) * (2 * Math.PI * 31)} ${2 * Math.PI * 31}`}
                          strokeLinecap="round"
                          transform="rotate(135 38 38)"
                        />
                        <circle
                          cx={38}
                          cy={38}
                          r={31}
                          fill="none"
                          stroke="url(#rpmArcGrad)"
                          strokeWidth={6}
                          strokeDasharray={`${
                            (270 / 360) * (2 * Math.PI * 31) * Math.min(1, rpm / 7000)
                          } ${2 * Math.PI * 31}`}
                          strokeLinecap="round"
                          transform="rotate(135 38 38)"
                          style={{
                            filter: `drop-shadow(0 0 7px ${rpm >= 5600 ? '#FF2E4C' : '#38BDF8'})`
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className="cockpit-readout font-display text-[15px] font-extrabold">
                          {rpm}
                        </span>
                        <span className="mt-0.5 text-[8px] font-bold tracking-wider text-cyan-300">
                          RPM
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Barra Spectrum Shift-Light Colorida */}
                  <div className="mt-1.5 flex items-center gap-[3px]">
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const active = idx < activeRpmBars;
                      const barColor = !active
                        ? 'rgba(30, 41, 59, 0.55)'
                        : idx >= 13
                        ? '#FF2E4C'
                        : idx >= 10
                        ? '#F59E0B'
                        : idx >= 6
                        ? '#10B981'
                        : '#38BDF8';
                      return (
                        <span
                          key={idx}
                          className="h-2 flex-1 -skew-x-12 rounded-[1.5px] transition-all"
                          style={{
                            backgroundColor: barColor,
                            boxShadow: active ? `0 0 8px ${barColor}AA` : 'none'
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Rodapé de Telemetria Integrada */}
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] font-semibold tabular-nums text-slate-300">
                    <span className="text-cyan-200">
                      {motorTemp}°C · {batteryVolts.toFixed(1)}V
                    </span>
                    <span className="text-slate-400">Lim. {config.speedLimitKmh} km/h</span>
                  </div>
                </div>

                {/* Toast central */}
                <div className="flex flex-col items-center justify-end self-end pb-1">
                  {toastMsg && (
                    <div
                      className="cockpit-card-glass rounded-xl px-4 py-1.5 text-xs font-semibold text-white"
                      style={{
                        border: `1px solid ${neon.glow}66`,
                        boxShadow: `0 0 20px ${neon.ambientRgba}`
                      }}
                    >
                      {toastMsg}
                    </div>
                  )}
                  {showVolumeHud && (
                    <div className="cockpit-card-glass cockpit-glow-cyan mt-1 flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-xl">
                      <Volume2 className="h-4 w-4 text-cyan-400" />
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-cyan-300"
                          style={{ width: `${(volume / 15) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums">{volume}/15</span>
                    </div>
                  )}
                </div>

                {/* Asa Direita: GPS do Waze (Mapa Noturno + Próxima Manobra + ETA) */}
                <button
                  type="button"
                  onClick={() => setIsWazeModalOpen(true)}
                  className="cockpit-card-metallic cockpit-glow-cyan flex w-[238px] flex-col justify-between rounded-2xl p-3 text-left backdrop-blur-xl transition-all hover:brightness-110 active:scale-[0.99]"
                  style={{
                    borderRight: '3px solid #38BDF8'
                  }}
                >
                  {/* Cabeçalho Waze */}
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          wazeActive ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'
                        }`}
                        style={{ boxShadow: wazeActive ? '0 0 8px #38BDF8' : 'none' }}
                      />
                      <span className="cockpit-label text-sky-300">WAZE GPS</span>
                    </div>
                    {wazeRadarAlert && currentWazeRoute.radarLimit ? (
                      <span className="flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300 ring-1 ring-amber-400/40">
                        <ShieldAlert className="h-2.5 w-2.5" />
                        RADAR {currentWazeRoute.radarLimit}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-bold text-emerald-300">
                        {wazeActive ? 'ROTA ATIVA' : 'PAUSADO'}
                      </span>
                    )}
                  </div>

                  {/* Mini-Mapa Vetorial Noturno do Waze */}
                  <div className="relative mt-1.5 h-[78px] w-full overflow-hidden rounded-xl border border-sky-400/25 bg-[#060C18]">
                    <svg
                      viewBox="0 0 220 78"
                      className="h-full w-full"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="wazeRouteGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="55%" stopColor="#38BDF8" />
                          <stop offset="100%" stopColor="#22D3EE" />
                        </linearGradient>
                      </defs>
                      {/* Malha viária noturna */}
                      <path
                        d="M0,18 L220,18 M0,44 L220,44 M0,64 L220,64 M38,0 L38,78 M104,0 L104,78 M168,0 L168,78"
                        stroke="rgba(30, 52, 92, 0.55)"
                        strokeWidth="3"
                        fill="none"
                      />
                      <path
                        d="M12,78 L86,0 M142,78 L210,12"
                        stroke="rgba(30, 52, 92, 0.35)"
                        strokeWidth="2"
                        fill="none"
                      />
                      {/* Rota iluminada Waze */}
                      {wazeActive && (
                        <>
                          <path
                            d="M 46,74 L 46,44 Q 46,32 58,32 L 154,32 Q 168,32 168,18 L 168,10"
                            fill="none"
                            stroke="rgba(56,189,248,0.28)"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M 46,74 L 46,44 Q 46,32 58,32 L 154,32 Q 168,32 168,18 L 168,10"
                            fill="none"
                            stroke="url(#wazeRouteGrad)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Pino de destino */}
                          <circle cx={168} cy={10} r={4.5} fill="#22D3EE" />
                          <circle cx={168} cy={10} r={8} fill="rgba(34,211,238,0.28)" />
                        </>
                      )}
                      {/* Seta do veículo */}
                      <polygon
                        points="46,52 39,66 46,62 53,66"
                        fill="#FFFFFF"
                        stroke="#38BDF8"
                        strokeWidth="1.5"
                      />
                    </svg>

                    {/* Manobra Turn-by-Turn sobreposta */}
                    <div className="absolute left-2 top-1.5 right-2 flex items-center gap-2 rounded-lg bg-[#091224]/90 px-2 py-1 ring-1 ring-sky-400/30 backdrop-blur-sm">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/20 text-sky-300">
                        <CornerUpRight className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 leading-tight">
                        <div className="font-display text-xs font-extrabold tabular-nums text-white">
                          {wazeActive ? currentWazeRoute.turnDistance : 'GPS Livre'}
                        </div>
                        <div className="truncate text-[10px] font-medium text-sky-200/90">
                          {wazeActive ? currentWazeRoute.street : 'Toque para definir rota'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Destino / ETA / Distância */}
                  <div className="mt-1.5 flex w-full items-center justify-between text-[11px] tabular-nums">
                    <span className="flex items-center gap-1 font-bold text-white truncate">
                      <Navigation className="h-3 w-3 shrink-0 text-sky-400" />
                      <span className="truncate">{currentWazeRoute.destination}</span>
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-cyan-300 shrink-0">
                      {wazeActive
                        ? `${wazeEtaMinutes} min · ${wazeDistanceLeftKm.toFixed(1).replace('.', ',')} km`
                        : 'Sem destino'}
                    </span>
                  </div>
                </button>
              </div>

              {/* ATALHOS EM PARALELOGRAMO COM BRILHO INDIVIDUAL DE MARCA */}
              <div className="flex h-14 items-center gap-2.5 px-1">
                {shortcuts.map((app, index) => (
                  <button
                    key={`${app.packageName}-${index}`}
                    type="button"
                    onClick={() => handleShortcutClick(app)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setReplacingSlot(index);
                      setIsDrawerOpen(true);
                    }}
                    className="group relative flex h-full flex-1 -skew-x-12 items-center justify-center overflow-hidden rounded-lg px-3 text-white transition-all hover:brightness-125 active:scale-[0.98]"
                    style={{
                      background:
                        'linear-gradient(160deg, rgba(24,38,68,0.88) 0%, rgba(12,20,38,0.95) 100%)',
                      border: `1px solid ${app.accent}55`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 20px rgba(0,0,0,0.45)`
                    }}
                  >
                    {/* Barra luminosa inferior colorida por app */}
                    <span
                      className="absolute bottom-0 left-2 right-2 h-[2px] opacity-80 transition-opacity group-hover:opacity-100"
                      style={{
                        backgroundColor: app.accent,
                        boxShadow: `0 0 10px ${app.accent}`
                      }}
                    />
                    <span className="flex skew-x-12 items-center gap-2 text-xs font-bold tracking-wide truncate">
                      <span style={{ color: app.accent, filter: `drop-shadow(0 0 6px ${app.accent}88)` }}>
                        {renderShortcutIcon(app.packageName)}
                      </span>
                      <span className="truncate">{app.label}</span>
                    </span>
                  </button>
                ))}

                {/* Botão Gaveta de Apps com Gradiente Metálico Luminoso */}
                <button
                  type="button"
                  onClick={() => {
                    setReplacingSlot(null);
                    setIsDrawerOpen(true);
                  }}
                  aria-label="Abrir gaveta de aplicativos"
                  className="flex h-full w-24 shrink-0 -skew-x-12 items-center justify-center rounded-lg text-white transition-transform hover:brightness-110 active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg, ${neon.glow} 0%, ${neon.primary} 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 24px ${neon.glow}77`
                  }}
                >
                  <LayoutGrid className="h-6 w-6 skew-x-12 drop-shadow" />
                </button>
              </div>

              {/* BARRA INFERIOR PREMIUM */}
              <div className="mt-2 flex h-14 items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustVolume(-1)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-200 hover:bg-white/10"
                  >
                    <Volume1 className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!musicPermissionGranted) setMusicPermissionGranted(true);
                      setTrackIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
                      setTrackProgress(0);
                      setIsPlaying(true);
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-200 hover:bg-white/10"
                  >
                    <SkipPrevious className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!musicPermissionGranted) {
                      setMusicPermissionGranted(true);
                      setIsPlaying(true);
                      showToast('Controle de música ativado');
                    } else {
                      setIsPlaying((p) => !p);
                    }
                  }}
                  className="mx-4 flex flex-1 flex-col items-center justify-center rounded-xl px-4 py-1.5 hover:bg-white/5"
                >
                  {!musicPermissionGranted ? (
                    <>
                      <span className="text-sm font-semibold text-white">Controle de música desligado</span>
                      <span className="text-xs text-slate-400">Toque aqui para permitir</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-white truncate max-w-[340px]">
                        {TRACKS[trackIdx].title}
                      </span>
                      <span className="text-xs font-medium text-cyan-300 tabular-nums">
                        {TRACKS[trackIdx].artist} · {Math.floor(trackProgress / 60)}:
                        {String(trackProgress % 60).padStart(2, '0')} /{' '}
                        {Math.floor(TRACKS[trackIdx].durationSec / 60)}:
                        {String(TRACKS[trackIdx].durationSec % 60).padStart(2, '0')}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!musicPermissionGranted) setMusicPermissionGranted(true);
                      setIsPlaying((p) => !p);
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${neon.glow} 0%, ${neon.primary} 100%)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 22px ${neon.glow}80`
                    }}
                  >
                    {isPlaying && musicPermissionGranted ? <Pause className="h-6 w-6" /> : <PlayArrow className="h-6 w-6" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!musicPermissionGranted) setMusicPermissionGranted(true);
                      setTrackIdx((i) => (i + 1) % TRACKS.length);
                      setTrackProgress(0);
                      setIsPlaying(true);
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-200 hover:bg-white/10"
                  >
                    <SkipNext className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustVolume(1)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-200 hover:bg-white/10"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsObdModalOpen(true)}
                    title="Drive Lab / Saúde"
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-cyan-300 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    <Speed className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDimmerStep((s) => ((s + 1) % 3) as 0 | 1 | 2)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-amber-300 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    <Sun className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={openSettings}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* MODAL: Drive Lab / Saúde */}
            {isObdModalOpen && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
                <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-white/15 bg-[#0B1222]/95 p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        Drive Lab / Saúde — OBD2 ELM327 ({selectedObdDevice.name})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Status:{' '}
                        {obdStatus === 'CONNECTED'
                          ? 'Conectado (ATZ · ATE0 · ATL0 · ATSP0)'
                          : obdStatus === 'CONNECTING'
                          ? 'Conectando via Bluetooth SPP...'
                          : 'Desconectado (usando GPS)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {obdStatus === 'CONNECTED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setObdStatus('DISCONNECTED');
                            showToast('OBD2 desconectado · Voltando ao GPS');
                          }}
                          className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white"
                        >
                          Desconectar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsObdModalOpen(false)}
                        className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>

                  <div className="grid flex-1 min-h-0 grid-cols-12 gap-4">
                    <div className="col-span-6 flex flex-col gap-3 min-h-0">
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="rounded-xl bg-[#131C31] p-2.5 ring-1 ring-white/10">
                          <div className="text-slate-400">RPM (010C)</div>
                          <div className="mt-0.5 font-mono text-base font-bold text-cyan-300">{rpm}</div>
                        </div>
                        <div className="rounded-xl bg-[#131C31] p-2.5 ring-1 ring-white/10">
                          <div className="text-slate-400">Vel (010D)</div>
                          <div className="mt-0.5 font-mono text-base font-bold">{obdSpeedKmh} km/h</div>
                        </div>
                        <div className="rounded-xl bg-[#131C31] p-2.5 ring-1 ring-white/10">
                          <div className="text-slate-400">Motor (0105)</div>
                          <div className="mt-0.5 font-mono text-base font-bold text-emerald-300">{motorTemp}°C</div>
                        </div>
                        <div className="rounded-xl bg-[#131C31] p-2.5 ring-1 ring-white/10">
                          <div className="text-slate-400">Bat (ATRV)</div>
                          <div className="mt-0.5 font-mono text-base font-bold text-indigo-300">{batteryVolts.toFixed(1)}V</div>
                        </div>
                        <div className="rounded-xl bg-[#131C31] p-2.5 ring-1 ring-white/10">
                          <div className="text-slate-400">Carga (0104)</div>
                          <div className="mt-0.5 font-mono text-base font-bold text-amber-300">{engineLoad}%</div>
                        </div>
                        <div className="rounded-xl bg-[#131C31] p-2.5 ring-1 ring-white/10">
                          <div className="text-slate-400">MAF (0110)</div>
                          <div className="mt-0.5 font-mono text-base font-bold">{mafGramsSec.toFixed(1)} g/s</div>
                        </div>
                        <div className="rounded-xl bg-[#131C31] p-2.5 ring-1 ring-white/10">
                          <div className="text-slate-400">MAP (010B)</div>
                          <div className="mt-0.5 font-mono text-base font-bold">{mapKpa} kPa</div>
                        </div>
                        <div className="rounded-xl bg-[#131C31] p-2.5 ring-1 ring-white/10">
                          <div className="text-slate-400">IAT (010F)</div>
                          <div className="mt-0.5 font-mono text-base font-bold">{intakeTemp}°C</div>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-sky-300">
                        Dispositivos Bluetooth Pareados (SPP UUID 00001101)
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                        {PAIRED_BT_DEVICES.map((dev) => {
                          const active = selectedObdDevice.address === dev.address && obdStatus === 'CONNECTED';
                          return (
                            <button
                              key={dev.address}
                              type="button"
                              onClick={() => connectObdDevice(dev)}
                              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs ${
                                active
                                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-100'
                                  : 'border-slate-700 bg-[#131C31] text-white hover:border-sky-400'
                              }`}
                            >
                              <span className="font-semibold">{dev.name}</span>
                              <span className="font-mono text-[11px] text-slate-400">{dev.address}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="col-span-6 flex flex-col gap-3 min-h-0">
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDtcList(SAMPLE_DTCS);
                            showToast('Modo 03: 3 códigos DTC encontrados');
                          }}
                          className="h-12 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-xs font-bold text-slate-950"
                        >
                          Ler Falhas (Modo 03)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDtcList([]);
                            showToast('Modo 04: Memória de falhas limpa');
                          }}
                          className="h-12 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          Limpar Códigos (Modo 04)
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-[#090D16] p-3">
                        {dtcList.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <span className="text-sm font-semibold text-emerald-400">
                              Injeção Eletrônica Saudável
                            </span>
                            <span className="mt-1 text-xs text-slate-400">
                              Nenhum código de falha DTC armazenado. Clique em Ler Falhas para testar o Modo 03.
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dtcList.map((dtc) => (
                              <div key={dtc.code} className="rounded-xl border border-red-500/40 bg-red-500/10 p-3">
                                <div className="font-mono text-sm font-bold text-red-400">{dtc.code}</div>
                                <div className="mt-0.5 text-xs text-slate-200">{dtc.description}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Resumo da Viagem */}
            {isTripModalOpen && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
                <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/15 bg-[#0B1222]/95 p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        Computador de Bordo — Resumo da Viagem
                      </h3>
                      <p className="text-xs text-cyan-300">
                        Fonte: {obdStatus === 'CONNECTED' ? 'OBD2 (MAF/MAP + RPM)' : 'GPS'} ·{' '}
                        {config.engineDisplacementLiters.toFixed(1)}L ·{' '}
                        {config.fuelType === 'ETHANOL' ? 'Etanol' : 'Gasolina'} (R${' '}
                        {config.fuelPriceBrl.toFixed(2).replace('.', ',')}/L)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTripModalOpen(false)}
                      className="rounded-lg p-1 text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="rounded-xl bg-[#131C31] p-3 ring-1 ring-white/10">
                      <div className="text-slate-400">Distância</div>
                      <div className="mt-1 font-mono text-lg font-bold">{tripDistanceKm.toFixed(2)} km</div>
                    </div>
                    <div className="rounded-xl bg-[#131C31] p-3 ring-1 ring-white/10">
                      <div className="text-slate-400">Tempo Ativo</div>
                      <div className="mt-1 font-mono text-lg font-bold">{formatTripDuration(tripSeconds)}</div>
                    </div>
                    <div className="rounded-xl bg-[#131C31] p-3 ring-1 ring-white/10">
                      <div className="text-slate-400">Vel. Média</div>
                      <div className="mt-1 font-mono text-lg font-bold">{tripAvgSpeed.toFixed(1)} km/h</div>
                    </div>
                    <div className="rounded-xl bg-[#131C31] p-3 ring-1 ring-white/10">
                      <div className="text-slate-400">Consumo Médio</div>
                      <div className="mt-1 font-mono text-lg font-bold">{tripAvgKmL.toFixed(1)} km/l</div>
                    </div>
                    <div className="rounded-xl bg-[#131C31] p-3 ring-1 ring-white/10">
                      <div className="text-slate-400">Litros Gastos</div>
                      <div className="mt-1 font-mono text-lg font-bold">{tripFuelLiters.toFixed(2)} L</div>
                    </div>
                    <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/40 p-3">
                      <div className="text-emerald-200">Custo Estimado</div>
                      <div className="mt-1 font-mono text-lg font-bold text-emerald-300">
                        R$ {tripCostBrl.toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTripDistanceKm(0);
                        setTripSeconds(0);
                        setTripFuelLiters(0);
                        showToast('Viagem zerada');
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Zerar Viagem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTripModalOpen(false)}
                      className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: AppDrawerDialog */}
            {isDrawerOpen && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
                <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-white/15 bg-[#0B1222]/95 p-4 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {replacingSlot !== null
                          ? `Substituir Atalho #${replacingSlot + 1}`
                          : `Aplicativos Instalados (${filteredApps.length})`}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {replacingSlot !== null
                          ? 'Escolha o aplicativo para fixar na barra principal'
                          : 'Toque para abrir ou escolha um slot para personalizar'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#090D16] px-3 py-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={drawerSearch}
                          onChange={(e) => setDrawerSearch(e.target.value)}
                          placeholder="Buscar app..."
                          className="w-36 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setReplacingSlot(null);
                          setDrawerSearch('');
                        }}
                        className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 text-xs font-semibold text-white"
                      >
                        <X className="h-4 w-4" />
                        <span>Fechar</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                      Trocar atalho:
                    </span>
                    {shortcuts.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplacingSlot(replacingSlot === idx ? null : idx)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
                          replacingSlot === idx
                            ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                            : 'border-slate-700 bg-[#090D16] text-slate-300 hover:text-white'
                        }`}
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        <span>
                          #{idx + 1} {s.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="grid flex-1 grid-cols-4 gap-2.5 overflow-y-auto pr-1">
                    {filteredApps.map((app) => (
                      <button
                        key={app.packageName}
                        type="button"
                        onClick={() => handleSelectDrawerApp(app)}
                        className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border bg-[#121B30] p-2 hover:brightness-125 transition-all"
                        style={{
                          borderColor: `${app.accent}44`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12)`
                        }}
                      >
                        <span style={{ color: app.accent, filter: `drop-shadow(0 0 8px ${app.accent}88)` }}>
                          {renderShortcutIcon(app.packageName)}
                        </span>
                        <span className="w-full truncate text-center text-[11px] font-bold text-white">
                          {app.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Configurações Completas */}
            {isSettingsOpen && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
                <div className="w-full max-w-lg space-y-3.5 rounded-2xl border border-white/15 bg-[#0B1222]/95 p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-white">
                      Ajustes do Cockpit &amp; Computador de Bordo
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCarVisual((v) => (v === 'gol1999' ? 'garage' : 'gol1999'))}
                      className="rounded-lg border border-slate-700 bg-[#131C31] px-2.5 py-1 text-[11px] font-semibold text-cyan-300"
                    >
                      Foto: {carVisual === 'gol1999' ? 'Gol 1999' : 'Garagem'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400">Nome do Carro</label>
                      <input
                        type="text"
                        value={draftCarName}
                        onChange={(e) => setDraftCarName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#090D16] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Cilindrada (L)</label>
                      <select
                        value={draftDisplacement}
                        onChange={(e) => setDraftDisplacement(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#090D16] px-2.5 py-2 text-xs text-white"
                      >
                        {[1.0, 1.4, 1.6, 1.8, 2.0, 2.4].map((d) => (
                          <option key={d} value={d}>
                            {d.toFixed(1)}L
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Preço Litro (R$)</label>
                      <input
                        type="text"
                        value={draftFuelPrice}
                        onChange={(e) => setDraftFuelPrice(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-[#090D16] px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Limite de Velocidade</span>
                        <span className="font-mono font-bold text-white">{draftLimit} km/h</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={180}
                        value={draftLimit}
                        onChange={(e) => setDraftLimit(Number(e.target.value))}
                        className="mt-1.5 w-full accent-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Combustível</label>
                      <div className="mt-1 grid grid-cols-2 gap-1.5">
                        {(['GASOLINE', 'ETHANOL'] as FuelTypeId[]).map((ft) => (
                          <button
                            key={ft}
                            type="button"
                            onClick={() => setDraftFuelType(ft)}
                            className={`h-8 rounded-lg text-xs font-semibold ${
                              draftFuelType === ft
                                ? 'bg-sky-500 text-slate-950'
                                : 'border border-slate-700 bg-[#131C31] text-white'
                            }`}
                          >
                            {ft === 'GASOLINE' ? 'Gasolina' : 'Etanol'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'cyan', label: 'Azul Neon' },
                        { id: 'red', label: 'Vermelho' },
                        { id: 'amber', label: 'Âmbar' }
                      ] as { id: NeonThemeId; label: string }[]
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setDraftTheme(preset.id)}
                        className={`h-9 rounded-xl text-xs font-bold ${
                          draftTheme === preset.id
                            ? 'text-slate-950'
                            : 'border border-slate-700 bg-[#131C31] text-white'
                        }`}
                        style={
                          draftTheme === preset.id ? { backgroundColor: NEON_STYLE[preset.id].glow } : undefined
                        }
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#090D16] px-3.5 py-2">
                    <span className="text-xs font-medium text-slate-200">
                      Animação cinematográfica ao ligar
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraftSplashEnabled((v) => !v)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold ${
                        draftSplashEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {draftSplashEnabled ? 'Ativada' : 'Desativada'}
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const parsedPrice = parseFloat(draftFuelPrice.replace(',', '.')) || config.fuelPriceBrl;
                        onUpdateConfig({
                          carName: draftCarName.trim() || 'GOL 1999',
                          speedLimitKmh: draftLimit,
                          neonTheme: draftTheme,
                          engineDisplacementLiters: draftDisplacement,
                          fuelType: draftFuelType,
                          fuelPriceBrl: parsedPrice,
                          splashEnabled: draftSplashEnabled
                        });
                        setIsSettingsOpen(false);
                      }}
                      className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Simular Velocidade */}
            {isDriveModalOpen && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md">
                <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/15 bg-[#0B1222]/95 p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-white">Simular Velocidade</h3>
                    <button type="button" onClick={() => setIsDriveModalOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button type="button" onClick={() => { applyDrivePreset(0, 840, 18, 3.2); setIsDriveModalOpen(false); }} className="h-12 rounded-xl border border-slate-700 bg-[#131C31] text-xs font-bold text-white">
                      Marcha Lenta (0 km/h)
                    </button>
                    <button type="button" onClick={() => { applyDrivePreset(61, 2700, 40, 14.8); setIsDriveModalOpen(false); }} className="h-12 rounded-xl border border-slate-700 bg-[#131C31] text-xs font-bold text-white">
                      Urbano (61 km/h)
                    </button>
                    <button type="button" onClick={() => { applyDrivePreset(98, 3400, 56, 21.4); setIsDriveModalOpen(false); }} className="h-12 rounded-xl border border-slate-700 bg-[#131C31] text-xs font-bold text-white">
                      Rodovia (98 km/h)
                    </button>
                    <button type="button" onClick={() => { applyDrivePreset(config.speedLimitKmh + 16, 5600, 82, 39.0); setIsDriveModalOpen(false); }} className="h-12 rounded-xl border border-red-500/50 bg-red-500/15 text-xs font-bold text-red-200">
                      Testar Alerta Limite
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Comando de Voz */}
            {isVoiceModalOpen && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md">
                <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/15 bg-[#0B1222]/95 p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-sky-400" />
                      <h3 className="font-display text-lg font-bold text-white">Comando de Voz</h3>
                    </div>
                    <button type="button" onClick={() => setIsVoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: '"Abrir Waze"', action: () => showToast('Iniciando rota no Waze') },
                      {
                        label: '"Tocar Spotify"',
                        action: () => {
                          setMusicPermissionGranted(true);
                          setTrackIdx(0);
                          setIsPlaying(true);
                          showToast('Tocando Spotify');
                        }
                      },
                      { label: '"Verificar saúde OBD2"', action: () => setIsObdModalOpen(true) }
                    ].map((cmd) => (
                      <button
                        key={cmd.label}
                        type="button"
                        onClick={() => {
                          setIsVoiceModalOpen(false);
                          cmd.action();
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-[#131C31] px-4 py-3 text-left text-sm font-semibold text-white hover:border-sky-400"
                      >
                        {cmd.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Waze GPS Navegação Rápida */}
            {isWazeModalOpen && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md">
                <div className="cockpit-card-metallic cockpit-glow-cyan w-full max-w-md space-y-4 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-sky-400" />
                      <h3 className="font-display text-lg font-bold text-white">
                        Waze GPS — Navegação Rápida
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWazeModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {WAZE_ROUTES.map((route, idx) => {
                      const active = wazeActive && idx === wazeRouteIdx;
                      return (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => {
                            setWazeRouteIdx(idx);
                            setWazeDistanceLeftKm(route.remainingKm);
                            setWazeActive(true);
                            setIsWazeModalOpen(false);
                            showToast(`Waze: Rota para ${route.destination}`);
                          }}
                          className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                            active
                              ? 'border-sky-400 bg-sky-500/20 text-white'
                              : 'border-slate-700 bg-[#131C31] text-slate-200 hover:border-sky-400/60'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <MapPin className="h-3.5 w-3.5 text-sky-400" />
                            <span>{route.destination}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400 truncate w-full">
                            {route.street}
                          </div>
                          <div className="mt-1 font-mono text-[10px] font-semibold text-cyan-300">
                            {route.etaMin} min · {route.remainingKm.toFixed(1).replace('.', ',')} km
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setWazeRadarAlert((v) => !v)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                        wazeRadarAlert
                          ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                          : 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {wazeRadarAlert ? 'Alerta Radar: Ativo' : 'Alerta Radar: Off'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setWazeActive((v) => !v);
                          showToast(!wazeActive ? 'Rota Waze retomada' : 'Rota Waze pausada');
                        }}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white"
                      >
                        {wazeActive ? 'Pausar Rota' : 'Retomar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsWazeModalOpen(false)}
                        className="cockpit-neon-gradient rounded-xl px-4 py-2 text-xs font-bold text-white"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SPLASH INTRO OVERLAY (2.5 segundos cinematográfico) */}
            {showSplash && (
              <div
                className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#04060B] transition-opacity duration-300 ${
                  splashStep === 'fading' ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowSplash(false)}
                  className="absolute right-5 top-5 z-20 rounded-xl border border-white/15 bg-[#0D1424]/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Pular
                </button>

                <div
                  className="relative flex h-[62%] w-[68%] items-center justify-center transition-all duration-900 ease-out"
                  style={{
                    transform: splashStep === 'sliding' ? 'translateX(-110px)' : 'translateX(0px)',
                    opacity: splashStep === 'sliding' ? 0.35 : 1
                  }}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-2xl">
                    <img
                      src={
                        carVisual === 'gol1999'
                          ? '/assets/aistudio/WhatsApp_Image_2026-11-14_at_00.23.10_520da369.jpeg'
                          : '/src/assets/images/garagem_noturna_carro_1794656024079.jpg'
                      }
                      alt={config.carName}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(ellipse 56% 58% at 50% 52%, rgba(4,6,11,0) 45%, rgba(4,6,11,0.92) 92%)'
                      }}
                    />

                    {/* Faróis radiais */}
                    <div
                      className={`pointer-events-none absolute left-[30%] top-[53%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-200 ${
                        splashStep === 'flash' ? 'opacity-95' : 'opacity-0'
                      }`}
                      style={{
                        background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${neon.glow}88 35%, transparent 72%)`
                      }}
                    />
                    <div
                      className={`pointer-events-none absolute left-[39%] top-[54%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-200 ${
                        splashStep === 'flash' ? 'opacity-95' : 'opacity-0'
                      }`}
                      style={{
                        background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${neon.glow}88 35%, transparent 72%)`
                      }}
                    />
                  </div>

                  {/* Linha neon acendendo sob o carro */}
                  <div
                    className="absolute bottom-2 h-[3px] rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: splashStep === 'sliding' ? '0%' : '82%',
                      background: `linear-gradient(90deg, transparent 0%, ${neon.glow} 30%, #FFFFFF 50%, ${neon.glow} 70%, transparent 100%)`,
                      boxShadow: `0 0 18px ${neon.glow}`
                    }}
                  />
                </div>

                <div className="mt-4 text-center">
                  <div className="font-display text-2xl font-bold tracking-wide text-white">
                    {greetingText.slice(0, typedChars)}
                    <span className="ml-0.5 animate-pulse text-cyan-400">|</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Conectando GPS, ELM327 OBD2 e áudio em segundo plano...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
