/// <reference types="vite-plugin-pwa/client" />

// Set per build in vite.config.ts; changes whenever the app is rebuilt.
declare const __BUILD_ID__: string
// The git commit the build came from (vite.config.ts).
declare const __COMMIT__: string
