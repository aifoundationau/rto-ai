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
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl text-white text-sm overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white truncate">
                  {location?.suburb || 'Local District'}, {location?.city || 'Australia'}
                </h3>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-400/15 text-amber-300 border border-amber-400/30 uppercase">
                  Live Meteo
                </span>
              </div>
              <p className="text-sm text-slate-300 truncate mt-0.5">
                {location?.state ? `${location.state}, ` : ''}{location?.country || 'Australia'} • WMO Atmospheric Model
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh Live Forecast"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Close Weather Dialog"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm">
          {/* 1. Main Current Conditions Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold font-mono bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 uppercase tracking-wider mb-2.5">
                  Current Atmospheric Reading
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {weather?.temperature !== undefined ? `${weather.temperature}°C` : '--°C'}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-indigo-200">
                    {weather?.condition || 'Analyzing conditions...'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-sm text-slate-200">
                  <span>
                    Feels like: <strong className="text-white font-bold">{weather?.apparentTemperature ?? weather?.temperature ?? '--'}°C</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Today: <strong className="text-emerald-400 font-bold">{weather?.tempMax !== undefined ? `${weather.tempMax}°C` : '--'}</strong> / <strong className="text-sky-300 font-bold">{weather?.tempMin !== undefined ? `${weather.tempMin}°C` : '--'}</strong>
                  </span>
                </div>
              </div>

              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0 self-center sm:self-auto">
                {renderWeatherIcon(weather?.iconType, 'w-10 h-10 sm:w-12 sm:h-12')}
              </div>
            </div>
          </div>

          {/* 2. Detailed Meteorological Metrics Grid (Size 14 Font) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Humidity */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 space-y-1.5 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Humidity</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {weather?.humidity !== undefined ? `${weather.humidity}%` : '--%'}
              </div>
              <p className="text-xs text-slate-400">Relative air moisture</p>
            </div>

            {/* Wind */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 space-y-1.5 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Wind Velocity</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {weather?.windSpeed !== undefined ? `${weather.windSpeed} km/h` : '-- km/h'}
              </div>
              <p className="text-xs text-slate-400">
                Direction: {getWindDirection(weather?.windDirection) || 'Variable'}
              </p>
            </div>

            {/* Precipitation */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 space-y-1.5 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <Umbrella className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Precipitation</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {weather?.precipitation !== undefined ? `${weather.precipitation} mm` : '0 mm'}
              </div>
              <p className="text-xs text-slate-400">Liquid rainfall depth</p>
            </div>

            {/* Air Pressure */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 space-y-1.5 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <Gauge className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Pressure</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {weather?.surfacePressure ? `${Math.round(weather.surfacePressure)} hPa` : '-- hPa'}
              </div>
              <p className="text-xs text-slate-400">Barometric surface level</p>
            </div>

            {/* UV Index */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 space-y-1.5 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span>UV Index</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {weather?.uvIndexMax !== undefined ? `${weather.uvIndexMax}` : '--'}
              </div>
              <p className="text-xs text-slate-400">
                Level: {getUvDescription(weather?.uvIndexMax)}
              </p>
            </div>

            {/* Sunrise & Sunset */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 space-y-1.5 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <Sunrise className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Sun Cycle</span>
              </div>
              <div className="text-sm font-bold text-white pt-1">
                <span>{formatTimeWithMinutes(weather?.sunrise)}</span>
                <span className="text-slate-400 mx-1.5">/</span>
                <span>{formatTimeWithMinutes(weather?.sunset)}</span>
              </div>
              <p className="text-xs text-slate-400">Dawn / Dusk (Local)</p>
            </div>
          </div>

          {/* 3. Hourly Breakdown (Next 24 Hours) - Size 14 Font */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="font-extrabold text-sm sm:text-base text-white">
                  Hourly Forecast Breakdown (Next 24 Hours)
                </h4>
              </div>
              <span className="text-sm text-slate-300 hidden sm:inline">
                Scroll horizontally &rarr;
              </span>
            </div>

            {weather?.hourly && weather.hourly.length > 0 ? (
              <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth">
                {weather.hourly.map((hour, idx) => (
                  <div
                    key={`${hour.time}-${idx}`}
                    className={`w-32 shrink-0 rounded-2xl p-3.5 flex flex-col items-center justify-between gap-2.5 border text-center transition-all ${
                      hour.isCurrentHour
                        ? 'bg-indigo-600/35 border-indigo-400/70 ring-2 ring-indigo-500/30 shadow-md'
                        : 'bg-slate-800/70 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {/* Time */}
                    <div className="text-sm font-bold text-slate-100">
                      {hour.timeFormatted}
                      {hour.isCurrentHour && (
                        <span className="block text-[11px] font-black uppercase text-indigo-400 tracking-wider">
                          Current
                        </span>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="my-1">
                      {renderWeatherIcon(hour.iconType, 'w-7 h-7')}
                    </div>

                    {/* Temperature */}
                    <div className="text-base font-black text-white">
                      {hour.temperature}°C
                    </div>

                    {/* Condition Summary */}
                    <div className="text-xs text-slate-200 font-medium truncate max-w-full px-1">
                      {hour.condition}
                    </div>

                    {/* Precipitation Probability & Wind */}
                    <div className="w-full pt-2 border-t border-slate-700/60 flex flex-col items-center gap-1 text-xs">
                      {hour.precipitationProbability !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs ${
                            hour.precipitationProbability > 40
                              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                              : 'text-slate-300'
                          }`}
                        >
                          💧 {hour.precipitationProbability}%
                        </span>
                      )}
                      <span className="text-slate-300 text-xs">
                        {hour.windSpeed} km/h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-800/40 border border-slate-700/40 rounded-2xl text-center text-sm text-slate-400">
                Hourly forecast breakdown is loading or unavailable for this station.
              </div>
            )}
          </div>

          {/* 4. Footer Attribution & Coordinates */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Coordinates: {location?.latitude?.toFixed(4) || '-27.4698'}, {location?.longitude?.toFixed(4) || '153.0251'}
              </span>
            </div>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 flex items-center gap-1.5 transition-colors font-medium"
            >
              <span>Powered by Open-Meteo API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
