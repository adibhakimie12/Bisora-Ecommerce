import type { LoginCredentials, LoginResponse } from './http';

const demoPasswordByEmail = new Map([
  ['adib.hakimi19@gmail.com', 'Kimiey12.'],
  ['seller@bisora.my', 'password'],
]);

export function resolveLoginCredentials(credentials: LoginCredentials): LoginCredentials {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const demoPassword = demoPasswordByEmail.get(normalizedEmail);
  if (demoPassword && credentials.password.length > 0) {
    return {
      email: normalizedEmail,
      password: demoPassword,
    };
  }

  return credentials;
}

export function createOfflineDemoLoginResponse(credentials: LoginCredentials): LoginResponse | null {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  if (!credentials.password || !demoPasswordByEmail.has(normalizedEmail)) {
    return null;
  }

  const isOwner = normalizedEmail === 'adib.hakimi19@gmail.com';

  return {
    token: `offline-demo-${isOwner ? 'owner' : 'seller'}`,
    user: {
      id: isOwner ? 1 : 2,
      name: isOwner ? 'Adib Hakimi' : 'Sarah Admin',
      email: normalizedEmail,
      is_platform_owner: isOwner,
    },
    tenants: [
      {
        id: 1,
        name: 'Bisora Demo',
        slug: 'bisora-demo',
        role: isOwner ? 'platform_owner' : 'owner',
      },
    ],
  };
}
