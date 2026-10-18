'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Compass,
  FileCheck,
  DoorOpen,
  Bot,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Radio,
  ShieldAlert,
  Award,
  Video,
  FileText,
  Play,
  ExternalLink
} from 'lucide-react';
import { CourseProgram, COURSES_DATA } from '@/data/courses';
import { UnitDetail, UNITS_DATA } from '@/data/units';
import { NavTab } from '@/components/Navbar';
import { SevereEmergencyModal } from '@/components/emergency/SevereEmergencyModal';

interface HomeViewProps {
  onNavigateTab: (tab: NavTab) => void;
  onAskAgent: (query: string) => void;
  onApplyForCourse: (course: CourseProgram) => void;
  onExploreUnit: (unitCode: string) => void;
  onOpenClassroom: () => void;
}

export interface BlogPost {
  id: number | string;
  tag: string;
  date: string;
  title: string;
  image: string;
  snippet: string;
  content: string;
  type?: 'youtube' | 'linkedin' | 'article';
  url?: string;
  videoId?: string;
  author?: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    tag: "AI Research",
    date: "Sep 28, 2026",
    title: "EduPulse AI Research Group Unveils Autonomous Tutoring Agents",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    snippet: "Our faculty researchers have deployed next-generation agentic workflows assisting over 5,000 students in real-time Python debugging.",
    content: "The EduPulse AI Research Team today released its landmark findings on autonomous student tutoring agents. By linking Large Language Models directly to university autograders via Model Context Protocol (MCP), student completion rates in introductory computer science increased by 34%. Key takeaways include sub-second feedback on syntax errors and automated generation of personalized practice problems tailored to individual weak spots."
  },
  {
    id: 2,
    tag: "Admissions & ATAR",
    date: "Sep 24, 2026",
    title: "How to Apply for 2026 Early Offer Schemes & Scholarships",
    image: "/images/early-offer-scholarships-2026.jpg",
    snippet: "Everything prospective Year 12 applicants need to know about early admissions, ATAR adjustments, and merit-based grants.",
    content: "Applications for 2026 Early Entry and Vice-Chancellor Scholarships are officially open. High school students can submit predicted year 11/12 results through our direct EduPulse application portal to lock in conditional offers before final exams. Financial aid packages including equity grants and STEM leadership awards up to $10,000 per year are available."
  },
  {
    id: 3,
    tag: "Campus Life",
    date: "Sep 20, 2026",
    title: "Inside the New $45M Robotics & High-Performance Compute Hub",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
    snippet: "Take a virtual tour of our newly opened engineering precinct, housing quantum computing simulators and autonomous vehicle labs.",
    content: "Our new High-Performance Compute Hub was officially inaugurated this week. Designed to foster interdisciplinary research between computer science, medicine, and business analytics, the building features 24/7 student access pods, robotics testing tracks, and secure sandbox cloud environments."
  },
  {
    id: 4,
    tag: "Career Pathways",
    date: "Sep 15, 2026",
    title: "2026 Graduate Employability Ranking: EduPulse Ranks Top 3",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
    snippet: "Industry partnerships with global tech giants yield 96% employment within three months of graduation.",
    content: "The latest national employment audit confirms our computer science and data analytics graduates enjoy industry-leading entry salaries and quick placement into global technology firms including Google, Atlassian, Microsoft, and Canva."
  }
];

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateTab,
  onAskAgent,
  onApplyForCourse,
  onExploreUnit,
  onOpenClassroom
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [degreeFilter, setDegreeFilter] = useState<'all' | 'Undergraduate' | 'Postgraduate'>('all');
  const [featuredDegrees, setFeaturedDegrees] = useState<CourseProgram[]>([]);
  const [featuredSyllabi, setFeaturedSyllabi] = useState<UnitDetail[]>([]);
  const [selectedUnitModal, setSelectedUnitModal] = useState<UnitDetail | null>(null);
  const [selectedBlogModal, setSelectedBlogModal] = useState<BlogPost | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(BLOG_POSTS);

  // Fetch live blog posts from admin submissions API & browser storage
  useEffect(() => {
    let isMounted = true;

    const loadPosts = () => {
      fetch('/api/blog')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted) return;
          let posts: BlogPost[] = data && Array.isArray(data.posts) ? data.posts : [];

          // Merge any client-published posts from localStorage
          try {
            const stored = typeof window !== 'undefined' ? localStorage.getItem('edupulse_custom_blog_posts') : null;
            if (stored) {
              const localPosts = JSON.parse(stored);
              if (Array.isArray(localPosts) && localPosts.length > 0) {
                const seen = new Set(localPosts.map((p: any) => p.id));
                posts = [...localPosts, ...posts.filter((p: any) => !seen.has(p.id))];
              }
            }
          } catch (e) {
            console.warn('[HomeView] LocalStorage read error:', e);
          }

          if (posts.length > 0) {
            setBlogPosts(posts);
          }
        })
        .catch((err) => {
          console.warn('[HomeView] Blog fetch error, attempting localStorage fallback:', err);
          try {
            const stored = typeof window !== 'undefined' ? localStorage.getItem('edupulse_custom_blog_posts') : null;
            if (stored && isMounted) {
              const localPosts = JSON.parse(stored);
              if (Array.isArray(localPosts) && localPosts.length > 0) {
                const seen = new Set(localPosts.map((p: any) => p.id));
                setBlogPosts([...localPosts, ...BLOG_POSTS.filter((p) => !seen.has(p.id))]);
              }
            }
          } catch (e) {}
        });
    };

    loadPosts();

    // Listen for live updates when admin publishes from another tab or panel
    const handleBlogUpdated = () => {
      loadPosts();
    };
    window.addEventListener('edupulse_blog_updated', handleBlogUpdated);
    window.addEventListener('storage', handleBlogUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('edupulse_blog_updated', handleBlogUpdated);
      window.removeEventListener('storage', handleBlogUpdated);
    };
  }, []);

  // Dynamic Front-Page Campus Metrics (Adjustable via Admin Panel)
  const [campusMetrics, setCampusMetrics] = useState({
    heroBadgeText: 'Your Future is Now • Powered by Gemini',
    totalStudents: '5,000+',
    placementRate: '96%',
    facultyStaff: '350+',
    studentsSubtitle: 'Active learners across all faculties',
    placementSubtitle: 'Graduate employment within 90 days',
    facultySubtitle: 'Academic educators & operational staff',
    emergencyAlert: '',
    emergencyTitle: '',
    emergencyActive: false,
    emergencySeverity: 'severe' as 'critical' | 'severe' | 'warning',
    emergencyUpdatedAt: '',
  });

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('edupulse_metrics_cache') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && isMounted) setCampusMetrics((prev) => ({ ...prev, ...parsed }));
        }
      } catch {}

      fetch('/api/campus-metrics')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data && data.metrics) {
            setCampusMetrics((prev) => ({
              ...prev,
              ...data.metrics,
            }));
          }
        })
        .catch((err) => console.warn('[HomeView] Campus metrics fetch error:', err));
    };

    loadMetrics();

    const handleMetricsUpdated = () => {
      loadMetrics();
    };
    window.addEventListener('edupulse_metrics_updated', handleMetricsUpdated);
    window.addEventListener('storage', handleMetricsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('edupulse_metrics_updated', handleMetricsUpdated);
      window.removeEventListener('storage', handleMetricsUpdated);
    };
  }, []);

  // Auto-trigger Severe Emergency Popup when active update is saved
  useEffect(() => {
    if (campusMetrics.emergencyActive && campusMetrics.emergencyAlert?.trim()) {
      const storageKey = `edupulse_emergency_ack_${campusMetrics.emergencyUpdatedAt || 'active'}`;
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null;
      if (!dismissed) {
        setIsEmergencyModalOpen(true);
      }
    } else {
      setIsEmergencyModalOpen(false);
    }
  }, [campusMetrics.emergencyActive, campusMetrics.emergencyAlert, campusMetrics.emergencyUpdatedAt]);

  const handleAcknowledgeEmergency = () => {
    setIsEmergencyModalOpen(false);
    if (typeof window !== 'undefined' && campusMetrics.emergencyUpdatedAt) {
      const storageKey = `edupulse_emergency_ack_${campusMetrics.emergencyUpdatedAt}`;
      sessionStorage.setItem(storageKey, 'true');
    }
  };

  const formatStudents = (val?: string) => {
    const raw = (val || '5,000+').trim();
    return raw.toLowerCase().includes('student') ? raw : `${raw} Students`;
  };
  const formatPlacement = (val?: string) => {
    const raw = (val || '96%').trim();
    return raw.toLowerCase().includes('placement') ? raw : `${raw} Placement`;
  };
  const formatFaculty = (val?: string) => {
    const raw = (val || '350+').trim();
    return raw.toLowerCase().includes('faculty') || raw.toLowerCase().includes('staff')
      ? raw
      : `${raw} Faculty & Staff`;
  };

  // Helper to shuffle and pick N items
  const shuffleAndPick = <T,>(arr: T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  const reshuffleDegrees = () => {
    const filtered = degreeFilter === 'all'
      ? COURSES_DATA
      : COURSES_DATA.filter(c => c.degreeLevel === degreeFilter);
    setFeaturedDegrees(shuffleAndPick(filtered, 2));
  };

  const reshuffleSyllabi = () => {
    setFeaturedSyllabi(shuffleAndPick(UNITS_DATA, 2));
  };

  useEffect(() => {
    reshuffleDegrees();
    reshuffleSyllabi();
  }, [degreeFilter]);

  // Real-time live filtered degrees/syllabi if query is present
  const displayedDegrees = searchQuery.trim()
    ? COURSES_DATA.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.overview.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : featuredDegrees;

  const displayedSyllabi = searchQuery.trim()
    ? UNITS_DATA.filter(u =>
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.overview.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : featuredSyllabi;

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onAskAgent(`I am looking for courses and units related to: "${searchQuery}"`);
  };

  const scrollBlogCarousel = (direction: 'left' | 'right') => {
    const el = document.getElementById('blog-carousel-wrapper');
    if (el) {
      el.scrollBy({ left: direction === 'left' ? -340 : 340, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 pb-16">

      {/* 0. SEVERE EMERGENCY BROADCAST TOP BANNER (IF ACTIVE) */}
      {campusMetrics.emergencyActive && campusMetrics.emergencyAlert?.trim() && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-650 via-rose-600 to-red-700 border-2 border-red-500 shadow-2xl text-white p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-black/30 border border-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/20 border border-white/30 text-white">
                  {(campusMetrics.emergencySeverity || 'severe').toUpperCase()} EMERGENCY BROADCAST
                </span>
                {campusMetrics.emergencyUpdatedAt && (
                  <span className="text-[11px] text-red-100 font-medium">
                    • Issued {new Date(campusMetrics.emergencyUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-tight">
                {campusMetrics.emergencyTitle || 'Severe Environmental & Weather Emergency Notice'}
              </h3>
              <p className="text-xs sm:text-sm text-red-50 line-clamp-2 max-w-3xl mt-0.5 font-medium leading-relaxed">
                {campusMetrics.emergencyAlert}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-red-700 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse text-red-600" />
              <span>View Emergency Advisory</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO BANNER SECTION */}
      <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 flex items-center min-h-[460px] sm:min-h-[500px]">

        {/* Background Graphic & Gradient Overlay */}
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80"
          alt="EduPulse AI Campus"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950/85 to-slate-900/50" />

        {/* Floating Quick Stats (Desktop) - Evenly spread top to down */}
        <div className="hidden lg:flex flex-col justify-between absolute right-8 xl:right-10 top-10 bottom-10 z-20 w-72 xl:w-80 py-1">
          {/* Box 1: Students */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-white shadow-xl space-y-1.5 transform hover:scale-105 transition-all hover:bg-slate-800/90 hover:border-white/25">
            <div className="flex items-center gap-2.5 text-indigo-300 font-extrabold text-base">
              <Users className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="tracking-tight">{formatStudents(campusMetrics.totalStudents)}</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              {campusMetrics.studentsSubtitle || 'Active learners across all faculties'}
            </p>
          </div>

          {/* Box 2: Graduate Placement */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-white shadow-xl space-y-1.5 transform hover:scale-105 transition-all hover:bg-slate-800/90 hover:border-white/25">
            <div className="flex items-center gap-2.5 text-emerald-400 font-extrabold text-base">
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="tracking-tight">{formatPlacement(campusMetrics.placementRate)}</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              {campusMetrics.placementSubtitle || 'Graduate employment within 90 days'}
            </p>
          </div>

          {/* Box 3: Total Faculty and Admin Staff */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-white shadow-xl space-y-1.5 transform hover:scale-105 transition-all hover:bg-slate-800/90 hover:border-white/25">
            <div className="flex items-center gap-2.5 text-amber-300 font-extrabold text-base">
              <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="tracking-tight">{formatFaculty(campusMetrics.facultyStaff)}</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              {campusMetrics.facultySubtitle || 'Academic educators & operational staff'}
            </p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-3xl text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 text-xs font-bold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{campusMetrics.heroBadgeText || 'Your Future is Now • Powered by Gemini'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white">
            Future-Ready Degrees, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-300">
              AI-Guided Success
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-2xl">
            Explore accredited university degrees, inspect weekly unit syllabi, and receive 24/7 personalized course guidance with our autonomous AI academic advisor.
          </p>

          {/* Search Bar Form */}
          <form onSubmit={handleHeroSearchSubmit} className="relative max-w-xl pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search degrees, unit codes (e.g. CS100, AI700, DATA3001)..."
                className="w-full pl-12 pr-28 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20 transition shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-indigo-600/40 flex items-center gap-1.5"
              >
                <span>Explore</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Action Badges / CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => onNavigateTab('courses')}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition shadow-lg flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-indigo-600" /> Browse Programs
            </button>
            <button
              onClick={() => onNavigateTab('application')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-600 text-white font-bold transition flex items-center gap-2 backdrop-blur-sm"
            >
              <FileCheck className="w-4 h-4 text-indigo-400" /> Application Form
            </button>
            <button
              onClick={onOpenClassroom}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-400/50 text-white font-bold transition flex items-center gap-2 backdrop-blur-sm"
            >
              <DoorOpen className="w-4 h-4" /> Classroom
            </button>
            <button
              onClick={() => onAskAgent('I need help picking the best degree for my career goals.')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/50 text-white font-bold transition flex items-center gap-2 backdrop-blur-sm"
            >
              <Bot className="w-4 h-4" /> Consult AI Agent
            </button>
          </div>

          {/* Mobile Quick Stats Strip (Under lg) */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-white/10 mt-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-xl text-white space-y-0.5">
              <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-sm">
                <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{formatStudents(campusMetrics.totalStudents)}</span>
              </div>
              <p className="text-[10px] text-slate-300 line-clamp-1">
                {campusMetrics.studentsSubtitle || 'Active learners across all faculties'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-xl text-white space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{formatPlacement(campusMetrics.placementRate)}</span>
              </div>
              <p className="text-[10px] text-slate-300 line-clamp-1">
                {campusMetrics.placementSubtitle || 'Graduate employment within 90 days'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-xl text-white space-y-0.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-sm">
                <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{formatFaculty(campusMetrics.facultyStaff)}</span>
              </div>
              <p className="text-[10px] text-slate-300 line-clamp-1">
                {campusMetrics.facultySubtitle || 'Academic educators & operational staff'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & CAPABILITIES STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('courses')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">14 Programs</div>
          <div className="text-xs font-bold text-slate-700 mt-0.5">Accredited Degrees</div>
          <div className="text-[11px] text-slate-400 mt-1">Undergraduate & Master's</div>
        </div>

        <div
          onClick={() => onNavigateTab('units')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">120+ Units</div>
          <div className="text-xs font-bold text-slate-700 mt-0.5">Curriculum Syllabuses</div>
          <div className="text-[11px] text-slate-400 mt-1">12-week lecture & lab plans</div>
        </div>

        <div
          onClick={() => onNavigateTab('events')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatPlacement(campusMetrics.placementRate).replace(' Placement', '')} Rate
          </div>
          <div className="text-xs font-bold text-slate-700 mt-0.5">Graduate Employment</div>
          <div className="text-[11px] text-slate-400 mt-1">Top 3 national ranking</div>
        </div>

        <div
          onClick={() => onNavigateTab('chat')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-3 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">24/7 Agent</div>
          <div className="text-xs font-bold text-slate-700 mt-0.5">Autonomous Advisor</div>
          <div className="text-[11px] text-slate-400 mt-1">Gemini & GCP sync</div>
        </div>
      </section>

      {/* 3. BLOCK 1: FEATURED UNIVERSITY DEGREES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">Degree Catalog 2026</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              Featured University Degrees
              <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
                Showing {displayedDegrees.length} of {COURSES_DATA.length}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDegreeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${degreeFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setDegreeFilter('Undergraduate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${degreeFilter === 'Undergraduate' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Undergraduate
            </button>
            <button
              onClick={() => setDegreeFilter('Postgraduate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${degreeFilter === 'Postgraduate' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Postgraduate
            </button>
            {!searchQuery && (
              <button
                onClick={reshuffleDegrees}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition border border-indigo-200/60 ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Shuffle Two Degrees
              </button>
            )}
          </div>
        </div>

        {/* Degree Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedDegrees.map((deg) => (
            <div
              key={deg.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-extrabold rounded-xl">
                    {deg.code}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {deg.durationYears} Years • {deg.degreeLevel}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {deg.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{deg.faculty}</p>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                  {deg.overview}
                </p>

                {/* Badges Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Entry Req</span>
                    <span className="text-xs font-black text-slate-800">
                      {deg.atarRequirement ? `ATAR ${deg.atarRequirement}` : `GPA ${deg.gpaRequirement}`}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Domestic Fee</span>
                    <span className="text-xs font-black text-emerald-600">
                      ${(deg.annualTuitionDomestic / 1000).toFixed(1)}k/yr
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Intl Fee</span>
                    <span className="text-xs font-black text-indigo-600">
                      ${(deg.annualTuitionInternational / 1000).toFixed(1)}k/yr
                    </span>
                  </div>
                </div>

                {/* Core Units */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Core Units</span>
                  <div className="flex flex-wrap gap-1.5">
                    {deg.coreUnits.slice(0, 4).map((unitCode) => (
                      <button
                        key={unitCode}
                        onClick={() => {
                          const unitObj = UNITS_DATA.find(u => u.code === unitCode);
                          if (unitObj) setSelectedUnitModal(unitObj);
                          else onExploreUnit(unitCode);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-mono font-semibold rounded-lg transition"
                      >
                        {unitCode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => onAskAgent(`Tell me about admission requirements, majors, and career outcomes for ${deg.title} (${deg.code})`)}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Ask AI Agent
                </button>
                <button
                  onClick={() => onApplyForCourse(deg)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition flex items-center gap-1"
                >
                  Apply Now &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 3. BLOCK 2: FEATURED UNIT SYLLABI */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">Academic Curriculum</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              Featured Unit Syllabi
              <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
                Showing {displayedSyllabi.length} of {UNITS_DATA.length}
              </span>
            </h2>
          </div>

          {!searchQuery && (
            <button
              onClick={reshuffleSyllabi}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition border border-indigo-200/60"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Shuffle Two Units
            </button>
          )}
        </div>

        {/* Syllabi Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedSyllabi.map((syll) => (
            <div
              key={syll.code}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-extrabold rounded-xl">
                    {syll.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {syll.creditPoints} CP • {syll.level}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {syll.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Offered: {syll.semestersOffered.join(' & ')} • {syll.deliveryMode}
                  </p>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                  {syll.overview}
                </p>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-700 block">
                    Key Learning Outcomes:
                  </span>
                  <ul className="list-disc pl-4 space-y-1">
                    {syll.learningOutcomes.slice(0, 2).map((outcome, idx) => (
                      <li key={idx} className="line-clamp-1">{outcome}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedUnitModal(syll)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-200"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600" /> View Full 12-Week Syllabus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 4. BLOCK 3: BLOG & INSIGHTS SPOT PANEL (CAROUSEL) */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">Campus News & Research</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">EduPulse Blog & Insights Spot Panel</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBlogCarousel('left')}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition shadow-sm"
              title="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollBlogCarousel('right')}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition shadow-sm"
              title="Scroll Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Slider */}
        <div
          id="blog-carousel-wrapper"
          className="flex gap-6 overflow-x-auto hide-scrollbar scroll-smooth py-2 px-1"
        >
          {blogPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedBlogModal(post)}
              className="min-w-[280px] sm:min-w-[340px] bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('/api/blog/proxy-image') && post.image) {
                        target.src = `/api/blog/proxy-image?url=${encodeURIComponent(post.image)}`;
                      } else {
                        target.src =
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
                      }
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    {post.type === 'youtube' && <Video className="w-3 h-3 text-red-400" />}
                    {post.type === 'linkedin' && <FileText className="w-3 h-3 text-blue-400" />}
                    <span>{post.tag}</span>
                  </span>

                  {post.type === 'youtube' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition">
                      <div className="w-11 h-11 rounded-full bg-red-600/90 group-hover:scale-110 text-white flex items-center justify-center shadow-lg transition-transform">
                        <Play className="w-4 h-4 ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400">{post.date}</span>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{post.snippet}</p>
                </div>
              </div>

              <div className="p-5 pt-0 text-xs font-bold text-indigo-600 flex items-center gap-1">
                <span>{post.type === 'youtube' ? 'Watch Video' : 'Read Post'}</span> &rarr;
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* MODAL: SYLLABUS DETAILS */}
      {selectedUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 relative custom-scrollbar">
            <button
              onClick={() => setSelectedUnitModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-extrabold rounded-xl">
                  {selectedUnitModal.code}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {selectedUnitModal.title}
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {selectedUnitModal.creditPoints} CP • {selectedUnitModal.level} • {selectedUnitModal.faculty}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-2xl text-xs text-amber-900 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Prerequisites:</strong> {selectedUnitModal.prerequisites.join(', ') || 'None'}</span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Detailed Course Description</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{selectedUnitModal.overview}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Learning Outcomes</h4>
                <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-1">
                  {selectedUnitModal.learningOutcomes.map((outcome, idx) => (
                    <li key={idx}>{outcome}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Assessment Breakdown</h4>
                <div className="space-y-2">
                  {selectedUnitModal.assessments.map((a, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{a.name}</span>
                        <p className="text-[10px] text-slate-400">Due: {typeof a.dueWeek === 'number' ? `Week ${a.dueWeek}` : a.dueWeek} • {a.type}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-extrabold rounded-xl">
                        {a.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    const code = selectedUnitModal.code;
                    setSelectedUnitModal(null);
                    onAskAgent(`Please provide a comprehensive study guide and weekly plan for unit ${code}.`);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
                >
                  <Bot className="w-4 h-4" /> Ask AI Agent About This Unit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BLOG POST & IN-APP VIDEO PLAYER */}
      {selectedBlogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 relative custom-scrollbar">
            <button
              onClick={() => setSelectedBlogModal(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedBlogModal.type === 'youtube' && selectedBlogModal.videoId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-600" />
                    <span>{selectedBlogModal.tag || 'YouTube Video'}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">• {selectedBlogModal.date}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                  {selectedBlogModal.title}
                </h2>

                {/* In-App Responsive Video Modal Player */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${selectedBlogModal.videoId}?autoplay=1&rel=0`}
                    title={selectedBlogModal.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="text-xs font-bold text-slate-700">Video Overview:</div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedBlogModal.content || selectedBlogModal.snippet}
                  </p>
                </div>

                {selectedBlogModal.url && (
                  <div className="flex justify-end pt-2">
                    <a
                      href={selectedBlogModal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      <span>Open on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                    {selectedBlogModal.type === 'linkedin' && <FileText className="w-3.5 h-3.5 text-blue-600" />}
                    <span>{selectedBlogModal.tag}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">• {selectedBlogModal.date}</span>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 leading-snug">
                  {selectedBlogModal.title}
                </h2>

                <p className="text-xs text-slate-400 font-semibold">
                  By {selectedBlogModal.author || 'EduPulse Editorial Team'}
                </p>

                <img
                  src={selectedBlogModal.image}
                  alt={selectedBlogModal.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-56 object-cover rounded-2xl my-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('/api/blog/proxy-image') && selectedBlogModal.image) {
                      target.src = `/api/blog/proxy-image?url=${encodeURIComponent(selectedBlogModal.image)}`;
                    } else {
                      target.src =
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
                    }
                  }}
                />

                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedBlogModal.content || selectedBlogModal.snippet}
                </p>

                {selectedBlogModal.url && (
                  <div className="pt-4 flex justify-end">
                    <a
                      href={selectedBlogModal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md"
                    >
                      <span>Read Full Post on LinkedIn</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Severe Emergency Advisory Modal (Triggered on Emergency Update Broadcast) */}
      <SevereEmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={handleAcknowledgeEmergency}
        title={campusMetrics.emergencyTitle}
        message={campusMetrics.emergencyAlert || ''}
        severity={campusMetrics.emergencySeverity}
        updatedAt={campusMetrics.emergencyUpdatedAt}
      />

    </div>
  );
};
