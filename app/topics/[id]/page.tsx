import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAdminServer } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TopicPageClient from './TopicPageClient';

interface TopicPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { id } = await params;
  const topicId = parseInt(id, 10);
  if (Number.isNaN(topicId)) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: topic, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single();

  if (error || !topic) notFound();

  const isAdmin = await isAdminServer();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white hover:bg-orange-600"
          >
            ← 수업 질문 목록
          </Link>
        </header>
        <TopicPageClient topic={topic} isAdmin={isAdmin} />
      </main>
    </div>
  );
}
