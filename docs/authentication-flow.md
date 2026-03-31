# 인증 시스템 흐름 및 파일 구조

이 문서는 프로젝트에 적용된 인증 시스템의 전체 흐름과 관련 파일들을 설명합니다.

## 📋 목차

1. [인증 아키텍처 개요](#인증-아키텍처-개요)
2. [인증 흐름도](#인증-흐름도)
3. [주요 파일 설명](#주요-파일-설명)
4. [서버 vs 클라이언트 인증](#서버-vs-클라이언트-인증)
5. [세션 관리](#세션-관리)
6. [역할 기반 접근 제어 (RBAC)](#역할-기반-접근-제어-rbac)

---

## 인증 아키텍처 개요

이 프로젝트는 **Supabase Auth**를 기반으로 한 인증 시스템을 사용하며, **Next.js App Router**의 서버/클라이언트 컴포넌트 구조에 맞춰 설계되었습니다.

### 핵심 구성 요소

```
┌─────────────────────────────────────────────────────────┐
│                    인증 시스템 구조                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Supabase Auth (인증 제공자)                          │
│     └─ 이메일/비밀번호 기반 인증                          │
│                                                           │
│  2. Users 테이블 (사용자 정보 저장)                       │
│     └─ role, email, name 등 메타데이터                   │
│                                                           │
│  3. 서버 사이드 인증 (lib/auth.ts)                        │
│     └─ Server Components에서 사용                         │
│                                                           │
│  4. 클라이언트 사이드 인증 (lib/auth-client.ts)           │
│     └─ Client Components에서 사용                        │
│                                                           │
│  5. Middleware (middleware.ts)                            │
│     └─ 세션 쿠키 동기화 및 갱신                          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 인증 흐름도

### 1. 로그인 프로세스

```
┌─────────────┐
│   사용자    │
│  (브라우저) │
└──────┬──────┘
       │
       │ 1. 이메일/비밀번호 입력
       ▼
┌─────────────────────────────┐
│  LoginButton.tsx             │
│  (Client Component)          │
│  - signInWithPassword()      │
└──────┬──────────────────────┘
       │
       │ 2. Supabase Auth API 호출
       ▼
┌─────────────────────────────┐
│  Supabase Auth              │
│  - 인증 처리                 │
│  - JWT 토큰 생성             │
│  - 쿠키 설정                 │
└──────┬──────────────────────┘
       │
       │ 3. 인증 성공 → 쿠키 저장
       ▼
┌─────────────────────────────┐
│  Middleware                 │
│  - 쿠키 동기화               │
│  - 세션 갱신                 │
└──────┬──────────────────────┘
       │
       │ 4. router.refresh()
       ▼
┌─────────────────────────────┐
│  Server Component           │
│  (app/page.tsx)             │
│  - getCurrentUserServer()   │
│  - users 테이블 조회/생성    │
└──────┬──────────────────────┘
       │
       │ 5. 사용자 정보 반환
       ▼
┌─────────────┐
│   화면      │
│  업데이트    │
└─────────────┘
```

### 2. 사용자 정보 조회 프로세스

#### 서버 사이드 (Server Component)

```
app/page.tsx
    │
    ├─> getCurrentUserServer()
    │       │
    │       ├─> createServerSupabaseClient()
    │       │       │
    │       │       └─> Next.js cookies() 사용
    │       │           └─> 쿠키에서 세션 읽기
    │       │
    │       ├─> supabase.auth.getUser()
    │       │       │
    │       │       └─> Supabase Auth에서 사용자 확인
    │       │
    │       ├─> users 테이블 조회
    │       │       │
    │       │       └─> email로 users 테이블 검색
    │       │
    │       └─> 사용자 없으면 자동 생성
    │               │
    │               └─> role: 'user' (기본값)
    │
    └─> User 객체 반환 (id, email, name, role 등)
```

#### 클라이언트 사이드 (Client Component)

```
TopicListItem.tsx
    │
    ├─> isAdminClient() / isUserClient()
    │       │
    │       ├─> getCurrentUserClient()
    │       │       │
    │       │       ├─> createBrowserClient()
    │       │       │       │
    │       │       │       └─> @supabase/ssr 사용
    │       │       │           └─> 브라우저 쿠키 읽기
    │       │       │
    │       │       ├─> supabase.auth.getUser()
    │       │       │       │
    │       │       │       └─> 클라이언트에서 세션 확인
    │       │       │
    │       │       ├─> users 테이블 조회
    │       │       │
    │       │       └─> 사용자 없으면 자동 생성
    │       │
    │       └─> role 확인 후 boolean 반환
    │
    └─> 조건부 렌더링 (예: {isAdmin && <DeleteButton />})
```

---

## 주요 파일 설명

### 1. `lib/supabase/client.ts` - 브라우저 클라이언트

**역할**: 브라우저 환경에서 Supabase 클라이언트 생성

```typescript
// 브라우저에서 사용하는 Supabase 클라이언트
// @supabase/ssr의 createBrowserClient 사용
// - 브라우저 쿠키를 자동으로 관리
// - 클라이언트 컴포넌트에서만 사용
```

**사용 위치**:
- `lib/auth-client.ts`
- `app/components/auth/LoginButton.tsx`
- 모든 Client Components

---

### 2. `lib/supabase/server.ts` - 서버 클라이언트

**역할**: 서버 환경에서 Supabase 클라이언트 생성

```typescript
// 서버에서 사용하는 Supabase 클라이언트
// Next.js의 cookies()를 사용하여 쿠키 읽기/쓰기
// - Server Components에서 사용
// - Server Actions에서 사용
```

**특징**:
- `cookies().getAll()`: 모든 쿠키 읽기
- `cookies().set()`: 쿠키 설정 (Server Component에서는 제한적)
- Middleware에서 쿠키 동기화 처리

**사용 위치**:
- `lib/auth.ts`
- `app/page.tsx` (Server Component)

---

### 3. `lib/auth.ts` - 서버 사이드 인증

**역할**: Server Components에서 사용자 인증 및 역할 확인

**주요 함수**:

#### `getCurrentUserServer()`
```typescript
// 서버에서 현재 사용자 정보 가져오기
// 1. Supabase Auth에서 인증된 사용자 확인
// 2. users 테이블에서 사용자 정보 조회
// 3. 사용자가 없으면 자동 생성 (role: 'user')
```

**자동 사용자 생성 로직**:
- Supabase Auth에는 있지만 `users` 테이블에 없는 경우
- 이메일 앞부분을 `name`으로 사용
- 기본 `role`은 `'user'`

#### `isAdminServer()`
```typescript
// 현재 사용자가 관리자인지 확인
// getCurrentUserServer()를 호출하여 role 확인
```

#### `isUserServer()`
```typescript
// 현재 사용자가 일반 사용자인지 확인
// getCurrentUserServer()를 호출하여 role 확인
```

**사용 위치**:
- `app/page.tsx` (Server Component)
- 모든 Server Components

---

### 4. `lib/auth-client.ts` - 클라이언트 사이드 인증

**역할**: Client Components에서 사용자 인증 및 역할 확인

**주요 함수**:

#### `getCurrentUserClient()`
```typescript
// 클라이언트에서 현재 사용자 정보 가져오기
// 서버 버전과 동일한 로직이지만 브라우저 환경에서 실행
```

#### `isAdminClient()`
```typescript
// 클라이언트에서 관리자 여부 확인
// 비동기 함수이므로 useEffect나 이벤트 핸들러에서 사용
```

#### `isUserClient()`
```typescript
// 클라이언트에서 일반 사용자 여부 확인
```

**사용 위치**:
- `app/components/topics/TopicListItem.tsx`
- `app/components/topics/TopicDetail.tsx`
- `app/components/topics/TopicCreateButton.tsx`
- `app/components/topics/TopicDeleteButton.tsx`
- `app/components/memos/MemoButton.tsx`

**주의사항**:
- Client Component에서만 사용 가능
- 비동기 함수이므로 `useEffect`나 이벤트 핸들러에서 호출
- 초기 렌더링 시 `null`을 반환할 수 있으므로 조건부 렌더링 필요

---

### 5. `app/components/auth/LoginButton.tsx` - 로그인 UI

**역할**: 사용자 로그인/로그아웃 UI 제공 (회원가입 기능 제거됨)

**주요 기능**:

1. **세션 확인**
   ```typescript
   useEffect(() => {
     supabase.auth.getSession() // 현재 세션 확인
     supabase.auth.onAuthStateChange() // 인증 상태 변경 감지
   })
   ```

2. **로그인**
   ```typescript
   signInWithPassword() // 로그인
   ```

3. **로그아웃**
   ```typescript
   signOut() // 로그아웃
   router.refresh() // 서버 컴포넌트 재렌더링
   ```

**특징**:
- 로그인/회원가입 모드 전환
- 인증 상태 변경 시 자동으로 `router.refresh()` 호출
- 서버 컴포넌트가 새로운 세션 정보를 받을 수 있도록 함

---

### 6. `middleware.ts` - 세션 관리

**역할**: 모든 요청에서 Supabase 세션 쿠키 동기화 및 갱신

**작동 방식**:

```typescript
// 1. 요청이 들어올 때마다 실행
// 2. 쿠키에서 세션 읽기
// 3. Supabase Auth에 세션 확인 요청
// 4. 세션이 만료되었거나 갱신이 필요한 경우 쿠키 업데이트
// 5. 응답에 업데이트된 쿠키 포함
```

**중요성**:
- 서버와 클라이언트 간 쿠키 동기화 보장
- 세션 자동 갱신
- Server Components에서 최신 세션 정보 사용 가능

**매칭 경로**:
- 모든 경로에서 실행 (정적 파일 제외)
- `_next/static`, `_next/image`, 이미지 파일 제외

---

## 서버 vs 클라이언트 인증

### 언제 무엇을 사용해야 할까?

| 상황 | 사용할 파일 | 이유 |
|------|------------|------|
| Server Component | `lib/auth.ts` | 서버에서 실행되며 쿠키를 직접 읽을 수 있음 |
| Client Component | `lib/auth-client.ts` | 브라우저에서 실행되며 브라우저 쿠키 사용 |
| 초기 페이지 로드 | `lib/auth.ts` | 서버에서 먼저 렌더링되므로 서버 인증 사용 |
| 사용자 인터랙션 | `lib/auth-client.ts` | 클라이언트에서 즉시 반응해야 함 |

### 예시: `app/page.tsx`

```typescript
// Server Component
export default async function Home() {
  // ✅ 서버 인증 사용
  const isAdmin = await isAdminServer();
  const currentUser = await getCurrentUserServer();
  
  return (
    <>
      {isAdmin && <TopicCreateButton />}
      <TopicListItem topic={topic} />
    </>
  );
}
```

### 예시: `TopicListItem.tsx`

```typescript
// Client Component
'use client';

export default function TopicListItem({ topic }) {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // ✅ 클라이언트 인증 사용
    const checkAdmin = async () => {
      const admin = await isAdminClient();
      setIsAdmin(admin);
    };
    checkAdmin();
  }, []);
  
  return (
    <>
      {isAdmin && <TopicDeleteButton />}
    </>
  );
}
```

---

## 세션 관리

### 쿠키 동기화 흐름

```
┌──────────────┐
│   브라우저   │
│   (클라이언트)│
└──────┬───────┘
       │
       │ 1. 로그인 요청
       ▼
┌──────────────┐
│  Supabase    │
│  Auth API    │
└──────┬───────┘
       │
       │ 2. JWT 토큰 + 쿠키 설정
       ▼
┌──────────────┐
│  브라우저    │
│  쿠키 저장   │
└──────┬───────┘
       │
       │ 3. 다음 요청 시 쿠키 포함
       ▼
┌──────────────┐
│  Middleware  │
│  - 쿠키 읽기 │
│  - 세션 확인 │
│  - 쿠키 갱신 │
└──────┬───────┘
       │
       │ 4. 업데이트된 쿠키를 응답에 포함
       ▼
┌──────────────┐
│  Server      │
│  Component   │
│  - 쿠키 읽기 │
│  - 사용자 확인│
└──────────────┘
```

### 쿠키 관리 전략

1. **@supabase/ssr 사용**
   - 서버와 클라이언트 간 쿠키 자동 동기화
   - 세션 만료 시 자동 갱신

2. **Middleware 역할**
   - 모든 요청에서 세션 확인
   - 쿠키 갱신이 필요한 경우 자동 처리

3. **router.refresh()**
   - 인증 상태 변경 시 서버 컴포넌트 재렌더링
   - 최신 사용자 정보 반영

---

## 역할 기반 접근 제어 (RBAC)

### 역할 구조

```typescript
// lib/constants/roles.ts
export const USER_ROLES = {
  ADMIN: 'admin',  // 관리자
  USER: 'user',    // 일반 사용자
} as const;
```

### 권한 매트릭스

| 기능 | Admin | User |
|------|-------|------|
| Topic 생성 | ✅ | ❌ |
| Topic 수정 | ✅ | ❌ |
| Topic 삭제 | ✅ | ❌ |
| Topic 조회 | ✅ | ✅ |
| Memo 생성 | ✅ | ✅ (자신의 것만) |
| Memo 수정 | ✅ | ✅ (자신의 것만) |
| Memo 삭제 | ✅ | ✅ (자신의 것만) |
| Memo 조회 | ✅ (모든 것) | ✅ (자신의 것만) |

### 권한 확인 예시

#### 서버 사이드

```typescript
// app/page.tsx
const isAdmin = await isAdminServer();
const isUser = await isUserServer();

// 조건부 렌더링
{isAdmin && <TopicCreateButton />}
```

#### 클라이언트 사이드

```typescript
// TopicListItem.tsx
useEffect(() => {
  const checkRole = async () => {
    const admin = await isAdminClient();
    const user = await isUserClient();
    setIsAdmin(admin);
    setIsUser(user);
  };
  checkRole();
}, []);

// 조건부 렌더링
{isAdmin && <TopicDeleteButton />}
{isUser && <MemoButton />}
```

### 데이터베이스 레벨 권한 (RLS)

Supabase의 Row Level Security (RLS) 정책으로 데이터베이스 레벨에서도 권한 제어:

```sql
-- 사용자는 자신의 메모만 조회 가능
CREATE POLICY "Users can read own memos"
  ON memos FOR SELECT
  USING (user_id = get_current_user_id());

-- 관리자는 모든 메모 조회 가능
CREATE POLICY "Admins can read all memos"
  ON memos FOR SELECT
  USING (is_admin());
```

---

## 주요 특징 및 설계 결정

### 1. 자동 사용자 생성

**문제**: Supabase Auth에는 사용자가 있지만 `users` 테이블에는 없는 경우

**해결**: `getCurrentUserServer()`와 `getCurrentUserClient()`에서 자동 생성

```typescript
if (!user) {
  // 자동으로 users 테이블에 사용자 생성
  // role: 'user' (기본값)
  // name: email의 앞부분
}
```

### 2. 서버/클라이언트 분리

**이유**: Next.js App Router의 서버/클라이언트 컴포넌트 구조에 맞춤

**장점**:
- 타입 안정성 (서버 전용 함수를 클라이언트에서 사용 불가)
- 명확한 책임 분리
- 최적화된 성능

### 3. Middleware를 통한 세션 관리

**이유**: 서버와 클라이언트 간 쿠키 동기화 보장

**효과**:
- 세션 자동 갱신
- 서버 컴포넌트에서 최신 세션 정보 사용 가능
- 보안 강화

---

## 디버깅 팁

### 로그 확인

모든 인증 함수에는 디버깅 로그가 포함되어 있습니다:

```typescript
console.log('[Auth Server] Authenticated user email:', authUser.email);
console.log('[Auth Server] User found with role:', user.role);
console.log('[Auth Client] isAdminClient check:', { userRole, isAdmin });
```

### 일반적인 문제 해결

1. **사용자 정보가 null인 경우**
   - Middleware가 제대로 실행되는지 확인
   - 쿠키가 설정되었는지 확인
   - Supabase Auth 설정 확인

2. **역할이 제대로 표시되지 않는 경우**
   - `users` 테이블의 `role` 컬럼 확인
   - `getCurrentUserServer()` / `getCurrentUserClient()` 로그 확인

3. **세션이 만료되는 경우**
   - Middleware가 모든 요청에서 실행되는지 확인
   - `router.refresh()`가 호출되는지 확인

---

## 요약

이 프로젝트의 인증 시스템은 다음과 같은 특징을 가집니다:

1. **이중 인증 레이어**: Supabase Auth (인증) + Users 테이블 (메타데이터)
2. **서버/클라이언트 분리**: 각 환경에 최적화된 인증 함수
3. **자동 사용자 생성**: Supabase Auth 사용자를 Users 테이블에 자동 동기화
4. **세션 자동 관리**: Middleware를 통한 쿠키 동기화 및 갱신
5. **역할 기반 접근 제어**: Admin/User 역할에 따른 권한 관리
6. **데이터베이스 레벨 보안**: RLS 정책으로 추가 보안 강화

이 구조는 확장 가능하고 유지보수하기 쉬우며, Next.js App Router의 모범 사례를 따릅니다.

