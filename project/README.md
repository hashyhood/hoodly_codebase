# 🏘️ Hoodly - Next Generation Social Networking App

Hoodly is a comprehensive social networking app built with React Native, Expo, and Supabase. It features real-time messaging, location-based social features, marketplace, events, groups, and more.

## ✨ Features

### 🏠 Core Social Features
- **Feed**: Share posts, photos, and updates with your neighborhood
- **Real-time Messaging**: Group chats and private messages with real-time updates
- **Friends System**: Send friend requests and manage connections
- **Location-based**: Discover people and events near you
- **Profile Management**: Rich profiles with customization options

### 🛍️ Marketplace
- **Buy & Sell**: Local marketplace for goods and services
- **Categories**: Organized listings by category
- **Location-based**: Find items near you
- **Image Support**: Multiple images per listing

### 📅 Events
- **Event Creation**: Create and manage local events
- **RSVP System**: Going, maybe, not going responses
- **Location Integration**: Events with map integration
- **Event Discovery**: Find events happening around you

### 👥 Groups
- **Group Creation**: Create public or private groups
- **Group Posts**: Share content within groups
- **Member Management**: Invite and manage group members
- **Group Chat**: Real-time messaging within groups

### 🗺️ Location Features
- **Proximity Discovery**: Find people and events near you
- **Location Sharing**: Share your location with friends
- **Privacy Controls**: Control who can see your location
- **Geofencing**: Location-based notifications

### 🔔 Notifications
- **Real-time**: Instant notifications for all activities
- **Customizable**: Control what notifications you receive
- **Push Notifications**: Stay updated even when app is closed

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- Supabase account

### 1. Clone and Install
```bash
git clone <repository-url>
cd project
npm install
```

### 2. Database Setup

#### Supabase (Primary Database)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Apply Database Migrations**
   ```bash
   # Navigate to Supabase dashboard > SQL Editor
   # Run migrations in order:
   # 1. db/migrations/00_base_schema.sql
   # 2. db/migrations/01_fixed_tables.sql  
   # 3. db/migrations/02_fix_rls_policies.sql
   # 4. db/migrations/03_fix_room_members_rls.sql
   ```

3. **Environment Configuration**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

#### Database Schema
- **Tables**: users, posts, rooms, messages, events, groups, marketplace, notifications, safety_alerts
- **RLS Policies**: Row Level Security enabled on all tables
- **Real-time**: WebSocket subscriptions for live updates
- **Storage**: Public bucket for file uploads

### 3. Run the App
```bash
# Start the development server
npm run dev

# Or for specific platforms
npm run ios
npm run android
npm run web
```

### 4. Backend Server (Optional)
```bash
cd backend
npm install
npm run dev:backend
```

## 🏗️ Architecture

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe development
- **Context API**: State management
- **React Navigation**: Navigation system

### Backend
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Database
- **Real-time**: WebSocket subscriptions
- **Storage**: File uploads and management
- **Auth**: User authentication and management

### Key Components
```
project/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   ├── chat/              # Group chat screens
│   └── private-chat/      # Private messaging
├── components/            # Reusable components
├── contexts/             # React contexts
├── lib/                  # API and utilities
├── types/                # TypeScript types
└── assets/               # Images and assets
```

## 📱 Screens

### Main Tabs
- **Feed**: Social feed with posts and interactions
- **Map**: Location-based discovery
- **Marketplace**: Buy and sell items
- **Events**: Discover and create events
- **Groups**: Join and manage groups
- **Chat**: Group and private messaging
- **Profile**: User profile and settings

### Additional Screens
- **Auth**: Login and registration
- **Search**: Find people, groups, and content
- **Friends**: Manage friend connections
- **Notifications**: View and manage notifications

## 🔧 Configuration

### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Configuration
- **RLS Policies**: Row Level Security enabled on all tables
- **Storage**: Public bucket for uploads
- **Real-time**: Enabled for all tables
- **Functions**: Custom database functions for location features

## 🛠️ Development

