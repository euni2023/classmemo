# 권한 구조 구현 가이드

## 요구사항 정리

### user 역할 (일반 사용자)
- ✅ topic에 대한 메모(memos) 작성/수정/삭제
- ✅ 자신이 작성한 메모만 조회

### admin 역할 (관리자)
- ✅ topic 생성/수정/삭제

---

## 구현 단계

### 1단계: 인증 유틸리티 함수 생성 ✅
**파일**: `lib/auth.ts` (이미 생성됨)

**기능**:
- `getCurrentUserServer()` / `getCurrentUserClient()`: 현재 사용자 정보 조회
- `isAdminServer()` / `isAdminClient()`: 관리자 여부 확인
- `isUserServer()` / `isUserClient()`: 일반 사용자 여부 확인

---

### 2단계: 로그인 컴포넌트 생성

**파일**: `app/components/LoginButton.tsx` (새로 생성 필요)

**기능**:
- Supabase Auth를 사용한 로그인/회원가입
- 로그인 상태 표시
- 사용자 역할 표시

**구현 예시**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) router.refresh();
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  // 현재 세션 확인
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // UI 렌더링...
}
```

---

### 3단계: page.tsx 수정

**변경사항**:
1. 로그인 버튼 추가
2. 관리자만 "주제 작성" 버튼 표시
3. 일반 사용자는 topics 목록만 조회 (읽기 전용)

**수정 예시**:
```typescript
import { isAdminServer } from '@/lib/auth';
import LoginButton from './components/LoginButton';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .order('id', { ascending: false });

  const isAdmin = await isAdminServer();

  return (
    <div>
      <header>
        <h1>수업 질문 관리</h1>
        <LoginButton />
        {isAdmin && <WritePostButton />} {/* 관리자만 표시 */}
      </header>
      {/* topics 목록 표시 */}
    </div>
  );
}
```

---

### 4단계: WritePostButton.tsx 수정 (관리자만 사용)

**변경사항**:
1. 관리자 권한 체크 추가
2. topics 테이블에 INSERT

**수정 예시**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 관리자 권한 확인
  const user = await getCurrentUserClient();
  if (user?.role !== 'admin') {
    alert('관리자만 주제를 생성할 수 있습니다.');
    return;
  }

  const supabase = createBrowserClient();
  const { error } = await supabase.from('topics').insert({
    title,
    goals,
    activity,
    weeks: weeks === '' ? null : Number(weeks),
  });
  // ...
};
```

---

### 5단계: PostDetail.tsx 수정 (관리자만 수정 가능)

**변경사항**:
1. 관리자만 수정 버튼 표시
2. UPDATE 시 관리자 권한 체크

**수정 예시**:
```typescript
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const checkAdmin = async () => {
    const admin = await isAdminClient();
    setIsAdmin(admin);
  };
  checkAdmin();
}, []);

const handleUpdate = async (e: React.FormEvent) => {
  // 관리자 권한 확인
  const user = await getCurrentUserClient();
  if (user?.role !== 'admin') {
    alert('관리자만 주제를 수정할 수 있습니다.');
    return;
  }
  // UPDATE 로직...
};

// UI에서
{isAdmin && (
  <button onClick={() => setIsEditing(true)}>수정</button>
)}
```

---

### 6단계: DeleteButton.tsx 수정 (관리자만 사용)

**변경사항**:
1. 관리자만 삭제 버튼 표시
2. DELETE 시 관리자 권한 체크

**수정 예시**:
```typescript
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const checkAdmin = async () => {
    const admin = await isAdminClient();
    setIsAdmin(admin);
  };
  checkAdmin();
}, []);

const handleDelete = async (e: React.MouseEvent) => {
  // 관리자 권한 확인
  const user = await getCurrentUserClient();
  if (user?.role !== 'admin') {
    alert('관리자만 주제를 삭제할 수 있습니다.');
    return;
  }
  // DELETE 로직...
};

// PostListItem.tsx에서
{isAdmin && <DeleteButton postId={post.id} postTitle={post.title} />}
```

---

### 7단계: 메모 관련 컴포넌트 생성 (일반 사용자용)

