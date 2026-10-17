import { NextRequest, NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase/admin';

export interface BlogPostItem {
  id: string;
  tag: string;
  date: string;
  title: string;
  image: string;
  snippet: string;
  content?: string;
  type?: 'youtube' | 'linkedin' | 'article';
  url?: string;
  videoId?: string;
  author?: string;
  createdAt?: string;
}

// In-memory fallback if Firestore is unreachable or in local dev
let inMemoryBlogPosts: BlogPostItem[] = [
  {
    id: 'post-1',
    tag: 'AI Research',
    date: '28 Sep 2026',
    title: 'EduPulse AI Research Group Unveils Autonomous Tutoring Agents',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    snippet: 'Our faculty researchers have deployed next-generation agentic workflows assisting over 5,000 students in real-time Python debugging.',
    content: 'The EduPulse AI Research Team today released its landmark findings on autonomous student tutoring agents. By linking Large Language Models directly to university autograders via Model Context Protocol (MCP), student completion rates in introductory computer science increased by 34%. Key takeaways include sub-second feedback on syntax errors and automated generation of personalized practice problems tailored to individual weak spots.',
    type: 'article',
    author: 'EduPulse AI Research Team',
    createdAt: '2026-09-28T09:00:00Z',
  },
  {
    id: 'post-2',
    tag: 'Admissions & ATAR',
    date: '24 Sep 2026',
    title: 'How to Apply for 2026 Early Offer Schemes & Scholarships',
    image: '/images/early-offer-scholarships-2026.jpg',
    snippet: 'Everything prospective Year 12 applicants need to know about early admissions, ATAR adjustments, and merit-based grants.',
    content: 'Applications for 2026 Early Entry and Vice-Chancellor Scholarships are officially open. High school students can submit predicted year 11/12 results through our direct EduPulse application portal to lock in conditional offers before final exams. Financial aid packages including equity grants and STEM leadership awards up to $10,000 per year are available.',
    type: 'article',
    author: 'Admissions Directorate',
    createdAt: '2026-09-24T10:00:00Z',
  },
  {
    id: 'post-3',
    tag: 'Campus Life',
    date: '20 Sep 2026',
    title: 'Inside the New $45M Robotics & High-Performance Compute Hub',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    snippet: 'Take a virtual tour of our newly opened engineering precinct, housing quantum computing simulators and autonomous vehicle labs.',
    content: 'Our new High-Performance Compute Hub was officially inaugurated this week. Designed to foster interdisciplinary research between computer science, medicine, and business analytics, the building features 24/7 student access pods, robotics testing tracks, and secure sandbox cloud environments.',
    type: 'article',
    author: 'Campus News Bureau',
    createdAt: '2026-09-20T11:00:00Z',
  },
  {
    id: 'post-4',
    tag: 'Career Pathways',
    date: '15 Sep 2026',
    title: '2026 Graduate Employability Ranking: EduPulse Ranks Top 3',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    snippet: 'Industry partnerships with global tech giants yield 96% employment within three months of graduation.',
    content: 'The latest national employment audit confirms our computer science and data analytics graduates enjoy industry-leading entry salaries and quick placement into global technology firms including Google, Atlassian, Microsoft, and Canva.',
    type: 'article',
    author: 'Graduate Careers Hub',
    createdAt: '2026-09-15T12:00:00Z',
  },
];

export async function GET() {
  if (!isFirebaseConfigured) {
    return NextResponse.json({ posts: inMemoryBlogPosts });
  }
  try {
    const posts: BlogPostItem[] = [];
    try {
      const snapshot = await db.collection('blog_posts').orderBy('createdAt', 'desc').get();
      if (!snapshot.empty) {
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...(doc.data() as any) });
        });
      }
    } catch (dbErr) {
      console.warn('[BlogRoute] Firestore get error, using fallback:', dbErr);
    }

    if (posts.length === 0) {
      return NextResponse.json({ posts: inMemoryBlogPosts });
    }

    // Merge default posts if not already present
    const existingIds = new Set(posts.map((p) => p.id));
    for (const defPost of inMemoryBlogPosts) {
      if (!existingIds.has(defPost.id)) {
        posts.push(defPost);
      }
    }

    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error('[BlogRoute] GET error:', err);
    return NextResponse.json({ posts: inMemoryBlogPosts });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, tag, date, image, snippet, content, type, url, videoId, author } = body;

    if (!title?.trim() || !image?.trim()) {
      return NextResponse.json({ error: 'Title and thumbnail image are required' }, { status: 400 });
    }

    const postId = `post-${Date.now()}`;
    const newPost: BlogPostItem = {
      id: postId,
      title: title.trim(),
      tag: (tag || (type === 'youtube' ? 'YouTube Video' : 'LinkedIn Article')).trim(),
      date: (date || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })).trim(),
      image: image.trim(),
      snippet: (snippet || title).trim(),
      content: content || snippet || '',
      type: type || 'article',
      url: url || '',
      videoId: videoId || '',
      author: author || 'EduPulse Editorial Team',
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      await db.collection('blog_posts').doc(postId).set(newPost);
    } catch (dbErr) {
      console.warn('[BlogRoute] Firestore save fallback to in-memory:', dbErr);
    }

    // Always update in-memory cache as well
    inMemoryBlogPosts = [newPost, ...inMemoryBlogPosts];

    return NextResponse.json({ success: true, post: newPost });
  } catch (err: any) {
    console.error('[BlogRoute] POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    try {
      await db.collection('blog_posts').doc(id).delete();
    } catch (dbErr) {
      console.warn('[BlogRoute] Firestore delete fallback:', dbErr);
    }

    inMemoryBlogPosts = inMemoryBlogPosts.filter((p) => p.id !== id);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('[BlogRoute] DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete post' }, { status: 500 });
  }
}
