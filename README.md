# 🏘️ Hoodly - Hyper-Local Social Networking App

Hoodly is a comprehensive social networking app that combines the best features of Instagram, TikTok, Snapchat, Reddit, and Nextdoor, all built with **100% Supabase backend**.

## 🚀 Features

- **Real-time Chat**: Room-based and direct messaging with presence indicators
- **Location-Based Discovery**: Find nearby rooms, events, and neighbors using PostGIS
- **Social Features**: Posts, comments, reactions, follows, and notifications
- **Push Notifications**: FCM (Android) and APNs (iOS) support
- **Media Management**: Image uploads with thumbnail generation
- **Security**: Row Level Security (RLS) on all database operations
- **Scalable**: Built on Supabase's enterprise-grade infrastructure

## 🏗️ Architecture

### Backend: Supabase Only
- **Database**: PostgreSQL with PostGIS extensions
- **Authentication**: Supabase Auth with JWT
- **Real-time**: Supabase Realtime for live updates
- **Storage**: Supabase Storage for media files
- **Edge Functions**: Deno functions for custom logic
- **Security**: Row Level Security (RLS) policies

### Frontend: React Native + Expo
- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router for file-based routing
- **State Management**: Zustand for lightweight state
- **UI Components**: Custom design system with theme support
- **Real-time**: Supabase Realtime subscriptions

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g @expo/cli`
- Supabase CLI: `npm install -g supabase`
- Supabase account and project
- FCM and APNs credentials (for push notifications)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies
```bash
git clone <your-repo-url>
cd hoodly-app
npm install
```

### 2. Environment Configuration
Copy `env.example` to `.env` and fill in your values:
```bash
cp env.example .env
```

Required variables:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
FCM_SERVER_KEY=your_firebase_fcm_server_key
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apple_developer_team_id
APNS_BUNDLE_ID=com.yourapp.bundle
APNS_PRIVATE_KEY=your_apns_private_key_content
```

### 3. Deploy Supabase Backend

#### Option A: Automated Deployment (Recommended)
```bash
# On Windows
.\deploy-supabase.ps1

# On macOS/Linux
chmod +x deploy-supabase.sh
./deploy-supabase.sh
```

#### Option B: Manual Deployment
```bash
# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy Edge Functions
supabase functions deploy sendPush
supabase functions deploy onNotificationInsert
supabase functions deploy mediaThumb
supabase functions deploy scheduledCleanup

# Apply database migrations
supabase db push

# Set secrets
supabase secrets set FCM_SERVER_KEY=your_key
supabase secrets set APNS_KEY_ID=your_key_id
# ... set other secrets
```

### 4. Start Development
```bash
npx expo start
```

## 🗄️ Database Schema

The app uses a comprehensive schema with:
- **User Management**: Profiles, authentication, follows
- **Communication**: Rooms, messages, DMs, notifications
- **Content**: Posts, comments, reactions, events
- **Location**: PostGIS integration for proximity features
- **Media**: Storage buckets with automatic organization

All tables have Row Level Security (RLS) policies ensuring data privacy and security.

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure session management
- **Client-Side Validation**: Input sanitization and validation
- **Secure APIs**: All endpoints protected by RLS policies
- **Push Notification Security**: Two-client authentication system

## 📱 Real-time Features

- **Live Chat**: Real-time messaging in rooms and DMs
- **Presence Indicators**: Show who's online and typing
- **Live Notifications**: Instant notification delivery
- **Location Updates**: Real-time proximity alerts
- **Live Content**: Real-time post and comment updates

## 🚀 Deployment

### Edge Functions
All custom backend logic is handled by Supabase Edge Functions:
- `sendPush`: Push notification service
- `onNotificationInsert`: Automatic notification triggers
- `mediaThumb`: Image processing and thumbnails
- `scheduledCleanup`: Automated data maintenance

### Database Migrations
The complete schema is managed through Supabase migrations:
```bash
supabase db push    # Apply migrations
supabase db diff    # Generate migration from changes
supabase db reset   # Reset local database
```

## 🧪 Testing

### Test Real-time Features
```bash
# Test connections
node lib/connection-test.ts

# Test specific features
node test-features.js
node test-notifications.js
```

### Test Edge Functions Locally
```bash
supabase start
supabase functions serve sendPush --env-file ./supabase/.env.local
```

## 📚 API Reference

### Core Functions
- `nearbyRooms(lat, lng, radius)`: Find nearby chat rooms
- `createDMThread(user1, user2)`: Start direct message thread
- `createNotification(data)`: Send push notification
- `followUser(userId)`: Follow another user
- `uploadMedia(file)`: Upload and process media files

### Real-time Subscriptions
- `subscribeRoomMessages(roomId, callback)`: Listen to room messages
- `subscribeNotifications(userId, callback)`: Listen to notifications
- `presenceForRoom(roomId, userId)`: Track user presence

## 🔧 Development

### Project Structure
```
project/
├── app/                    # Expo Router screens
├── components/            # Reusable UI components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities and APIs
├── supabase/              # Supabase configuration
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
└── types/                 # TypeScript type definitions
```

### Adding New Features
1. **Database**: Add tables and RLS policies in migrations
2. **Backend Logic**: Create Edge Functions for complex operations
3. **Frontend**: Add screens, components, and hooks
4. **Real-time**: Subscribe to relevant database changes
5. **Security**: Ensure RLS policies cover new functionality

## 🚨 Troubleshooting

### Common Issues
1. **TypeScript Errors**: Run `npx tsc --noEmit` to check types
2. **RLS Policy Issues**: Check database policies in Supabase Dashboard
3. **Real-time Not Working**: Verify REPLICA IDENTITY is set to FULL
4. **Push Notifications**: Check FCM/APNs credentials and Edge Function logs

### Getting Help
- Check Supabase Dashboard logs
- Review Edge Function execution logs
- Verify environment variables are set correctly
- Test with simplified examples first

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [PostGIS Documentation](https://postgis.net/documentation)

---

**Built with ❤️ using Supabase, React Native, and Expo**
