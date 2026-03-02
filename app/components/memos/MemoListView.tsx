'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getCurrentUserClient, isAdminClient, isUserClient } from '@/lib/auth-client';
import { Memo, Topic } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants/roles';
import { useRouter } from 'next/navigation';
import TopicDeleteButton from '../topics/TopicDeleteButton';

interface MemoWithUser extends Memo {
  users: {
    name: string;
    email: string;
  };
}

interface MemoListViewProps {
  topic: Topic | null;
  /** 서버에서 전달한 admin 여부 (admin일 때 topic 수정/삭제 버튼 표시) */
  isAdminFromServer?: boolean;
  onTopicUpdate?: (updatedTopic: Topic) => void;
  onTopicDelete?: () => void;
  /** 메모 저장/삭제 시 호출 (주제 목록의 메모 개수 갱신용) */
  onMemoSaved?: () => void;
}

export default function MemoListView({
  topic,
  isAdminFromServer,
  onTopicUpdate,
  onTopicDelete,
  onMemoSaved,
}: MemoListViewProps) {
  const [memos, setMemos] = useState<MemoWithUser[]>([]);
  const [allMemos, setAllMemos] = useState<MemoWithUser[]>([]); // 필터링 전 모든 메모
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editActivity, setEditActivity] = useState('');
  const [editWeeks, setEditWeeks] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null); // 필터링용 작성자 ID
  const [authors, setAuthors] = useState<Array<{ id: number; name: string; email: string }>>([]);
  // user용 메모 작성/수정 상태
  const [isWritingMemo, setIsWritingMemo] = useState(false);
  const [activityContent, setActivityContent] = useState('');
  const [reflection, setReflection] = useState('');
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  // admin용 AI 분석
  const [analyzingMemo, setAnalyzingMemo] = useState<MemoWithUser | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      const admin = await isAdminClient();
      const user = await isUserClient();
      const currentUserData = await getCurrentUserClient();
      setIsAdmin(admin);
      setIsUser(user);
      setCurrentUser(currentUserData);
    };
    checkRole();
  }, []);

  useEffect(() => {
    if (topic) {
      loadMemos();
      // topic이 변경되면 편집 모드 초기화 및 필터 초기화
      setEditTitle(topic.title);
      setEditGoals(topic.goals);
      setEditActivity(topic.activity);
      setEditWeeks(topic.weeks ?? '');
      setIsEditing(false);
      setSelectedAuthorId(null); // topic 변경 시 필터 초기화
      setIsWritingMemo(false); // topic 변경 시 메모 작성 모드 초기화
      cancelMemoEdit();
    } else {
      setMemos([]);
      setAllMemos([]);
      setIsEditing(false);
      setSelectedAuthorId(null);
      setAuthors([]);
      setIsWritingMemo(false);
      cancelMemoEdit();
    }
  }, [topic, isAdmin, currentUser]);

  // 작성자 필터 적용 함수
  const applyAuthorFilter = (
    memosToFilter: MemoWithUser[],
    authorId: number | null
  ) => {
    if (authorId === null) {
      setMemos(memosToFilter);
    } else {
      const filtered = memosToFilter.filter((memo) => memo.user_id === authorId);
      setMemos(filtered);
    }
  };

  // 작성자 필터 변경 핸들러
  const handleAuthorFilterChange = (authorId: number | null) => {
    setSelectedAuthorId(authorId);
    applyAuthorFilter(allMemos, authorId);
  };

  // user용 메모 작성/수정 핸들러
  const handleMemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !topic) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();

      if (editingMemo) {
        // 수정
        const { error } = await supabase
          .from('memos')
          .update({
            activity_content: activityContent,
            reflection: reflection || null,
          })
          .eq('id', editingMemo.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;
      } else {
        // 작성
        const { error } = await supabase.from('memos').insert({
          user_id: currentUser.id,
          topic_id: topic.id,
          activity_content: activityContent,
          reflection: reflection || null,
        });

        if (error) throw error;
      }

      setActivityContent('');
      setReflection('');
      setEditingMemo(null);
      setIsWritingMemo(false);
      await loadMemos();
      router.refresh();
      onMemoSaved?.();
    } catch (error) {
      console.error('메모 저장 오류:', error);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // user용 메모 삭제 핸들러
  const handleMemoDelete = async (memoId: number) => {
    if (!confirm('메모를 삭제하시겠습니까?')) return;
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', memoId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      await loadMemos();
      router.refresh();
      onMemoSaved?.();
    } catch (error) {
      console.error('메모 삭제 오류:', error);
      alert('메모 삭제에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // user용 메모 수정 시작
  const startEditMemo = (memo: Memo) => {
    setEditingMemo(memo);
    setActivityContent(memo.activity_content);
    setReflection(memo.reflection || '');
    setIsWritingMemo(true);
  };

  // user용 메모 작성/수정 취소
  const cancelMemoEdit = () => {
    setEditingMemo(null);
    setActivityContent('');
    setReflection('');
    setIsWritingMemo(false);
  };

  /** AI 분석 모달 열기 (저장된 분석이 있으면 표시, 없으면 분석 실행) */
  const handleOpenAnalysisModal = (memo: MemoWithUser) => {
    setAnalyzingMemo(memo);
    setAnalysisResult(null);
    if (memo.ai_analysis) {
      setAnalysisResult(memo.ai_analysis);
    } else {
      handleRunAnalysis(memo.id);
    }
  };

  /** AI 분석 실행 (새로 분석 또는 재분석) */
  const handleRunAnalysis = async (memoId: number) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await fetch(`/api/memos/${memoId}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setAnalysisResult(data.error || '분석 요청에 실패했습니다.');
        return;
      }
      setAnalysisResult(data.analysis ?? '');
      setAnalyzingMemo((prev) =>
        prev && prev.id === memoId
          ? { ...prev, ai_analysis: data.analysis, ai_analyzed_at: data.analyzed_at ?? undefined }
          : prev
      );
      await loadMemos();
    } catch {
      setAnalysisResult('분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const closeAnalysisModal = () => {
    setAnalyzingMemo(null);
    setAnalysisResult(null);
  };

  const loadMemos = async () => {
    if (!topic) return;
    setIsLoading(true);
    try {
      const supabase = createBrowserClient();

      // admin인 경우 모든 메모, user인 경우 자신의 메모만
      let query = supabase
        .from('memos')
        .select('*')
        .eq('topic_id', topic.id);

      if (!isAdmin && currentUser) {
        query = query.eq('user_id', currentUser.id);
      }

      const { data: memosData, error: memosError } = await query.order(
        'created_at',
        { ascending: false }
      );

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

      // 모든 메모 저장 (필터링 전)
      setAllMemos(memosWithUsers);

      // 작성자 목록 추출 (중복 제거)
      const uniqueAuthors = Array.from(
        new Map(
          usersData?.map((user) => [user.id, { id: user.id, name: user.name, email: user.email }]) || []
        ).values()
      );
      setAuthors(uniqueAuthors);

      // 필터링 적용
      applyAuthorFilter(memosWithUsers, selectedAuthorId);
    } catch (error) {
      console.error('메모 조회 오류:', error);
      alert('메모를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

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
      const { data, error } = await supabase
        .from('topics')
        .update({
          title: editTitle,
          goals: editGoals,
          activity: editActivity,
          weeks: editWeeks === '' ? null : Number(editWeeks),
        })
        .eq('id', topic.id)
        .select()
        .single();

      if (error) throw error;

      setIsEditing(false);
      if (onTopicUpdate && data) {
        onTopicUpdate(data);
      }
      router.refresh();
    } catch (error) {
      console.error('주제 수정 오류:', error);
      alert('주제 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!topic) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
        <p>왼쪽에서 주제를 선택하세요.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 - Topic 정보 */}
      <div className="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {isEditing ? '주제 수정' : topic.title}
          </h2>
          {(isAdminFromServer ?? isAdmin) && !isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                수정
              </button>
              <TopicDeleteButton
                topicId={topic.id}
                topicTitle={topic.title}
                onDelete={onTopicDelete}
              />
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleTopicUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                제목
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="주제 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              배운 내용을 자신의 말로 설명하기
              </label>
              <textarea
                value={editGoals}
                onChange={(e) => setEditGoals(e.target.value)}
                required
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="배운 내용을 자신의 말로 설명하기"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              배운 내용과 관련해 추가로 궁금한 점
              </label>
              <textarea
                value={editActivity}
                onChange={(e) => setEditActivity(e.target.value)}
                required
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="배운 내용과 관련해 추가로 궁금한 점"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                주차 (선택사항)
              </label>
              <input
                type="number"
                value={editWeeks}
                onChange={(e) =>
                  setEditWeeks(e.target.value === '' ? '' : Number(e.target.value))
                }
                min="1"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="주차를 입력하세요"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (topic) {
                    setEditTitle(topic.title);
                    setEditGoals(topic.goals);
                    setEditActivity(topic.activity);
                    setEditWeeks(topic.weeks ?? '');
                  }
                }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? '수정 중...' : '수정하기'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {topic.weeks && (
              <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                {topic.weeks}주차
              </p>
            )}
            <div className="mt-3 space-y-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  학습 내용
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {topic.goals}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  단원 핵심 역량
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {topic.activity}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isAdmin ? '모든 사용자의 메모' : '내 메모'} ({memos.length}개)
              </p>
              <div className="flex items-center gap-2">
                {/* 작성자 필터 (admin만 표시) */}
                {isAdmin && authors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">작성자:</span>
                    <select
                      value={selectedAuthorId || ''}
                      onChange={(e) =>
                        handleAuthorFilterChange(
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    >
                      <option value="">전체</option>
                      {authors.map((author) => (
                        <option key={author.id} value={author.id}>
                          {author.name} ({author.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* 메모 작성 버튼 (user만 표시) */}
                {isUser && !isWritingMemo && (
                  <button
                    onClick={() => setIsWritingMemo(true)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    + 메모 작성
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 메모 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="py-8 text-center text-zinc-500">로딩 중...</div>
        ) : memos.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            {isAdmin ? '작성된 메모가 없습니다.' : '작성한 메모가 없습니다.'}
          </div>
        ) : (
          <div className="space-y-4">
            {memos.map((memo) => (
              <div
                key={memo.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {memo.users?.name || '알 수 없음'}
                    </span>
                    {isAdmin && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        ({memo.users?.email || ''})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(memo.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {/* admin인 경우 메모별 AI 분석 버튼 (저장된 분석 있으면 표시) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenAnalysisModal(memo)}
                        disabled={isAnalyzing}
                        className="rounded-md bg-violet-600 px-2 py-1 text-xs font-medium text-white hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 disabled:opacity-50"
                      >
                        {memo.ai_analysis ? '저장된 분석 보기' : 'AI 분석'}
                      </button>
                    )}
                    {/* user인 경우 자신의 메모만 수정/삭제 버튼 표시 */}
                    {isUser &&
                      currentUser &&
                      memo.user_id === currentUser.id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditMemo(memo)}
                            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleMemoDelete(memo.id)}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                  </div>
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

      {/* 메모 작성/수정 모달 (user 전용) */}
      {isWritingMemo && isUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelMemoEdit();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="memo-modal-title"
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="memo-modal-title" className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {editingMemo ? '메모 수정' : '메모 작성'}
            </h2>
            <form onSubmit={handleMemoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  배운 내용을 자신의 말로 설명하기
                </label>
                <textarea
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  required
                  rows={5}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="배운 내용을 자신의 말로 설명해 주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  배운 내용과 관련해 추가로 궁금한 점 질문하기
                </label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="궁금한 점을 입력하세요"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelMemoEdit}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting
                    ? '저장 중...'
                    : editingMemo
                      ? '수정하기'
                      : '작성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI 분석 결과 모달 (admin 전용) */}
      {analyzingMemo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAnalysisModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-analysis-modal-title"
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ai-analysis-modal-title" className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              AI 분석 · {analyzingMemo.users?.name || '알 수 없음'}
              {analyzingMemo.ai_analyzed_at && (
                <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  (분석: {new Date(analyzingMemo.ai_analyzed_at).toLocaleString('ko-KR')})
                </span>
              )}
            </h2>
            <div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-zinc-600 dark:text-zinc-400">
                {analyzingMemo.activity_content}
                {analyzingMemo.reflection && (
                  <>
                    <span className="mt-2 block font-medium">궁금한 점:</span>
                    {analyzingMemo.reflection}
                  </>
                )}
              </p>
            </div>
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">분석 결과</h3>
              {isAnalyzing ? (
                <p className="text-sm text-zinc-500">분석 중...</p>
              ) : (analysisResult ?? analyzingMemo.ai_analysis) ? (
                <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                  {analysisResult ?? analyzingMemo.ai_analysis}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              {!isAnalyzing && (
                <button
                  type="button"
                  onClick={() => handleRunAnalysis(analyzingMemo.id)}
                  className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
                >
                  새로 분석
                </button>
              )}
              <button
                type="button"
                onClick={closeAnalysisModal}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

