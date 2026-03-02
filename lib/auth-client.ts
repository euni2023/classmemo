// 클라이언트 전용 인증 함수
// 'use client' 컴포넌트에서만 사용하세요.

import { createBrowserClient } from './supabase/client';

/**
 * 클라이언트 사이드에서 현재 사용자 정보 가져오기
 */
export async function getCurrentUserClient() {
  try {
    const supabase = createBrowserClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.log('[Auth Client] Auth error:', authError.message);
      return null;
    }

    if (!authUser || !authUser.email) {
      console.log('[Auth Client] No authenticated user');
      return null;
    }

    console.log('[Auth Client] Authenticated user email:', authUser.email);

    // users 테이블에서 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single();

    // 사용자가 없으면 자동 생성
    if (userError || !user) {
      console.log(`[Auth Client] User ${authUser.email} not found in 'users' table, creating...`);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: authUser.email,
          name: authUser.email.split('@')[0], // 이메일 앞부분을 이름으로 사용
          role: 'user', // 기본 역할은 'user'
        })
        .select('*')
        .single();

      if (createError) {
        console.error('[Auth Client] Error creating user:', createError);
        return null;
      }

      console.log(`[Auth Client] User ${newUser?.email} created with role: ${newUser?.role}`);
      return newUser;
    }

    console.log(`[Auth Client] User ${user.email} found with role: ${user.role}`);
    return user;
  } catch (error) {
    console.error('[Auth Client] getCurrentUserClient error:', error);
    return null;
  }
}

/**
 * 클라이언트 사이드에서 현재 사용자가 관리자인지 확인
 */
export async function isAdminClient(): Promise<boolean> {
  const user = await getCurrentUserClient();
  const isAdmin = user?.role === 'admin';
  console.log(`[Auth Client] isAdminClient check: user?.role = ${user?.role}, result = ${isAdmin}`);
  return isAdmin;
}

/**
 * 클라이언트 사이드에서 현재 사용자가 일반 사용자인지 확인
 */
export async function isUserClient(): Promise<boolean> {
  const user = await getCurrentUserClient();
  const isUser = user?.role === 'user';
  console.log(`[Auth Client] isUserClient check: user?.role = ${user?.role}, result = ${isUser}`);
  return isUser;
}

