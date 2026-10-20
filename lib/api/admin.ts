import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchPendingSellers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'seller')
    .eq('approved', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function setSellerApproved(userId: string, approved: boolean) {
  const { error } = await supabase.from('profiles').update({ approved }).eq('id', userId);
  if (error) throw error;
  if (!approved) {
    await supabase
      .from('listings')
      .update({ status: 'paused' })
      .eq('seller_id', userId)
      .eq('status', 'active');
  }
}
