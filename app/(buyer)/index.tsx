import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';

import { Card, EmptyState, Field, Muted, Screen, StatusBadge } from '@/components/ui';
import { fetchMarketplace } from '@/lib/api/listings';
import { kg, money } from '@/lib/format';
import { VEGETABLE_CATEGORIES } from '@/lib/types';

export default function MarketplaceScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const query = useQuery({
    queryKey: ['listings', 'market', search, category, sort],
    queryFn: () => fetchMarketplace({ search, category, sort }),
  });

  const sorts = useMemo(
    () => [
      { id: 'newest' as const, label: 'Newest' },
      { id: 'price_asc' as const, label: 'Price ↑' },
      { id: 'price_desc' as const, label: 'Price ↓' },
    ],
    []
  );

  return (
    <Screen>
      <Field label="Search" value={search} onChangeText={setSearch} placeholder="Tomato, beans…" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
        <Chip selected={!category} label="All" onPress={() => setCategory('')} />
        {VEGETABLE_CATEGORIES.map((item) => (
          <Chip key={item} selected={category === item} label={item} onPress={() => setCategory(item)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {sorts.map((item) => (
          <Chip key={item.id} selected={sort === item.id} label={item.label} onPress={() => setSort(item.id)} />
        ))}
      </View>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState title="No vegetables yet" body="Approved farmers will appear here when they publish stock." />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(buyer)/listing/${item.id}`)}>
            <Card>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={{ height: 140, borderRadius: 12 }} />
              ) : null}
              <Text style={{ fontWeight: '800', fontSize: 18 }}>{item.name}</Text>
              <Muted>
                {item.seller?.farm_name || item.seller?.full_name} · {item.area || 'Local pickup'}
              </Muted>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#1F7A3A' }}>
                  {money(item.price_per_kg)} / kg · {kg(item.quantity_kg)} left
                </Text>
                <StatusBadge status={item.status} />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: selected ? '#1F7A3A' : '#E7F5EA',
      }}
    >
      <Text style={{ color: selected ? '#fff' : '#1F7A3A', fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
