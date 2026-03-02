'use client';

import { TopicListItemProps } from '@/lib/types';

export default function TopicListItem({
  topic,
  isSelected = false,
  onSelect,
  memoCount = null,
}: TopicListItemProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <li
      className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-600 dark:border-blue-400'
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
      }`}
      onClick={handleClick}
    >
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {topic.title}
        </h2>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {memoCount !== null && memoCount !== undefined ? (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {memoCount}개
          </span>
        ) : (
          <span className="text-sm text-zinc-400">&gt;</span>
        )}
      </div>
    </li>
  );
}


