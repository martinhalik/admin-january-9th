# Role-Based Filtering Visual Guide

## Hierarchy Structure

```
CEO (Robert Mitchell)
│
├── VP of Sales (Jennifer Adams)
│   │
│   ├── DSM - Central (Michael Thompson)
│   │   │
│   │   ├── MM - Chicago (Sarah Johnson)
│   │   │   ├── BD - David Martinez
│   │   │   ├── BD - Emily Chen
│   │   │   └── MD - Lisa Rodriguez
│   │   │
│   │   └── MM - Milwaukee (James Wilson)
│   │       ├── BD - Amanda Foster
│   │       └── MD - Carlos Rivera
│   │
│   ├── DSM - East (Patricia Lee)
│   │   │
│   │   ├── MM - New York (Daniel Park)
│   │   │   ├── BD - Rachel Green
│   │   │   ├── BD - Thomas Anderson
│   │   │   └── MD - Jennifer White
│   │   │
│   │   └── MM - Boston (Michelle Brown)
│   │       ├── BD - Kevin O'Brien
│   │       └── MD - Samantha Taylor
│   │
│   └── DSM - West (Alexander Kim)
│       │
│       └── MM - San Francisco (Nicole Garcia)
│           ├── BD - Brandon Lee
│           ├── BD - Jessica Moore
│           └── MD - Steven Harris
│
└── VP of Operations (Christopher Davis)
    │
    └── Content Ops Manager (Victoria Martinez)
        ├── Content Ops Staff - Olivia Davis
        └── Content Ops Staff - Nathan Wright
```

## Filtering Examples

### Example 1: BD Representative (David Martinez)

**Role**: Business Development Representative (BD)
**Reports To**: Sarah Johnson (MM - Chicago)
**Team**: None (Individual Contributor)

**Filtering Rule**: Can only see accounts where they are the account owner

```
Accounts Visible:
- ✓ Chimi's Fresh-Mex (Owner: David Martinez)
- ✓ Urban Fitness Studio (Owner: David Martinez)
- ✓ Spa Serenity (Owner: David Martinez)
- ✗ Bella Italia (Owner: Emily Chen)
- ✗ All other accounts

Total: ~6-8 accounts (only their own)
```

---

### Example 2: Market Manager (Sarah Johnson)

**Role**: Market Manager (MM)
**Reports To**: Michael Thompson (DSM - Central)
**Direct Reports**:
- David Martinez (BD)
- Emily Chen (BD)
- Lisa Rodriguez (MD)

**Filtering Rule**: Can see accounts where they OR their direct reports are owners

```
Accounts Visible:
Personal Accounts:
- ✓ Any account owned by Sarah Johnson

Team Accounts:
- ✓ All accounts owned by David Martinez
- ✓ All accounts owned by Emily Chen
- ✓ All accounts owned by Lisa Rodriguez

Not Visible:
- ✗ Accounts from Milwaukee team (James Wilson's team)
- ✗ Accounts from other divisions

Total: ~20-25 accounts (own + 3 direct reports)
```

**Account Owner Filter Options**:
- Sarah Johnson (self)
- David Martinez
- Emily Chen
- Lisa Rodriguez

---

### Example 3: Divisional Sales Manager (Michael Thompson)

**Role**: Divisional Sales Manager (DSM)
**Reports To**: Jennifer Adams (VP of Sales)
**Division**: Central
**Direct Reports**:
- Sarah Johnson (MM - Chicago)
- James Wilson (MM - Milwaukee)

**All Team Members** (Including Sub-Teams):
- Sarah Johnson (MM)
  - David Martinez (BD)
  - Emily Chen (BD)
  - Lisa Rodriguez (MD)
- James Wilson (MM)
  - Amanda Foster (BD)
  - Carlos Rivera (MD)

**Filtering Rule**: Can see accounts where ANYONE in their team (entire hierarchy) is owner

```
Accounts Visible:
Chicago Market:
- ✓ Accounts owned by Sarah Johnson
- ✓ Accounts owned by David Martinez
- ✓ Accounts owned by Emily Chen
- ✓ Accounts owned by Lisa Rodriguez

Milwaukee Market:
- ✓ Accounts owned by James Wilson
- ✓ Accounts owned by Amanda Foster
- ✓ Accounts owned by Carlos Rivera

Not Visible:
- ✗ Accounts from East division (Patricia Lee's team)
- ✗ Accounts from West division (Alexander Kim's team)

Total: ~40-50 accounts (entire Central division)
```

**Account Owner Filter Options**:
- All team members (7 people)

---

### Example 4: VP/Executive (Jennifer Adams)

**Role**: VP of Sales / Executive
**Reports To**: CEO
**Division**: All Sales

**Filtering Rule**: Can see ALL accounts (no filtering)

```
Accounts Visible:
- ✓ ALL accounts across ALL divisions
- ✓ ALL account owners
- ✓ ALL locations

Total: 500+ accounts (entire company)
```

**Account Owner Filter Options**:
- All BD and MD reps across the company

---

## Visual Filtering Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Account Database                          │
│                    (500+ Accounts)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Role-Based Filter Logic     │
            │   (accountFiltering.ts)       │
            └───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│   BD/MD View  │   │   MM View    │   │  DSM View    │
