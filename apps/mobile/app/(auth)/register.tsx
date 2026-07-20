import { useState } from 'react';
import { Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await sendOtp(fullPhone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await verifyOtp(fullPhone, otp);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>RDN</Text>
        <Text style={styles.title}>{otpSent ? 'Verify OTP' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>
          {otpSent
            ? `Enter the 6-digit code sent to +91${phone.replace('+91', '')}`
            : 'Join the Resident Dealer Network'}
        </Text>

        {!otpSent ? (
          <>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              autoCapitalize="words"
            />
            <Input
              label="Phone Number"
              placeholder="Enter 10-digit number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9+]/g, ''));
                setError('');
              }}
              keyboardType="phone-pad"
              maxLength={13}
              error={error}
            />
            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              isLoading={loading}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Input
              label="OTP"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={(text) => {
                setOtp(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              error={error}
            />
            <Button
              title="Create Account"
              onPress={handleVerifyOtp}
              isLoading={loading}
              style={styles.button}
            />
            <Button
              title="Go Back"
              onPress={() => {
                setOtpSent(false);
                setOtp('');
                setError('');
              }}
              variant="outline"
              style={styles.button}
            />
          </>
        )}

        <Button
          title="Already have an account? Login"
          onPress={() => router.push('/(auth)/login')}
          variant="outline"
          style={styles.loginButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: { marginTop: 8, width: '100%' },
  loginButton: { marginTop: 24, width: '100%' },
});
