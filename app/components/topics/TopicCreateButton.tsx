'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getCurrentUserClient } from '@/lib/auth-client';
import { USER_ROLES } from '@/lib/constants/roles';
import { useRouter } from 'next/navigation';

export default function TopicCreateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [goals, setGoals] = useState('');
  const [activity, setActivity] = useState('');
  const [weeks, setWeeks] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 관리자 권한 확인
      const user = await getCurrentUserClient();
      if (!user || user.role !== USER_ROLES.ADMIN) {
        alert('관리자만 주제를 생성할 수 있습니다.');
        setIsSubmitting(false);
        return;
      }

      const supabase = createBrowserClient();
      const { error } = await supabase.from('topics').insert({
        title,
        goals,
        activity,
        weeks: weeks === '' ? null : Number(weeks),
      });

      if (error) throw error;

      // 성공 시 모달 닫고 페이지 새로고침
      setIsOpen(false);
      setTitle('');
      setGoals('');
      setActivity('');
      setWeeks('');
      router.refresh();
    } catch (error) {
      console.error('글 작성 오류:', error);
      alert('글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300"
      >
        글쓰기
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                새 글 작성
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="주제 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  학습 내용
                </label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  required
                  rows={4}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="학습 내용을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  단원 핵심 역량
                </label>
                <textarea
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  required
                  rows={4}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="단원 핵심 역량을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  주차 (선택사항)
                </label>
                <input
                  type="number"
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value === '' ? '' : Number(e.target.value))}
                  min="1"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="주차를 입력하세요"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
                >
                  {isSubmitting ? '작성 중...' : '작성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


