# WedWise — System Architecture

> Technical architecture and engineering documentation for WedWise, a collaborative wedding operating system for Indian families.

---

## 1. System Overview

WedWise is a **multi-user, wedding-scoped application** where authorized family members collaborate inside a shared wedding workspace.

The system connects:

* Wedding identity
* Budget and expenses
* Events and timeline
* Guests and RSVP
* Accommodation and transport
* Vendors and payments
* Family collaboration
* Memories
* AI-powered wedding insights

The core architectural principle is:

> **One wedding → one shared source of truth → multiple authorized family members.**

Every major entity is associated with a `wedding_id`, allowing the application to isolate data between different weddings.

---

## 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      User / PWA     │
                         │  Desktop + Mobile   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ React + TypeScript  │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
            ┌────────────┐   ┌──────────────┐  ┌─────────────┐
            │ Supabase   │   │ Edge         │  │ Gemini AI   │
            │ Auth       │   │ Functions    │  │ Server Side │
            └─────┬──────┘   └──────┬───────┘  └─────────────┘
                  │                  │
                  └──────────┬───────┘
                             ▼
                    ┌──────────────────┐
                    │ PostgreSQL       │
                    │ + RLS            │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Supabase Storage │
                    │ Private Media    │
                    └──────────────────┘
```

---

## 3. Frontend Architecture

### Technology

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Recharts
* Progressive Web App architecture

The frontend is organized around wedding-aware screens and reusable components.

```text
src/
├── components/
├── pages/
├── services/
├── hooks/
├── types/
├── utils/
├── constants/
└── ...
```

### Component Architecture

WedWise follows a layered component approach:

```text
Design Tokens
      ↓
Primitives
      ↓
Patterns
      ↓
Screens
      ↓
Application Shell
```

Examples of signature product components include:

* `WeddingPulseCard`
* `BudgetHealthBanner`
* `SmartTaskList`
* `AskWedWisePanel`
* `TimelineRail`
* `VaultGrid`
* `WeddingStoryFeed`

The goal is to keep product-specific behavior separate from generic UI primitives.

---

## 4. Wedding-Scoped Data Architecture

The application is designed around a central wedding workspace.

Conceptually:

```text
Wedding
│
├── Members
├── Invitations
├── Activity
├── Budget
├── Expenses
├── Events
├── Tasks
├── Guests
├── RSVP
├── Accommodation
├── Transport
├── Vendors
├── Vendor Payments
├── Memories
└── AI Context
```

Most business entities contain:

```text
wedding_id
```

This creates the fundamental isolation boundary.

A user can also belong to more than one wedding, which allows the architecture to support planner-style or multi-wedding use cases.

---

## 5. Authentication & Authorization

### Authentication

Authentication is handled through **Supabase Auth**.

The application uses the authenticated user identity to determine which wedding workspaces the user can access.

### Authorization

WedWise uses role-based access control.

Supported roles:

| Role         | Purpose                                   |
| ------------ | ----------------------------------------- |
| OWNER        | Full wedding ownership and administration |
| FAMILY_ADMIN | Family-level administration               |
| CONTRIBUTOR  | Can contribute permitted wedding data     |
| VIEWER       | Read-only access                          |

Permissions are centralized instead of scattering role checks throughout individual screens.

Conceptually:

```text
Authenticated User
       │
       ▼
Wedding Membership
       │
       ▼
Role
       │
       ▼
Permission Check
       │
       ▼
Allowed UI + Database Operation
```

---

## 6. Row Level Security

PostgreSQL Row Level Security provides the database-level security boundary.

The application does not rely only on frontend role checks.

The important security principle is:

> **Frontend permissions improve UX; database RLS enforces access.**

A wedding member must be authorized for the corresponding wedding before accessing wedding-scoped data.

Conceptually:

```text
Request
  │
  ▼
Authenticated User
  │
  ▼
auth.uid()
  │
  ▼
Wedding Membership Check
  │
  ├── Authorized → Database operation allowed
  │
  └── Unauthorized → Operation denied
