import { fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import vinext from 'vinext';
import { defineConfig } from 'vite';

// Dev runs on Node; build and deploy run through the Cloudflare plugin so the
// output is a Workers bundle. There is no database and no auth here — the
// registry JSON is the source of truth and it is fetched at build time, so the
// Worker has nothing to connect to at runtime.
const useCloudflare =
  process.argv.includes('build') ||
  process.argv.includes('deploy') ||
  process.env.VINEXT_CLOUDFLARE_DEV === '1';

export default defineConfig({
  resolve: {
    // `cloudflare:workers` is a workerd built-in. src/lib/data.ts imports the
    // ASSETS binding from it; under plain Node dev that import is parsed and
    // fails resolution even though the code path never runs.
    alias: useCloudflare
      ? []
      : [
          {
            find: 'cloudflare:workers',
            replacement: fileURLToPath(new URL('./src/lib/workers-env-stub.ts', import.meta.url)),
          },
        ],
  },
  plugins: [
    vinext(),
    ...(useCloudflare
      ? [cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] } })]
      : []),
  ],
});
