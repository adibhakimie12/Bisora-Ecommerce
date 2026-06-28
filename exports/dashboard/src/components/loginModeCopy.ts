import { ApiError } from '../api/http';

export type AuthMode = 'login' | 'trial';

interface LoginModeCopy {
  tabLabel: string;
  title: string;
  description: string;
  helperTitle: string;
  helperText: string;
  submitLabel: string;
  submittingLabel: string;
}

export function getLoginModeCopy(mode: AuthMode): LoginModeCopy {
  if (mode === 'trial') {
    return {
      tabLabel: 'Sign up',
      title: 'Create workspace',
      description: 'Register your store first. Free trial and paid packages are selected inside the workspace.',
      helperTitle: 'New merchant:',
      helperText: 'Create an account, then choose Free Trial, Basic, Standard, or Premium from Store plan.',
      submitLabel: 'Create workspace',
      submittingLabel: 'Creating workspace...',
    };
  }

  return {
    tabLabel: 'Sign in',
    title: 'Sign in',
    description: 'Owner and registered sellers sign in here. Use the platform owner account to enter Superadmin.',
    helperTitle: 'Owner access:',
    helperText: 'Use adib.hakimi19@gmail.com with password Kimiey12. Demo mode also accepts any non-empty password for this owner email.',
    submitLabel: 'Sign in to workspace',
    submittingLabel: 'Authorizing credentials...',
  };
}

export function getPostAuthRoute({ isPlatformOwner, mode }: { isPlatformOwner: boolean; mode: AuthMode }) {
  if (isPlatformOwner) return '/superadmin';
  if (mode === 'trial') return '/store-plan';
  return '/dashboard';
}

export function getAuthErrorMessage(mode: AuthMode, error: unknown) {
  if (error instanceof ApiError && error.message && error.message !== 'API request failed') {
    return error.message;
  }

  if (mode === 'login' && error instanceof TypeError) {
    return 'Backend offline. Start Laravel API at http://127.0.0.1:8000, then sign in again.';
  }

  return mode === 'trial'
    ? 'Trial signup failed. Check all fields, use a new email, and keep password 8+ characters.'
    : 'Login failed. Check email, password, and API connection.';
}
