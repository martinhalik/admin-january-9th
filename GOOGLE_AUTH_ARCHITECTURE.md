# Google Authentication Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              React Application (Port 3000)              │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │           App.tsx (Root Component)              │  │   │
│  │  │  ┌────────────────────────────────────────┐    │  │   │
│  │  │  │      AuthProvider (Context)            │    │  │   │
│  │  │  │  - Manages auth state                  │    │  │   │
│  │  │  │  - Listens to Supabase events         │    │  │   │
│  │  │  │  - Enforces @groupon.com restriction  │    │  │   │
│  │  │  └────────────────────────────────────────┘    │  │   │
│  │  │  ┌────────────────────────────────────────┐    │  │   │
│  │  │  │         Router (React Router)          │    │  │   │
│  │  │  │  ┌──────────────────────────────────┐ │    │  │   │
│  │  │  │  │  Public Routes:                  │ │    │  │   │
│  │  │  │  │  • /login → LoginPage            │ │    │  │   │
│  │  │  │  └──────────────────────────────────┘ │    │  │   │
│  │  │  │  ┌──────────────────────────────────┐ │    │  │   │
│  │  │  │  │  Protected Routes (wrapped):     │ │    │  │   │
│  │  │  │  │  • / → Dashboard                 │ │    │  │   │
│  │  │  │  │  • /deals → Deals                │ │    │  │   │
│  │  │  │  │  • /accounts → Accounts          │ │    │  │   │
│  │  │  │  │  • /admin/* → Admin pages        │ │    │  │   │
│  │  │  │  │  • All other routes...           │ │    │  │   │
│  │  │  │  └──────────────────────────────────┘ │    │  │   │
│  │  │  └────────────────────────────────────────┘    │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/OAuth
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (Auth Service)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Authentication Module                      │   │
│  │  • Manages OAuth flow                                  │   │
│  │  • Handles callbacks from Google                       │   │
│  │  • Issues JWT tokens                                   │   │
│  │  • Manages sessions                                    │   │
│  │  • Automatic token refresh                             │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Database (PostgreSQL)                      │   │
│  │  • auth.users table (managed by Supabase)              │   │
│  │  • deals table (with optional RLS)                     │   │
│  │  • accounts table (with optional RLS)                  │   │
│  │  • employees table (with optional RLS)                 │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ OAuth 2.0
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Google OAuth 2.0                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              OAuth Consent Screen                       │   │
│  │  • Type: Internal (Groupon only)                       │   │
│  │  • Domain hint: groupon.com                            │   │
│  │  • Scopes: email, profile, openid                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         Google Workspace (Groupon)                      │   │
│  │  • Authenticates user                                  │   │
│  │  • Verifies @groupon.com domain                        │   │
│  │  • Returns user profile                                │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow Diagram

```
┌─────────┐                                                    
│  User   │                                                    
└────┬────┘                                                    
     │                                                         
     │ 1. Navigate to app                                     
     │                                                         
     ▼                                                         
┌─────────────┐                                               
│   App.tsx   │                                               
│             │                                               
│ Is user     │                                               
│ logged in?  │                                               
└──────┬──────┘                                               
       │                                                       
       │ No                                                    
       │                                                       
       ▼                                                       
┌─────────────────┐                                           
│  LoginPage.tsx  │                                           
│                 │                                           
│ [Sign in with   │                                           
│   Google 🔐]    │                                           
└────────┬────────┘                                           
         │                                                     
         │ 2. Click sign in                                   
         │                                                     
         ▼                                                     
┌──────────────────────┐                                      
│  AuthContext.tsx     │                                      
│  signInWithGoogle()  │                                      
└──────────┬───────────┘                                      
           │                                                   
           │ 3. Initiate OAuth                                
           │    with hd=groupon.com                           
           │                                                   
           ▼                                                   
┌───────────────────────┐                                     
│   Supabase Auth       │                                     
│   OAuth Redirect      │                                     
└──────────┬────────────┘                                     
           │                                                   
           │ 4. Redirect to Google                            
           │                                                   
           ▼                                                   
┌───────────────────────┐                                     
│   Google OAuth        │                                     
│   Consent Screen      │                                     
│                       │                                     
│   [Select Account]    │                                     
│   user@groupon.com ✓  │                                     
└──────────┬────────────┘                                     
           │                                                   
           │ 5. User authenticates                            
           │                                                   
           ▼                                                   
┌───────────────────────┐                                     
│   Google              │                                     
│   Returns user info   │                                     
└──────────┬────────────┘                                     
           │                                                   
           │ 6. Callback to Supabase                          
           │    with authorization code                       
           │                                                   
           ▼                                                   
┌───────────────────────┐                                     
│   Supabase Auth       │                                     
│   Processes callback  │                                     
│   Creates session     │                                     
│   Issues JWT token    │                                     
└──────────┬────────────┘                                     
           │                                                   
           │ 7. Redirect back to app                          
           │    with session                                  
           │                                                   
           ▼                                                   
┌───────────────────────┐                                     
│   AuthContext.tsx     │                                     
│   onAuthStateChange() │                                     
└──────────┬────────────┘                                     
           │                                                   
           │ 8. Verify email domain                           
           │    checkGrouponDomain()                          
           │                                                   
           ▼                                                   
     Is @groupon.com?                                         
           │                                                   
     ┌─────┴─────┐                                           
     │           │                                            
    Yes         No                                            
     │           │                                            
     │           ▼                                            
     │     ┌─────────────┐                                   
     │     │ Sign out    │                                   
     │     │ Redirect to │                                   
     │     │ /login      │                                   
     │     └─────────────┘                                   
     │                                                        
     ▼                                                        
┌─────────────────┐                                          
│ Allow access    │                                          
│ Set user state  │                                          
└────────┬────────┘                                          
         │                                                    
         │ 9. Navigate to                                    
         │    intended route                                 
         │                                                    
         ▼                                                    
┌───────────────────┐                                        
│ ProtectedRoute    │                                        
│ Check auth status │                                        
└────────┬──────────┘                                        
         │                                                    
         │ Authenticated ✓                                   
         │                                                    
         ▼                                                    
┌───────────────────┐                                        
│   Dashboard       │                                        
│   (or other page) │                                        
└───────────────────┘                                        
```

## Component Responsibilities

### 1. AuthContext (`frontend/src/contexts/AuthContext.tsx`)

**Purpose**: Centralized authentication state management

**Responsibilities**:
- Initialize Supabase auth client
- Listen to auth state changes
- Provide auth state to entire app
- Handle sign-in flow
- Handle sign-out flow
- Enforce domain restriction
- Show loading states

**Exports**:
```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isGrouponUser: boolean;
}
```

### 2. LoginPage (`frontend/src/components/LoginPage.tsx`)

**Purpose**: User interface for authentication

**Responsibilities**:
- Display branded login page
- Provide Google sign-in button
- Show security information
- Handle sign-in click events

**UI Elements**:
- Groupon branding
- "Sign in with Google" button
- Security notices
- Responsive layout

### 3. ProtectedRoute (`frontend/src/components/ProtectedRoute.tsx`)

**Purpose**: Guard routes that require authentication

**Responsibilities**:
- Check authentication status
- Verify Groupon domain
- Redirect to login if unauthorized
- Show loading state during checks
- Render children if authorized

**Logic**:
```typescript
if (loading) return <LoadingSpinner />;
if (!user || !isGrouponUser) return <Navigate to="/login" />;
return <>{children}</>;
```

### 4. App.tsx (Modified)

**Purpose**: Application root with auth integration

**Changes**:
- Wrap app with `AuthProvider`
- Define public route (`/login`)
- Wrap all other routes with `ProtectedRoute`

**Structure**:
```typescript
<AuthProvider>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/*" element={
      <ProtectedRoute>
        {/* All protected routes */}
      </ProtectedRoute>
    } />
  </Routes>