```

This protects against bypassing the frontend and directly attempting unauthorized database operations.

---

## 7. Family Collaboration Architecture

Family collaboration is implemented using dedicated wedding membership and invitation entities.

```text
OWNER / FAMILY_ADMIN
          │
          ▼
   Create Invitation
          │
          ▼
 Secure Invitation Token
          │
          ▼
     Email Delivery
          │
          ▼
   Recipient Opens Link
          │
          ▼
 Authentication Check
          │
          ▼
 Email / Identity Validation
          │
          ▼
 Accept Invitation
          │
          ▼
 wedding_members
          │
          ▼
 Shared Wedding Workspace
```

### Invitation Safety

The production invitation flow includes:

* Expiration
* Single-use acceptance
* Case-insensitive email matching
* Duplicate protection
* OWNER invitation protection
* Row locking during acceptance
* Activity logging
* Idempotent repeated acceptance

The invitation does **not** grant wedding access merely because the invitation exists.

Access is established only after successful acceptance.

---

## 8. Financial Architecture

WedWise separates financial concepts into connected but explicit entities.

```text
Budget
  │
  ├── Allocations
  │
  ├── Expenses
  │
  └── Vendor Payments
            │
            ▼
       Financial View
            │
            ├── Spent
            ├── Remaining
            ├── Allocated
            └── Unallocated
```

Financial values are calculated deterministically from stored data.

AI is not treated as the authoritative calculator for financial totals.

For example:

```text
Remaining Budget
=
Total Budget
-
Recorded Expenses
```

This keeps important financial values reproducible and auditable.

---

## 9. Vendor & Payment Flow

Vendor management connects vendor records with payment activity and expense records.

Conceptually:

```text
Vendor
  │
  ├── Contract
  │
  ├── Payment
  │
  └── Payment Status
          │
          ▼
      Expense Ledger
```

The architecture maintains consistency between vendor payments and financial reporting.

Payment-to-expense synchronization is designed to avoid duplicate financial records.

---

## 10. Events & Timeline Architecture

Wedding ceremonies are modeled as structured events rather than static text.

```text
Wedding
   │
   └── Events
        ├── Engagement
        ├── Haldi
        ├── Mehendi
        ├── Sangeet
        ├── Wedding
        └── Reception
```

Events can connect to:

* Ceremony timing
* Tasks
* Budgets
* Memories
* Timeline navigation

This creates a shared timeline across planning and post-wedding memories.

---

## 11. Guest & Logistics Architecture

Guest management is connected to RSVP and logistics.

```text
Guest
 │
 ├── RSVP
 │
 ├── Accommodation
 │
 └── Transport
```

This allows wedding planning to move beyond a simple guest list into operational coordination.

---

## 12. Memories Architecture

Wedding Memories is designed as a ceremony-rooted archive.

```text
Wedding
   │
   ▼
Memory
   │
   ├── Ceremony/Event
   ├── Story / Caption
   ├── Author
   ├── Visibility
   ├── Media
   └── People Tags
```

Media is stored separately from wedding metadata.

The storage architecture uses private wedding-scoped media with controlled access.

This prevents wedding photos from becoming publicly accessible simply because they exist in the application.

---

## 13. Ask WedWise AI Architecture

Ask WedWise is designed as a **data-grounded assistant**.

```text
User Question
      │
      ▼
Ask WedWise
      │
      ▼
Intent / Query Understanding
      │
      ▼
Wedding Data Retrieval
      │
      ├── Budget
      ├── Expenses
      ├── Vendors
      ├── Events
      ├── Guests
      └── Memories
      │
      ▼
AI Response
```

### Important Principle

The AI should not invent authoritative wedding facts.

For deterministic questions such as:

* Budget remaining
* Total spent
* Largest expense
* Vendor payment status

the application can use deterministic data-derived responses.

This provides a fallback when the cloud AI service is unavailable or rate-limited.

### Server-Side AI

Sensitive AI credentials remain server-side.

The browser does not receive private AI API keys.

---

## 14. AI Failure & Fallback Strategy

WedWise includes deterministic fallback behavior for supported wedding-data questions.

Conceptually:

```text
User Question
      │
      ▼
