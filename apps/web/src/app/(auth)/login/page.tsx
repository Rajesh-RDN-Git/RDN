'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendOtpSchema, type SendOtpInput } from '@rdn/shared';
import { PhoneInput } from '@/components/ui/phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { authApi } from '@/lib/api';
import { showToast } from '@/stores/toast-store';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted">
          <Spinner size="lg" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SendOtpInput>({
    resolver: zodResolver(sendOtpSchema),
  });

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onSendOtp = useCallback(async (data: SendOtpInput) => {
    setIsSubmitting(true);
    try {
      await authApi.sendOtp(data.phone);
      setPhone(data.phone);
      setStep('otp');
      setResendTimer(30);
      showToast.success('OTP sent successfully');
    } catch {
      showToast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const onVerifyOtp = useCallback(
    async (otp: string) => {
      setIsSubmitting(true);
      try {
        await login(phone, otp);
        const from = searchParams.get('from') || '/dashboard';
        router.push(from);
      } catch {
        showToast.error('Invalid OTP. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [phone, login, router, searchParams],
  );

  const handleResend = useCallback(async () => {
    try {
      await authApi.sendOtp(phone);
      setResendTimer(30);
      showToast.success('OTP resent successfully');
    } catch {
      showToast.error('Failed to resend OTP');
    }
  }, [phone]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {step === 'phone'
            ? 'Enter your phone number to continue'
            : `Enter the OTP sent to ${phone}`}
        </p>

        {step === 'phone' ? (
          <form onSubmit={handleSubmit(onSendOtp)} className="space-y-4">
            <PhoneInput
              label="Phone Number"
              placeholder="9999900001"
              error={errors.phone?.message}
              {...register('phone', {
                setValueAs: (v: string) => (v.startsWith('+91') ? v : `+91${v}`),
              })}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <OtpInput onComplete={onVerifyOtp} disabled={isSubmitting} />
            {isSubmitting && (
              <div className="flex justify-center">
                <Spinner size="sm" />
              </div>
            )}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">Resend OTP in {resendTimer}s</p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-sm font-medium text-brand hover:text-brand-text"
                >
                  Resend OTP
                </button>
              )}
            </div>
            <button
              onClick={() => setStep('phone')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Change phone number
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-brand hover:text-brand-text">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
