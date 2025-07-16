# NeuralFlow - Brain Monitoring System

A modern, minimalistic EEG-based meditation analysis and visualization application built with Next.js and Tailwind CSS.

## Features

- **Real-time EEG Signal Monitoring**: Visualize brain wave activity across multiple channels
- **Mental State Analysis**: AI-powered analysis of focus, relaxation, and cognitive states
- **Vital Signs Tracking**: Heart rate and HRV monitoring
- **Interactive Dashboard**: Clean, single-page interface with no unnecessary scrolling
- **Dark/Light Mode**: Seamless theme switching with consistent design
- **Responsive Design**: Adapts gracefully across desktop and tablet viewports

## Design System

### Color Scheme

The application uses a modern, minimalistic color palette focused on neutral grays with subtle green accents:

#### Light Theme
- **Background**: `#ffffff` (Pure white)
- **Foreground**: `#1f2937` (Dark gray)
- **Primary (Green Accent)**: `#059669` (Emerald 600)
- **Secondary**: `#f9fafb` (Light gray)
- **Muted**: `#f3f4f6` (Very light gray)
- **Border**: `#e5e7eb` (Light gray border)

#### Dark Theme
- **Background**: `#0f172a` (Dark slate)
- **Foreground**: `#f8fafc` (Near white)
- **Primary (Green Accent)**: `#10b981` (Emerald 500, adapted for contrast)
- **Secondary**: `#334155` (Medium slate)
- **Muted**: `#334155` (Medium slate)
- **Border**: `#334155` (Medium slate border)

### Typography

- **Font Family**: Inter, system fonts fallback (`'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif`)
- **Font Weights**: 
  - Regular (400) for body text
  - Medium (500) for labels
  - Semibold (600) for headings
  - Bold (700) for emphasis

### Border Radius

Consistent 4px border radius across all components for a flat, modern design:
- **Small**: `2px`
- **Medium**: `4px` (default)
- **Large**: `4px` (same as medium for consistency)
- **Extra Large**: `6px`

### Component Styling

#### Cards
- **Background**: White/Dark slate with subtle borders
- **Border**: 1px solid border in theme colors
- **Padding**: 16px (1rem)
- **Shadow**: Minimal, no heavy drop shadows

#### Buttons
- **Primary**: Green background (`#059669`) with white text
- **Secondary**: Light gray background with dark text
- **Ghost**: Transparent with hover states
- **Outline**: Border-only with hover fill
- **Border Radius**: 4px consistently
- **Hover States**: Green accent color for all interactive elements

#### Progress Bars
- **Background**: Light gray (`#e5e7eb` light, `#374151` dark)
- **Fill**: Green gradient (`#059669` to `#047857`)
- **Height**: 8px (0.5rem)
- **Border Radius**: 4px

## Layout Architecture

### Grid System
- **12-column grid** layout for desktop
- **Responsive breakpoints** for mobile and tablet
- **Single viewport design** - no vertical scrolling required at 1920×1080

### Layout Structure
```
Header (Brand + Controls)
├── Left Sidebar (3 columns)
│   ├── Device Status
│   ├── Vital Signs
│   ├── Mental State
│   └── Session Controls
├── Main Content (6 columns)
│   ├── Signal Monitors (3-column grid)
│   └── Brain Wave Analysis
└── Right Sidebar (3 columns)
    ├── Session Statistics
    ├── System Information
    └── Recent Activity
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Project_01
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Key Components

### `EEGDataPlot.tsx`
Main dashboard component containing:
- Real-time signal visualization
- Brain wave frequency analysis
- Device connection management
- Theme switching functionality

### Design Tokens

All design tokens are defined in `src/app/globals.css`:

```css
:root {
  --radius: 4px;
  --primary: #059669;
  --background: #ffffff;
  --foreground: #1f2937;
  /* ... additional tokens */
}

.dark {
  --primary: #10b981;
  --background: #0f172a;
  --foreground: #f8fafc;
  /* ... dark theme overrides */
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the design system
4. Test across different screen sizes
5. Submit a pull request

## License

This project is licensed under the MIT License.