AI Request
      │
      ├── AI available
      │       ↓
      │   AI response
      │
      └── AI unavailable / rate limited
              ↓
        Deterministic fallback
              ↓
        Wedding database data
```

This prevents common operational questions from becoming unusable solely because an external AI service is temporarily unavailable.

---

## 15. Progressive Web App

WedWise is implemented as a Progressive Web App.

The PWA architecture provides:

* Installable web experience
* Mobile-first UI
* Web app manifest
* Service worker
* App icons
* Responsive layouts
* Desktop and mobile support

The application can therefore be installed from a supported browser and used more like an application without requiring a Play Store installation.

---

## 16. Security Architecture

Security responsibilities are separated across layers.

```text
┌─────────────────────────────┐
│ Frontend                    │
│ UX permissions + validation │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ Supabase Auth               │
│ User identity               │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ PostgreSQL + RLS            │
│ Wedding data authorization  │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ Private Storage             │
│ Wedding media isolation     │
└─────────────────────────────┘
```

Server-only credentials such as AI and email service secrets are kept outside the browser bundle.

---

## 17. Deployment Architecture

Production deployment separates the frontend from backend/server-side responsibilities.

```text
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │    Netlify     │
              │ React / PWA    │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │    Supabase    │
              │                │
              │ Auth           │
              │ PostgreSQL     │
              │ RLS            │
              │ Storage        │
              │ Edge Functions │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │ External AI    │
              │ Gemini         │
              └────────────────┘
```

Production application:

**https://wedwise-wedding.netlify.app**

---

## 18. Data Isolation Model

Wedding isolation is a core architectural invariant.

```text
User A
 │
 └── Wedding A
       ├── Budget A
       ├── Guests A
       ├── Vendors A
       └── Memories A

User B
 │
 └── Wedding B
       ├── Budget B
       ├── Guests B
       ├── Vendors B
       └── Memories B
```

Queries and mutations are wedding-scoped, while PostgreSQL RLS provides an additional database-level enforcement layer.

This prevents data from one wedding being exposed through another wedding workspace.

---

## 19. Application Route Model

The application uses wedding-scoped routes.

Conceptually:

```text
/w/:weddingId/wedding
/w/:weddingId/wedding/timeline
/w/:weddingId/wedding/events/:eventId
/w/:weddingId/wedding/tasks

/w/:weddingId/people
/w/:weddingId/people/:guestId
/w/:weddingId/people/rsvp
/w/:weddingId/people/rooms
/w/:weddingId/people/transport

/w/:weddingId/vendors
/w/:weddingId/vendors/:vendorId

/w/:weddingId/more
/w/:weddingId/more/vault
/w/:weddingId/more/reports
/w/:weddingId/more/memories
/w/:weddingId/more/ask
/w/:weddingId/more/members
/w/:weddingId/more/settings
```

The `weddingId` keeps the application explicitly tied to the active wedding workspace.

---

## 20. Design Architecture

WedWise intentionally avoids the generic SaaS dashboard aesthetic.

The visual system uses:

* Editorial typography
* Warm paper-inspired surfaces
* Indian wedding-inspired visual motifs
* Mandap-derived geometry
* Arch structures
* Diagonal visual seams
* Block-print-inspired line art
* Wedding Pulse visual language

The design principle is:

> **Wedding planning should feel like an editorial experience, not an enterprise spreadsheet.**

---

## 21. Engineering Principles

### 1. Wedding-scoped by default

Every business operation should know which wedding it belongs to.

### 2. Database security over UI security

Frontend permissions are not treated as the final security boundary.

### 3. Deterministic financial calculations

Financial totals come from stored records and deterministic calculations.

### 4. AI as an assistant

AI provides interpretation and assistance, not uncontrolled authority over wedding state.

### 5. Explicit roles

Permissions are centralized and role-aware.

### 6. Idempotent critical operations

Operations such as invitation acceptance and payment synchronization should safely handle retries.

### 7. Mobile-first

The application is designed for real wedding planning situations where users frequently operate from phones.

### 8. Shared source of truth

Family members collaborate against the same wedding workspace instead of maintaining disconnected spreadsheets or chats.

---

## 22. Core Architectural Differentiator

WedWise is not simply:

```text
Wedding Planner
+
AI Chatbot
```

Its architecture is centered around:

```text
                 ONE WEDDING
                     │
        ┌────────────┼────────────┐
        │            │            │
      PEOPLE        MONEY       EVENTS
        │            │            │
        ├────────────┼────────────┤
        │            │            │
      VENDORS      TASKS       MEMORIES
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
               ASK WEDWISE AI
