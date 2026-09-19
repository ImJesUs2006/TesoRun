import { defineConfig } from "prisma/config";

// Con prisma.config.ts el CLI ya no carga .env por su cuenta.
try {
  process.loadEnvFile();
} catch {
  // sin archivo .env (p.ej. variables ya exportadas)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});