</AuthProvider>
```

### 5. Layout.tsx (Modified)

**Purpose**: Main layout with sign-out functionality

**Changes**:
- Import `useAuth` hook
- Add sign-out handler to user menu
- Call `signOut()` when user clicks logout

## Data Flow

### Sign In Flow
```
User → LoginPage → signInWithGoogle() 
     → Supabase → Google OAuth 
     → Callback → Supabase 
     → AuthContext → checkGrouponDomain()
     → If valid: Set user state
     → ProtectedRoute → Allow access
```

### Sign Out Flow
```
User → User Menu → Logout Click 
     → signOut() → Supabase.auth.signOut()
     → Clear session → AuthContext updates
     → ProtectedRoute → Redirect to /login
```

### Session Persistence
```
Page Load → AuthContext.useEffect()
          → supabase.auth.getSession()
          → Session exists? → Restore state
          → Listen for changes
          → Auto-refresh tokens
```

## Security Layers

### Layer 1: OAuth Consent Screen
- **Level**: Google Cloud Console
- **Config**: Internal (Groupon only)
- **Effect**: Shows only Groupon accounts

### Layer 2: OAuth Parameter
- **Level**: OAuth request
- **Config**: `hd=groupon.com`
- **Effect**: Hints domain to Google

### Layer 3: Application Validation (ENFORCED)
- **Level**: AuthContext
- **Config**: Email domain check
- **Effect**: Auto sign-out non-Groupon users

### Layer 4: Route Protection
- **Level**: ProtectedRoute component
- **Config**: Check auth + domain
- **Effect**: Block access to routes

### Layer 5: Database (Optional)
- **Level**: Supabase RLS policies
- **Config**: Email-based policies
- **Effect**: Restrict database queries

## Environment Configuration

### Development
```bash
# frontend/.env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Production (Vercel)
```bash
# Vercel Environment Variables
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Google Cloud Console
```
OAuth 2.0 Client:
- Client ID: xxx.apps.googleusercontent.com
- Client Secret: GOCSPX-xxx
- Redirect URI: https://xxx.supabase.co/auth/v1/callback
```

### Supabase Dashboard
```
Authentication → Providers → Google:
- Enabled: ✓
- Client ID: (from Google)
- Client Secret: (from Google)
```

## File Dependencies

```
App.tsx
  └── AuthProvider (AuthContext.tsx)
        ├── supabase (lib/supabase.ts)
        └── Supabase Auth SDK (@supabase/supabase-js)

  └── Routes
        ├── LoginPage.tsx
        │     └── useAuth() → AuthContext
        │
        └── ProtectedRoute.tsx
              └── useAuth() → AuthContext
                    └── All protected routes
```

## Session Storage

```
Browser localStorage:
├── supabase.auth.token
│   ├── access_token (JWT)
│   ├── refresh_token
│   ├── expires_at
│   └── user metadata
│
└── Application state:
    ├── currentRole (existing)
    ├── currentUser (existing)
    └── theme (existing)
```

## API Interactions

### Supabase Auth Endpoints
```
POST   /auth/v1/token
  → Request access token

GET    /auth/v1/user
  → Get current user

POST   /auth/v1/logout
  → Sign out user

POST   /auth/v1/refresh
  → Refresh access token
```

### Google OAuth Endpoints
```
GET    /o/oauth2/v2/auth
  → Authorization request

POST   /oauth2/v4/token
  → Token exchange

GET    /oauth2/v2/userinfo
  → User profile
```

---

This architecture provides secure, scalable authentication with multiple layers of protection ensuring only Groupon employees can access the application.




