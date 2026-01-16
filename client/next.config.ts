import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
          path.resolve(__dirname, "..", "data"),
        ],
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
