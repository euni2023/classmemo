# Database Migrations and Seeds

이 폴더는 데이터베이스 마이그레이션과 시드 데이터를 관리합니다.

## 구조

```
database/
├── migrations/     # 데이터베이스 스키마 마이그레이션 파일
│   ├── 001_create_users_table.sql
│   ├── 002_create_topics_table.sql
│   └── 003_create_memos_table.sql
└── seeds/          # 시드 데이터 (개발/테스트용)
    └── example_data.sql
```

## 마이그레이션 실행 순서

마이그레이션은 번호 순서대로 실행해야 합니다:

1. `001_create_users_table.sql` - users 테이블 생성
2. `002_create_topics_table.sql` - topics 테이블 생성
3. `003_create_memos_table.sql` - memos 테이블 생성 (users, topics 필요)

## 시드 데이터

`seeds/example_data.sql` 파일은 개발 및 테스트 환경에서 사용할 예시 데이터를 포함합니다.

**주의**: 프로덕션 환경에서는 시드 데이터를 사용하지 마세요.

## 사용 방법

### Supabase에서 실행

1. Supabase Dashboard → SQL Editor로 이동
2. 각 마이그레이션 파일을 순서대로 실행
3. (선택사항) 시드 데이터 실행

### 로컬 PostgreSQL에서 실행

```bash
# 마이그레이션 실행
psql -U your_user -d your_database -f database/migrations/001_create_users_table.sql
psql -U your_user -d your_database -f database/migrations/002_create_topics_table.sql
psql -U your_user -d your_database -f database/migrations/003_create_memos_table.sql

# 시드 데이터 실행 (선택사항)
psql -U your_user -d your_database -f database/seeds/example_data.sql
```


