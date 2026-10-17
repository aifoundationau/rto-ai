'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Navigation,
  Languages,
  ChevronUp,
  Check,
  Search
} from 'lucide-react';
import { setGoogleTranslateLanguage, getActiveGoogleTranslateLanguage } from '@/components/GoogleTranslate';
import { WeatherModal } from '@/components/weather/WeatherModal';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  lat: number;
  lon: number;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English (AU)', nativeName: 'English (AU)', flag: '🇦🇺', lat: -35.28, lon: 149.13, region: 'Australia (AU) · Standard' },
  // Closest neighbours to Australia & Oceania:
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', lat: -6.20, lon: 106.84, region: 'Southeast Asia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', lat: 3.14, lon: 101.69, region: 'Southeast Asia' },
  { code: 'tl', name: 'Tagalog / Filipino', nativeName: 'Filipino', flag: '🇵🇭', lat: 14.60, lon: 120.98, region: 'Southeast Asia' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', lat: 10.82, lon: 106.63, region: 'Southeast Asia' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', lat: 13.75, lon: 100.50, region: 'Southeast Asia' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭', lat: 11.55, lon: 104.92, region: 'Southeast Asia' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာစာ', flag: '🇲🇲', lat: 16.86, lon: 96.19, region: 'Southeast Asia' },
  // East Asia:
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', lat: 23.13, lon: 113.26, region: 'East Asia' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇭🇰', lat: 22.32, lon: 114.17, region: 'East Asia' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', lat: 35.68, lon: 139.76, region: 'East Asia' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', lat: 37.56, lon: 126.97, region: 'East Asia' },
  // South Asia:
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', lat: 28.61, lon: 77.21, region: 'South Asia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', lat: 23.81, lon: 90.41, region: 'South Asia' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', lat: 30.73, lon: 76.77, region: 'South Asia' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', lat: 13.08, lon: 80.27, region: 'South Asia' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', lat: 27.71, lon: 85.32, region: 'South Asia' },
  // Middle East & Africa:
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪', lat: 25.20, lon: 55.27, region: 'Middle East' },
  // Europe & Americas:
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', lat: 40.41, lon: -3.70, region: 'Europe / Americas' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', lat: 48.85, lon: 2.35, region: 'Europe' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', lat: 52.52, lon: 13.40, region: 'Europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', lat: -15.79, lon: -47.88, region: 'Americas / Europe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', lat: 41.90, lon: 12.50, region: 'Europe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', lat: 37.98, lon: 23.73, region: 'Europe' },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface GeoLocationData {
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

