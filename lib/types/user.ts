/**
 * User 관련 타입 정의
 */

export interface User {
  id: number;
  email: string;
  name: string;
  snumber?: string | null;
  role: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
}


