# 🏠 Borrow Base

> **Building sustainable communities through resource sharing and neighbor connections**

Borrow Base is a modern, community-driven platform that enables neighbors to share resources, reducing waste and fostering stronger community bonds. Share what you have, borrow what you need, and build lasting connections with people in your neighborhood.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/react-18.0.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Latest Updates (v2.0)

### 🚀 **Enhanced User Experience**
- **Global State Management**: New ResourceContext for seamless resource management across components
- **Real-time Updates**: Instant dashboard refresh when new resources are added
- **Loading States**: Beautiful LoadingOverlay component with animations during resource creation
- **Improved Add Resource Flow**: Streamlined process with drag-and-drop uploads and instant feedback

### 🎯 **Key Improvements**
- **Responsive Design**: Optimized for all devices with modern dark/light themes
- **Performance**: Efficient state management and API integration patterns
- **User Interface**: Smooth animations, hover effects, and professional UI components
- **Error Handling**: Comprehensive error boundaries and retry mechanisms

## 🌟 Core Features

### 🔄 **Resource Management**
- **Smart Resource Listing**: Add items with drag-and-drop photo uploads, detailed metadata, and real-time previews
- **Advanced Search & Filtering**: Find resources by category, distance, availability, and condition
- **Location-Based Discovery**: Automatically calculate distances and show nearby resources
- **Real-time Updates**: Live synchronization when resources are added, updated, or removed

### 💬 **Communication Hub**
- **Built-in Chat System**: Direct messaging between resource owners and borrowers
- **Borrow Request Management**: Formal request system with scheduling and status tracking
- **Notification Center**: Real-time alerts for requests, messages, and community updates
- **Review System**: Build community trust through ratings and feedback

### 🗺️ **Location Services**
- **GPS Integration**: Automatic location detection and address validation
- **Distance Calculation**: Precise distance measurements between users and resources
- **Interactive Maps**: Visual representation of resource locations (future enhancement)
- **Neighborhood Verification**: Location-based community building

### 👥 **User Experience**
- **Modern Authentication**: Secure JWT-based login with session management
- **Comprehensive Profiles**: Detailed user profiles with resource history and ratings
- **Dark/Light Themes**: Professional UI with theme support
- **Mobile-First Design**: Responsive layout optimized for all screen sizes

## 🛠️ Technology Stack

### **Frontend Architecture**
- **React 18** - Modern React with hooks, suspense, and concurrent features
- **TypeScript** - Type-safe development with enhanced IDE support
- **Vite** - Lightning-fast build tool and hot module replacement
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

### **State Management & Context**
- **React Context API** - Global state management with ResourceContext
- **Custom Hooks** - Reusable logic for resource management and API calls
- **Real-time Updates** - Efficient state synchronization across components

### **UI/UX Libraries**
- **Framer Motion** - Smooth animations and micro-interactions
- **React Icons & Lucide** - Comprehensive icon libraries
- **React Router** - Client-side routing with lazy loading
- **React Toastify** - Elegant toast notifications

### **Backend Integration**
- **Node.js + Express** - RESTful API server
- **PostgreSQL** - Robust relational database
- **JWT Authentication** - Secure token-based authentication
- **File Upload Handling** - Efficient image processing and storage

## 📁 Project Structure

```
borrow_base/
├── public/                    # Static assets and uploads
│   ├── uploads/              # User uploaded resource images
│   └── favicon.ico
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base components (Button, Input, Modal)
│   │   ├── LoadingOverlay.tsx # New: Animated loading component
│   │   ├── navbar.tsx       # Navigation with add resource integration
│   │   ├── sidebar.tsx      # Collapsible side navigation
│   │   └── footer.tsx       # Brand footer
│   ├── contexts/            # React Context providers
│   │   └── ResourceContext.tsx # New: Global resource state management
│   ├── MainComponent/       # Core feature components
│   │   ├── main.tsx         # Enhanced dashboard with refresh capability
│   │   ├── chat.tsx         # Real-time messaging system
│   │   ├── profile.tsx      # User profile management
│   │   └── notification.tsx # Notification center
│   ├── Profile/             # Profile-related components
│   │   ├── AddResourceForm.tsx # Enhanced with loading states
│   │   ├── ProfileContent.tsx
│   │   ├── ProfileTabs.tsx
│   │   └── ProfileReviews.tsx
│   ├── Page/                # Route components
│   │   └── home.tsx         # Enhanced with refresh management
│   ├── Auth/                # Authentication components
│   │   ├── authContext.tsx
│   │   └── route.tsx
│   ├── Location/            # Location services
│   │   ├── GetLocation.tsx
│   │   ├── reverseGeocode.tsx
│   │   └── updateLocationAPI.tsx
│   ├── services/            # API services
│   │   └── apiService.ts
│   └── utils/               # Utility functions
│       └── api.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TandelPriyanshi/BorrowBase.git
   cd borrow_base
   ```

