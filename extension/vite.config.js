import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        home: resolve(__dirname, "src/pages/home/home.html"),
        second: resolve(__dirname, "src/pages/text_input/text_input.html"),
        question: resolve(__dirname, "src/pages/question/question.html"),
        sidePanel: resolve(__dirname, "src/pages/question/sidePanel.html"),
        previous: resolve(__dirname, "src/pages/previous/previous.html"),
        anwers: resolve(__dirname, "src/pages/answer/answer.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
