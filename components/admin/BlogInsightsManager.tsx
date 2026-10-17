import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Link2,
  Video,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Play,
  Eye,
  Check,
  Search,
  ArrowRight,
  Globe,
  Image as ImageIcon,
  CheckCheck,
  Copy,
  ClipboardPaste,
  ShieldAlert,
  Send,
  Layers
} from 'lucide-react';
import { auth } from '@/lib/firebase/client';

export interface BlogPostItem {
  id: string;
  tag: string;
  date: string;
  title: string;
  image: string;
  snippet: string;
  content?: string;
  type?: 'youtube' | 'linkedin' | 'article' | 'image';
  url?: string;
  videoId?: string;
  author?: string;
  createdAt?: string;
}

export const BlogInsightsManager: React.FC = () => {
  // Main URL inputs
  const [urlInput, setUrlInput] = useState('');
  const [directImageUrlInput, setDirectImageUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'extract' | 'manual'>('extract');

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);
  const [authwallNotice, setAuthwallNotice] = useState<string | null>(null);

  // Extracted / Editing draft post
  const [draftPost, setDraftPost] = useState<Partial<BlogPostItem> | null>(null);
  const [foundImagesList, setFoundImagesList] = useState<string[]>([]);

  // Image load & preview status
  const [imageLoadStatus, setImageLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [usingProxy, setUsingProxy] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Published posts list
  const [publishedPosts, setPublishedPosts] = useState<BlogPostItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Video preview modal inside admin
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  // Helper to count words
  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  // Helper to trim words to 20
  const enforceMaxWords = (text: string, max: number = 20) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= max) return text;
    return words.slice(0, max).join(' ');
  };

  const fetchPublishedPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const res = await fetch('/api/blog');
      const data = await res.json();
      let posts: BlogPostItem[] = data && Array.isArray(data.posts) ? data.posts : [];

      // Merge with custom posts saved locally in browser
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
        console.warn('[BlogInsightsManager] LocalStorage read error:', e);
      }

      setPublishedPosts(posts);
    } catch (err) {
      console.warn('[BlogInsightsManager] Fetch error:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPublishedPosts();
  }, []);

  const handleExtractMetadata = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    const cleanImgUrl = directImageUrlInput.trim();

    if (!cleanUrl && !cleanImgUrl) {
      setExtractError('Please enter a LinkedIn Article, YouTube Video URL, or Image URL.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractError(null);
      setExtractSuccess(null);
      setAuthwallNotice(null);
      setImageLoadStatus('loading');
      setUsingProxy(false);

      const res = await fetch('/api/blog/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanUrl || cleanImgUrl,
          customImageUrl: cleanImgUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to extract metadata.');
      }

      const initialThumb = cleanImgUrl || data.thumbnail || '';
      setFoundImagesList(data.foundImages || (initialThumb ? [initialThumb] : []));

      if (data.hasAuthwallShield && data.authwallMessage) {
        setAuthwallNotice(data.authwallMessage);
      }

      setDraftPost({
        title: data.title || '',
        tag: data.tag || (data.type === 'youtube' ? 'YouTube Video' : 'LinkedIn Article'),
        date: data.uploadDate || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
        image: initialThumb,
        snippet: data.extract || '',
        content: data.fullDescription || data.extract || '',
        type: data.type || 'article',
        url: data.url || cleanUrl,
        videoId: data.videoId || '',
        author: data.author || 'EduPulse Contributor',
      });

      if (data.type === 'image') {
        setExtractSuccess('Direct Image URL detected and previewed on postcard! No upload required.');
      } else {
        setExtractSuccess(
          `Extracted ${data.type === 'youtube' ? 'YouTube Video' : 'LinkedIn Article'} data! Image URL found & previewed below.`
        );
      }
    } catch (err: any) {
      console.error('[BlogInsightsManager] Extraction error:', err);
      setExtractError(err.message || 'Could not parse link. You can enter details manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSelectThumbnail = (imgUrl: string) => {
    setUsingProxy(false);
    setImageLoadStatus('loading');
    setDraftPost((prev) => (prev ? { ...prev, image: imgUrl } : null));
  };

  const handleUpdateImageUrl = (newUrl: string) => {
    setUsingProxy(false);
    setImageLoadStatus('loading');
    setDraftPost((prev) => (prev ? { ...prev, image: newUrl } : { image: newUrl }));
  };

  const pasteImageFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.startsWith('http')) {
          handleUpdateImageUrl(text.trim());
          setExtractSuccess('Image URL pasted from clipboard! Live preview updating...');
        } else {
          setExtractError('Clipboard does not contain a valid URL starting with http.');
        }
      } else {
        setExtractError('Clipboard access not allowed by browser. Please paste URL manually.');
      }
    } catch (err) {
      setExtractError('Unable to access clipboard. Please paste URL manually into the field.');
    }
  };

  const copyDraftImageUrl = () => {
    if (draftPost?.image) {
      navigator.clipboard.writeText(draftPost.image);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handlePublishPost = async () => {
    if (!draftPost?.title || !draftPost?.image) {
      setExtractError('Title and thumbnail image URL are required before publishing.');
      return;
    }

    try {
      setIsPublishing(true);
      setExtractError(null);

      // Ensure snippet is capped at 20 words
      const finalSnippet = enforceMaxWords(draftPost.snippet || draftPost.title, 20);

      // Obtain client auth token if signed in
      let authHeader = '';
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken) authHeader = `Bearer ${idToken}`;
      } catch (e) {}

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch('/api/blog', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...draftPost,
          snippet: finalSnippet,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to publish post.');
      }

      // Persist to browser localStorage so post is always visible on website & admin panel
      const publishedPost: BlogPostItem = data.post || {
        id: `post-${Date.now()}`,
        ...draftPost,
        snippet: finalSnippet,
        createdAt: new Date().toISOString(),
      };

      try {
        const stored = localStorage.getItem('edupulse_custom_blog_posts');
        const existing: BlogPostItem[] = stored ? JSON.parse(stored) : [];
        const updated = [publishedPost, ...existing.filter((p) => p.id !== publishedPost.id)];
        localStorage.setItem('edupulse_custom_blog_posts', JSON.stringify(updated));
        window.dispatchEvent(new Event('edupulse_blog_updated'));
      } catch (e) {
        console.warn('[BlogInsightsManager] LocalStorage save error:', e);
      }

      setExtractSuccess('Postcard published to EduPulse Blog & Insights Spot Panel successfully!');
      setDraftPost(null);
      setFoundImagesList([]);
      setUrlInput('');
      setDirectImageUrlInput('');
      setAuthwallNotice(null);
      await fetchPublishedPosts();
    } catch (err: any) {
      console.error('[BlogInsightsManager] Publish error:', err);
      setExtractError(err.message || 'Failed to publish.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      // 1. Remove from localStorage
      try {
        const stored = localStorage.getItem('edupulse_custom_blog_posts');
        if (stored) {
          const localPosts: BlogPostItem[] = JSON.parse(stored).filter((p: any) => p.id !== id);
          localStorage.setItem('edupulse_custom_blog_posts', JSON.stringify(localPosts));
          window.dispatchEvent(new Event('edupulse_blog_updated'));
        }
      } catch (e) {}

      // 2. Call DELETE endpoint
      let authHeader = '';
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken) authHeader = `Bearer ${idToken}`;
      } catch (e) {}

      const headers: Record<string, string> = {};
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`/api/blog?id=${id}`, { method: 'DELETE', headers });
      setPublishedPosts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.warn('[BlogInsightsManager] Delete error:', err);
    }
  };

  // Quick test demo presets
  const loadSampleYouTube = () => {
    setUrlInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    setDirectImageUrlInput('');
    setExtractError(null);
  };

  const loadSampleLinkedIn = () => {
    setUrlInput('https://www.linkedin.com/pulse/future-higher-education-ai-student-services-edupulse-australia');
    setDirectImageUrlInput('');
    setExtractError(null);
  };

  const loadSampleLinkedInImageUrl = () => {
    const sampleImg =
      'https://media.licdn.com/dms/image/v2/D4E03AQH2VjWzDl985w/profile-displayphoto-scale_200_200/B4EZu.6slqI4Ac-/0/1768434617115?e=2147483647&v=beta&t=w01CmE8UYevK124Ck1h6qotLUT6FlHkHn6BZenxdTZk';
    setUrlInput(sampleImg);
    setDirectImageUrlInput(sampleImg);
    setExtractError(null);
  };

  // Initialize a blank manual draft
  const startManualDraft = () => {
    setDraftPost({
      title: 'Australian Higher Education Spotlight',
      tag: 'LinkedIn Article',
      date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      image:
        'https://media.licdn.com/dms/image/v2/D4E03AQH2VjWzDl985w/profile-displayphoto-scale_200_200/B4EZu.6slqI4Ac-/0/1768434617115?e=2147483647&v=beta&t=w01CmE8UYevK124Ck1h6qotLUT6FlHkHn6BZenxdTZk',
      snippet: 'Key findings and policy analysis for university admissions staff and tertiary education leaders.',
      type: 'linkedin',
      url: 'https://www.linkedin.com',
      author: 'EduPulse Contributor',
    });
    setImageLoadStatus('loading');
    setUsingProxy(false);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Spot Panel Submissions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              EduPulse Blog & Insights Spot Panel Manager
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              <strong>Zero Image Uploads:</strong> No image files are ever uploaded or stored. The system finds the image URL directly (or accepts a pasted LinkedIn thumbnail image URL), links to it, and renders an instant live preview on the postcard.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchPublishedPosts}
              disabled={isLoadingPosts}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition cursor-pointer"
              title="Refresh published posts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPosts ? 'animate-spin text-indigo-300' : ''}`} />
              <span>Refresh Posts</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Submission & Extraction Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <span>Paste Article, Video, or Thumbnail Image URL</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports LinkedIn Articles, YouTube Videos, or direct LinkedIn Image URLs (<code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">media.licdn.com</code>).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('extract')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'extract' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Smart Extractor
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('manual');
                if (!draftPost) startManualDraft();
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'manual' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direct Postcard Builder
            </button>
          </div>
        </div>

        {activeTab === 'extract' && (
          <form onSubmit={handleExtractMetadata} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Article / Post / Video Link
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.linkedin.com/pulse/... or https://www.youtube.com/watch?v=... or image URL"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>2. Optional: Direct Thumbnail Image URL (No upload needed)</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const txt = await navigator.clipboard.readText();
                        if (txt) setDirectImageUrlInput(txt.trim());
                      } catch {}
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste from Clipboard</span>
                  </button>
                </div>
                <input
                  type="url"
                  value={directImageUrlInput}
                  onChange={(e) => setDirectImageUrlInput(e.target.value)}
                  placeholder="Optional: Paste direct LinkedIn image address (media.licdn.com) if already copied..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              {/* Quick presets for test demo */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Quick Demo Links:</span>
                <button
                  type="button"
                  onClick={loadSampleYouTube}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium cursor-pointer transition text-[11px]"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Sample YouTube</span>
                </button>
                <button
                  type="button"
                  onClick={loadSampleLinkedIn}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium cursor-pointer transition text-[11px]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sample LinkedIn Article</span>
                </button>
                <button
                  type="button"
                  onClick={loadSampleLinkedInImageUrl}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium cursor-pointer transition text-[11px]"
                  title="Loads a signed media.licdn.com thumbnail URL directly"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Sample LinkedIn Image URL</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isExtracting}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>{isExtracting ? 'Finding Image & Data...' : 'Find Image URL & Preview'}</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'manual' && !draftPost && (
          <div className="text-center py-6">
            <button
              type="button"
              onClick={startManualDraft}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Postcard with Direct Image URL</span>
            </button>
          </div>
        )}

        {/* Status Feedback */}
        {extractError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}

        {extractSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{extractSuccess}</span>
          </div>
        )}

        {authwallNotice && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-3 animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">LinkedIn Image URL Tip:</span>
              <p className="text-amber-700 leading-relaxed">
                LinkedIn protects images behind an authwall. To use the exact thumbnail: In LinkedIn, right-click the image &rarr; choose <strong>&ldquo;Copy image address&rdquo;</strong>, then paste that URL directly into the <strong>Thumbnail Image URL</strong> box below! It will preview instantly without uploading.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Live Image URL Inspector & Postcard Preview */}
      {draftPost && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Image URL Preview & Postcard</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Live Postcard Appearance (Zero File Upload)
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraftPost(null);
                  setFoundImagesList([]);
                  setAuthwallNotice(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Discard Draft
              </button>
              <button
                type="button"
                onClick={handlePublishPost}
                disabled={isPublishing}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 text-slate-950 text-xs font-extrabold transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing...' : 'Save & Publish Postcard'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* The Postcard Rendering (Exact match with Home Carousel) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 self-start flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Postcard on Landing Page</span>
              </div>

              <div className="w-full max-w-[340px] bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl flex flex-col justify-between text-slate-900">
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-100 group">
                    <img
                      src={
                        usingProxy && draftPost.image
                          ? `/api/blog/proxy-image?url=${encodeURIComponent(draftPost.image)}`
                          : draftPost.image || ''
                      }
                      alt={draftPost.title || 'Thumbnail'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition duration-300"
                      onLoad={() => setImageLoadStatus('success')}
                      onError={() => {
                        if (!usingProxy && draftPost.image) {
                          setUsingProxy(true);
                        } else {
                          setImageLoadStatus('error');
                        }
                      }}
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      {draftPost.type === 'youtube' && <Video className="w-3 h-3 text-red-400" />}
                      {draftPost.type === 'linkedin' && <FileText className="w-3 h-3 text-blue-400" />}
                      <span>{draftPost.tag || 'Campus Spot'}</span>
                    </span>

                    {draftPost.type === 'youtube' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <span>{draftPost.date}</span>
                      {draftPost.author && (
                        <>
                          <span>•</span>
                          <span className="truncate">{draftPost.author}</span>
                        </>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                      {draftPost.title}
                    </h4>

                    {/* Up to 20 words extract */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {draftPost.snippet}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 text-xs font-bold text-indigo-600 flex items-center justify-between border-t border-slate-100 mt-2">
                  <span className="flex items-center gap-1">
                    {draftPost.type === 'youtube' ? 'Watch In-App Video' : 'Read Full Post'} &rarr;
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      countWords(draftPost.snippet || '') > 20
                        ? 'bg-rose-100 text-rose-700 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {countWords(draftPost.snippet || '')}/20 words
                  </span>
                </div>
              </div>

              {/* Image URL Load Status Indicator */}
              <div className="mt-3 w-full max-w-[340px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Image URL Status:</span>
                </span>
                {imageLoadStatus === 'success' && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Loaded {usingProxy ? '(via Proxy)' : '(Direct)'}</span>
                  </span>
                )}
                {imageLoadStatus === 'loading' && (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Rendering URL...</span>
                  </span>
                )}
                {imageLoadStatus === 'error' && (
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Direct 403 / Error</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUsingProxy(true)}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Use Proxy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Fields: Image URL, Title, Date, Extract */}
            <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Thumbnail Image URL & Attributes</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Pure URL Reference (No Upload)</span>
                </span>
              </div>

              {/* Dedicated Image URL Field with Instant Live Preview */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/40 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Thumbnail Image URL</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Live URL: paste any image link to preview immediately
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={draftPost.image || ''}
                    onChange={(e) => handleUpdateImageUrl(e.target.value.trim())}
                    placeholder="https://media.licdn.com/dms/image/... or any image URL"
                    className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={pasteImageFromClipboard}
                    className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="Paste Image URL from Clipboard"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Paste</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyDraftImageUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                    title="Copy Image URL"
                  >
                    {copiedUrl ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {draftPost.image && (
                    <a
                      href={draftPost.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition flex items-center"
                      title="Open Image URL in New Tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Helper instruction */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Updates the preview card instantly as you type or paste.</span>
                  {usingProxy ? (
                    <span className="text-indigo-300 font-medium">Image routed via Proxy</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setUsingProxy(true)}
                      className="text-slate-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Force image proxy
                    </button>
                  )}
                </div>
              </div>

              {/* Found Image URLs list (if article had multiple images) */}
              {foundImagesList.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Candidate Images Found ({foundImagesList.length}) — Click to switch thumbnail:</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {foundImagesList.map((img, idx) => {
                      const isSelected = draftPost.image === img;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectThumbnail(img)}
                          className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition ${
                            isSelected
                              ? 'border-indigo-400 ring-2 ring-indigo-400/40 scale-105'
                              : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Candidate ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `/api/blog/proxy-image?url=${encodeURIComponent(img)}`;
                            }}
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Post Title</label>
                <input
                  type="text"
                  value={draftPost.title || ''}
                  onChange={(e) => setDraftPost((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Upload Date & Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Date (AU Format)</label>
                  <input
                    type="text"
                    value={draftPost.date || ''}
                    onChange={(e) => setDraftPost((prev) => ({ ...prev, date: e.target.value }))}
                    placeholder="e.g. 17 Oct 2026"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={draftPost.tag || ''}
                    onChange={(e) => setDraftPost((prev) => ({ ...prev, tag: e.target.value }))}
                    placeholder="YouTube Video, LinkedIn Article, etc."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Short Extract (up to 20 words) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Short Extract (up to 20 words)
                  </label>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      countWords(draftPost.snippet || '') > 20
                        ? 'bg-rose-900/60 text-rose-300 font-bold'
                        : 'bg-indigo-900/60 text-indigo-300'
                    }`}
                  >
                    {countWords(draftPost.snippet || '')} / 20 words
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={draftPost.snippet || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setDraftPost((prev) => ({ ...prev, snippet: text }));
                  }}
                  placeholder="Enter a brief summary of the article or video..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Trims automatically on publish if over 20 words.</span>
                  {countWords(draftPost.snippet || '') > 20 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraftPost((prev) => ({
                          ...prev,
                          snippet: enforceMaxWords(prev?.snippet || '', 20),
                        }))
                      }
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                    >
                      Trim to 20 words now
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handlePublishPost}
                  disabled={isPublishing}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 text-slate-950 text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPublishing ? 'Publishing...' : 'Save & Publish Postcard'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Published Posts on the Spot Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Published Spot Panel Posts ({publishedPosts.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              These postcards are currently rendered on the EduPulse landing page carousel.
            </p>
          </div>
        </div>

        {publishedPosts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No posts published yet. Paste a LinkedIn, YouTube, or Image URL above to publish your first post!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {publishedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
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
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      {post.type === 'youtube' && <Video className="w-3 h-3 text-red-400" />}
                      {post.type === 'linkedin' && <FileText className="w-3 h-3 text-blue-400" />}
                      <span>{post.tag}</span>
                    </span>

                    {post.type === 'youtube' && post.videoId && (
                      <button
                        type="button"
                        onClick={() => setPreviewVideoId(post.videoId || null)}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition cursor-pointer"
                        title="Preview video"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 ml-0.5" />
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <span>{post.date}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {post.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">{post.snippet}</p>

                    <div className="text-[10px] text-slate-400 font-mono truncate" title={post.image}>
                      Img: {post.image}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>Visit Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div>
                    {deleteConfirmId === post.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(post.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. In-App Video Modal Preview (inside Admin) */}
      {previewVideoId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setPreviewVideoId(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-red-500" />
                <span>In-App YouTube Video Player</span>
              </span>
              <button
                onClick={() => setPreviewVideoId(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
              >
                Close &times;
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1&rel=0`}
                title="YouTube Video Player"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
