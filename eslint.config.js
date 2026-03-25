import js from "@eslint/js";
import prettier from "eslint-config-prettier";

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  localStorage: "readonly",
  fetch: "readonly",
  Headers: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  FormData: "readonly",
  performance: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  Element: "readonly",
  HTMLElement: "readonly",
  HTMLInputElement: "readonly",
  HTMLFormElement: "readonly",
};

const serviceWorkerGlobals = {
  ...browserGlobals,
  self: "readonly",
  caches: "readonly",
};

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: browserGlobals,
    },
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: serviceWorkerGlobals,
    },
  },
  prettier,
];