2. **Install dependencies**
   ```bash
   npm install

   cd backend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb borrowbase
   
   # Import database schema (if available)
   # psql borrowbase < backend/db/schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Environment Configuration
   NODE_ENV=development
   PORT=3000
   
   # Database Configuration
   DATABASE_URL=borrowbase.db
   
   # JWT Configuration
   JWT_SECRET="your-super-secret-jwt-access-key"
   JWT_REFRESH_SECRET="your-super-secret-jwt"
   
   # Security
   BCRYPT_ROUNDS=12
   
   # API Configuration
   API_VERSION=v1
   API_BASE_URL=http://localhost:3000/api
   
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start
   
   # This will start:
   # - Frontend: http://localhost:5173
   # - Backend: http://localhost:3000
   ```

## 📱 Usage Guide

### **Getting Started**
1. **Sign Up** → Create your account with email verification
2. **Complete Profile** → Add your location and profile details
3. **Verify Location** → Enable location services for neighborhood discovery
4. **Start Sharing** → Add your first resource or browse available items

### **Adding Resources**
1. Click the "Add Resource" button in the navbar
2. Fill in resource details (title, description, category, condition)
3. Upload photos with drag-and-drop interface
4. Set availability and lending preferences
5. Watch the loading animation as your resource is processed
6. See your resource appear instantly in the dashboard

### **Borrowing Process**
1. **Browse** → Explore resources in your neighborhood
2. **Filter** → Use category, distance, and condition filters
3. **Request** → Send a borrow request with preferred dates
4. **Chat** → Communicate with the resource owner
5. **Coordinate** → Arrange pickup and return details
6. **Review** → Leave feedback after the exchange

## 🎨 Design System

