'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getCurrentUserClient } from '@/lib/auth-client';
import { MemoButtonProps, Memo, MemoDifficulty } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function MemoButton({ topicId, topicTitle }: MemoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [activityContent, setActivityContent] = useState('');
  const [reflection, setReflection] = useState('');
  const [difficulty, setDifficulty] = useState<MemoDifficulty>('보통');
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [hasMemo, setHasMemo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      console.log('[MemoButton] Loading user...');
      const currentUser = await getCurrentUserClient();
      console.log('[MemoButton] User loaded:', currentUser);
      setUser(currentUser);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      checkMemoExists();
    }
  }, [user, topicId]);

  useEffect(() => {
    if (isOpen && user) {
      loadMemos();
    }
  }, [isOpen, user]);

  const checkMemoExists = async () => {
    if (!user) return;
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memos')
        .select('id')
        .eq('topic_id', topicId)
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      setHasMemo((data && data.length > 0) || false);
    } catch (error) {
      console.error('메모 확인 오류:', error);
    }
  };

  const loadMemos = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('topic_id', topicId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemos(data || []);
    } catch (error) {
      console.error('메모 조회 오류:', error);
      alert('메모를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const supabase = createBrowserClient();
      
      if (editingMemo) {
        // 수정
        const { error } = await supabase
          .from('memos')
          .update({
            activity_content: activityContent,
            reflection: reflection || null,
            difficulty: difficulty || null,
          })
          .eq('id', editingMemo.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // 작성
        const { error } = await supabase.from('memos').insert({
          user_id: user.id,
          topic_id: topicId,
          activity_content: activityContent,
          reflection: reflection || null,
          difficulty: difficulty || null,
        });

        if (error) throw error;
      }

      setActivityContent('');
      setReflection('');
      setDifficulty('보통');
      setEditingMemo(null);
      setIsWriting(false);
      await loadMemos();
      await checkMemoExists();
      router.refresh();
    } catch (error) {
      console.error('메모 저장 오류:', error);
      alert('메모 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (memoId: number) => {
    if (!confirm('메모를 삭제하시겠습니까?')) return;
    if (!user) return;

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', memoId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadMemos();
      await checkMemoExists();
      router.refresh();
    } catch (error) {
      console.error('메모 삭제 오류:', error);
      alert('메모 삭제에 실패했습니다.');
    }
  };

  const startEdit = (memo: Memo) => {
    setEditingMemo(memo);
    setActivityContent(memo.activity_content);
    setReflection(memo.reflection || '');
    setDifficulty((memo.difficulty as MemoDifficulty) || '보통');
    setIsWriting(true);
  };

  const cancelEdit = () => {
    setEditingMemo(null);
    setActivityContent('');
    setReflection('');
    setDifficulty('보통');
    setIsWriting(false);
  };

  // user가 없어도 버튼은 표시 (TopicListItem에서 이미 isUser 체크를 했으므로)
  // 단, user가 없으면 클릭 시에만 확인
  console.log('[MemoButton] Rendering - user:', user, 'hasMemo:', hasMemo);
  
  return (
    <>
      <button
        onClick={() => {
          console.log('[MemoButton] Button clicked - user:', user);
          if (!user) {
            alert('사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
          }
          setIsOpen(true);
        }}
        className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
          hasMemo
            ? 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
        }`}
        title={hasMemo ? '메모수정' : '메모작성'}
        disabled={!user}
      >
        {hasMemo ? '메모수정' : '메모작성'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {topicTitle} - 내 메모
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  cancelEdit();
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            {!isWriting ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsWriting(true)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    + 메모 추가
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-8 text-center text-zinc-500">로딩 중...</div>
                ) : memos.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">작성한 메모가 없습니다.</div>
                ) : (
                  <div className="space-y-4">
                    {memos.map((memo) => (
                      <div
                        key={memo.id}
                        className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(memo.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(memo)}
                              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(memo.id)}
                              className="text-xs text-red-600 hover:underline dark:text-red-400"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              수업 질문에 대해 자신의 말로 설명하기
                            </h4>
                            {memo.difficulty && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                난이도: {memo.difficulty}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                            {memo.activity_content}
                          </p>
                        </div>
                        {memo.reflection && (
                          <div>
                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              수업 질문과 관련하여 스스로 질문 만들기
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    수업 질문에 대한 난이도 평가하기
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as MemoDifficulty)}
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value="매우 쉬움">매우 쉬움</option>
                    <option value="쉬움">쉬움</option>
                    <option value="보통">보통</option>
                    <option value="어려움">어려움</option>
                    <option value="매우 어려움">매우 어려움</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  수업 질문에 대해 자신의 말로 설명하기
                  </label>
                  <textarea
                    value={activityContent}
                    onChange={(e) => setActivityContent(e.target.value)}
                    required
                    rows={4}
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    placeholder="수업 질문에 대해 자신의 말로 설명하기"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  수업 질문과 관련하여 스스로 질문 만들기
                  </label>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    placeholder="궁금한 점을 입력하세요"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300"
                  >
                    {editingMemo ? '수정하기' : '작성하기'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}


