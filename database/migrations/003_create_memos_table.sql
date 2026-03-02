-- Migration: 003_create_memos_table.sql
-- Description: memos 테이블 생성 및 기본 설정
-- Note: topics 테이블이 먼저 생성되어 있어야 함 (002_create_topics_table.sql)

CREATE TABLE memos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  activity_content TEXT NOT NULL,
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 외래키 제약조건
  CONSTRAINT fk_memos_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_memos_topic 
    FOREIGN KEY (topic_id) 
    REFERENCES topics(id) 
    ON DELETE CASCADE
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_memos_user_id ON memos(user_id);
CREATE INDEX idx_memos_topic_id ON memos(topic_id);
CREATE INDEX idx_memos_created_at ON memos(created_at DESC);

-- 복합 인덱스 (특정 사용자의 특정 topic 메모 조회 시 성능 향상)
CREATE INDEX idx_memos_user_topic ON memos(user_id, topic_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- 현재 인증된 사용자의 user_id를 반환하는 함수 (성능 향상)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT id FROM users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자는 자신의 메모만 읽을 수 있도록 정책 생성
CREATE POLICY "Users can read own memos"
  ON memos FOR SELECT
  USING (user_id = get_current_user_id());

-- 사용자는 자신의 메모만 작성할 수 있도록 정책 생성
CREATE POLICY "Users can insert own memos"
  ON memos FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

-- 사용자는 자신의 메모만 수정할 수 있도록 정책 생성
CREATE POLICY "Users can update own memos"
  ON memos FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

-- 사용자는 자신의 메모만 삭제할 수 있도록 정책 생성
CREATE POLICY "Users can delete own memos"
  ON memos FOR DELETE
  USING (user_id = get_current_user_id());

-- 관리자는 모든 메모를 읽을 수 있도록 정책 생성
CREATE POLICY "Admins can read all memos"
  ON memos FOR SELECT
  USING (is_admin());

-- 관리자는 모든 메모를 수정할 수 있도록 정책 생성 (선택사항)
CREATE POLICY "Admins can update all memos"
  ON memos FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- 관리자는 모든 메모를 삭제할 수 있도록 정책 생성 (선택사항)
CREATE POLICY "Admins can delete all memos"
  ON memos FOR DELETE
  USING (is_admin());


