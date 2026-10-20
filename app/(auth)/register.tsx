import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, ErrorText, Field, Muted, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/format';
import type { UserRole } from '@/lib/types';

export default function RegisterScreen() {
  const { signUp, configured } = useAuth();
  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>('buyer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [farmName, setFarmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      if (!fullName.trim() || !email.trim() || password.length < 6) {
        throw new Error('Name, email, and a password of at least 6 characters are required');
      }
      if (role === 'seller' && (!farmName.trim() || !phone.trim() || !address.trim())) {
        throw new Error('Sellers must add farm name, phone, and location');
      }
      await signUp({ email, password, fullName, role, phone, address, farmName });
      router.replace('/');
    } catch (err) {
      setError(errorMessage(err, 'Could not create account'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Title>Create account</Title>
        <Muted>Choose Buyer or Seller. Admin accounts are created in Supabase only.</Muted>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['buyer', 'seller'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setRole(option)}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: role === option ? '#1F7A3A' : '#E7F5EA',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: role === option ? '#fff' : '#1F7A3A', fontWeight: '800' }}>
                {option === 'buyer' ? 'Buyer' : 'Seller'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <Field
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Field label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Field label="Address / location" value={address} onChangeText={setAddress} />
        {role === 'seller' ? (
          <Field label="Farm name" value={farmName} onChangeText={setFarmName} />
        ) : null}
        {role === 'seller' ? (
          <Muted>Your listings stay hidden until an admin approves your farm.</Muted>
        ) : null}
        <ErrorText message={error} />
        <Button title="Register" onPress={onSubmit} loading={loading} disabled={!configured} />
      </ScrollView>
    </Screen>
  );
}
