import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.atelier.womenscalculator',
  appName: '柔光計算器',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
