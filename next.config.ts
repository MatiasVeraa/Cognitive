import type { NextConfig } from 'next';
import { BASE } from './lib/base';

/**
 * El sitio vive en digitalarts.com.ar/dev/cognitive-sitios (ver README): todas sus rutas y
 * archivos cuelgan de esa ruta base. Las tres propuestas son exportaciones estáticas hechas con
 * esa misma ruta más su carpeta (public/cognitive-a, -b y -c). Nada se indexa.
 */
const nextConfig: NextConfig = {
  basePath: BASE,
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