```

The result is a **shared wedding operating system** where planning data, financial data, people, vendors, events, memories and AI assistance operate within the same wedding context.

---

## 23. Production Status

Current production stack:

* React + TypeScript + Vite
* Tailwind CSS
* Supabase Auth
* PostgreSQL
* PostgreSQL Row Level Security
* Supabase Storage
* Supabase Edge Functions
* Gemini AI
* Netlify
* Progressive Web App

Production URL:

**https://wedwise-wedding.netlify.app**

GitHub:

**https://github.com/priyanshi-gupta31/WedWise**

---

## 24. Summary

WedWise is architected as a **secure, wedding-scoped collaborative workspace**.

Its core architecture combines:

```text
React
  +
Supabase
  +
PostgreSQL + RLS
  +
Role-Based Collaboration
  +
Deterministic Financial Logic
  +
Server-Side AI
  +
Private Wedding Media
  +
PWA
```

The architecture is designed to support the complete wedding lifecycle:

```text
Plan
  ↓
Budget
  ↓
Coordinate
  ↓
Invite
  ↓
Manage
  ↓
Celebrate
  ↓
Remember
```

**WedWise turns a wedding from a collection of spreadsheets, chats and disconnected tools into one shared family workspace.**
# WedWise — System Architecture

> Technical architecture and engineering documentation for WedWise, a collaborative wedding operating system for Indian families.

---

## 1. System Overview

WedWise is a **multi-user, wedding-scoped application** where authorized family members collaborate inside a shared wedding workspace.

The system connects:

* Wedding identity
* Budget and expenses
* Events and timeline
* Guests and RSVP
* Accommodation and transport
* Vendors and payments
* Family collaboration
* Memories
* AI-powered wedding insights

The core architectural principle is:

> **One wedding → one shared source of truth → multiple authorized family members.**

Every major entity is associated with a `wedding_id`, allowing the application to isolate data between different weddings.

---

## 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      User / PWA     │
                         │  Desktop + Mobile   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ React + TypeScript  │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
            ┌────────────┐   ┌──────────────┐  ┌─────────────┐
            │ Supabase   │   │ Edge         │  │ Gemini AI   │
            │ Auth       │   │ Functions    │  │ Server Side │
            └─────┬──────┘   └──────┬───────┘  └─────────────┘
                  │                  │
                  └──────────┬───────┘
                             ▼
                    ┌──────────────────┐
                    │ PostgreSQL       │
                    │ + RLS            │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Supabase Storage │
                    │ Private Media    │
                    └──────────────────┘
```

---

## 3. Frontend Architecture

### Technology

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Recharts
* Progressive Web App architecture

The frontend is organized around wedding-aware screens and reusable components.

```text
src/
├── components/
├── pages/
├── services/
├── hooks/
├── types/
├── utils/
├── constants/
└── ...
```

### Component Architecture

WedWise follows a layered component approach:

```text
Design Tokens
      ↓
Primitives
      ↓
Patterns
      ↓
Screens
      ↓
Application Shell
```

Examples of signature product components include:

* `WeddingPulseCard`
* `BudgetHealthBanner`
* `SmartTaskList`
* `AskWedWisePanel`
* `TimelineRail`
* `VaultGrid`
* `WeddingStoryFeed`

