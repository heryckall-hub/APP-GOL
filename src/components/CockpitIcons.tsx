import React from 'react';
import {
  Bluetooth as LucideBluetooth,
  Compass as LucideCompass,
  Gauge,
  MapPin,
  Music,
  Pause as LucidePause,
  Play,
  Settings as LucideSettings,
  SkipBack,
  SkipForward,
  SunMedium,
  TriangleAlert,
  Volume2,
  VolumeX,
  Wrench
} from 'lucide-react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Speed: React.FC<IconProps> = ({ className, style }) => <Gauge className={className} style={style} />;
export const Build: React.FC<IconProps> = ({ className, style }) => <Wrench className={className} style={style} />;
export const Compass: React.FC<IconProps> = ({ className, style }) => <LucideCompass className={className} style={style} />;
export const MusicNote: React.FC<IconProps> = ({ className, style }) => <Music className={className} style={style} />;
export const Settings: React.FC<IconProps> = ({ className, style }) => <LucideSettings className={className} style={style} />;
export const GpsFixed: React.FC<IconProps> = ({ className, style }) => <MapPin className={className} style={style} />;
export const Bluetooth: React.FC<IconProps> = ({ className, style }) => <LucideBluetooth className={className} style={style} />;
export const Brightness6: React.FC<IconProps> = ({ className, style }) => <SunMedium className={className} style={style} />;
export const Warning: React.FC<IconProps> = ({ className, style }) => <TriangleAlert className={className} style={style} />;
export const PlayArrow: React.FC<IconProps> = ({ className, style }) => <Play className={className} style={style} />;
export const Pause: React.FC<IconProps> = ({ className, style }) => <LucidePause className={className} style={style} />;
export const SkipNext: React.FC<IconProps> = ({ className, style }) => <SkipForward className={className} style={style} />;
export const SkipPrevious: React.FC<IconProps> = ({ className, style }) => <SkipBack className={className} style={style} />;
export const VolumeUp: React.FC<IconProps> = ({ className, style }) => <Volume2 className={className} style={style} />;
export const VolumeDown: React.FC<IconProps> = ({ className, style }) => <VolumeX className={className} style={style} />;
