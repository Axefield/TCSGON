/// <reference types="vite/client" />

// Ambient module declarations for non-TS imports used by Vite.
// Loaded automatically by tsconfig.json's `include: ["src", "e2e"]`.

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css';

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}