'use client';

import { useRouter } from 'next/navigation';
import { Topic } from '@/lib/types';
import MemoListView from '@/app/components/memos/MemoListView';

interface TopicPageClientProps {
  topic: Topic;
  isAdmin: boolean;
}

export default function TopicPageClient({ topic, isAdmin }: TopicPageClientProps) {
  const router = useRouter();

  const handleTopicUpdate = (updatedTopic: Topic) => {
    router.refresh();
  };

  const handleTopicDelete = () => {
    router.push('/');
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <MemoListView
        topic={topic}
        isAdminFromServer={isAdmin}
        onTopicUpdate={handleTopicUpdate}
        onTopicDelete={handleTopicDelete}
      />
    </div>
  );
}
