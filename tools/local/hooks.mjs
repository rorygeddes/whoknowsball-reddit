// Node module hooks for the local harness: swap in the fake Devvit server, resolve extensionless .ts imports, load JSON.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const fake = pathToFileURL(
  fileURLToPath(new URL('./fake-devvit.mjs', import.meta.url))
).href;

export async function resolve(specifier, ctx, next) {
  if (specifier === '@devvit/web/server')
    return { url: fake, shortCircuit: true };
  if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
    const url = new URL(specifier + '.ts', ctx.parentURL);
    if (existsSync(fileURLToPath(url)))
      return { url: url.href, shortCircuit: true };
  }
  return next(specifier, ctx);
}

export async function load(url, ctx, next) {
  if (url.endsWith('.json')) {
    return {
      format: 'module',
      source: `export default ${readFileSync(fileURLToPath(url), 'utf8')};`,
      shortCircuit: true,
    };
  }
  return next(url, ctx);
}
