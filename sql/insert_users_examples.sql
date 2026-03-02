-- users 테이블 INSERT 예시

-- 1. 기본 INSERT (모든 필수 필드 포함)
INSERT INTO users (email, name, snumber, role)
VALUES ('user1@example.com', '홍길동', '2024001', 'user');

-- 2. snumber 없이 INSERT (snumber는 선택사항)
INSERT INTO users (email, name, role)
VALUES ('user2@example.com', '김철수', 'user');

-- 3. 관리자 계정 생성
INSERT INTO users (email, name, snumber, role)
VALUES ('admin@example.com', '관리자', '0000001', 'admin');

-- 4. 여러 개 한번에 INSERT
INSERT INTO users (email, name, snumber, role)
VALUES 
  ('student1@example.com', '이영희', '2024002', 'user'),
  ('student2@example.com', '박민수', '2024003', 'user'),
  ('student3@example.com', '최지은', '2024004', 'user');

-- 5. role 기본값 사용 (role 생략 시 'user'로 자동 설정)
INSERT INTO users (email, name, snumber)
VALUES ('student4@example.com', '정수진', '2024005');

-- 6. 실제 사용 예시 (한국어 이름)
INSERT INTO users (email, name, snumber, role)
VALUES 
  ('teacher@school.edu', '선생님', 'T001', 'admin'),
  ('student01@school.edu', '김학생', '2024001', 'user'),
  ('student02@school.edu', '이학생', '2024002', 'user'),
  ('student03@school.edu', '박학생', '2024003', 'user');