export interface HourlyWeatherPoint {
  time: string;
  timeFormatted: string;
  isCurrentHour?: boolean;
  temperature: number;
  apparentTemperature?: number;
  humidity?: number;
  precipitationProbability?: number;
  precipitation?: number;
  weatherCode: number;
  condition: string;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'storm' | 'snow';
  windSpeed: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  weatherCode: number;
  humidity?: number;
  windSpeed?: number;
  apparentTemperature?: number;
  precipitation?: number;
  surfacePressure?: number;
  windDirection?: number;
  tempMax?: number;
  tempMin?: number;
  uvIndexMax?: number;
  sunrise?: string;
  sunset?: string;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'storm' | 'snow';
  hourly?: HourlyWeatherPoint[];
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
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Language Selector state: Always defaults to English
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(SUPPORTED_LANGUAGES[0]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isLangMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangMenuOpen]);

  // Compute languages with distance relative to detected Geolocation
  const { nearbyLanguages, otherLanguages } = useMemo(() => {
    const userLat = location?.latitude ?? -27.4698;
    const userLon = location?.longitude ?? 153.0251;

    // Filter out English (since English is always pinned as Default at the top)
    const nonEnglish = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'en');

    // Attach distance
    const withDistance = nonEnglish.map((l) => ({
      ...l,
      distanceKm: calculateDistanceKm(userLat, userLon, l.lat, l.lon),
    }));

    // Sort by proximity ascending
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    // Filter by search query if any
    const query = langSearch.toLowerCase().trim();
    const filtered = query
      ? withDistance.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.nativeName.toLowerCase().includes(query) ||
            l.region.toLowerCase().includes(query)
        )
      : withDistance;

    // Split into nearby (closest 6) and other languages
    const nearby = query ? filtered : filtered.slice(0, 6);
    const others = query ? [] : filtered.slice(6);

    return { nearbyLanguages: nearby, otherLanguages: others };
  }, [location?.latitude, location?.longitude, langSearch]);

  // Sync with active Google Translate cookie if user previously selected a language
  // AU should always default and stay in English / English format (en-AU)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const isAU = tz.toLowerCase().includes('australia');
      const activeCode = getActiveGoogleTranslateLanguage();

      // If user is in Australia and has no explicit foreign language preference, always stay in English (AU)
      const storedPref = localStorage.getItem('edupulse_preferred_language');
      if (isAU && (!storedPref || storedPref === 'en')) {
        setSelectedLanguage(SUPPORTED_LANGUAGES[0]);
        if (activeCode && activeCode !== 'en') {
          setGoogleTranslateLanguage('en');
        }
        return;
      }

      if (activeCode && activeCode !== 'en') {
        const found = SUPPORTED_LANGUAGES.find(
          (l) => l.code.toLowerCase() === activeCode.toLowerCase()
        );
        if (found) {
          setSelectedLanguage(found);
        }
      }
    }
  }, []);

  const handleSelectLanguage = (lang: LanguageOption) => {
    setSelectedLanguage(lang);
    setIsLangMenuOpen(false);
    try {
      localStorage.setItem('edupulse_preferred_language', lang.code);
    } catch {
      // ignore
    }

    // Use Google to translate the website into the chosen language
    setGoogleTranslateLanguage(lang.code);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('edupulse-language-changed', {
          detail: {
            code: lang.code,
            name: lang.name,
            nativeName: lang.nativeName,
          },
        })
      );
    }
  };

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

  // Helper to format hour string e.g. "2026-10-18T10:00" -> "10 AM"
  const formatHourString = (timeStr: string): string => {
    const parts = timeStr.split('T')[1]?.split(':');
    if (!parts || parts.length < 2) return timeStr;
    const hour = parseInt(parts[0], 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour} ${ampm}`;
  };

  // 3. Fetch Weather from Open-Meteo
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&forecast_days=2&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.current) {
        const { condition, iconType } = parseWeatherCode(data.current.weather_code);

        const times: string[] = data.hourly?.time || [];
        const currentIsoHour = (data.current?.time || '').slice(0, 13);
        let startIndex = times.findIndex((t: string) => t.startsWith(currentIsoHour));
        if (startIndex === -1) startIndex = 0;

        const hourly: HourlyWeatherPoint[] = times.slice(startIndex, startIndex + 24).map((t: string, idx: number) => {
          const i = startIndex + idx;
          const code = data.hourly?.weather_code?.[i] ?? 0;
          const { condition: hCondition, iconType: hIcon } = parseWeatherCode(code);
          return {
            time: t,
            timeFormatted: idx === 0 ? 'Now' : formatHourString(t),
            isCurrentHour: idx === 0,
            temperature: Math.round((data.hourly?.temperature_2m?.[i] ?? 0) * 10) / 10,
            apparentTemperature: Math.round((data.hourly?.apparent_temperature?.[i] ?? 0) * 10) / 10,
            humidity: data.hourly?.relative_humidity_2m?.[i],
            precipitationProbability: data.hourly?.precipitation_probability?.[i] ?? 0,
            weatherCode: code,
            condition: hCondition,
            iconType: hIcon,
            windSpeed: Math.round(data.hourly?.wind_speed_10m?.[i] ?? 0),
          };
        });

        setWeather({
          temperature: Math.round(data.current.temperature_2m * 10) / 10,
          condition,
          weatherCode: data.current.weather_code,
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m || 0),
          apparentTemperature: Math.round((data.current.apparent_temperature ?? data.current.temperature_2m) * 10) / 10,
          precipitation: data.current.precipitation ?? 0,
          surfacePressure: data.current.surface_pressure,
          windDirection: data.current.wind_direction_10m,
          tempMax: data.daily?.temperature_2m_max?.[0] !== undefined ? Math.round(data.daily.temperature_2m_max[0] * 10) / 10 : undefined,
          tempMin: data.daily?.temperature_2m_min?.[0] !== undefined ? Math.round(data.daily.temperature_2m_min[0] * 10) / 10 : undefined,
          uvIndexMax: data.daily?.uv_index_max?.[0] !== undefined ? Math.round(data.daily.uv_index_max[0] * 10) / 10 : undefined,
          sunrise: data.daily?.sunrise?.[0],
          sunset: data.daily?.sunset?.[0],
          iconType,
          hourly,
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

      // Enforce AU always stays in English / English format
      const isAustralia = country.toLowerCase() === 'australia' || (data.countryCode && data.countryCode.toUpperCase() === 'AU');
      if (isAustralia && typeof window !== 'undefined') {
        const storedPref = localStorage.getItem('edupulse_preferred_language');
        if (!storedPref || storedPref === 'en') {
          setSelectedLanguage(SUPPORTED_LANGUAGES[0]);
        }
      }

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
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner hover:border-indigo-500/30 transition-all notranslate" translate="no">
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
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsWeatherModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsWeatherModalOpen(true);
              }
            }}
            className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner hover:border-amber-500/50 hover:bg-slate-800/90 cursor-pointer transition-all notranslate group relative focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            translate="no"
            title="Click for detailed weather forecast & hourly breakdown"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
              {weather ? renderWeatherIcon(weather.iconType) : <CloudSun className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold tracking-wide uppercase text-[10px] text-amber-400 flex items-center gap-1.5">
                  Local Weather
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5 group-hover:text-amber-300 transition-colors">
                  <span>Live Meteo</span>
                  <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </span>
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
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner hover:border-emerald-500/30 transition-all notranslate" translate="no">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold text-slate-200 tracking-wide uppercase text-[10px] text-emerald-400">
                  Current Date & Time (AU)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {browserInfo?.timeZone ? browserInfo.timeZone.split('/').pop()?.replace('_', ' ') : 'Australia (AEST/AEDT)'}
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
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner hover:border-purple-500/30 transition-all notranslate" translate="no">
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
          <div className="flex items-center gap-2 notranslate" translate="no">
            <span className="font-semibold text-slate-300">EduPulse AI</span>
            <span>—</span>
            <span>Australian University Admissions Assistant & Admissions Calendar Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-slate-400 notranslate" translate="no">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>AI Foundation Australian Education</span>
            </span>
            <span className="notranslate" translate="no">•</span>

            {/* Language Selector: Always defaults to English (AU), offers nearby languages based on Geolocation */}
            <div className="relative notranslate" ref={langMenuRef} translate="no">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all shadow-sm ${
                  isLangMenuOpen
                    ? 'bg-indigo-950/80 text-indigo-200 border-indigo-700/80 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
                title="Select language (AU always stays in English / English format; offers nearby languages based on your geolocation)"
                aria-expanded={isLangMenuOpen}
              >
                <Languages className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="flex items-center gap-1">
                  <span>{selectedLanguage.flag}</span>
                  <span className="font-semibold">{selectedLanguage.name}</span>
                </span>
                {selectedLanguage.code === 'en' && (
                  <span className="text-[9px] uppercase px-1 py-0.2 bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 rounded font-semibold tracking-wider">
                    Default (AU)
                  </span>
                )}
                <ChevronUp
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                    isLangMenuOpen ? 'rotate-180 text-indigo-300' : ''
                  }`}
                />
              </button>

              {/* Proximity-sorted Language Popover */}
              {isLangMenuOpen && (
                <div
                  className="absolute bottom-full right-0 mb-3 w-80 sm:w-96 max-w-[92vw] bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] p-4 z-[100] text-left ring-1 ring-slate-800 notranslate"
                  style={{ backgroundColor: '#020617', opacity: 1 }}
                  translate="no"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/90">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                        <Languages className="w-4 h-4 text-indigo-400" />
                        <span>Interface & Assistant Language</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Detected Geolocation:{' '}
                          <strong className="text-slate-200">
                            {location?.city || 'Brisbane'}, {location?.country || 'Australia'}
                          </strong>
                        </span>
                      </div>
                    </div>
                    {selectedLanguage.code !== 'en' && (
                      <button
                        type="button"
                        onClick={() => handleSelectLanguage(SUPPORTED_LANGUAGES[0])}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold shrink-0 cursor-pointer"
                      >
                        Reset to English (AU)
                      </button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="mt-3 mb-2.5 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      placeholder="Search languages by name or region..."
                      className="w-full bg-[#0b1222] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                      style={{ backgroundColor: '#0b1222' }}
                      autoFocus
                    />
                  </div>

                  {/* Scrollable Language List */}
                  <div className="max-h-72 overflow-y-auto pr-1 space-y-3 custom-scrollbar text-xs">
                    {/* Always-pinned Default: English (AU) */}
                    {!langSearch && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5 flex items-center justify-between">
                          <span>Default Language</span>
                          <span className="text-[9px] text-indigo-400 font-mono">en-AU</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectLanguage(SUPPORTED_LANGUAGES[0])}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            selectedLanguage.code === 'en'
                              ? 'bg-indigo-950/90 border-indigo-500/70 text-white shadow-sm'
                              : 'bg-[#0b1222] hover:bg-slate-900 border-slate-800 text-slate-200'
                          }`}
                          style={{ backgroundColor: selectedLanguage.code === 'en' ? '#1e1b4b' : '#0b1222' }}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{SUPPORTED_LANGUAGES[0].flag}</span>
                            <div className="text-left">
                              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                <span>{SUPPORTED_LANGUAGES[0].name}</span>
                                <span className="text-[9px] uppercase px-1.5 py-0.2 bg-indigo-900 text-indigo-200 border border-indigo-700 rounded font-bold tracking-wider">
                                  Default (AU)
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">Australian English Format (en-AU)</div>
                            </div>
                          </div>
                          {selectedLanguage.code === 'en' && <Check className="w-4 h-4 text-indigo-400" />}
                        </button>
                      </div>
                    )}

                    {/* Regional / Nearby Languages based on Geolocation */}
                    {nearbyLanguages.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                          <span>
                            {langSearch
                              ? 'Search Results'
                              : `Nearby Languages (Near ${location?.country || 'Australia'})`}
                          </span>
                          {!langSearch && (
                            <span className="text-[10px] text-indigo-400 font-semibold lowercase">
                              sorted by distance
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {nearbyLanguages.map((lang) => {
                            const isSelected = selectedLanguage.code === lang.code;
                            return (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => handleSelectLanguage(lang)}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-950/90 border-indigo-500/70 text-white shadow-sm'
                                    : 'bg-[#0b1222]/80 hover:bg-slate-900 border-slate-800/80 text-slate-200'
                                }`}
                                style={{ backgroundColor: isSelected ? '#1e1b4b' : '#0b1222' }}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-lg shrink-0">{lang.flag}</span>
                                  <div className="text-left min-w-0">
                                    <div className="font-semibold truncate text-slate-100">
                                      {lang.name}{' '}
                                      <span className="text-slate-400 font-normal text-[11px]">
                                        ({lang.nativeName})
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">{lang.region}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#020617] text-slate-300 border border-slate-700 font-mono font-medium">
                                    ~{lang.distanceKm.toLocaleString()} km
                                  </span>
                                  {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Other International Languages */}
                    {otherLanguages.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                          Other World Languages
                        </div>
                        <div className="space-y-1.5">
                          {otherLanguages.map((lang) => {
                            const isSelected = selectedLanguage.code === lang.code;
                            return (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => handleSelectLanguage(lang)}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-950/90 border-indigo-500/70 text-white shadow-sm'
                                    : 'bg-[#0b1222]/80 hover:bg-slate-900 border-slate-800/80 text-slate-200'
                                }`}
                                style={{ backgroundColor: isSelected ? '#1e1b4b' : '#0b1222' }}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-lg shrink-0">{lang.flag}</span>
                                  <div className="text-left min-w-0">
                                    <div className="font-semibold truncate text-slate-100">
                                      {lang.name}{' '}
                                      <span className="text-slate-400 font-normal text-[11px]">
                                        ({lang.nativeName})
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">{lang.region}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#020617] text-slate-300 border border-slate-700 font-mono font-medium">
                                    ~{lang.distanceKm.toLocaleString()} km
                                  </span>
                                  {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Centered Responsive Weather Details & Hourly Breakdown Modal */}
      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weather={weather}
        location={location}
        onRefresh={() => {
          if (location?.latitude && location?.longitude) {
            fetchWeather(location.latitude, location.longitude);
          }
        }}
        isLoading={isLoadingGeo}
      />
    </footer>
  );
};
