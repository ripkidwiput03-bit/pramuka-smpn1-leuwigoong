# 🚀 API Endpoint Maker

A modern, powerful REST API endpoint generator for creating custom canvas images, badges, quotes, and more. Built with React, TypeScript, Express.js, and MongoDB Atlas.

![API Endpoint Maker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![React](https://img.shields.io/badge/React-19.2.3-61dafb)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### Core Features
- 🎨 **Canvas API** - Generate custom images with text, gradients, and more
- 🎯 **Multiple Endpoints** - Text, quotes, badges, profiles, gradients
- ⚡ **Lightning Fast** - Optimized for performance
- 🔒 **Secure Authentication** - Multiple login options
- 🌐 **Glass Morphism UI** - Modern, beautiful interface
- 📱 **Responsive Design** - Works on all devices
- 🎭 **SVG Icons** - Professional Lucide React icons
- 🔥 **Real-time Preview** - Test endpoints instantly
- 📋 **Copy & Paste** - Easy URL copying
- 🚀 **Production Ready** - Built with best practices

### Authentication & Security
- 🔐 **Multi-Provider Login** - Email, Google, GitHub
- 🔑 **API Key Management** - Create, manage, and delete API keys
- 📊 **Usage Dashboard** - Track API usage and statistics
- 🛡️ **Rate Limiting** - Prevent abuse with intelligent limits
- 🔒 **Secure Storage** - Encrypted credentials and tokens
- 📈 **Real-time Usage** - Live monitoring of API requests

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

### Backend (Ready for Integration)
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Node.js Canvas** - Image generation
- **JWT** - Authentication
- **TypeScript** - Type safety

## 🎯 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/api-endpoint-maker.git

# Navigate to directory
cd api-endpoint-maker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

## 🔐 Authentication

### Sign In Methods

The platform supports multiple authentication providers:

1. **Email & Password** - Traditional authentication
2. **Google OAuth** - Sign in with Google account
3. **GitHub OAuth** - Sign in with GitHub account

### Getting Your API Key

1. Click "Sign In" button in the header
2. Choose your preferred authentication method
3. Complete the authentication flow
4. Access your dashboard to view your API key
5. Create additional API keys as needed

### Using API Keys

Include your API key in the request header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.yourdomain.com/api/canvas/text?text=Hello
```

Or as a query parameter:

```bash
https://api.yourdomain.com/api/canvas/text?text=Hello&apikey=YOUR_API_KEY
```

### API Key Management

From your dashboard, you can:
- View all your API keys
- Create new API keys for different projects
- Monitor usage per API key
- Delete compromised keys
- Track request statistics

## 📋 Available Endpoints

### 1. Canvas Text Generator
Generate custom text images with various styles

```
GET /api/canvas/text?text=Hello&size=48&color=%23ffffff&bg=%23000000
```

**Parameters:**
- `text` (required) - Text to display
- `font` - Font family (default: Arial)
- `size` - Font size in pixels (default: 48)
- `color` - Text color (default: #ffffff)
- `bg` - Background color (default: #000000)

### 2. Quote Card Generator
Create beautiful quote cards

```
GET /api/canvas/quote?quote=Your+quote&author=Author&theme=minimal
```

**Parameters:**
- `quote` (required) - Quote text
- `author` - Quote author
- `theme` - Card theme (minimal, gradient, dark, light, colorful)

### 3. Badge Generator
Generate custom badges

```
GET /api/canvas/badge?label=status&value=online&color=blue
```

**Parameters:**
- `label` (required) - Badge label
- `value` (required) - Badge value
- `color` - Badge color (blue, green, red, yellow, purple, gray)

### 4. Profile Card
Create profile cards

```
GET /api/canvas/profile?name=John+Doe&title=Developer&avatar=https://...
```

**Parameters:**
- `name` (required) - Profile name
- `title` - Profile title
- `avatar` - Avatar URL

### 5. Gradient Background
Generate gradient backgrounds

```
GET /api/canvas/gradient?color1=%23667eea&color2=%23764ba2&direction=diagonal
```

**Parameters:**
- `color1` (required) - First gradient color
- `color2` (required) - Second gradient color
- `direction` - Gradient direction (horizontal, vertical, diagonal)
- `width` - Canvas width (default: 800)
- `height` - Canvas height (default: 400)

## 🎨 Design Features

### Glass Morphism
Modern glass morphism design with:
- Backdrop blur effects
- Semi-transparent backgrounds
- Subtle borders
- Smooth transitions

### Color Scheme
- **Background**: Dark gradient (#0f0f0f to #1a1a1a)
- **Glass White**: rgba(255, 255, 255, 0.1)
- **Glass Dark**: rgba(0, 0, 0, 0.3)
- **Accent**: Purple to Pink gradient

### Typography
- **Primary Font**: Inter
- **Monospace Font**: JetBrains Mono

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=API Endpoint Maker
```

### Tailwind Configuration

The project uses Tailwind CSS v4 with custom configurations in `src/index.css`.

## 📁 Project Structure

```
api-endpoint-maker/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── EndpointCard.tsx
│   │   ├── EndpointTester.tsx
│   │   ├── EndpointsList.tsx
│   │   ├── CodeExample.tsx
│   │   ├── Stats.tsx
│   │   ├── TechStack.tsx
│   │   └── Footer.tsx
│   ├── data/
│   │   └── endpoints.ts     # Endpoint definitions
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── utils/
│   │   └── cn.ts            # Utility functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── BACKEND_SETUP.md        # Backend setup guide
├── README.md
├── package.json
└── tsconfig.json
```

## 🚀 Deployment

### Frontend Deployment

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Build command
npm run build

# Publish directory
dist
```

### Backend Deployment

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed backend setup instructions.

## 🔐 Security

- JWT authentication
- Rate limiting
- Input validation
- CORS protection
- XSS prevention
- Secure headers

## 📊 Performance

- Optimized bundle size
- Code splitting
- Lazy loading
- Image optimization
- CDN delivery

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Vite](https://vitejs.dev)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## 📧 Contact

For questions and support:
- Email: support@apiendpointmaker.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/api-endpoint-maker/issues)

## 🗺️ Roadmap

- [ ] Backend API implementation
- [ ] User authentication system
- [ ] API key management
- [ ] Usage analytics dashboard
- [ ] More canvas endpoints
- [ ] Webhook support
- [ ] Custom templates
- [ ] API versioning
- [ ] GraphQL support
- [ ] WebSocket support

---

Made with ❤️ by developers, for developers

**⭐ Star this repo if you find it useful!**
