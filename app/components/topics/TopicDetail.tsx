'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getCurrentUserClient, isAdminClient } from '@/lib/auth-client';
import { TopicDetailProps, Memo } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants/roles';
import { useRouter } from 'next/navigation';

interface MemoWithUser extends Memo {
  users: {
    name: string;
    email: string;
  };
}

export default function TopicDetail({ topic, isOpen, onClose }: TopicDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [goals, setGoals] = useState(topic.goals);
  const [activity, setActivity] = useState(topic.activity);
  const [weeks, setWeeks] = useState<number | ''>(topic.weeks ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMemos, setShowMemos] = useState(false);
  const [memos, setMemos] = useState<MemoWithUser[]>([]);
  const [isLoadingMemos, setIsLoadingMemos] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    
    const checkAdmin = async () => {
      const admin = await isAdminClient();
      setIsAdmin(admin);
    };

    // 초기 역할 확인
    checkAdmin();

    // 인증 상태 변경 감지 - 로그인/로그아웃 시 역할 재확인
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  // topic이 변경될 때마다 폼 값 업데이트
  useEffect(() => {
    setTitle(topic.title);
    setGoals(topic.goals);
    setActivity(topic.activity);
    setWeeks(topic.weeks ?? '');
    setIsEditing(false);
    setShowMemos(false);
  }, [topic]);

  // 메모 조회
  useEffect(() => {
    if (showMemos && isAdmin && isOpen) {
      loadMemos();
    }
  }, [showMemos, isAdmin, isOpen, topic.id]);

  const loadMemos = async () => {
    if (!isAdmin) return;
    setIsLoadingMemos(true);
    try {
      const supabase = createBrowserClient();
      
      // 메모 조회
      const { data: memosData, error: memosError } = await supabase
        .from('memos')
        .select('*')
        .eq('topic_id', topic.id)
        .order('created_at', { ascending: false });

      if (memosError) throw memosError;

      if (!memosData || memosData.length === 0) {
        setMemos([]);
        return;
      }

      // 사용자 ID 목록 추출
      const userIds = [...new Set(memosData.map((memo) => memo.user_id))];
      
      // 사용자 정보 조회
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      // 메모와 사용자 정보 결합
      const memosWithUsers: MemoWithUser[] = memosData.map((memo) => {
        const user = usersData?.find((u) => u.id === memo.user_id);
        return {
          ...memo,
          users: user
            ? { name: user.name, email: user.email }
            : { name: '알 수 없음', email: '' },
        };
      });

      setMemos(memosWithUsers);
    } catch (error) {
      console.error('메모 조회 오류:', error);
      alert('메모를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingMemos(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 관리자 권한 확인
      const user = await getCurrentUserClient();
      if (!user || user.role !== USER_ROLES.ADMIN) {
        alert('관리자만 주제를 수정할 수 있습니다.');
        setIsSubmitting(false);
        return;
      }

      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('topics')
        .update({
          title,
          goals,
          activity,
          weeks: weeks === '' ? null : Number(weeks),
        })
        .eq('id', topic.id);

      if (error) throw error;

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('글 수정 오류:', error);
      alert('글 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {isEditing ? '글 수정' : '글 상세'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
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
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
              >
                {isSubmitting ? '수정 중...' : '수정하기'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {topic.weeks && (
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {topic.weeks}주차
                </p>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {topic.title}
              </h3>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                학습 내용
              </h4>
              <p className="mb-4 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {topic.goals}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                단원 핵심 역량
              </h4>
              <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {topic.activity}
              </p>
            </div>
            {isAdmin && (
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowMemos(!showMemos)}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                >
                  {showMemos ? '메모 숨기기' : '메모 조회'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300"
                >
                  수정
                </button>
              </div>
            )}

            {showMemos && isAdmin && (
              <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  작성된 메모 ({memos.length}개)
                </h3>
                {isLoadingMemos ? (
                  <div className="py-8 text-center text-zinc-500">로딩 중...</div>
                ) : memos.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">작성된 메모가 없습니다.</div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {memos.map((memo) => (
                      <div
                        key={memo.id}
                        className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {memo.users?.name || '알 수 없음'}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              ({memo.users?.email || ''})
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(memo.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            배운 내용을 자신의 말로 설명하기
                          </h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                            {memo.activity_content}
                          </p>
                        </div>
                        {memo.reflection && (
                          <div>
                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              배운 내용과 관련해 추가로 궁금한 점 질문하기
                            </h4>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                              {memo.reflection}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


