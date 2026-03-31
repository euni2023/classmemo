'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getCurrentUserClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();

    // 현재 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const currentUser = await getCurrentUserClient();
        setUser(currentUser ?? session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const currentUser = await getCurrentUserClient();
        setUser(currentUser ?? session.user);
      } else {
        setUser(null);
      }
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // 중복 요청 방지
    
    setIsSubmitting(true);
    const supabase = createBrowserClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert('로그인 실패: ' + error.message);
      } else {
        setEmail('');
        setPassword('');

        // 로그인 성공 시 현재 사용자 정보 업데이트
        const currentUser = await getCurrentUserClient();
        setUser(currentUser ?? data.user ?? null);

        router.refresh();
      }
    } catch (error) {
      console.error('인증 오류:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (isLoading) {
    return <div className="text-sm text-zinc-500">로딩 중...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <div>{user.name || '사용자'}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">

        <form onSubmit={handleLogin} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-black px-3 py-1 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '처리 중...' : '로그인'}
          </button>
        </form>
      </div>

    </div>
  );
}