The goal is to keep product-specific behavior separate from generic UI primitives.

---

## 4. Wedding-Scoped Data Architecture

The application is designed around a central wedding workspace.

Conceptually:

```text
Wedding
│
├── Members
├── Invitations
├── Activity
├── Budget
├── Expenses
├── Events
├── Tasks
├── Guests
├── RSVP
├── Accommodation
├── Transport
├── Vendors
├── Vendor Payments
├── Memories
└── AI Context
```

Most business entities contain:

```text
wedding_id
```

This creates the fundamental isolation boundary.

A user can also belong to more than one wedding, which allows the architecture to support planner-style or multi-wedding use cases.

---

## 5. Authentication & Authorization

### Authentication

Authentication is handled through **Supabase Auth**.

The application uses the authenticated user identity to determine which wedding workspaces the user can access.

### Authorization

WedWise uses role-based access control.

Supported roles:

| Role         | Purpose                                   |
| ------------ | ----------------------------------------- |
| OWNER        | Full wedding ownership and administration |
| FAMILY_ADMIN | Family-level administration               |
| CONTRIBUTOR  | Can contribute permitted wedding data     |
| VIEWER       | Read-only access                          |

Permissions are centralized instead of scattering role checks throughout individual screens.

Conceptually:

```text
Authenticated User
       │
       ▼
Wedding Membership
       │
       ▼
Role
       │
       ▼
Permission Check
       │
       ▼
Allowed UI + Database Operation
```

---

## 6. Row Level Security

PostgreSQL Row Level Security provides the database-level security boundary.

The application does not rely only on frontend role checks.

The important security principle is:

> **Frontend permissions improve UX; database RLS enforces access.**

A wedding member must be authorized for the corresponding wedding before accessing wedding-scoped data.

Conceptually:

```text
Request
  │
  ▼
Authenticated User
  │
  ▼
auth.uid()
  │
  ▼
Wedding Membership Check
  │
  ├── Authorized → Database operation allowed
  │
  └── Unauthorized → Operation denied
```

This protects against bypassing the frontend and directly attempting unauthorized database operations.

---

## 7. Family Collaboration Architecture

Family collaboration is implemented using dedicated wedding membership and invitation entities.

```text
OWNER / FAMILY_ADMIN
          │
          ▼
   Create Invitation
          │
          ▼
 Secure Invitation Token
          │
          ▼
     Email Delivery
          │
          ▼
   Recipient Opens Link
          │
          ▼
 Authentication Check
          │
          ▼
 Email / Identity Validation
          │
          ▼
 Accept Invitation
          │
          ▼
 wedding_members
          │
          ▼
 Shared Wedding Workspace
```

### Invitation Safety

The production invitation flow includes:

* Expiration
* Single-use acceptance
* Case-insensitive email matching
* Duplicate protection
* OWNER invitation protection
* Row locking during acceptance
* Activity logging
* Idempotent repeated acceptance

The invitation does **not** grant wedding access merely because the invitation exists.

Access is established only after successful acceptance.

---

## 8. Financial Architecture

WedWise separates financial concepts into connected but explicit entities.

```text
Budget
  │
  ├── Allocations
  │
  ├── Expenses
  │
  └── Vendor Payments
            │
            ▼
       Financial View
            │
            ├── Spent
            ├── Remaining
            ├── Allocated
            └── Unallocated
```

Financial values are calculated deterministically from stored data.

AI is not treated as the authoritative calculator for financial totals.

For example:

```text
Remaining Budget
=
Total Budget
-
Recorded Expenses
```

This keeps important financial values reproducible and auditable.

---

## 9. Vendor & Payment Flow

Vendor management connects vendor records with payment activity and expense records.

Conceptually:

```text
Vendor
  │
  ├── Contract
  │
  ├── Payment
  │
  └── Payment Status
          │
          ▼
      Expense Ledger
```

The architecture maintains consistency between vendor payments and financial reporting.

Payment-to-expense synchronization is designed to avoid duplicate financial records.

---

