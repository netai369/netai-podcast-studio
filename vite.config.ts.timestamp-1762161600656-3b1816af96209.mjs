// vite.config.ts
import { defineConfig } from "file:///Users/edgarbueltemeyer/Development/NetAI-Stack/netai-podcast-studio/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///Users/edgarbueltemeyer/Development/NetAI-Stack/netai-podcast-studio/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { sveltePreprocess } from "file:///Users/edgarbueltemeyer/Development/NetAI-Stack/netai-podcast-studio/node_modules/svelte-preprocess/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///Users/edgarbueltemeyer/Development/NetAI-Stack/netai-podcast-studio/vite.config.ts";
var vite_config_default = defineConfig({
  // Use relative paths for all assets to support deployment to any path.
  base: "./",
  plugins: [svelte({
    preprocess: sveltePreprocess()
  })],
  resolve: {
    alias: {
      // FIX: __dirname is not available in ES modules.
      "@": path.resolve(path.dirname(fileURLToPath(__vite_injected_original_import_meta_url)), "./src")
    }
  },
  define: {
    "process.env": process.env
  },
  server: {
    // Listen on all addresses, which is necessary for containerized/proxied environments.
    host: true,
    // This setting helps Vite correctly resolve asset URLs when running behind a proxy.
    origin: "",
    // Explicitly configure the HMR connection to prevent it from resolving to the wrong host.
    hmr: {
      protocol: "ws",
      // Use WebSockets for HTTP.
      port: 4e3
      // Use the same port as the dev server.
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZWRnYXJidWVsdGVtZXllci9EZXZlbG9wbWVudC9OZXRBSS1TdGFjay9uZXRhaS1wb2RjYXN0LXN0dWRpb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2VkZ2FyYnVlbHRlbWV5ZXIvRGV2ZWxvcG1lbnQvTmV0QUktU3RhY2svbmV0YWktcG9kY2FzdC1zdHVkaW8vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2VkZ2FyYnVlbHRlbWV5ZXIvRGV2ZWxvcG1lbnQvTmV0QUktU3RhY2svbmV0YWktcG9kY2FzdC1zdHVkaW8vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSAnQHN2ZWx0ZWpzL3ZpdGUtcGx1Z2luLXN2ZWx0ZSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJ1xuaW1wb3J0IHsgc3ZlbHRlUHJlcHJvY2VzcyB9IGZyb20gJ3N2ZWx0ZS1wcmVwcm9jZXNzJ1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgLy8gVXNlIHJlbGF0aXZlIHBhdGhzIGZvciBhbGwgYXNzZXRzIHRvIHN1cHBvcnQgZGVwbG95bWVudCB0byBhbnkgcGF0aC5cbiAgYmFzZTogJy4vJyxcbiAgcGx1Z2luczogW3N2ZWx0ZSh7XG4gICAgcHJlcHJvY2Vzczogc3ZlbHRlUHJlcHJvY2VzcygpXG4gIH0pXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAvLyBGSVg6IF9fZGlybmFtZSBpcyBub3QgYXZhaWxhYmxlIGluIEVTIG1vZHVsZXMuXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgJ3Byb2Nlc3MuZW52JzogcHJvY2Vzcy5lbnZcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgLy8gTGlzdGVuIG9uIGFsbCBhZGRyZXNzZXMsIHdoaWNoIGlzIG5lY2Vzc2FyeSBmb3IgY29udGFpbmVyaXplZC9wcm94aWVkIGVudmlyb25tZW50cy5cbiAgICBob3N0OiB0cnVlLFxuICAgIC8vIFRoaXMgc2V0dGluZyBoZWxwcyBWaXRlIGNvcnJlY3RseSByZXNvbHZlIGFzc2V0IFVSTHMgd2hlbiBydW5uaW5nIGJlaGluZCBhIHByb3h5LlxuICAgIG9yaWdpbjogJycsXG4gICAgLy8gRXhwbGljaXRseSBjb25maWd1cmUgdGhlIEhNUiBjb25uZWN0aW9uIHRvIHByZXZlbnQgaXQgZnJvbSByZXNvbHZpbmcgdG8gdGhlIHdyb25nIGhvc3QuXG4gICAgaG1yOiB7XG4gICAgICBwcm90b2NvbDogJ3dzJywgLy8gVXNlIFdlYlNvY2tldHMgZm9yIEhUVFAuXG4gICAgICBwb3J0OiA0MDAwIC8vIFVzZSB0aGUgc2FtZSBwb3J0IGFzIHRoZSBkZXYgc2VydmVyLlxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFgsU0FBUyxvQkFBb0I7QUFDM1osU0FBUyxjQUFjO0FBQ3ZCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHdCQUF3QjtBQUorTSxJQUFNLDJDQUEyQztBQU9qUyxJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBLEVBRTFCLE1BQU07QUFBQSxFQUNOLFNBQVMsQ0FBQyxPQUFPO0FBQUEsSUFDZixZQUFZLGlCQUFpQjtBQUFBLEVBQy9CLENBQUMsQ0FBQztBQUFBLEVBQ0YsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUEsTUFFTCxLQUFLLEtBQUssUUFBUSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDLEdBQUcsT0FBTztBQUFBLElBQ3pFO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sZUFBZSxRQUFRO0FBQUEsRUFDekI7QUFBQSxFQUNBLFFBQVE7QUFBQTtBQUFBLElBRU4sTUFBTTtBQUFBO0FBQUEsSUFFTixRQUFRO0FBQUE7QUFBQSxJQUVSLEtBQUs7QUFBQSxNQUNILFVBQVU7QUFBQTtBQUFBLE1BQ1YsTUFBTTtBQUFBO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
