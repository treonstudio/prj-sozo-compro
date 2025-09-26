# Sozo Company Profile - Modular Web Platform

A comprehensive modular web platform for Sozo company profile built with WordPress backend integration and React frontend components. This repository contains specialized modules that work together to create a modern, interactive company website.

## 🏗️ Architecture Overview

This project follows a modular architecture with each directory containing specialized services and components:

- **WordPress Integration**: Custom plugins for seamless content management
- **React Components**: Modern, responsive frontend modules
- **Microservice Architecture**: Independent, deployable modules for scalability

## 📁 Module Structure

### `/articles` - Content Management System
**Purpose**: Article display and management system with WordPress integration

**Tech Stack**:
- React 18.3.1 + TypeScript
- Vite build system
- WordPress plugin integration

**Key Features**:
- React-based article display component
- WordPress plugin for content syndication
- Responsive iframe integration with expand/collapse functionality
- Theme support (light/dark mode)
- Category filtering system
- Shortcode generator for WordPress integration

**Components**:
- `wordpress-plugin/` - WordPress plugin for article display (`[react_articles]` shortcode)
- `sozo-react/` - React components for article rendering
- `src/` - Core application logic and styling

### `/map` - Interactive Location Services
**Purpose**: Interactive mapping solution for company locations and services

**Tech Stack**:
- React 18.3.1 + TypeScript
- Leaflet mapping library
- Supabase for data management
- TailwindCSS for styling

**Key Features**:
- Interactive company location mapping
- Real-time data integration via Supabase
- Responsive design with Tailwind CSS
- Lucide React icons for enhanced UX
- TypeScript for type safety

**Components**:
- `src/components/` - Reusable map components
- `src/data/` - Location and service data management
- `src/types/` - TypeScript type definitions

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- WordPress 5.0+
- PHP 7.4+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/raizora/prj-sozo-compro.git
cd prj-sozo-compro
```

2. **Setup Articles Module**
```bash
cd articles
npm install
npm run dev
```

3. **Setup Map Module**
```bash
cd map
npm install
npm run dev
```

4. **WordPress Plugin Installation**
- Upload `articles/wordpress-plugin/react-articles-display/` to `/wp-content/plugins/`
- Activate plugin in WordPress admin
- Use `[react_articles]` shortcode in pages/posts

## 🛠️ Development

### Articles Module Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
```

### Map Module Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Code linting
npm run preview  # Preview build
```

## 📝 WordPress Integration

The articles module includes a WordPress plugin that enables seamless integration:

**Shortcode Usage**:
```php
[react_articles width="100%" height="600px" theme="light" category="health"]
```

**Parameters**:
- `width`: Container width (default: "100%")
- `height`: Initial iframe height (default: "600px")
- `expanded_height`: Expanded view height (default: "1200px")
- `theme`: Color theme - "light" or "dark" (default: "light")
- `category`: Article category filter (optional)

## 🌐 Deployment

Each module can be deployed independently:

- **Articles**: Static hosting (Vercel, Netlify) with WordPress plugin
- **Map**: Static hosting with Supabase backend integration
- **WordPress Plugin**: Standard WordPress plugin installation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the GPL v2 or later - see individual module documentation for specific details.

## 🏢 About Sozo

Sozo is a modern company focused on delivering innovative web solutions. This modular platform demonstrates our commitment to scalable, maintainable, and user-focused web development.

**Website**: [sozo.treonstudio.com](https://sozo.treonstudio.com)

---

*Built with ❤️ by the Treon Studio team*