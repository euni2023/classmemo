-- Migration: 004_add_memo_ai_analysis.sql
-- Description: memos 테이블에 AI 분석 결과 저장 컬럼 추가

ALTER TABLE memos
  ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN memos.ai_analysis IS 'AI 분석 결과 텍스트';
COMMENT ON COLUMN memos.ai_analyzed_at IS 'AI 분석 수행 시각';
