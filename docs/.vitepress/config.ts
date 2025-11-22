import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Pura',
  description: 'Pure FP for TypeScript. Fast, Type-Safe, Zero Compromise.',
  base: '/',

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/reference' },
      { text: 'Examples', link: '/examples/arrays' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why Pura?', link: '/guide/why-pura' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'produce() API', link: '/guide/produce-api' },
            { text: 'produceFast() API', link: '/guide/produce-fast-api' },
            { text: 'Adaptive Strategy', link: '/guide/understanding-adaptive' },
            { text: 'unpura() Conversion', link: '/guide/unpura' },
          ]
        },
        {
          text: 'Migration',
          items: [
            { text: 'From Immer', link: '/guide/migration-from-immer' },
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Performance Tips', link: '/guide/performance' },
            { text: 'Architecture', link: '/guide/architecture' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/reference' },
            { text: 'produce()', link: '/api/produce' },
            { text: 'produceFast()', link: '/api/produce-fast' },
            { text: 'pura()', link: '/api/pura' },
            { text: 'unpura()', link: '/api/unpura' },
            { text: 'isPura()', link: '/api/is-pura' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Arrays', link: '/examples/arrays' },
            { text: 'Objects', link: '/examples/objects' },
            { text: 'Maps & Sets', link: '/examples/maps-sets' },
            { text: 'Real-World', link: '/examples/real-world' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sylphxltd/pura' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 SylphX Ltd'
    },

    search: {
      provider: 'local'
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'Pura' }],
  ]
})
