import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { subscribeToOrders } from '@/lib/api/orders';

export function useRealtimeOrders(userId?: string) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    return subscribeToOrders(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setNotice('An order was updated.');
    });
  }, [queryClient, userId]);

  return { notice, clearNotice: () => setNotice(null) };
}
