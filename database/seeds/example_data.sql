-- Seed Data: 예시 데이터 삽입
-- 주의: 이 파일은 개발/테스트 환경에서만 사용하세요.

-- 사용자 예시 데이터
INSERT INTO users (email, name, snumber, role)
VALUES 
  ('admin@example.com', '관리자', '0000001', 'admin'),
  ('user1@example.com', '홍길동', '2024001', 'user'),
  ('user2@example.com', '김철수', '2024002', 'user'),
  ('user3@example.com', '이영희', '2024003', 'user')
ON CONFLICT (email) DO NOTHING;

-- 주제 예시 데이터
INSERT INTO topics (title, goals, activity, weeks)
VALUES 
  (
    'Python 기초',
    'Python의 기본 문법과 데이터 타입을 이해하고, 변수, 조건문, 반복문을 활용할 수 있다.',
    'Python 설치 및 환경 설정, 변수와 데이터 타입 실습, 조건문과 반복문 예제 작성',
    1
  ),
  (
    '데이터베이스 설계',
    'ERD를 작성하고 데이터베이스 스키마를 설계할 수 있다.',
    'ERD 도구 사용법 학습, 실제 프로젝트 ERD 작성, 정규화 실습',
    2
  ),
  (
    '웹 개발 기초',
    'HTML, CSS, JavaScript를 활용하여 기본적인 웹 페이지를 만들 수 있다.',
    'HTML 구조 작성, CSS 스타일링, JavaScript 기본 문법 실습',
    3
  )
ON CONFLICT DO NOTHING;

-- 메모 예시 데이터 (users와 topics가 먼저 생성되어 있어야 함)
INSERT INTO memos (user_id, topic_id, activity_content, reflection)
SELECT 
  u.id,
  t.id,
  'Python 기초 수업을 들었습니다. 변수와 데이터 타입에 대해 배웠습니다.',
  'Python이 생각보다 직관적이고 배우기 쉬운 언어라는 것을 느꼈습니다.'
FROM users u, topics t
WHERE u.email = 'user1@example.com' AND t.title = 'Python 기초'
ON CONFLICT DO NOTHING;


