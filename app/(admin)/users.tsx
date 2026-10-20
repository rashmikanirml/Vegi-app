import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text } from 'react-native';

import { Card, EmptyState, Muted, Screen, StatusBadge, Title } from '@/components/ui';
import { fetchUsers } from '@/lib/api/admin';

export default function AdminUsersScreen() {
  const query = useQuery({ queryKey: ['admin', 'users'], queryFn: fetchUsers });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Title>Users</Title>
        {(query.data ?? []).length === 0 ? (
          <EmptyState title="No users" body="Registered buyers and sellers appear here." />
        ) : (
          (query.data ?? []).map((user) => (
            <Card key={user.id}>
              <Text style={{ fontWeight: '800' }}>{user.full_name || 'Unnamed user'}</Text>
              <Muted>
                {user.role} · {user.phone || 'no phone'} · {user.farm_name || user.address || '—'}
              </Muted>
              {user.role === 'seller' ? (
                <StatusBadge status={user.approved ? 'completed' : 'pending'} />
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
