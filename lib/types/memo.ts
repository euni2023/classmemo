/**
 * Memo 관련 타입 정의
 */

export interface Memo {
  id: number;
  user_id: number;
  topic_id: number;
  activity_content: string;
  reflection: string | null;
  /** 수업 질문에 대한 난이도 (선택) */
  difficulty?: MemoDifficulty | null;
  created_at: string;
  updated_at?: string;
  /** AI 분석 결과 (admin 분석 후 저장) */
  ai_analysis?: string | null;
  /** AI 분석 수행 시각 */
  ai_analyzed_at?: string | null;
}

export type MemoDifficulty = '매우 쉬움' | '쉬움' | '보통' | '어려움' | '매우 어려움';

export interface MemoButtonProps {
  topicId: number;
  topicTitle: string;
}


