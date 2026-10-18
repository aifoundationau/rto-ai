'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Sun,
  CloudSun,
  CloudRain,
  Cloud,
  CloudLightning,
  Snowflake,
  Clock,
  Droplets,
  Wind,
  Gauge,
  Sunrise,
  Sunset,
  Umbrella,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { WeatherData, GeoLocationData } from '@/components/Footer';

export interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
  location: GeoLocationData | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Convert wind direction degrees to 16-point compass string
function getWindDirection(degrees?: number): string {
  if (degrees === undefined || degrees === null) return '';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
}

// Convert UV index to descriptor
function getUvDescription(uv?: number): string {
  if (uv === undefined || uv === null) return 'N/A';
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

// Format ISO time "2026-10-18T05:09" to "5:09 AM"
function formatTimeWithMinutes(timeStr?: string): string {
  if (!timeStr) return '--:--';
  const parts = timeStr.split('T')[1]?.split(':');
  if (!parts || parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  location,
  onRefresh,
  isLoading = false,
}) => {
  const [mounted, setMounted] = useState(false);

  // SSR hydration safety for React Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const renderWeatherIcon = (
    iconType?: WeatherData['iconType'],
    className: string = 'w-6 h-6'
  ) => {
    switch (iconType) {
      case 'sun':
        return <Sun className={`${className} text-amber-400`} />;
      case 'cloud-sun':
        return <CloudSun className={`${className} text-amber-300`} />;
      case 'rain':
        return <CloudRain className={`${className} text-cyan-400`} />;
      case 'storm':
        return <CloudLightning className={`${className} text-purple-400`} />;
      case 'snow':
        return <Snowflake className={`${className} text-sky-200`} />;
      case 'cloud':
      default:
        return <Cloud className={`${className} text-slate-300`} />;
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Local Weather Details & Hourly Forecast"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-white text-sm overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* 1. Compact Header */}
        <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/95">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <h3 className="font-bold text-sm text-white truncate">
                {location?.suburb || 'Local District'}, {location?.city || 'Australia'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-400/15 text-amber-300 border border-amber-400/25 uppercase shrink-0">
                Live Meteo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh Live Forecast"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Close Weather Dialog"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Current Conditions Summary Banner */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white tracking-tight">
                {weather?.temperature !== undefined ? `${weather.temperature}°C` : '--°C'}
              </span>
              <span className="text-sm font-bold text-indigo-200 truncate">
                {weather?.condition || 'Analyzing conditions...'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
              <span>
                Feels like: <strong className="text-white font-semibold">{weather?.apparentTemperature ?? weather?.temperature ?? '--'}°C</strong>
              </span>
              <span>•</span>
              <span>
                Today: <strong className="text-emerald-400 font-semibold">{weather?.tempMax !== undefined ? `${weather.tempMax}°C` : '--'}</strong> / <strong className="text-sky-300 font-semibold">{weather?.tempMin !== undefined ? `${weather.tempMin}°C` : '--'}</strong>
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            {renderWeatherIcon(weather?.iconType, 'w-7 h-7')}
          </div>
        </div>

        {/* 3. 6 Key Metrics Grid (Compact 3x2, Size 14 Font) */}
        <div className="p-3 grid grid-cols-3 gap-2 bg-slate-900/90 text-sm">
          {/* Humidity */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Humidity</span>
            </div>
            <div className="text-sm font-bold text-white">
              {weather?.humidity !== undefined ? `${weather.humidity}%` : '--%'}
            </div>
          </div>

          {/* Wind */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Wind className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Wind</span>
            </div>
            <div className="text-sm font-bold text-white">
              {weather?.windSpeed !== undefined ? `${weather.windSpeed} km/h` : '--'}
            </div>
          </div>

          {/* Precipitation */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Umbrella className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Rain</span>
            </div>
            <div className="text-sm font-bold text-white">
              {weather?.precipitation !== undefined ? `${weather.precipitation} mm` : '0 mm'}
            </div>
          </div>

          {/* Pressure */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Gauge className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Pressure</span>
            </div>
            <div className="text-sm font-bold text-white">
              {weather?.surfacePressure ? `${Math.round(weather.surfacePressure)} hPa` : '--'}
            </div>
          </div>

          {/* UV Index */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>UV Index</span>
            </div>
            <div className="text-sm font-bold text-white">
              {weather?.uvIndexMax !== undefined ? `${weather.uvIndexMax} (${getUvDescription(weather?.uvIndexMax)})` : '--'}
            </div>
          </div>

          {/* Sun Cycle */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Sunrise className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>Sun Cycle</span>
            </div>
            <div className="text-xs font-bold text-white pt-0.5 truncate">
              {formatTimeWithMinutes(weather?.sunrise)} / {formatTimeWithMinutes(weather?.sunset)}
            </div>
          </div>
        </div>

        {/* 4. Hourly Forecast Breakdown (Side-Scrolling Carousel) */}
        <div className="px-3 pb-3 pt-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300 px-1">
            <div className="flex items-center gap-1.5 font-bold text-sm text-white">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Hourly Forecast Breakdown (Next 24h)</span>
            </div>
            <span className="text-xs text-slate-400">Scroll horizontally &rarr;</span>
          </div>

          {weather?.hourly && weather.hourly.length > 0 ? (
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1 pt-0.5 scroll-smooth [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full">
              {weather.hourly.map((hour, idx) => (
                <div
                  key={`${hour.time}-${idx}`}
                  className={`w-24 shrink-0 rounded-xl p-2 flex flex-col items-center justify-between gap-1 border text-center transition-all ${
                    hour.isCurrentHour
                      ? 'bg-indigo-600/35 border-indigo-400/60 ring-1 ring-indigo-400/30'
                      : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-200">
                    {hour.timeFormatted}
                  </div>

                  <div className="my-0.5">
                    {renderWeatherIcon(hour.iconType, 'w-5 h-5')}
                  </div>

                  <div className="text-sm font-black text-white">
                    {hour.temperature}°C
                  </div>

                  <div className="w-full pt-1 border-t border-slate-700/50 flex items-center justify-center gap-1 text-[11px]">
                    <span className="font-bold text-cyan-300">
                      💧{hour.precipitationProbability ?? 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-center text-xs text-slate-400">
              Hourly forecast loading...
            </div>
          )}
        </div>

        {/* 5. Minimal Footer */}
        <div className="px-3.5 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Coordinates: {location?.latitude?.toFixed(4) || '-27.4698'}, {location?.longitude?.toFixed(4) || '153.0251'}
          </span>
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Open-Meteo WMO</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
