import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function TabIcon({
  name,
  color,
  size,
}: {
  name: IconName;
  color?: unknown;
  size?: number;
}) {
  const tint = typeof color === 'string' ? color : '#1F7A3A';
  return <Ionicons name={name} color={tint} size={size ?? 24} />;
}
