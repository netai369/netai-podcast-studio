/**
 * Jest transformer that replaces Vite's import.meta.env with a global reference
 * before passing to ts-jest for TypeScript compilation.
 */
import tsJest from 'ts-jest';

const tsJestTransformer = tsJest.default.createTransformer({
  useESM: true,
  tsconfig: 'tsconfig.json'
});

export default {
  ...tsJestTransformer,
  process(sourceText, sourcePath, config) {
    // Replace import.meta.env with global.importMetaEnv (set up in setupTests.ts)
    const transformed = sourceText.replace(
      /import\.meta\.env/g,
      'global.importMetaEnv'
    );
    return tsJestTransformer.process(transformed, sourcePath, config);
  }
};
