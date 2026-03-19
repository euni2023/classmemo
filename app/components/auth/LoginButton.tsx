'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
      if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          alert('로그인 실패: ' + error.message);
        } else {
          setEmail('');
          setPassword('');
          // 세션 확인 및 페이지 새로고침
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          alert('회원가입 실패: ' + error.message);
        } else {
          alert('회원가입 성공! 이메일 확인 후 로그인하세요.');
          setIsLoginMode(true);
          setEmail('');
          setPassword('');
        }
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
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {user.email}
        </span>
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
            {isSubmitting ? '처리 중...' : (isLoginMode ? '로그인' : '회원 가입')}
          </button>
        </form>
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
       {isLoginMode ? (
          <span>아직 가입을 안한 경우는 </span>
        ) : (
          <span>이미 계정이 있는 경우는 </span>
        )}
        <button
          onClick={() => setIsLoginMode(!isLoginMode)}
          className="rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-black hover:bg-gray-300"
        >
          {isLoginMode ? '회원 가입' : '로그인'}
        </button>
        
      </div>
    </div>
  );
}


