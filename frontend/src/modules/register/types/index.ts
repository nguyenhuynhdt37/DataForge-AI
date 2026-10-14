export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  title?: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  title?: string | null;
  total_annotated: number;
  accuracy_rate: number;
  is_admin: boolean;
  is_active: boolean;
  created_at?: string;
}
