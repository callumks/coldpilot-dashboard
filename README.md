# Coldpilot Dashboard

A modern, dark-themed React dashboard for managing cold outreach campaigns. Built with React, TypeScript, and TailwindCSS, inspired by Framer's Cadence template aesthetic.

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

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard

## Available Scripts

- `npm start` - Start development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (one-way operation)

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

- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **Create React App** - Development tooling

## Contributing

This is a starter template. Customize and extend as needed for your specific use case.

## License

MIT License - feel free to use this template for your projects.
