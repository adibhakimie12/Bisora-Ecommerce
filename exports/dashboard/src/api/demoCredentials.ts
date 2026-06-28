import type { LoginCredentials } from './http';

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
