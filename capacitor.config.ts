import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miaoda.creator',
  appName: '自媒体创作',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Share: {
      dialogTitle: '分享到小红书',
    },
  },
};

export default config;
