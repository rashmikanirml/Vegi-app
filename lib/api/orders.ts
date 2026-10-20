import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus, Payment } from '@/lib/types';

const orderSelect = `
  *,
  listing:listings (id, name, image_url, category, area),
  buyer:profiles!orders_buyer_id_fkey (id, full_name, phone, address),
  seller:profiles!orders_seller_id_fkey (id, full_name, farm_name, phone, address),
  payment:payments (*)
`;

function mapOrder(row: Record<string, unknown>): Order {
  const payment = row.payment as Payment | Payment[] | null;
  return {
    ...(row as unknown as Order),
    payment: Array.isArray(payment) ? payment[0] ?? null : payment,
  };
}

export async function createOrder(listingId: string, quantityKg: number) {
  const { data, error } = await supabase.rpc('create_order', {
    p_listing_id: listingId,
    p_quantity_kg: quantityKg,
  });
  if (error) throw error;
  return data as string;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw error;
  return data as Order;
}

export async function fetchOrdersForBuyer(buyerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(orderSelect)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

export async function fetchOrdersForSeller(sellerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(orderSelect)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(orderSelect)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

export async function fetchOrder(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(orderSelect)
    .eq('id', id)
    .single();
  if (error) throw error;
  return mapOrder(data as Record<string, unknown>);
}

export function subscribeToOrders(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`orders-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `buyer_id=eq.${userId}` },
      onChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `seller_id=eq.${userId}` },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