**새 파일**: `app/components/MemoButton.tsx`
- topic 클릭 시 메모 작성/조회 모달 표시

**새 파일**: `app/components/MemoList.tsx`
- 자신이 작성한 메모 목록 표시

**새 파일**: `app/components/MemoDetail.tsx`
- 메모 상세보기 및 수정/삭제

**구현 예시**:
```typescript
// MemoButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getCurrentUserClient } from '@/lib/auth';

interface MemoButtonProps {
  topicId: number;
}

export default function MemoButton({ topicId }: MemoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [memos, setMemos] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUserClient();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // 자신의 메모만 조회
  const loadMemos = async () => {
    if (!user) return;
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('memos')
      .select('*')
      .eq('topic_id', topicId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMemos(data || []);
  };

  // 메모 작성
  const handleSubmit = async (formData) => {
    if (!user) return;
    const supabase = createBrowserClient();
    await supabase.from('memos').insert({
      user_id: user.id,
      topic_id: topicId,
      activity_content: formData.activity_content,
      reflection: formData.reflection,
    });
    loadMemos();
  };

  // UI 렌더링...
}
```

---

### 8단계: PostListItem.tsx 수정

**변경사항**:
1. 관리자만 삭제 버튼 표시
2. 일반 사용자는 메모 버튼 표시

**수정 예시**:
```typescript
const [isAdmin, setIsAdmin] = useState(false);
const [isUser, setIsUser] = useState(false);

useEffect(() => {
  const checkRole = async () => {
    const user = await getCurrentUserClient();
    setIsAdmin(user?.role === 'admin');
    setIsUser(user?.role === 'user');
  };
  checkRole();
}, []);

return (
  <li>
    <div>{post.title}</div>
    <div>
      {isAdmin && <DeleteButton postId={post.id} postTitle={post.title} />}
      {isUser && <MemoButton topicId={post.id} />}
    </div>
  </li>
);
```

---

## 데이터 흐름도

```
[로그인]
  ↓
[역할 확인]
  ├─ admin → topics CRUD 가능
  └─ user → memos CRUD 가능 (자신의 것만)
```

---

## 보안 고려사항

### 1. UI 레벨 보호
- 역할에 따라 버튼 표시/숨김
- 사용자 경험 개선

### 2. API 레벨 보호 (필수)
- 각 작업 전 권한 재확인
- 클라이언트 조작 방지

### 3. 데이터베이스 레벨 보호 (권장)
- RLS (Row Level Security) 정책 설정
- 최종 방어선

---

## RLS 정책 예시

### topics 테이블
```sql
-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read topics"
ON topics FOR SELECT USING (true);

-- 관리자만 INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify topics"
ON topics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND users.role = 'admin'
  )
);
```

### memos 테이블
```sql
-- 자신의 메모만 읽기
CREATE POLICY "Users can read own memos"
ON memos FOR SELECT
USING (user_id = get_current_user_id());

-- 자신의 메모만 작성/수정/삭제
CREATE POLICY "Users can manage own memos"
ON memos FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());
```

---

## 구현 순서 요약

1. ✅ `lib/auth.ts` 생성 (인증 유틸리티)
2. `app/components/LoginButton.tsx` 생성
3. `app/page.tsx` 수정 (로그인 버튼, 관리자만 주제 작성)
4. `app/components/WritePostButton.tsx` 수정 (관리자 권한 체크)
5. `app/components/PostDetail.tsx` 수정 (관리자만 수정)
6. `app/components/DeleteButton.tsx` 수정 (관리자만 삭제)
7. `app/components/PostListItem.tsx` 수정 (역할에 따라 버튼 표시)
8. 메모 관련 컴포넌트 생성 (MemoButton, MemoList, MemoDetail)
9. RLS 정책 설정 (Supabase에서)

---

## 테스트 체크리스트

- [ ] 관리자 로그인 시 topics 작성/수정/삭제 가능
- [ ] 일반 사용자 로그인 시 memos 작성/수정/삭제 가능
- [ ] 일반 사용자는 자신의 메모만 조회 가능
- [ ] 비로그인 사용자는 읽기만 가능
- [ ] API 레벨 권한 체크 동작 확인
- [ ] RLS 정책 동작 확인

