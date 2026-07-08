import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Tell Nitro to inject the database namespace binding into the build
  nitro: {
    cloudflare: {
      wrangler: {
        kv_namespaces: [
          {
            binding: "HSC_SCORES",
            id: "e1ae2e40327c48b4aa40ae87d6c4355a"
          }
        ]
      }
    }
  }
});
