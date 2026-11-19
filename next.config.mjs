/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === 'development';
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src ${scriptSrc}`,
  "connect-src 'self'",
  "frame-src 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ")

const nextConfig = {
  // Keep development-generated instruction files out of the reviewed public file set.
  agentRules: false,
  async redirects() {
    return [
      {
        source: "/member",
        destination: "/all",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/all",
        permanent: true,
      },
      {
        source: "/member/:type(all|youtube-movie|youtube-shorts|youtube-live|movie|audio|tver|column)/:member",
        destination: "/:type/member/:member",
        permanent: true,
      },
      {
        source: "/member/:type(all|youtube-movie|youtube-shorts|youtube-live|movie|audio|tver|column)",
        destination: "/:type",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
