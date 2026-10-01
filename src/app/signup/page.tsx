'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useZodForm } from '@/hooks/useZodForm';
import { signupSchema } from '@/lib/validation/auth';
import { PASSWORD_MIN } from '@/lib/validation/limits';

export default function SignupPage() {
  const router = useRouter();
  const { register, handleSubmit, formState, assignServerErrors } = useZodForm(signupSchema, {
    defaultValues: { email: '', password: '' },
  });
  const { errors } = formState;
  const [redirecting, setRedirecting] = useState(false);
  const { run, pending, error } = useApiRequest();

  const onSubmit = handleSubmit(async (values) => {
    const body = await run(
      '/api/auth/signup',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) },
      'Sign up failed',
      assignServerErrors
    );
    if (!body) return;

    setRedirecting(true);
    router.push('/projects');
    router.refresh();
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <FormField id="signup-email" label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </FormField>
        <FormField
          id="signup-password"
          label="Password"
          error={errors.password}
          help={`At least ${PASSWORD_MIN} characters.`}
        >
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </FormField>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {/* Stays in the loading state through the redirect after a successful submit. */}
        <Button type="submit" loading={pending || redirecting} className="w-full">
          Sign up
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-primary underline">
          Log in
        </a>
      </p>
    </main>
  );
}
