import type { OAuthProvider } from '../api/oauth';

export const OAUTH_PROVIDER_NAMES: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
};

export function OAuthProviderIcon({
  provider,
  size = 18,
}: {
  provider: OAuthProvider;
  size?: number;
}) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.26 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
      />
    </svg>
  );
}
