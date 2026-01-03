/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ini paling "gampang tembus" untuk localhost
    domains: ["localhost", "127.0.0.1"],

    // tambahan pengaman pattern (tanpa port supaya gak strict)
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/uploads/**",
      },
      { protocol: "https", hostname: "ibyteimg.com", pathname: "/**" },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
