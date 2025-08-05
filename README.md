# Coldpilot Dashboard

**Private Repository - Not for Public Use**

The official dashboard application for Coldpilot - an AI-powered cold outreach platform. This repository contains proprietary code and is not intended for public use, distribution, or contribution.

Built with Next.js, TypeScript, TailwindCSS, and Prisma.

## Features

- **Dark Mode by Default**: Professional, easy-on-the-eyes interface
- **Responsive Design**: Works seamlessly across all device sizes
- **Modern UI Components**:
  - Sidebar navigation with user profile
  - Top search bar with notifications
  - Metric cards with trend indicators
  - Thread preview cards for email/message management
- **TypeScript**: Full type safety and IntelliSense support
- **TailwindCSS**: Utility-first CSS framework for rapid styling

## Project Structure

```
src/
├── App.tsx                 # Main application component
├── Dashboard.tsx           # Main dashboard layout
├── index.tsx              # React app entry point
├── index.css              # Global styles and Tailwind imports
└── components/
    ├── Sidebar.tsx        # Left navigation sidebar
    ├── Topbar.tsx         # Top navigation bar
    ├── StatCard.tsx       # Metric display cards
    └── ThreadPreview.tsx  # Message/thread preview cards
```

## Development Setup

**For Authorized Developers Only**

### Prerequisites

- Node.js (v18 or higher)
- npm
- PostgreSQL database access
- Required environment variables

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (see `.env.example`)

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build  
- `npm run start` - Start production server
- `npx prisma studio` - Open database admin interface
- `npx prisma migrate dev` - Run database migrations

## Design System

### Colors

- **Primary**: Blue accent color for interactive elements
- **Gray Scale**: Comprehensive gray palette for backgrounds and text
- **Dark Theme**: Gray-950 background with lighter gray cards

### Typography

- **Font**: Inter (imported from Google Fonts)
- **Sizes**: Responsive typography scale using Tailwind classes

### Components

- **Rounded Corners**: Consistent 1-2rem border radius
- **Soft Shadows**: Subtle depth with custom shadow utilities
- **Generous Spacing**: Clean, spacious layout design

## Customization

### Tailwind Configuration

The `tailwind.config.js` file includes:

- Custom color palette
- Extended border radius values
- Custom shadow utilities
- Extended spacing scale

### Component Styling

All components use Tailwind utility classes for consistent styling. To modify the appearance:

1. Update `tailwind.config.js` for global changes
2. Modify individual component classes for specific changes
3. Add custom CSS in `src/index.css` if needed

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS framework
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Clerk** - Authentication
- **Stripe** - Payment processing
- **OpenAI** - AI features

## Deployment

- **Railway** - Primary hosting platform
- **Vercel** - Alternative deployment option
- **GitHub Actions** - CI/CD pipeline

## Security & Access

This repository contains:
- Proprietary business logic
- API integrations and keys
- Customer data schemas
- Billing and payment flows

**Access is restricted to authorized team members only.**

## Support

For development questions or access requests, contact the development team.
