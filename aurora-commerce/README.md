# Aurora Commerce

Aurora Commerce is a Minimum Viable Product (MVP) E-commerce Store built with Next.js 14, TypeScript, Tailwind CSS, and Supabase. This project aims to provide a seamless shopping experience with a modern and responsive design.

## Features

- **Product Listing**: Browse through a variety of products with detailed information.
- **Product Details**: View detailed descriptions, images, and add products to the cart.
- **Shopping Cart**: Manage items in the cart, modify quantities, and remove products.
- **Checkout Process**: Enter shipping and payment information to complete purchases.
- **API Integration**: Fetch product data and manage orders using Supabase.

## Project Structure

```
aurora-commerce
├── src
│   ├── app
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products
│   │   │   ├── page.tsx
│   │   │   └── [id]
│   │   │       └── page.tsx
│   │   ├── cart
│   │   │   └── page.tsx
│   │   ├── checkout
│   │   │   └── page.tsx
│   │   └── api
│   │       ├── products
│   │       │   └── route.ts
│   │       └── checkout
│   │           └── route.ts
│   ├── components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── Cart.tsx
│   │   └── CheckoutForm.tsx
│   ├── lib
│   │   ├── supabase
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils.ts
│   ├── types
│   │   └── index.ts
│   └── styles
│       └── globals.css
├── public
│   └── favicon.ico
├── .env.local.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn
- Supabase account for backend services

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd aurora-commerce
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials.

### Running the Development Server

To start the development server, run:
```
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to view the application.

### Deployment

This application is designed for deployment on Vercel. To deploy, follow these steps:

1. Push your code to a Git repository (GitHub, GitLab, etc.).
2. Sign in to Vercel and import your repository.
3. Configure environment variables in the Vercel dashboard.
4. Deploy your application.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License. See the LICENSE file for details.