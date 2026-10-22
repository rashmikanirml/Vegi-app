import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/format';

export default function LoginScreen() {
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (err) {
      setError(errorMessage(err, 'Could not log in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
        <Title>Welcome back</Title>
        <Field
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <ErrorText message={error} />
        <Button title="Log in" onPress={onSubmit} loading={loading} disabled={!configured} />
        <Link href="/(auth)/forgot-password">
          <Text style={{ color: '#1F7A3A', fontWeight: '700' }}>Forgot password?</Text>
        </Link>
      </ScrollView>
    </Screen>
  );
}
