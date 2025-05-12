import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "tests/openPhish.test.ts", // Entry point for your script
      formats: ["es"], // Output as an ES module
    },
    outDir: "dist-tests", // Output directory for the compiled script
    rollupOptions: {
      output: {
        entryFileNames: "[name].js", // Ensure the output file is named properly
      },
    },
  },
});