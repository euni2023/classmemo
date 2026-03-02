-- Migration: 002_create_topics_table.sql
-- Description: topics 테이블 생성 및 기본 설정

CREATE TABLE topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  goals TEXT NOT NULL,
  activity TEXT NOT NULL,
  weeks INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);
CREATE INDEX idx_topics_weeks ON topics(weeks);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 topics를 읽을 수 있도록 정책 생성
CREATE POLICY "Anyone can read topics"
  ON topics FOR SELECT
  USING (true);

-- 관리자만 topics를 생성/수정/삭제할 수 있도록 정책 생성
CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );


