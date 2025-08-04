import dotenv from 'dotenv';

dotenv.config();

export const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  google: {
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}',
    docId: process.env.GOOGLE_DOC_ID || '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow',
  },
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  },
  urls: {
    githubRepo: process.env.GITHUB_REPO_URL || 'https://github.com/garimto81/slack-report-automation',
  },
  schedule: {
    dailyCron: process.env.DAILY_SCHEDULE || '0 10 * * *',
    retryInterval: parseInt(process.env.RETRY_INTERVAL || '60', 10),
  },
  timezone: process.env.TZ || 'Asia/Seoul',
};