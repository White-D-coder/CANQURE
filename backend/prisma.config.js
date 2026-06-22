import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./prisma/schema.prisma",

  datasource: {
    adapter: "mongodb",
    url: process.env.DATABASE_URL,
  },
});
