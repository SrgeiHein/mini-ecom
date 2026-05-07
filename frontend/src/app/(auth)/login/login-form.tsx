'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import * as authApi from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { isApiError } from '@/lib/api-client';

const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const res = await authApi.login(values.email, values.password);
      setSession(res.accessToken, res.user);
      const next = params.get('next') ?? '/';
      router.replace(next);
    } catch (err) {
      setServerError(
        isApiError(err) && err.status === 429
          ? 'Too many attempts. Please try again in a minute.'
          : isApiError(err) && err.status >= 400 && err.status < 500
            ? 'Invalid credentials'
            : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 h-1 w-10 rounded-full bg-indigo-600" />
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sign in to browse the demo catalog.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            aria-invalid={errors.email ? 'true' : 'false'}
            className="field"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <button
              type="button"
              className="mb-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500"
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
            className="field"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {serverError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
          {!isSubmitting && (
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 10h12m0 0-4-4m4 4-4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
        Demo: <span className="font-mono">demo@mini-ecom.test</span> /{' '}
        <span className="font-mono">Demo!Pass123</span>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Mini E-commerce Demo
      </p>
    </div>
  );
}
