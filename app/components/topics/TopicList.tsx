'use client';

import { useState } from 'react';
import { Topic } from '@/lib/types';
import TopicListItem from './TopicListItem';

interface TopicListProps {
  topics: Topic[];
  selectedTopicId: number | null;
  onTopicSelect: (topic: Topic) => void;
  /** user 로그인 시 주제별 메모 개수 (key: topic_id). null이면 admin 등 개수 미표시 */
  memoCountByTopicId?: Record<number, number> | null;
}

export default function TopicList({
  topics,
  selectedTopicId,
  onTopicSelect,
  memoCountByTopicId = null,
}: TopicListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {topics.length === 0 ? (
          <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
            게시글이 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {topics.map((topic: Topic) => (
              <TopicListItem
                key={topic.id}
                topic={topic}
                isSelected={selectedTopicId === topic.id}
                onSelect={() => onTopicSelect(topic)}
                memoCount={
                  memoCountByTopicId ? (memoCountByTopicId[topic.id] ?? 0) : null
                }
              />
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        총 {topics.length}개의 게시글이 있습니다.
      </div>
    </div>
  );
}