## 10. Events & Timeline Architecture

Wedding ceremonies are modeled as structured events rather than static text.

```text
Wedding
   │
   └── Events
        ├── Engagement
        ├── Haldi
        ├── Mehendi
        ├── Sangeet
        ├── Wedding
        └── Reception
```

Events can connect to:

* Ceremony timing
* Tasks
* Budgets
* Memories
* Timeline navigation

This creates a shared timeline across planning and post-wedding memories.

---

## 11. Guest & Logistics Architecture

Guest management is connected to RSVP and logistics.

```text
Guest
 │
 ├── RSVP
 │
 ├── Accommodation
 │
 └── Transport
```

This allows wedding planning to move beyond a simple guest list into operational coordination.

---

## 12. Memories Architecture

Wedding Memories is designed as a ceremony-rooted archive.

```text
Wedding
   │
   ▼
Memory
   │
   ├── Ceremony/Event
   ├── Story / Caption
   ├── Author
   ├── Visibility
   ├── Media
   └── People Tags
```

Media is stored separately from wedding metadata.

The storage architecture uses private wedding-scoped media with controlled access.

This prevents wedding photos from becoming publicly accessible simply because they exist in the application.

---

## 13. Ask WedWise AI Architecture

Ask WedWise is designed as a **data-grounded assistant**.

```text
User Question
      │
      ▼
Ask WedWise
      │
      ▼
Intent / Query Understanding
      │
      ▼
Wedding Data Retrieval
      │
      ├── Budget
      ├── Expenses
      ├── Vendors
      ├── Events
      ├── Guests
      └── Memories
      │
      ▼
AI Response
```

### Important Principle

The AI should not invent authoritative wedding facts.

For deterministic questions such as:

* Budget remaining
* Total spent
* Largest expense
* Vendor payment status

the application can use deterministic data-derived responses.

This provides a fallback when the cloud AI service is unavailable or rate-limited.

### Server-Side AI

Sensitive AI credentials remain server-side.

The browser does not receive private AI API keys.

---

## 14. AI Failure & Fallback Strategy

WedWise includes deterministic fallback behavior for supported wedding-data questions.

Conceptually:

```text
User Question
      │
      ▼
AI Request
      │
      ├── AI available
      │       ↓
      │   AI response
      │
      └── AI unavailable / rate limited
              ↓
        Deterministic fallback
              ↓
        Wedding database data
```

This prevents common operational questions from becoming unusable solely because an external AI service is temporarily unavailable.

---

## 15. Progressive Web App

WedWise is implemented as a Progressive Web App.

The PWA architecture provides:

* Installable web experience
* Mobile-first UI
* Web app manifest
* Service worker
* App icons
* Responsive layouts
* Desktop and mobile support

The application can therefore be installed from a supported browser and used more like an application without requiring a Play Store installation.

---

## 16. Security Architecture

Security responsibilities are separated across layers.

```text
┌─────────────────────────────┐
│ Frontend                    │
│ UX permissions + validation │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ Supabase Auth               │
│ User identity               │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ PostgreSQL + RLS            │
│ Wedding data authorization  │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ Private Storage             │
│ Wedding media isolation     │
└─────────────────────────────┘
```

Server-only credentials such as AI and email service secrets are kept outside the browser bundle.

---

## 17. Deployment Architecture

Production deployment separates the frontend from backend/server-side responsibilities.

```text
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │    Netlify     │
              │ React / PWA    │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │    Supabase    │
              │                │
              │ Auth           │
              │ PostgreSQL     │
              │ RLS            │
              │ Storage        │
              │ Edge Functions │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │ External AI    │
              │ Gemini         │
              └────────────────┘
```

Production application:

**https://wedwise-wedding.netlify.app**

---

## 18. Data Isolation Model

Wedding isolation is a core architectural invariant.

```text
User A
 │
 └── Wedding A
       ├── Budget A
       ├── Guests A
       ├── Vendors A
       └── Memories A

User B
 │
 └── Wedding B
       ├── Budget B
       ├── Guests B
       ├── Vendors B
       └── Memories B
```

