import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
  fonts: [
    {
      cssVariable: "--font-inter",
      name: "Inter",
      provider: fontProviders.fontsource(),
      styles: ["normal"],
      weights: ["100 900"],
    },
  ],
  prefetch: {
    prefetchAll: true,
  },
  site: "https://quoter.cc",
  vite: {
    plugins: [tailwindcss()],
  },
});
