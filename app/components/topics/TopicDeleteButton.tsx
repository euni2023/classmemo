'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getCurrentUserClient, isAdminClient } from '@/lib/auth-client';
import { USER_ROLES } from '@/lib/constants/roles';
import { useRouter } from 'next/navigation';

interface TopicDeleteButtonProps {
  topicId: number;
  topicTitle: string;
  onDelete?: () => void;
}

export default function TopicDeleteButton({
  topicId,
  topicTitle,
  onDelete,
}: TopicDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    
    const checkAdmin = async () => {
      const admin = await isAdminClient();
      setIsAdmin(admin);
    };

    // 초기 역할 확인
    checkAdmin();

    // 인증 상태 변경 감지 - 로그인/로그아웃 시 역할 재확인
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 리스트 항목 클릭 이벤트 전파 방지

    if (!confirm(`"${topicTitle}" 수업 질문을 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      // 관리자 권한 확인
      const user = await getCurrentUserClient();
      if (!user || user.role !== USER_ROLES.ADMIN) {
        alert('관리자만 주제를 삭제할 수 있습니다.');
        setIsDeleting(false);
        return;
      }

      const supabase = createBrowserClient();
      const { error } = await supabase.from('topics').delete().eq('id', topicId);

      if (error) throw error;

      // 삭제 성공 후 callback 호출
      if (onDelete) {
        onDelete();
      }

      router.refresh();
    } catch (error) {
      console.error('글 삭제 오류:', error);
      alert('글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50"
      title="삭제"
    >
      {isDeleting ? '삭제 중...' : '삭제'}
    </button>
  );
}


