'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Sun,
  CloudSun,
  CloudRain,
  Cloud,
  CloudLightning,
  Snowflake,
  Calendar,
  Clock,
  Compass,
  Monitor,
  Wifi,
  RefreshCw,
  Globe,
  Thermometer,
  ExternalLink,
  Navigation
} from 'lucide-react';

interface GeoLocationData {
  suburb: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  source: 'gps' | 'network' | 'default';
  accuracyMeters?: number;
}

interface WeatherData {
  temperature: number;
  condition: string;
  weatherCode: number;
  humidity?: number;
  windSpeed?: number;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'storm' | 'snow';
}

interface BrowserInfo {
  browser: string;
  os: string;
  timeZone: string;
  screenSize: string;
  language: string;
  online: boolean;
}

export const Footer: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<GeoLocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // 1. Live Clock & Date
  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Browser & Client System Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;
    let browser = 'Browser';
    if (userAgent.indexOf('Edg/') > -1) browser = 'Microsoft Edge';
    else if (userAgent.indexOf('Chrome/') > -1) browser = 'Google Chrome';
    else if (userAgent.indexOf('Safari/') > -1 && userAgent.indexOf('Chrome/') === -1) browser = 'Apple Safari';
    else if (userAgent.indexOf('Firefox/') > -1) browser = 'Mozilla Firefox';

    let os = 'Unknown OS';
    if (userAgent.indexOf('Win') > -1) os = 'Windows';
    else if (userAgent.indexOf('Mac') > -1) os = 'macOS';
    else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
    else if (userAgent.indexOf('Android') > -1) os = 'Android';
    else if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) os = 'iOS';

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney';
    const language = navigator.language || 'en-AU';
    const screenSize = `${window.screen?.width || 0}×${window.screen?.height || 0}`;

    setBrowserInfo({
      browser,
      os,
      timeZone,
      screenSize,
      language,
      online: navigator.onLine ?? true,
    });

    const handleOnline = () => setBrowserInfo(prev => prev ? { ...prev, online: true } : null);
    const handleOffline = () => setBrowserInfo(prev => prev ? { ...prev, online: false } : null);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper to map WMO weather codes to conditions and icons
  const parseWeatherCode = (code: number): { condition: string; iconType: WeatherData['iconType'] } => {
    if (code === 0) return { condition: 'Clear Sky', iconType: 'sun' };
    if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', iconType: 'cloud-sun' };
    if (code >= 45 && code <= 48) return { condition: 'Misty / Foggy', iconType: 'cloud' };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { condition: 'Showers / Rain', iconType: 'rain' };
    if (code >= 71 && code <= 77) return { condition: 'Snow Showers', iconType: 'snow' };
    if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', iconType: 'storm' };
    return { condition: 'Fair', iconType: 'cloud-sun' };
  };

  // 3. Fetch Weather from Open-Meteo
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.current) {
        const { condition, iconType } = parseWeatherCode(data.current.weather_code);
        setWeather({
          temperature: Math.round(data.current.temperature_2m * 10) / 10,
          condition,
          weatherCode: data.current.weather_code,
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m || 0),
          iconType,
        });
      }
    } catch (e) {
      console.warn('[Footer] Weather fetch failed:', e);
    }
  }, []);

  // 4. Reverse Geocode via BigDataCloud API
  const reverseGeocode = useCallback(async (lat?: number, lon?: number, source: 'gps' | 'network' = 'network', accuracy?: number) => {
    try {
      setIsLoadingGeo(true);
      setGeoError(null);
      let endpoint = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
      if (typeof lat === 'number' && typeof lon === 'number') {
        endpoint += `?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      } else {
        endpoint += '?localityLanguage=en';
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Geocoding response not ok');
      const data = await res.json();

      const suburb = data.locality || data.localityInfo?.administrative?.[3]?.name || data.city || 'Local District';
      const city = data.city || data.principalSubdivision || 'Australia';
      const state = data.principalSubdivision || '';
      const country = data.countryName || 'Australia';
      const postcode = data.postcode || '';
      const finalLat = typeof lat === 'number' ? lat : (data.latitude || -27.47);
      const finalLon = typeof lon === 'number' ? lon : (data.longitude || 153.02);

      setLocation({
        suburb,
        city,
        state,
        country,
        postcode,
        latitude: finalLat,
        longitude: finalLon,
        source,
        accuracyMeters: accuracy,
      });

      // Query weather for these coordinates
      await fetchWeather(finalLat, finalLon);
    } catch (err: any) {
      console.warn('[Footer] Geolocation fetch error:', err);
      setGeoError('Using network approximate region');
      // Default to Sydney/Brisbane fallback
      setLocation({
        suburb: 'Brisbane City',
        city: 'Brisbane',
        state: 'Queensland',
        country: 'Australia',
        postcode: '4000',
        latitude: -27.4698,
        longitude: 153.0251,
        source: 'default',
      });
      fetchWeather(-27.4698, 153.0251);
    } finally {
      setIsLoadingGeo(false);
    }
  }, [fetchWeather]);

  // Initial Geolocation load from Network/IP
  useEffect(() => {
    reverseGeocode();
  }, [reverseGeocode]);

  // Request browser GPS/High-accuracy Geolocation
  const handleRequestPreciseLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Browser geolocation is not supported in this browser.');
      return;
    }

    setIsLoadingGeo(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        reverseGeocode(latitude, longitude, 'gps', Math.round(accuracy));
      },
      (err) => {
        console.warn('[Footer] User denied or timed out browser geolocation:', err.message);
        setGeoError('GPS permission denied. Using network location.');
        setIsLoadingGeo(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const renderWeatherIcon = (iconType: WeatherData['iconType']) => {
    switch (iconType) {
      case 'sun':
        return <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />;
      case 'cloud-sun':
        return <CloudSun className="w-4 h-4 text-amber-300" />;
      case 'rain':
        return <CloudRain className="w-4 h-4 text-cyan-400" />;
      case 'storm':
        return <CloudLightning className="w-4 h-4 text-purple-400" />;
      case 'snow':
        return <Snowflake className="w-4 h-4 text-sky-200" />;
      case 'cloud':
      default:
        return <Cloud className="w-4 h-4 text-slate-300" />;
    }
  };

  const formatCoordinates = (lat: number | null, lon: number | null) => {
    if (lat === null || lon === null) return 'Determining coordinates...';
    const latDir = lat >= 0 ? '°N' : '°S';
    const lonDir = lon >= 0 ? '°E' : '°W';
    return `${Math.abs(lat).toFixed(4)}${latDir}, ${Math.abs(lon).toFixed(4)}${lonDir}`;
  };

  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/90 backdrop-blur-md text-slate-400 text-xs transition-colors">
      {/* Top Telemetry & Status Ribbon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1. Suburb & Geolocation */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner hover:border-indigo-500/30 transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold text-slate-200 tracking-wide uppercase text-[10px] text-indigo-400">
                  Geolocation & Suburb
                </span>
                <button
                  onClick={handleRequestPreciseLocation}
                  disabled={isLoadingGeo}
                  title="Update to high-accuracy device GPS"
                  className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-300 font-medium cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingGeo ? 'animate-spin text-indigo-400' : ''}`} />
                  <span className="hidden sm:inline">{location?.source === 'gps' ? 'GPS Active' : 'Use GPS'}</span>
                </button>
              </div>
              <p className="text-white font-medium text-sm truncate">
                {location ? (
                  <>
                    <span className="text-indigo-300 font-bold">{location.suburb}</span>
                    {location.city && location.city !== location.suburb ? `, ${location.city}` : ''}
                  </>
                ) : (
                  'Locating Suburb...'
                )}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span className="truncate">
                  {location ? `${location.state ? location.state + ', ' : ''}${location.country}` : 'Detecting...'}
                </span>
                {location?.latitude && location?.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300 underline font-mono text-[10px]"
                    title="View coordinates on Google Maps"
                  >
                    <Compass className="w-2.5 h-2.5" />
                    <span>{formatCoordinates(location.latitude, location.longitude)}</span>
                    <ExternalLink className="w-2 h-2" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 2. Weather Information */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner hover:border-amber-500/30 transition-all">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              {weather ? renderWeatherIcon(weather.iconType) : <CloudSun className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold text-slate-200 tracking-wide uppercase text-[10px] text-amber-400">
                  Local Weather
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Live Meteo</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-white font-bold text-base">
                  {weather ? `${weather.temperature}°C` : '--°C'}
                </span>
                <span className="text-slate-300 text-xs font-medium truncate">
                  {weather ? weather.condition : 'Fetching forecast...'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                {weather?.humidity !== undefined && (
                  <span>Humidity: <strong className="text-slate-300 font-normal">{weather.humidity}%</strong></span>
                )}
                {weather?.windSpeed !== undefined && (
                  <span>Wind: <strong className="text-slate-300 font-normal">{weather.windSpeed} km/h</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Live Date & Time */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner hover:border-emerald-500/30 transition-all">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold text-slate-200 tracking-wide uppercase text-[10px] text-emerald-400">
                  Current Date & Time
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {browserInfo?.timeZone ? browserInfo.timeZone.split('/').pop()?.replace('_', ' ') : 'Local Time'}
                </span>
              </div>
              <p className="text-white font-bold text-sm truncate">
                {currentDateTime
                  ? currentDateTime.toLocaleDateString('en-AU', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Syncing date...'}
              </p>
              <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-emerald-300">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>
                  {currentDateTime
                    ? currentDateTime.toLocaleTimeString('en-AU', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })
                    : '--:--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Browser & Connection Info */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner hover:border-purple-500/30 transition-all">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold text-slate-200 tracking-wide uppercase text-[10px] text-purple-400">
                  Client Environment
                </span>
                <span className="inline-flex items-center gap-1 text-[10px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${browserInfo?.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  <span className={browserInfo?.online ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                    {browserInfo?.online ? 'Online' : 'Offline'}
                  </span>
                </span>
              </div>
              <p className="text-white font-medium text-xs truncate">
                {browserInfo ? `${browserInfo.browser} on ${browserInfo.os}` : 'Browser client'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 truncate">
                <span>Display: {browserInfo?.screenSize || 'Responsive'}</span>
                <span>•</span>
                <span className="truncate">{browserInfo?.timeZone || 'Australia'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Legal line */}
        <div className="mt-4 pt-3 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">EduPulse AI</span>
            <span>—</span>
            <span>Australian University Admissions Assistant & Admissions Calendar Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>AI Foundation Australian Education</span>
            </span>
            <span>•</span>
            <span>Real-time Browser & Geolocation Telemetry</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