### Project Structure
```
project/
├── app/                # Expo Router pages
├── components/         # Reusable components
├── contexts/          # React contexts
├── lib/               # API and utilities
├── types/             # TypeScript types
├── db/                # Database migrations
│   └── migrations/    # Supabase SQL migrations
└── archive/           # Legacy files (Knex migrations, test files)

lib/
├── api.ts              # API functions for all features
├── supabase.ts         # Supabase client and types
├── auth.ts             # Authentication utilities
└── config.ts           # App configuration

contexts/
├── AuthContext.tsx     # Authentication state
└── ThemeContext.tsx    # Theme management

components/
├── ui/                 # Reusable UI components
├── FeedCard.tsx        # Post display component
├── MessageBubble.tsx   # Chat message component
└── ...
```

### Adding New Features
1. **Database**: 
   - Add tables via Supabase dashboard or SQL migrations
   - Create RLS policies for security
   - Store migrations in `db/migrations/`
2. **Types**: Update TypeScript types in `supabase.ts`
3. **API**: Add functions to `api.ts`
4. **Components**: Create UI components
5. **Screens**: Add new screens to `app/`
6. **Navigation**: Update navigation structure

### Database Migrations
- **Primary**: Supabase native migrations via SQL
- **Location**: `db/migrations/` folder
- **Naming**: `XX_description.sql` (e.g., `01_create_users_table.sql`)
- **Legacy**: Knex migrations moved to `archive/migrations/`

### Code Style
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality

## 🧪 Testing

### Database Testing
```bash
# Test Supabase connection and RLS policies
# Use Supabase dashboard > SQL Editor to run test queries
# Example: SELECT * FROM users LIMIT 1;
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Profile creation and editing
- [ ] Post creation and interaction
- [ ] Real-time messaging
- [ ] Friend requests and management
- [ ] Event creation and RSVP
- [ ] Marketplace listings
- [ ] Group creation and management
- [ ] Location-based features
- [ ] Notifications

## 🚨 Troubleshooting

### Common Issues

#### Authentication Issues
```bash
# Clear Expo cache
expo r -c

# Reset Supabase auth
# Go to Supabase dashboard > Auth > Users > Clear all
```

#### Database Connection Issues
```bash
# Test Supabase connection in dashboard
# Go to Supabase > SQL Editor > Run: SELECT NOW();

# Check environment variables
echo $EXPO_PUBLIC_SUPABASE_URL
```

#### Real-time Issues
- Check Supabase real-time settings
- Verify subscription channels
- Check network connectivity

#### Build Issues
```bash
# Clear all caches
npm run clean
expo r -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Performance Optimization
- **Image Optimization**: Use compressed images
- **Lazy Loading**: Implement for large lists
- **Caching**: Cache frequently accessed data
- **Pagination**: Implement for feeds and lists

## 🔒 Security

### Row Level Security (RLS)
- All tables have RLS policies
- Users can only access their own data
- Public read access where appropriate
- Secure write operations

### Authentication
- Supabase Auth with email/password
- Session management
- Secure token handling
- Password requirements

### Data Protection
- Encrypted data transmission
- Secure file uploads
- Privacy controls for location data
- User consent for data sharing

## 📊 Analytics

### User Metrics
- User registration and retention
- Feature usage statistics
- Location-based analytics
- Engagement metrics

### Performance Metrics
- App load times
- API response times
- Real-time connection stability
- Error rates

## 🚀 Deployment

### Expo Build
```bash
# Build for production
expo build:android
expo build:ios

# Or use EAS Build
eas build --platform all
```

### Supabase Production
1. Create production Supabase project
2. Run migrations
3. Update environment variables
4. Configure custom domains
5. Set up monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Test thoroughly before submitting
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Expo**: For the amazing development platform
- **Supabase**: For the powerful backend services
- **React Native**: For cross-platform development
- **Community**: For all the open-source contributions

## 📞 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the docs folder
- **Community**: Join our Discord server
- **Email**: support@hoodly.app

---

**Built with ❤️ for the next generation of social networking** 