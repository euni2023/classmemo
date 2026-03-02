// 이 파일은 서버 전용 함수만 포함합니다.
// 클라이언트 컴포넌트에서는 lib/auth-client.ts를 사용하세요.

import { createServerSupabaseClient } from './supabase/server';

/**
 * 서버 사이드에서 현재 사용자 정보 가져오기
 */
export async function getCurrentUserServer() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.log('[Auth Server] Auth error:', authError.message, authError);
      return null;
    }

    if (!authUser || !authUser.email) {
      console.log('[Auth Server] No authenticated user - authUser:', authUser);
      return null;
    }

    console.log('[Auth Server] Authenticated user email:', authUser.email);

    // users 테이블에서 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single();

    // 사용자가 없으면 자동 생성
    if (userError || !user) {
      console.log(`[Auth Server] User ${authUser.email} not found in 'users' table, creating...`);
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
        console.error('[Auth Server] Error creating user:', createError);
        return null;
      }

      console.log(`[Auth Server] User ${newUser?.email} created with role: ${newUser?.role}`);
      return newUser;
    }

    console.log(`[Auth Server] User ${user.email} found with role: ${user.role}`);
    return user;
  } catch (error) {
    console.error('[Auth Server] getCurrentUserServer error:', error);
    return null;
  }
}

/**
 * 서버 사이드에서 현재 사용자가 관리자인지 확인
 */
export async function isAdminServer(): Promise<boolean> {
  const user = await getCurrentUserServer();
  return user?.role === 'admin';
}

/**
 * 서버 사이드에서 현재 사용자가 일반 사용자인지 확인
 */
export async function isUserServer(): Promise<boolean> {
  const user = await getCurrentUserServer();
  return user?.role === 'user';
}

