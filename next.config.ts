import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le client Prisma 8 tourne côté serveur uniquement : il ne doit jamais
  // partir dans le bundle navigateur.
  serverExternalPackages: ["@prisma/orm-postgres"],
};

export default nextConfig;