### **Color Palette**
- **Primary**: Blue (#3b82f6) - Trust and reliability
- **Secondary**: Purple (#8b5cf6) - Community and connection
- **Accent**: Green (#10b981) - Sustainability and growth
- **Neutral**: Gray scale (#111827 to #f9fafb) - Clean and modern

### **Typography**
- **Headings**: Inter, semi-bold to bold weights
- **Body**: Inter, regular weight, optimized for readability
- **Code**: JetBrains Mono for technical content

### **Components**
- **Buttons**: Rounded corners, hover effects, loading states
- **Cards**: Subtle shadows, hover animations, gradient overlays
- **Forms**: Consistent validation, focus states, error handling
- **Modals**: Backdrop blur, smooth animations, escape handling

## 🔧 API Integration

### **Authentication Endpoints**
```typescript
POST /api/auth/login         // User authentication
POST /api/auth/register      // Account creation
POST /api/auth/logout        // Session termination
POST /api/auth/refresh       // Token refresh
```

### **Resource Management**
```typescript
GET    /api/resources        // Fetch all resources with filters
GET    /api/resources/:id    // Get specific resource details
POST   /api/resources        // Create new resource
PUT    /api/resources/:id    // Update existing resource
DELETE /api/resources/:id    // Remove resource
GET    /api/my-resources     // User's resource list
```

### **Communication**
```typescript
GET  /api/chats             // User's conversation list
POST /api/chats             // Start new conversation
GET  /api/chats/:id/messages // Message history
POST /api/chats/:id/messages // Send message
```

### **Borrow Requests**
```typescript
POST /api/borrow-requests    // Create request
GET  /api/my-requests        // User's requests
GET  /api/resource-requests  // Requests for user's resources
PUT  /api/borrow-requests/:id/status // Update status
```

## 🎯 Performance Optimizations

### **Frontend Performance**
- **Code Splitting**: Route-based lazy loading with React.Suspense
- **Image Optimization**: Automatic compression and responsive images
- **Bundle Analysis**: Tree shaking and dead code elimination
- **Caching Strategy**: Efficient API response caching

### **User Experience Enhancements**
- **Loading States**: Skeleton screens and progress indicators
- **Error Boundaries**: Graceful error handling and recovery options
- **Offline Support**: Basic offline functionality with service workers
- **Real-time Updates**: WebSocket integration for live data

## 🧪 Testing Strategy

### **Testing Commands**
```bash
# Unit tests with Jest and React Testing Library
npm run test

# End-to-end tests with Cypress
npm run test:e2e

# Coverage report
npm run test:coverage

# Lint and format
npm run lint
npm run format
```

### **Testing Approach**
- **Unit Tests**: Component behavior and utility functions
- **Integration Tests**: API calls and user interactions
- **E2E Tests**: Complete user journeys and workflows
- **Visual Regression**: UI consistency across updates

## 🚀 Deployment

### **Production Build**
```bash
npm run build
npm run preview  # Test production build locally
```

### **Deployment Options**
- **Vercel**: Recommended for React applications with automatic deployments
- **Netlify**: Easy setup with continuous integration
- **AWS S3 + CloudFront**: Scalable static hosting with CDN
- **Docker**: Containerized deployment for any platform

## 🔮 Roadmap & Future Enhancements

### **Version 2.1 (Next Release)**
- 🗺️ **Interactive Maps**: Google Maps integration for visual resource discovery
- 📱 **PWA Features**: Offline support and installable web app
- 🔔 **Push Notifications**: Real-time browser notifications
- 🎨 **Theme Customization**: User-selectable color themes

### **Version 3.0 (Major Update)**
- 📱 **Mobile Apps**: Native iOS and Android applications
- 🤖 **AI Recommendations**: Machine learning-based resource suggestions
- 💳 **Payment Integration**: Security deposits and transaction handling
- 🌐 **Multi-language**: Internationalization support
- 📊 **Analytics Dashboard**: Community insights and usage statistics

### **Long-term Vision**
- 🏘️ **Neighborhood Networks**: Inter-community resource sharing
- 🚚 **Delivery Integration**: Third-party delivery service partnerships
- 🏆 **Gamification**: Community challenges and reward systems
- 🌱 **Carbon Tracking**: Environmental impact measurement
- 🤝 **Corporate Partnerships**: Business integration opportunities

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### **Development Process**
1. **Fork** the repository
2. **Clone** your fork: `git clone <your-fork-url>`
3. **Branch**: `git checkout -b feature/amazing-feature`
4. **Develop**: Make your changes with tests
5. **Test**: `npm run test && npm run lint`
6. **Commit**: `git commit -m 'Add amazing feature'`
7. **Push**: `git push origin feature/amazing-feature`
8. **PR**: Open a Pull Request with detailed description

### **Contribution Guidelines**
- **Code Style**: Follow existing TypeScript and ESLint configurations
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update README and component documentation
- **Commits**: Use conventional commit messages
- **Reviews**: Be responsive to code review feedback

### **Areas for Contribution**
- 🐛 **Bug Fixes**: Check our issues page for bugs to fix
- ✨ **Features**: Implement items from our roadmap
- 📝 **Documentation**: Improve guides and API documentation
- 🎨 **UI/UX**: Enhance design and user experience
- 🧪 **Testing**: Increase test coverage and quality

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### **Technology Partners**
- **React Team** - For the incredible React framework
- **Vercel** - For Vite and deployment platform
- **Tailwind Labs** - For the utility-first CSS framework
- **Framer** - For beautiful motion libraries

### **Community**
- **Contributors** - Everyone who has contributed code and ideas
- **Beta Testers** - Early users who provided valuable feedback
- **Open Source** - The amazing open source ecosystem that makes this possible

### **Inspiration**
- **Sharing Economy** - Platforms that pioneered resource sharing
- **Community Building** - Local initiatives promoting neighborhood connections
- **Sustainability** - Environmental consciousness and waste reduction efforts
---

<div align="center">

**🌟 Star this project if you find it helpful! 🌟**

**Built with ❤️ for sustainable communities**

*"Sharing is caring, and caring builds communities."*

</div>

