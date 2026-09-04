This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

Copy `.env.example` to `.env.local` when local values differ from the defaults:

- `NEXT_PUBLIC_API_URL` selects the BookPreorder API for local, preview, or production builds.
- `NEXT_PUBLIC_SITE_BASE` sets the absolute site URL used by metadata and structured data.

Production deployments use the Next.js runtime. Run `npm run build` followed by `npm run start` to verify the production server locally.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
