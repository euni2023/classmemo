/**
 * Topic 관련 타입 정의
 */

export interface Topic {
  id: number;
  title: string;
  goals: string;
  activity: string;
  weeks: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TopicListItemProps {
  topic: Topic;
  isSelected?: boolean;
  onSelect?: () => void;
  /** user 로그인 시 해당 주제에 자신이 작성한 메모 개수 (null이면 개수 미표시) */
  memoCount?: number | null;
}

export interface TopicDetailProps {
  topic: Topic;
  isOpen: boolean;
  onClose: () => void;
}


