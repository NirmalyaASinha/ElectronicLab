# ElecTronic Lab - Component Management System

A comprehensive digital laboratory component management system designed for educational institutions to streamline the borrowing, issuing, and tracking of laboratory equipment and components.

## 🎯 Overview

ElecTronic Lab is a modern web-based platform that enables students to request components from the laboratory inventory, allows faculty to approve and track these requests, and provides administrators with complete visibility over component inventory and system analytics.

## ✨ Features

### Student Features
- **Browse Components** - Search and explore available laboratory components
- **Request Components** - Submit requests for components with customizable duration (3, 7, or 14 days)
- **Track Requests** - Monitor the status of submitted requests in real-time
- **Fine Management** - View and manage any fines incurred
- **Dashboard** - Quick access to browsing, requests, and fines with live clock and due date calendar

### Faculty Features
- **Request Approvals** - Review and approve/reject student component requests
- **Issue Components** - Mark approved requests as issued with automatic due date calculation
- **Track Returns** - Monitor component returns and mark as completed
- **Inventory Monitoring** - View current and past component issues with detailed analytics
- **Component History** - Access complete history of issued and returned components

### Admin Features
- **Inventory Management** - Add, edit, and manage laboratory component inventory
- **User Management** - Manage student and faculty accounts (create, view, deactivate)
- **Analytics Dashboard** - View system-wide statistics and trends
- **Complete Oversight** - Monitor all requests, issues, returns, and fines

## 🛠️ Tech Stack

- **Frontend**: Next.js 14.2.35 with React 18.x
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with CSS Custom Properties
- **UI Components**: Lucide React Icons
- **Type Safety**: TypeScript with strict mode
- **Database Migrations**: Drizzle Kit

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon recommended)
- Environment variables configured

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NirmalyaASinha/ElectronicLab.git
   cd ElectronicLab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file with the following variables:
   ```env
   DATABASE_URL=your_neon_database_url
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 📦 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Main dashboard with role-based routing
│   │   ├── admin/          # Admin-only pages
│   │   ├── faculty/        # Faculty-specific pages
│   │   └── student/        # Student-specific pages
│   ├── api/                # Backend API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   ├── student/            # Student feature components
│   ├── faculty/            # Faculty feature components
│   ├── admin/              # Admin feature components
│   ├── shared/             # Shared components across all roles
│   └── ui/                 # Reusable UI components
├── db/
│   ├── schema/             # Database table definitions
│   ├── migrations/         # SQL migration files
│   └── index.ts            # Database connection
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── otp.ts              # OTP utilities
│   ├── validations.ts      # Zod validation schemas
│   └── fine-calculator.ts  # Fine calculation logic
└── types/
    └── auth.ts             # Authentication type definitions
```

## 🔐 Authentication & Authorization

- **Authentication**: NextAuth.js with credentials provider
- **Password Security**: bcryptjs for password hashing
- **Role-Based Access**: Three roles supported
  - **STUDENT**: Can request components and view own requests
  - **FACULTY**: Can approve requests and issue components
  - **ADMIN**: Full system access

## 💾 Database Schema

### Key Tables

#### Users
- User accounts with roles and departments
- Stores student roll numbers and faculty employee IDs

#### Issue Requests
- Component requests from students
- Tracks request lifecycle (PENDING → APPROVED → ISSUED → RETURNED)
- Stores status, purpose, and timeline (requested, approved, issued, due, returned dates)

#### Issue Request Items
- Individual components within a request
- Quantity tracking and return status

#### Components
- Laboratory inventory
- Quantity tracking (total and available)
- Category classification

#### Fines
- Tracks fines for overdue or damaged components
- Status tracking (PENDING, PAID, WAIVED)

## 🔄 Request Workflow

1. **Student Request**: Student browses components and submits a request
2. **Faculty Review**: Faculty receives and reviews the request
3. **Approval/Rejection**: Faculty approves or rejects the request
4. **Issuance**: Faculty marks request as issued, system calculates due date
5. **Return Tracking**: Student returns components, faculty marks as returned
6. **Fine Settlement**: System calculates any applicable fines

## 📊 Key Features Implementation

### Real-Time Clock (IST Timezone)
- Live clock display showing current time in Indian Standard Time
- Updates every second

### Smart Date Formatting
- Consistent date formatting across the application
- Timezone-aware date calculations using IST

### Toast Notifications
- Non-intrusive user feedback
- Auto-dismiss after 3 seconds
- Success (green) and error (red) variants

### Modal Dialogs
- Responsive modal implementation
- Scroll-into-view behavior for accessibility
- Transparent backdrop

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login-step1` - Email validation
- `POST /api/auth/login-step2` - Password verification
- `POST /api/auth/register` - User registration
- `POST /api/auth/resend-otp` - Resend OTP

### Requests
- `GET /api/requests` - Fetch user's requests
- `POST /api/requests` - Create new request
- `POST /api/requests/[id]/approve` - Approve request
- `POST /api/requests/[id]/reject` - Reject request
- `POST /api/requests/[id]/issue` - Mark as issued
- `POST /api/requests/[id]/return` - Mark as returned

### Components
- `GET /api/components` - Fetch component inventory
- `POST /api/components` - Create new component

### Fines
- `GET /api/fines` - Fetch user's fines
- `POST /api/fines/[id]/pay` - Mark fine as paid

## 🎨 Design System

The application uses CSS custom properties for theming:
- **Colors**: Primary accent, background surfaces, text colors, borders
- **Spacing**: Consistent padding and margins
- **Typography**: Display and body font families
- **Shadows**: Subtle depth with CSS shadows
- **Radius**: Consistent border radius throughout

## 🧪 Testing

TypeScript strict mode is enabled for type safety. Build the project to verify:
```bash
npm run build
```

## 📝 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key (generate with: openssl rand -base64 32)

# Optional: API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🚢 Deployment

### Build for Production
```bash
npm run build
npm start
```

### On Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please ensure:
1. Code follows TypeScript best practices
2. Components are properly typed
3. Database queries use Drizzle ORM
4. API responses follow the `{success: boolean, data?: T}` structure

## 📞 Support

For issues and feature requests, please open an issue on GitHub.

---

**Built with ❤️ for educational institutions**
