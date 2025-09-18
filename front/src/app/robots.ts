import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tu-dominio.com'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/*',
        '/api/*',
        '/auth/verificar-email',
        '/_next/*',
        '/private/*',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}