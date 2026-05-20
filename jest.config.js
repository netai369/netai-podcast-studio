export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.svelte$': ['svelte-jester', { preprocess: true }],
    '^.+\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }]
  },
  moduleFileExtensions: ['js', 'ts', 'svelte'],
  transformIgnorePatterns: ['/node_modules/(?!(@google/genai|edge-tts-universal|pdfjs-dist|lamejs|mammoth|jszip))/'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: ['src/**/*.{ts,svelte}', '!src/main.ts', '!src/app.d.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};