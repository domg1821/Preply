import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.preply',        // ← pick your bundle ID (reverse domain, all lowercase)
  appName: 'Preply',
  webDir: 'out',                        // not used in server mode, but required by the schema
  server: {
    url: 'https://your-app.vercel.app', // ← your Vercel deployment URL
    cleartext: false,
    allowNavigation: [
      '*.supabase.co',
      '*.stripe.com',
      '*.anthropic.com',
    ],
  },
  ios: {
    contentInset: 'always',             // respects notch / Dynamic Island safe areas
  },
  plugins: {
    Browser: {},
    Clipboard: {},
    Haptics: {},
  },
};

export default config;
