import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAdminServer, isUserServer, getCurrentUserServer } from '@/lib/auth';
import { Topic } from '@/lib/types';
import TopicCreateButton from './components/topics/TopicCreateButton';
import LoginButton from './components/auth/LoginButton';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('데이터 조회 오류:', error);
  }

  const isAdmin = await isAdminServer();
  const isUser = await isUserServer();
  const currentUser = await getCurrentUserServer();

  // 로그인한 user의 주제별 메모 개수 (admin이 아닐 때만)
  let memoCountByTopicId: Record<number, number> = {};
  if (currentUser && !isAdmin) {
    const { data: memos } = await supabase
      .from('memos')
      .select('topic_id')
      .eq('user_id', currentUser.id);
    (memos || []).forEach((row) => {
      const tid = Number(row.topic_id);
      memoCountByTopicId[tid] = (memoCountByTopicId[tid] ?? 0) + 1;
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* 헤더 */}
        <header className="mb-6">
          <div className="mb-4 flex items-center justify-end gap-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">사용자 정보:</span>
            {currentUser ? (
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">역할:</span>{' '}
                <span className="rounded-md bg-zinc-200 px-2 py-1 dark:bg-zinc-800">
                  {currentUser.role}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  (isUser: {isUser ? 'true' : 'false'})
                </span>
              </div>
            ) : (
              <span className="text-sm text-zinc-400 dark:text-zinc-500">로그인 필요</span>
            )}
            <LoginButton />
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              수업 주제
            </h1>
            {isAdmin && <TopicCreateButton />}
          </div>
        </header>

        {/* 수업 주제 목록 (메모는 주제별 페이지에서만 표시) */}
        {error ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            {(topics ?? []).length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                등록된 수업 주제가 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {(topics ?? []).map((topic: Topic) => {
                  const memoCount = currentUser && !isAdmin ? (memoCountByTopicId[topic.id] ?? 0) : null;
                  return (
                    <li key={topic.id}>
                      <Link
                        href={`/topics/${topic.id}`}
                        className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                          {topic.title}
                        </h2>
                        {memoCount !== null ? (
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {memoCount}개
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-400 dark:text-zinc-500">&gt;</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {(topics ?? []).length > 0 && (
              <div className="border-t border-zinc-200 bg-white px-6 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                총 {(topics ?? []).length}개의 수업 주제
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
