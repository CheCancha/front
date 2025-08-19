// import { MetadataRoute } from 'next';
// import { sportsData } from './(pages)/deportes/sports-data';

// export default function sitemap(): MetadataRoute.Sitemap {
//   const baseUrl = 'https://www.catclub.com.ar';

//   // Rutas estáticas
//   const staticRoutes = [
//     { url: baseUrl, lastModified: new Date(), priority: 1.0 },
//     { url: `${baseUrl}/nosotros`, lastModified: new Date(), priority: 0.8 },
//     { url: `${baseUrl}/deportes`, lastModified: new Date(), priority: 0.8 },
//     { url: `${baseUrl}/instalaciones`, lastModified: new Date(), priority: 0.8 },
//     { url: `${baseUrl}/contacto`, lastModified: new Date(), priority: 0.7 },
//   ];

//   // Rutas dinámicas para deportes
//   const sportRoutes = sportsData.map((sport) => ({
//     url: `${baseUrl}/deportes/${sport.slug}`,
//     lastModified: new Date(),
//     priority: 0.9,
//   }));

//   return [...staticRoutes, ...sportRoutes];
// }
