'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useZodForm } from '@/hooks/useZodForm';
import { loginSchema } from '@/lib/validation/auth';

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState, assignServerErrors } = useZodForm(loginSchema, {
    defaultValues: { email: '', password: '' },
  });
  const { errors } = formState;
  const [redirecting, setRedirecting] = useState(false);
  const { run, pending, error } = useApiRequest();

  const onSubmit = handleSubmit(async (values) => {
    const body = await run(
      '/api/auth/login',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) },
      'Login failed',
      assignServerErrors
    );
    if (!body) return;

    setRedirecting(true);
    router.push('/projects');
    router.refresh();
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Log in</h1>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <FormField id="login-email" label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </FormField>
        <FormField id="login-password" label="Password" error={errors.password}>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </FormField>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {/* Stays in the loading state through the redirect after a successful submit. */}
        <Button type="submit" loading={pending || redirecting} className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        No account?{' '}
        <a href="/signup" className="font-medium text-primary underline">
          Sign up
        </a>
      </p>
    </main>
  );
}
