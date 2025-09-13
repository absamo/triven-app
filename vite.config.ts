import { reactRouter } from "@react-router/dev/vite"
import autoprefixer from "autoprefixer"
import { defineConfig } from "vite"
import babel from "vite-plugin-babel"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  css: {
    postcss: {
      plugins: [autoprefixer],
    },
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    {
      ...babel({
        filter: /\.tsx?$/,
        babelConfig: {
          presets: ["@babel/preset-typescript"],
          plugins: ["babel-plugin-react-compiler"],
        },
      }),
      apply: "build",
    },
  ],
  server: {
    // Automatically opens up the browser when we run npm run dev
    open: true,
    port: 3000,
    proxy: {
      "/api/chat": "http://localhost:11434",
    },
  },
  optimizeDeps: {
    include: [
      "react-router",
      "@mantine/form",
      "@mantine/core",
      "mantine-form-zod-resolver",
      "@mantine/notifications",
      "@mantine/hooks",
      "dayjs",
      "bcryptjs",
      "nanoid",
      "@prisma/client",
      "zod",
      "@tabler/icons-react",
      "clsx",
      "@epic-web/remember",
      "ean-generator",
      "dayjs/plugin/isSameOrAfter",
      "@mantine/dates",
      "randomatic",
      "dot-object",
      "dayjs/plugin/relativeTime",
    ],
  },
})
