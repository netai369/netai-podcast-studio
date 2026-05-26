export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.svelte$': ['svelte-jester', { preprocess: true }],
    '^.+\.ts$': '<rootDir>/jest-import-meta-transform.js'
  },
  moduleFileExtensions: ['js', 'ts', 'svelte'],
  transformIgnorePatterns: ['/node_modules/(?!(@google/genai|edge-tts-universal|pdfjs-dist|lamejs|mammoth|jszip|@google/genai/dist/web))/'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: ['src/**/*.{ts,svelte}', '!src/main.ts', '!src/app.d.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};