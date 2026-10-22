import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { Button, ErrorText, Field, Muted, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/format';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      Alert.alert('Check your email', 'If that account exists, a reset link is on the way.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
        <Title>Reset password</Title>
        <Muted>We will email a reset link to your account.</Muted>
        <Field
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <ErrorText message={error} />
        <Button title="Send reset link" onPress={onSubmit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