Queries and mutations are wedding-scoped, while PostgreSQL RLS provides an additional database-level enforcement layer.

This prevents data from one wedding being exposed through another wedding workspace.

---

## 19. Application Route Model

The application uses wedding-scoped routes.

Conceptually:

```text
/w/:weddingId/wedding
/w/:weddingId/wedding/timeline
/w/:weddingId/wedding/events/:eventId
/w/:weddingId/wedding/tasks

/w/:weddingId/people
/w/:weddingId/people/:guestId
/w/:weddingId/people/rsvp
/w/:weddingId/people/rooms
/w/:weddingId/people/transport

/w/:weddingId/vendors
/w/:weddingId/vendors/:vendorId

/w/:weddingId/more
/w/:weddingId/more/vault
/w/:weddingId/more/reports
/w/:weddingId/more/memories
/w/:weddingId/more/ask
/w/:weddingId/more/members
/w/:weddingId/more/settings
```

The `weddingId` keeps the application explicitly tied to the active wedding workspace.

---

## 20. Design Architecture

WedWise intentionally avoids the generic SaaS dashboard aesthetic.

The visual system uses:

* Editorial typography
* Warm paper-inspired surfaces
* Indian wedding-inspired visual motifs
* Mandap-derived geometry
* Arch structures
* Diagonal visual seams
* Block-print-inspired line art
* Wedding Pulse visual language

The design principle is:

> **Wedding planning should feel like an editorial experience, not an enterprise spreadsheet.**

---

## 21. Engineering Principles

### 1. Wedding-scoped by default

Every business operation should know which wedding it belongs to.

### 2. Database security over UI security

Frontend permissions are not treated as the final security boundary.

### 3. Deterministic financial calculations

Financial totals come from stored records and deterministic calculations.

### 4. AI as an assistant

AI provides interpretation and assistance, not uncontrolled authority over wedding state.

### 5. Explicit roles

Permissions are centralized and role-aware.

### 6. Idempotent critical operations

Operations such as invitation acceptance and payment synchronization should safely handle retries.

### 7. Mobile-first

The application is designed for real wedding planning situations where users frequently operate from phones.

### 8. Shared source of truth

Family members collaborate against the same wedding workspace instead of maintaining disconnected spreadsheets or chats.

---

## 22. Core Architectural Differentiator

WedWise is not simply:

```text
Wedding Planner
+
AI Chatbot
```

Its architecture is centered around:

```text
                 ONE WEDDING
                     │
        ┌────────────┼────────────┐
        │            │            │
      PEOPLE        MONEY       EVENTS
        │            │            │
        ├────────────┼────────────┤
        │            │            │
      VENDORS      TASKS       MEMORIES
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
               ASK WEDWISE AI
```

The result is a **shared wedding operating system** where planning data, financial data, people, vendors, events, memories and AI assistance operate within the same wedding context.

---

## 23. Production Status

Current production stack:

* React + TypeScript + Vite
* Tailwind CSS
* Supabase Auth
* PostgreSQL
* PostgreSQL Row Level Security
* Supabase Storage
* Supabase Edge Functions
* Gemini AI
* Netlify
* Progressive Web App

Production URL:

**https://wedwise-wedding.netlify.app**

GitHub:

**https://github.com/priyanshi-gupta31/WedWise**

---

## 24. Summary

WedWise is architected as a **secure, wedding-scoped collaborative workspace**.

Its core architecture combines:

```text
React
  +
Supabase
  +
PostgreSQL + RLS
  +
Role-Based Collaboration
  +
Deterministic Financial Logic
  +
Server-Side AI
  +
Private Wedding Media
  +
PWA
```

The architecture is designed to support the complete wedding lifecycle:

```text
Plan
  ↓
Budget
  ↓
Coordinate
  ↓
Invite
  ↓
Manage
  ↓
Celebrate
  ↓
Remember
```

**WedWise turns a wedding from a collection of spreadsheets, chats and disconnected tools into one shared family workspace.**
