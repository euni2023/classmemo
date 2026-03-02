'use client';

import { useState, useEffect, useCallback } from 'react';
import { Topic } from '@/lib/types';
import { getCurrentUserClient } from '@/lib/auth-client';
import { createBrowserClient } from '@/lib/supabase/client';
import TopicList from './TopicList';
import MemoListView from '../memos/MemoListView';

interface TopicListContainerProps {
  topics: Topic[];
  isAdmin?: boolean;
}

export default function TopicListContainer({ topics, isAdmin }: TopicListContainerProps) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [memoCountByTopicId, setMemoCountByTopicId] = useState<Record<number, number> | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUserClient();
      setCurrentUser(user ?? null);
    };
    loadUser();
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser());
    return () => subscription.unsubscribe();
  }, []);

  const loadMemoCountByTopicId = useCallback(async () => {
    const user = currentUser ?? (await getCurrentUserClient());
    if (!user) {
      setMemoCountByTopicId(null);
      return;
    }
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('memos')
      .select('topic_id')
      .eq('user_id', user.id);
    if (error) {
      setMemoCountByTopicId(null);
      return;
    }
    const countByTopic: Record<number, number> = {};
    (data || []).forEach((row) => {
      const tid = Number(row.topic_id);
      countByTopic[tid] = (countByTopic[tid] ?? 0) + 1;
    });
    setMemoCountByTopicId(countByTopic);
  }, [currentUser]);

  useEffect(() => {
    if (!isAdmin && currentUser) {
      loadMemoCountByTopicId();
    } else {
      setMemoCountByTopicId(null);
    }
  }, [isAdmin, currentUser, loadMemoCountByTopicId]);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleTopicUpdate = (updatedTopic: Topic) => {
    // 선택된 topic이 업데이트된 경우 상태 업데이트
    if (selectedTopic && selectedTopic.id === updatedTopic.id) {
      setSelectedTopic(updatedTopic);
    }
  };

  const handleTopicDelete = () => {
    setSelectedTopic(null);
  };

  const handleMemoSaved = useCallback(() => {
    loadMemoCountByTopicId();
  }, [loadMemoCountByTopicId]);

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* 왼쪽: Topic 목록 (30%) */}
      <div className="flex-[3] rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <TopicList
          topics={topics}
          selectedTopicId={selectedTopic?.id || null}
          onTopicSelect={handleTopicSelect}
          memoCountByTopicId={memoCountByTopicId}
        />
      </div>

      {/* 오른쪽: 메모 목록 (70%) */}
      <div className="flex-[7] rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <MemoListView
          topic={selectedTopic}
          isAdminFromServer={isAdmin}
          onTopicUpdate={handleTopicUpdate}
          onTopicDelete={handleTopicDelete}
          onMemoSaved={handleMemoSaved}
        />
      </div>
    </div>
  );
}

