# Code In The Dark - Points System

A modern points system platform with points, lifelines, gambling games, and real-time admin monitoring.

## 🚀 Features

### For Players:
- **Authentication System** - Secure login/register
- **Points System** - Earn and spend points
- **Lifelines** - Use helpful lifelines with points
- **Gambling Games** - Slot machine & dice games
- **Leaderboard** - Compete with other players
- **Transaction History** - Track all your activity

### For Admins:
- **Real-time Monitoring** - Live activity feed
- **User Management** - Manage users and points
- **Analytics Dashboard** - System statistics
- **User-wise Analysis** - Individual user tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: JWT tokens with httpOnly cookies
- **Animations**: Framer Motion
- **UI Components**: Radix UI, Shadcn/ui

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd codedark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your MongoDB connection string and JWT secret:
   ```env
   MONGODB_CONNECTION_URI=mongodb+srv://...
   JWT_SECRET=your-super-secret-key
   BCRYPT_ROUNDS=12
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

### Environment Variables for Production:
```env
MONGODB_CONNECTION_URI=your-mongodb-atlas-connection
JWT_SECRET=your-production-jwt-secret
BCRYPT_ROUNDS=12
NODE_ENV=production
```

## 🎮 Usage

### Default Admin Account:
- **Email**: `pranav@fanpit.live`
- **Password**: `admin`

### Game Rules:
- **Slot Machine**: 10 points per spin, various payouts
- **Dice Game**: Variable betting, multipliers based on dice result
- **Lifelines**: Different costs, limited uses per user

## 🔧 Development

### Project Structure:
```
codedark/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts    # User login
│   │   │   ├── register/route.ts # User registration
│   │   │   ├── logout/route.ts   # User logout
│   │   │   └── me/route.ts       # Get current user
│   │   ├── admin/                # Admin-only endpoints
│   │   │   ├── users/route.ts    # User management
│   │   │   ├── analytics/route.ts# System analytics
│   │   │   └── activity/route.ts # Real-time activity
│   │   ├── gambling/             # Gaming endpoints
│   │   │   ├── slot/route.ts     # Slot machine game
│   │   │   └── dice/route.ts     # Dice roll game
│   │   ├── lifelines/            # Lifeline system
│   │   │   ├── route.ts          # Get user lifelines
│   │   │   └── use/route.ts      # Use a lifeline
│   │   ├── user/                 # User data endpoints
│   │   │   └── history/route.ts  # Transaction history
│   │   └── leaderboard/route.ts  # User rankings
│   ├── admin/                    # Admin dashboard
│   │   └── page.tsx              # Real-time monitoring
│   ├── dashboard/                # User dashboard
│   │   └── page.tsx              # Main user interface
│   ├── gambling/                 # Gaming pages
│   │   └── page.tsx              # Slot machine & dice
│   ├── lifelines/                # Lifelines system
│   │   └── page.tsx              # Use lifelines
│   ├── history/                  # Transaction history
│   │   └── page.tsx              # User activity log
│   ├── leaderboard/              # Rankings
│   │   └── page.tsx              # User leaderboard
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing/login page
├── components/                   # Reusable components
│   ├── ui/                       # UI components
│   │   ├── button.tsx            # Button component
│   │   ├── input.tsx             # Input component
│   │   ├── select.tsx            # Select component
│   │   ├── loading.tsx           # Loading spinners
│   │   └── toast.tsx             # Toast notifications
│   ├── authentication-card.tsx  # Login/register form
│   └── error-boundary.tsx       # Error handling
├── contexts/                     # React contexts
│   └── AuthContext.tsx          # Authentication state
├── lib/                          # Utility libraries
│   ├── mongodb.ts               # Database connection
│   ├── auth.ts                  # JWT & password utils
│   └── utils.ts                 # Helper functions
├── .env.local                   # Environment variables
├── .env.example                 # Environment template
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS config
├── package.json                 # Dependencies
└── README.md                    # This file
```

### Key Components:

#### **Authentication System** (`contexts/AuthContext.tsx`)
- JWT token management
- User session persistence
- Login/logout functionality
- Admin role detection

#### **Database Layer** (`lib/mongodb.ts`)
- MongoDB connection pooling
- Database operations
- Error handling

#### **API Architecture** (`app/api/`)
- RESTful endpoints
- JWT authentication middleware
- Admin authorization checks
- Input validation & sanitization

#### **Gaming Engine** (`app/gambling/`)
- Slot machine with configurable payouts
- Dice game with multiplier system
- Real-time point updates
- Animation system with Framer Motion

#### **Admin Dashboard** (`app/admin/`)
- Real-time activity monitoring
- User management interface
- System analytics
- Live data updates (3-second intervals)

#### **UI Components** (`components/ui/`)
- Consistent design system
- Accessible components
- Loading states
- Error boundaries
- Toast notifications

## 📊 Database Schema

### Users Collection:
```javascript
{
  _id: String,
  username: String,
  email: String,
  password: String (hashed),
  points: Number,
  isActive: Boolean,
  isAdmin: Boolean,
  lifelines: Array,
  history: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed proprietary software for Code In The Dark Event for Invente.

Built by Pranav 🥷
