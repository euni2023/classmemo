-- memos 테이블 INSERT 예시

-- 1. 기본 INSERT (활동 내용과 소감 모두 포함)
INSERT INTO memos (user_id, topic_id, activity_content, reflection)
VALUES (
  1,  -- user_id (users 테이블의 id)
  1,  -- topic_id (topics 테이블의 id)
  '오늘은 Python 기초 문법을 학습했습니다. 변수, 데이터 타입, 조건문 등을 배웠습니다.',
  'Python이 생각보다 직관적이고 배우기 쉬운 언어라는 것을 느꼈습니다. 특히 들여쓰기로 코드 블록을 구분하는 것이 신선했습니다.'
);

-- 2. 소감 없이 활동 내용만 기록
INSERT INTO memos (user_id, topic_id, activity_content)
VALUES (
  1,
  2,
  '데이터베이스 설계 실습을 진행했습니다. ERD를 작성하고 테이블 관계를 정의했습니다.'
);

-- 3. 여러 사용자가 같은 topic에 대해 메모 작성
INSERT INTO memos (user_id, topic_id, activity_content, reflection)
VALUES 
  (
    1,  -- 첫 번째 사용자
    1,
    'Python 기초 문법 수업을 들었습니다.',
    '매우 유익한 수업이었습니다.'
  ),
  (
    2,  -- 두 번째 사용자
    1,
    'Python 변수와 데이터 타입에 대해 배웠습니다.',
    '다음 시간이 기대됩니다.'
  ),
  (
    3,  -- 세 번째 사용자
    1,
    '조건문과 반복문을 실습했습니다.',
    '실습 예제가 도움이 되었습니다.'
  );

-- 4. 한 사용자가 여러 topic에 대해 메모 작성
INSERT INTO memos (user_id, topic_id, activity_content, reflection)
VALUES 
  (
    1,
    1,  -- 첫 번째 topic
    'Python 기초를 학습했습니다.',
    '기초가 탄탄해야 한다는 것을 느꼈습니다.'
  ),
  (
    1,
    2,  -- 두 번째 topic
    '데이터베이스 설계를 배웠습니다.',
    '실무에서 유용할 것 같습니다.'
  ),
  (
    1,
    3,  -- 세 번째 topic
    '웹 개발 기초를 학습했습니다.',
    '프론트엔드와 백엔드의 차이를 이해했습니다.'
  );

-- 5. 실제 사용 예시
INSERT INTO memos (user_id, topic_id, activity_content, reflection)
VALUES 
  (
    (SELECT id FROM users WHERE email = 'student01@school.edu'),
    (SELECT id FROM topics WHERE title = 'Python 기초'),
    '오늘 수업에서 Python의 기본 문법을 배웠습니다. 변수 선언, 자료형, 연산자 등을 실습했습니다.',
    'Python이 다른 언어보다 문법이 간단하고 읽기 쉬워서 좋았습니다. 다음 시간에는 반복문과 함수를 배우고 싶습니다.'
  ),
  (
    (SELECT id FROM users WHERE email = 'student02@school.edu'),
    (SELECT id FROM topics WHERE title = 'Python 기초'),
    'Python 기초 수업을 들었습니다. 변수와 데이터 타입에 대해 이해했습니다.',
    '실습 시간이 부족했던 것 같습니다. 더 많은 예제를 풀어보고 싶습니다.'
  );

