import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, EmptyState, Muted, Screen, Title } from '@/components/ui';
import { fetchPendingSellers, fetchUsers, setSellerApproved } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth';

export default function AdminApprovalsScreen() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const pending = useQuery({ queryKey: ['admin', 'pending-sellers'], queryFn: fetchPendingSellers });
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: fetchUsers });
  const sellers = (users.data ?? []).filter((user) => user.role === 'seller');

  const mutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => setSellerApproved(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Title>Farmer approvals</Title>
        <Muted>Approve sellers before their listings go live. Admins are not created through public sign-up.</Muted>
        {(pending.data ?? []).length === 0 ? (
          <EmptyState title="No pending farms" body="New seller registrations will appear here." />
        ) : (
          (pending.data ?? []).map((seller) => (
            <Card key={seller.id}>
              <Text style={{ fontWeight: '800' }}>{seller.farm_name || seller.full_name}</Text>
              <Muted>
                {seller.full_name} · {seller.phone} · {seller.address}
              </Muted>
              <Button title="Approve farm" onPress={() => mutation.mutate({ id: seller.id, approved: true })} />
            </Card>
          ))
        )}
        <Title>Approved sellers</Title>
        {sellers.filter((s) => s.approved).map((seller) => (
          <Card key={seller.id}>
            <Text style={{ fontWeight: '800' }}>{seller.farm_name || seller.full_name}</Text>
            <Muted>{seller.phone}</Muted>
            <Button
              title="Suspend"
              variant="danger"
              onPress={() => mutation.mutate({ id: seller.id, approved: false })}
            />
          </Card>
        ))}
        <View style={{ marginTop: 12 }}>
          <Button title="Sign out" variant="ghost" onPress={signOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}
