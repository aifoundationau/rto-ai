import { NextRequest, NextResponse } from 'next/server';

function getShortExtract(text: string, maxWords: number = 20): string {
  if (!text) return '';
  const cleaned = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(' ');
  }
  return words.slice(0, maxWords).join(' ') + '...';
}

function formatAuDate(dateInput?: string | Date | null): string {
  if (!dateInput) {
    return new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function cleanImageUrl(url: string): string {
  if (!url) return '';
  return url.replace(/&amp;/g, '&').trim();
}

function isValidThumbnail(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  // Filter out LinkedIn authwall placeholders and tiny tracking pixels/icons
  if (url.includes('static.licdn.com/aero-v1/sc/h/') || url.includes('static.licdn.com/sc/h/')) return false;
  if (url.includes('favicon') || url.includes('1x1') || url.includes('tracking') || url.includes('pixel')) return false;
  return true;
}

// Safe regex extraction helper to avoid TypeScript ES5 downlevelIteration TS2802 errors
function extractRegexMatches(html: string, regex: RegExp, groupIndex: number = 1): string[] {
  const matches: string[] = [];
  const gRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = gRegex.exec(html)) !== null) {
    if (m[groupIndex]) {
      matches.push(m[groupIndex]);
    }
  }
  return matches;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = (body.url || '').trim();
    const customImageUrl = (body.customImageUrl || '').trim();

    if (!rawUrl && !customImageUrl) {
      return NextResponse.json({ error: 'Please provide a valid LinkedIn Article, YouTube Video, or Image URL' }, { status: 400 });
    }

    // 0. Direct Image URL Detection (e.g. pasted media.licdn.com, jpg, png, webp)
    const isDirectImageUrl =
      /\.(jpeg|jpg|png|webp|avif|gif|svg)(\?.*)?$/i.test(rawUrl) ||
      rawUrl.includes('licdn.com') ||
      rawUrl.includes('images.unsplash.com') ||
      rawUrl.includes('fbcdn.net') ||
      rawUrl.includes('googleusercontent.com');

    if (isDirectImageUrl && !rawUrl.includes('linkedin.com/pulse') && !rawUrl.includes('linkedin.com/posts')) {
      const cleanImg = cleanImageUrl(rawUrl);
      return NextResponse.json({
        type: 'image',
        tag: rawUrl.includes('licdn.com') ? 'LinkedIn Thumbnail' : 'Campus Spotlight',
        title: 'Australian Higher Education Spotlight',
        thumbnail: cleanImg,
        foundImages: [cleanImg],
        hasAutoThumbnail: true,
        uploadDate: formatAuDate(new Date()),
        extract: 'Featured insights and academic leadership updates previewed for EduPulse Blog & Insights Spot Panel.',
        fullDescription: '',
        author: 'EduPulse Contributor',
        url: cleanImg,
      });
    }

    let urlObj: URL;
    try {
      urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const host = urlObj.hostname.toLowerCase();

    // 1. YouTube Video Detection & Extraction
    const isYouTube = host.includes('youtube.com') || host.includes('youtu.be');
    if (isYouTube) {
      let videoId = '';
      if (host.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1).split('/')[0];
      } else if (urlObj.pathname.includes('/shorts/')) {
        videoId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      } else if (urlObj.pathname.includes('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1]?.split('/')[0] || '';
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }

      if (!videoId) {
        return NextResponse.json({ error: 'Could not detect YouTube Video ID from URL' }, { status: 400 });
      }

      let title = 'YouTube Video';
      let author = 'YouTube Creator';
      let uploadDate = formatAuDate(new Date());
      let rawDescription = '';
      let thumbnail = customImageUrl || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const foundImages: string[] = [
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      ];
      if (customImageUrl && !foundImages.includes(customImageUrl)) {
        foundImages.unshift(customImageUrl);
      }

      // 1.1 Fetch official YouTube oEmbed endpoint
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedRes = await fetch(oembedUrl, { next: { revalidate: 3600 } });
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.title) title = oembedData.title;
          if (oembedData.author_name) author = oembedData.author_name;
          if (oembedData.thumbnail_url && !customImageUrl) {
            thumbnail = oembedData.thumbnail_url;
            if (!foundImages.includes(oembedData.thumbnail_url)) {
              foundImages.unshift(oembedData.thumbnail_url);
            }
          }
        }
      } catch (err) {
        console.warn('[BlogExtract] YouTube oEmbed fetch error:', err);
      }

      // 1.2 Fetch watch page HTML to extract upload date and full description
      try {
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const pageRes = await fetch(watchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-AU,en;q=0.9',
          },
        });

        if (pageRes.ok) {
          const html = await pageRes.text();

          // Extract upload date
          const dateMatch =
            html.match(/"uploadDate":"([^"]+)"/) ||
            html.match(/itemprop="uploadDate" content="([^"]+)"/) ||
            html.match(/"publishDate":"([^"]+)"/) ||
            html.match(/itemprop="datePublished" content="([^"]+)"/);

          if (dateMatch && dateMatch[1]) {
            uploadDate = formatAuDate(dateMatch[1]);
          }

          // Extract description
          const descMatch =
            html.match(/"shortDescription":"([^"]+)"/) ||
            html.match(/name="description" content="([^"]+)"/) ||
            html.match(/property="og:description" content="([^"]+)"/);

          if (descMatch && descMatch[1]) {
            rawDescription = descMatch[1];
          }
        }
      } catch (err) {
        console.warn('[BlogExtract] YouTube page scrape error:', err);
      }

      if (!rawDescription) {
        rawDescription = `Watch "${title}" presented by ${author} on YouTube.`;
      }

      const extract = getShortExtract(rawDescription, 20);

      return NextResponse.json({
        type: 'youtube',
        tag: 'YouTube Video',
        title,
        thumbnail,
        foundImages,
        hasAutoThumbnail: true,
        uploadDate,
        extract,
        fullDescription: rawDescription,
        videoId,
        author,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    // 2. LinkedIn Article / Post Detection & Extraction
    const isLinkedIn = host.includes('linkedin.com');
    if (isLinkedIn) {
      let title = 'LinkedIn Insight & Article';
      let author = 'EduPulse Industry Contributor';
      let uploadDate = formatAuDate(new Date());
      let rawDescription = '';
      let thumbnail = customImageUrl || '';
      const candidateImages: string[] = [];

      try {
        const pageRes = await fetch(urlObj.href, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-AU,en;q=0.9',
          },
        });

        if (pageRes.ok) {
          const html = await pageRes.text();

          // Title extraction
          const titleMatch =
            html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
            html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) ||
            html.match(/<title>([^<]+)<\/title>/i);

          if (titleMatch && titleMatch[1]) {
            const cleanTitle = titleMatch[1].replace(/\s*\|\s*LinkedIn$/i, '').replace(/\s*-\s*LinkedIn$/i, '').trim();
            if (!cleanTitle.toLowerCase().includes('top content on linkedin')) {
              title = cleanTitle;
            }
          }

          // Search for all candidate image URLs across OpenGraph, Twitter cards, and microdata
          const foundMetaImgs = [
            ...extractRegexMatches(html, /<meta[^>]+(?:property|name)=["'](?:og:image|og:image:url|og:image:secure_url|twitter:image|twitter:image:src|image)["'][^>]+content=["']([^"']+)["']/gi),
            ...extractRegexMatches(html, /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|og:image:url|og:image:secure_url|twitter:image|twitter:image:src|image)["']/gi),
            ...extractRegexMatches(html, /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi),
            ...extractRegexMatches(html, /data-delayed-url=["']([^"']+)["']/gi),
            ...extractRegexMatches(html, /<img[^>]+src=["']([^"']+)["']/gi),
            ...extractRegexMatches(html, /https:\/\/media\.licdn\.com\/[^\s"'<>]+/gi, 0),
          ];

          for (const rawImg of foundMetaImgs) {
            const clean = cleanImageUrl(rawImg);
            if (isValidThumbnail(clean) && !candidateImages.includes(clean)) {
              if (clean.includes('media.licdn.com')) {
                candidateImages.unshift(clean);
              } else {
                candidateImages.push(clean);
              }
            }
          }

          // Search JSON-LD blocks
          const jsonLdBlocks = extractRegexMatches(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
          for (const block of jsonLdBlocks) {
            try {
              const parsed = JSON.parse(block);
              const imgCandidate = parsed.image?.url || parsed.image || parsed.thumbnailUrl;
              if (typeof imgCandidate === 'string' && isValidThumbnail(imgCandidate)) {
                candidateImages.unshift(cleanImageUrl(imgCandidate));
              }
            } catch {}
          }

          // Description
          const descMatch =
            html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
            html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);

          if (descMatch && descMatch[1]) {
            const cleanDesc = descMatch[1].trim();
            if (!cleanDesc.toLowerCase().includes('explore top linkedin content')) {
              rawDescription = cleanDesc;
            }
          }

          // Date published
          const dateMatch =
            html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i) ||
            html.match(/"datePublished":"([^"]+)"/i);

          if (dateMatch && dateMatch[1]) {
            uploadDate = formatAuDate(dateMatch[1]);
          }

          // Author
          const authorMatch =
            html.match(/<meta\s+name="author"\s+content="([^"]+)"/i) ||
            html.match(/"author":\s*\{\s*"name":\s*"([^"]+)"/i);

          if (authorMatch && authorMatch[1]) {
            author = authorMatch[1];
          }
        }
      } catch (err) {
        console.warn('[BlogExtract] LinkedIn fetch error:', err);
      }

      if (!rawDescription) {
        rawDescription = `Insightful industry analysis and higher education leadership updates from LinkedIn.`;
      }

      const hasAutoThumbnail = candidateImages.length > 0;
      if (!thumbnail) {
        thumbnail = candidateImages[0] || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
      }

      const extract = getShortExtract(rawDescription, 20);

      return NextResponse.json({
        type: 'linkedin',
        tag: 'LinkedIn Article',
        title,
        thumbnail,
        foundImages: candidateImages,
        hasAutoThumbnail,
        hasAuthwallShield: !hasAutoThumbnail,
        authwallMessage: !hasAutoThumbnail
          ? 'LinkedIn shields images behind its authwall. Right-click the image on LinkedIn, select "Copy image address", and paste it into the Thumbnail Image URL field below for an instant live preview!'
          : null,
        uploadDate,
        extract,
        fullDescription: rawDescription,
        author,
        url: urlObj.href,
      });
    }

    // 3. Generic Web Article Metadata Extraction
    let title = urlObj.hostname;
    let author = 'EduPulse Editorial';
    let uploadDate = formatAuDate(new Date());
    let rawDescription = '';
    let thumbnail = customImageUrl || '';
    const candidateImages: string[] = [];

    try {
      const pageRes = await fetch(urlObj.href, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (pageRes.ok) {
        const html = await pageRes.text();

        const titleMatch =
          html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
          html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) title = titleMatch[1].trim();

        const imgMatches = [
          ...extractRegexMatches(html, /<meta[^>]+(?:property|name)=["'](?:og:image|og:image:url|twitter:image)["'][^>]+content=["']([^"']+)["']/gi),
          ...extractRegexMatches(html, /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi),
          ...extractRegexMatches(html, /<img[^>]+src=["']([^"']+)["']/gi),
        ];

        for (const rawImg of imgMatches) {
          const clean = cleanImageUrl(rawImg);
          if (isValidThumbnail(clean) && !candidateImages.includes(clean)) {
            candidateImages.push(clean);
          }
        }

        const descMatch =
          html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
          html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
        if (descMatch && descMatch[1]) rawDescription = descMatch[1];
      }
    } catch (err) {
      console.warn('[BlogExtract] Generic article fetch error:', err);
    }

    if (!thumbnail) {
      thumbnail = candidateImages[0] || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
    }

    if (!rawDescription) {
      rawDescription = `Higher education insights and campus updates from ${title}.`;
    }

    const extract = getShortExtract(rawDescription, 20);

    return NextResponse.json({
      type: 'article',
      tag: 'University Insight',
      title,
      thumbnail,
      foundImages: candidateImages,
      hasAutoThumbnail: candidateImages.length > 0,
      uploadDate,
      extract,
      fullDescription: rawDescription,
      author,
      url: urlObj.href,
    });
  } catch (err: any) {
    console.error('[BlogExtract] Top-level handler error:', err);
    return NextResponse.json({ error: err.message || 'Failed to extract URL metadata' }, { status: 500 });
  }
}
