import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dominicgeraci.preply',
  appName: 'Preply',
  webDir: 'out',                        // not used in server mode, but required by the schema
  server: {
    url: 'https://preply-umber.vercel.app',
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
