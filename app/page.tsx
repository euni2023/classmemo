import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserServer } from '@/lib/auth';
import { Topic } from '@/lib/types';
import TopicCreateButton from './components/topics/TopicCreateButton';
import LoginButton from './components/auth/LoginButton';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const currentUser = await getCurrentUserServer();

  // 로그인한 사용자만 토픽 목록을 조회합니다.
  const isAdmin = currentUser ? (currentUser.role === 'admin') : false;
  const isUser = currentUser ? (currentUser.role === 'user') : false;

  let topics: Topic[] | null = null;
  let topicsError: any = null;

  if (currentUser) {
    const result = await supabase
      .from('topics')
      .select('*')
      .order('id', { ascending: false });
    topics = result.data;
    topicsError = result.error;
    if (topicsError) {
      console.error('데이터 조회 오류:', topicsError);
    }
  }

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
            {currentUser && <LoginButton />}
          </div>
        </header>

        {/* 로그인하지 않은 경우에는 토픽 목록을 표시하지 않습니다. */}
        {!currentUser ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <p className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              정보과학 수업 메모
            </p>
            <p className="mb-6">로그인 또는 회원가입 후 수업 질문을 확인할 수 있습니다.</p>
            {/* 헤더의 LoginButton과 동일하지만, 화면 중앙에 추가로 노출 */}
            <div className="flex items-center justify-center">
              <LoginButton />
            </div>
          </div>
        ) : topicsError ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-start gap-3 px-6 py-6">
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              수업 질문
            </h1>
            {isAdmin && <TopicCreateButton />}
          </div>
            {(topics ?? []).length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                등록된 수업 질문이 없습니다.
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
                총 {(topics ?? []).length}개의 수업 질문
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