│   6-8 accts   │   │  20-25 accts │   │  40-50 accts │
│   Own only    │   │  Team only   │   │  Division    │
└───────────────┘   └──────────────┘   └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Admin View  │
                    │  All accts   │
                    │  500+ accts  │
                    └──────────────┘
```

## Filter Application Flow

```
1. User Login/Selection
   │
   ├─> Extract employeeId and role
   │
   ▼
2. Determine Team Hierarchy
   │
   ├─> BD/MD: team = [self]
   ├─> MM: team = [self + direct reports]
   ├─> DSM: team = [self + all descendants]
   └─> Admin: team = [everyone]
   │
   ▼
3. Get Allowed Account Owner IDs
   │
   └─> List of employee IDs who can be account owners
   │
   ▼
4. Filter Accounts
   │
   └─> Keep only accounts where owner is in allowed list
   │
   ▼
5. Apply Additional Filters
   │
   ├─> Search text
   ├─> Status filter
   ├─> Potential filter
   ├─> Account owner filter (if applicable)
   └─> Other UI filters
   │
   ▼
6. Display Filtered Results
```

## UI Components

### 1. Accounts Page

```
┌─────────────────────────────────────────────────────┐
│  Accounts                                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ℹ️  Showing accounts owned by you or your team     │
│     members                                          │
│                                                      │
│  🔍 Search...                    [Filters ▼]        │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Account Name      Owner         Potential  Status  │
│  ────────────────────────────────────────────────   │
│  Chimi's Fresh-Mex David Martinez  HIGH     Active  │
│  Urban Fitness     David Martinez  MID      Active  │
│  Bella Italia      Emily Chen      HIGH     Active  │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

### 2. Filter Sidebar (For Managers)

```
┌─────────────────────────────┐
│  Filters               [×]  │
├─────────────────────────────┤
│                              │
│  Account Owner               │
│  ┌─────────────────────┐   │
│  │ All Owners      ▼   │   │
│  └─────────────────────┘   │
│    • Self                   │
│    • David Martinez         │
│    • Emily Chen             │
│    • Lisa Rodriguez         │
│                              │
│  Potential                   │
│  ┌─────────────────────┐   │
│  │ All Potential   ▼   │   │
│  └─────────────────────┘   │
│                              │
│  Status                      │
│  ┌─────────────────────┐   │
│  │ All Status      ▼   │   │
│  └─────────────────────┘   │
│                              │
└─────────────────────────────┘
```

### 3. Organization Hierarchy Page

```
┌─────────────────────────────────────────────────────────┐
│  Organization Hierarchy                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  View the company organizational structure. This data   │
│  is managed in Workday and synced from Google          │
│  Workspace. This is a read-only view.                  │
│                                                          │
│  🔍 Search by name, email, or role...                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Tree View                    │  Employee Details       │
│                               │                         │
│  📊 Robert Mitchell [CEO]     │  👤 [Avatar]           │
│    ├─ Jennifer Adams [VP]    │                         │
│    │   ├─ Michael Thompson   │  Sarah Johnson          │
│    │   │   ├─ Sarah Johnson  │  🏷️ MM                  │
│    │   │   │   ├─ David M.   │  Market Manager - Chi   │
│    │   │   │   ├─ Emily C.   │                         │
│    │   │   │   └─ Lisa R.    │  📧 sarah.johnson@...  │
│    │   │   └─ James Wilson   │  📞 (555) 301-0001     │
│    │   ├─ Patricia Lee       │  📍 Chicago, IL         │
│    │   └─ Alexander Kim      │                         │
│    └─ Christopher Davis      │  Direct Reports: 3      │
│                               │  • David Martinez       │
│                               │  • Emily Chen          │
│                               │  • Lisa Rodriguez      │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────────────┐
│  Google Workspace        │  (Production Source)
│  + Workday               │
└────────────┬─────────────┘
             │
             │ Sync (Automated)
             ▼
┌──────────────────────────┐
│  companyHierarchy.ts     │  (Application Data)
│  - Employee records      │
│  - Reporting structure   │
│  - Role assignments      │
└────────────┬─────────────┘
             │
             │ Runtime
             ▼
┌──────────────────────────┐
│  accountFiltering.ts     │  (Filtering Logic)
│  - Role rules            │
│  - Team calculation      │
│  - Permission checks     │
└────────────┬─────────────┘
             │
             │ Apply
             ▼
┌──────────────────────────┐
│  UI Components           │  (User Interface)
│  - Accounts page         │
│  - Account selector      │
│  - Deal creation         │
└──────────────────────────┘
```

## Security Considerations

```
✓ Client-side filtering for prototype/demo
✗ Server-side validation required for production

Production Requirements:
├─> API authentication
├─> Role-based JWT tokens
├─> Server-side filtering
├─> Audit logging
├─> Rate limiting
└─> Permission caching
```

---

## Quick Reference Table

| Role | Abbreviation | Sees Accounts From | Filter Count | Can Filter By Team |
|------|--------------|-------------------|--------------|-------------------|
| BD Rep | BD | Self only | 6-8 | No |
| MD Rep | MD | Self only | 6-8 | No |
| Market Manager | MM | Self + Direct Reports | 20-25 | Yes |
| Divisional Sales Mgr | DSM | Entire Division | 40-50 | Yes |
| VP / Executive | EXEC | All | 500+ | Yes |
| Content Ops | CONTENT | All | 500+ | Yes |
| Admin | ADMIN | All | 500+ | Yes |





