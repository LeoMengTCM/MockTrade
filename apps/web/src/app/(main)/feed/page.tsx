'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/formatters';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/cn';
import { MessageCircle, Send } from 'lucide-react';

interface Post {
  id: string; userId: string; username: string; avatarUrl: string;
  content: string; createdAt: string; commentCount: number;
}

interface Comment {
  id: string; userId: string; username: string; content: string; createdAt: string;
}

export default function FeedPage() {
  const { isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, Comment[]>>({});

  useEffect(() => {
    if (isAuthenticated) api.get('/social/feed').then(r => setPosts(r.data.items || [])).catch(() => {});
  }, [isAuthenticated]);

  const submitPost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await api.post('/social/posts', { content: newPost });
      setNewPost('');
      const r = await api.get('/social/feed');
      setPosts(r.data.items || []);
    } catch {}
    setPosting(false);
  };

  const loadComments = async (postId: string) => {
    if (expandedComments[postId]) {
      const copy = { ...expandedComments };
      delete copy[postId];
      setExpandedComments(copy);
      return;
    }
    const r = await api.get(`/social/posts/${postId}/comments`);
    setExpandedComments({ ...expandedComments, [postId]: r.data || [] });
  };

  const submitComment = async (postId: string, content: string) => {
    if (!content.trim()) return;
    await api.post(`/social/posts/${postId}/comments`, { content });
    loadComments(postId);
  };

  if (!isAuthenticated) return <div className="py-12 text-center text-[var(--text-muted)]">Please login to see feed</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Activity Feed</h1>

      {/* New Post */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share your trading thoughts..."
          className="w-full bg-transparent text-sm outline-none resize-none" rows={3} />
        <div className="flex justify-end mt-2">
          <button onClick={submitPost} disabled={posting || !newPost.trim()}
            className="rounded-lg bg-accent-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-primary/80 disabled:opacity-50">
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 && <div className="py-8 text-center text-[var(--text-muted)]">No posts yet. Follow some traders!</div>}
      {posts.map(post => (
        <div key={post.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-xs font-bold">
              {post.username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium">{post.username}</div>
              <div className="text-xs text-[var(--text-muted)]">{timeAgo(post.createdAt)}</div>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{post.content}</p>
          <button onClick={() => loadComments(post.id)} className="flex items-center gap-1 mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <MessageCircle size={14} />
            {post.commentCount} comments
          </button>

          {/* Comments */}
          {expandedComments[post.id] && (
            <div className="mt-3 pt-3 border-t border-[var(--border-color)] space-y-2">
              {expandedComments[post.id]?.map(c => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <span className="font-medium text-xs">{c.username}:</span>
                  <span className="text-[var(--text-secondary)] text-xs">{c.content}</span>
                </div>
              ))}
              <CommentInput onSubmit={(content) => submitComment(post.id, content)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CommentInput({ onSubmit }: { onSubmit: (content: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-2 mt-2">
      <input value={value} onChange={e => setValue(e.target.value)} placeholder="Add a comment..."
        className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs outline-none"
        onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { onSubmit(value); setValue(''); } }} />
      <button onClick={() => { if (value.trim()) { onSubmit(value); setValue(''); } }}
        className="rounded-lg bg-accent-primary/10 p-1.5 text-accent-primary hover:bg-accent-primary/20">
        <Send size={14} />
      </button>
    </div>
  );
}
