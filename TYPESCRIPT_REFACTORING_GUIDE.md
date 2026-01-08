# TypeScript Type Safety Improvements Guide

This document provides specific refactoring recommendations to replace `any` types with proper TypeScript interfaces.

## 📋 Priority Levels

- 🚨 **Critical**: Security or data integrity issues
- ⚠️ **High**: Core functionality, error handling
- 📝 **Medium**: Component props, reusability
- 💡 **Low**: Third-party libraries, acceptable any usage

---

## 🚨 Critical Priority Fixes

### 1. Geographic/Location Data Types

**Problem:** Multiple files use `any` for geographic data
**Files Affected:**
- `types/index_new.ts` (lines 43, 129, 175)
- `components/LocationsManager.tsx` (line 15)
- `components/LocationMapComponent.tsx` (line 6)

**Current:**
```typescript
location?: any; // PostGIS GEOGRAPHY type
```

**Solution:**
Create a proper GeoJSON type definition:

```typescript
// Add to types/index.ts or types/geo.ts

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoLocation {
  type: string;
  coordinates: number[];
}

// For PostGIS compatibility
export type PostGISGeography = GeoPoint | GeoLocation | null;
```

**Apply to files:**

```typescript
// types/index_new.ts
export interface Store {
  // ... other fields
  location?: PostGISGeography;
}

export interface Order {
  // ... other fields
  delivery_location?: PostGISGeography;
}

export interface Driver {
  // ... other fields
  current_location?: PostGISGeography;
}
```

**Leaflet/Routing specific:**
```typescript
// components/LocationMapComponent.tsx
let L: typeof import('leaflet') | undefined;

// Or if you need more specific typing:
import type * as LeafletTypes from 'leaflet';
let L: typeof LeafletTypes | undefined;
```

---

## ⚠️ High Priority Fixes

### 2. Order Update Data Typing

**Problem:** `updateData` object uses `any` type
**File:** `lib/orderHelpers.ts`
**Lines:** 140, 190, 268, 464

**Current:**
```typescript
const updateData: any = {
  status: newStatus,
  updated_at: new Date().toISOString(),
};
```

**Solution:**

```typescript
// Add to types/index.ts or lib/orderHelpers.ts

interface OrderUpdateData {
  status: OrderStatus;
  updated_at: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  driver_id?: string;
  rejection_reason?: string;
}

// Apply in orderHelpers.ts
const updateData: OrderUpdateData = {
  status: newStatus,
  updated_at: new Date().toISOString(),
};
```

### 3. Auth Event Handler Types

**Problem:** Auth state change handlers use `any`
**File:** `lib/auth.ts` (line 188)

**Current:**
```typescript
onAuthStateChange(async (event: any, session: any) => {
```

**Solution:**
```typescript
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
  // Your code here
});
```

### 4. Error Handling Types

**Problem:** Catch blocks use `any` for errors
**Files:** Multiple (listed in audit report)

**Current:**
```typescript
} catch (error: any) {
  console.error('Error:', error.message);
}
```

**Solution:**
```typescript
} catch (error: unknown) {
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'An unknown error occurred';
  
  console.error('Error:', errorMessage);
  
  // For Supabase errors specifically:
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };
    // Handle Supabase error
  }
}
```

**Create a helper function:**
```typescript
// lib/errors.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

// Usage:
} catch (error: unknown) {
  const message = getErrorMessage(error);
  // Use message
}
```

**Files to update:**
- `lib/storage.ts` - 5 occurrences
- `lib/qrOtpUtils.ts` - 4 occurrences  
- `lib/orderHelpers.ts` - 4 occurrences
- `lib/auth.ts` - 6 occurrences
- `contexts/DeliveryPackagesContext.tsx` - 2 occurrences
- `components/BulkUploadModal.tsx` - 2 occurrences

### 5. User Profile Update Types

**Problem:** Update function accepts `any` parameter
**File:** `lib/auth.ts` (line 281)

**Current:**
```typescript
export async function updateUserProfile(userId: string, updates: any) {
```

**Solution:**
```typescript
interface UserProfileUpdate {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
  preferred_currency?: string;
  language?: string;
  // Add other updatable fields
}

export async function updateUserProfile(
  userId: string, 
  updates: UserProfileUpdate
): Promise<{ success: boolean; error?: string }> {
  // Implementation
}
```

---

## 📝 Medium Priority Fixes

### 6. Component Icon Props

**Problem:** Sidebar components use `any` for icon props
**Files:**
- `components/AdminSidebar.tsx` (lines 26, 31)
- `components/DriverSidebar.tsx` (line 22)
- `components/dashboard/FuturisticSidebar.tsx` (line 41)

**Current:**
```typescript
interface NavItem {
  // ... other fields
  icon: any;
}
```

**Solution:**
```typescript
import { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon; // Properly typed
  badge?: number;
  subItems?: NavItem[];
}
```

### 7. Chat Component Props

**Problem:** Chat components use `any` for callback props
**Files:**
- `components/chat/MessageBubble.tsx` (lines 27-29)
- `components/chat/MessageActions.tsx` (lines 19-21)
- `components/chat/ReplyPreview.tsx` (line 12)

**Current:**
```typescript
interface MessageBubbleProps {
  // ... other props
  onEdit?: any;
  onDelete?: any;
  onReply?: any;
}
```

**Solution:**
```typescript
interface MessageBubbleProps {
  // ... other props
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => Promise<void>;
  onReply?: (message: Message) => void;
}
```

### 8. Drag Event Handlers

**Problem:** Motion drag events use `any`
**File:** `components/FloatingChatWidget.tsx` (line 201)

**Current:**
```typescript
onDragEnd={(event: any, info: any) => {
```

**Solution:**
```typescript
import { DragHandlers, PanInfo } from 'framer-motion';

onDragEnd={(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
  // Your code
}}
```

### 9. Chart Component Props

**Problem:** Recharts tooltip props use `any`
**File:** `components/dashboard/AnalyticsCharts.tsx` (lines 69, 233, 353)

**Current:**
```typescript
const CustomTooltip = ({ active, payload }: any) => {
```

**Solution:**
```typescript
import { TooltipProps } from 'recharts';

const CustomTooltip = ({ 
  active, 
  payload 
}: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) {
    return null;
  }
  // Your code
};
```

### 10. Data Processing Types

**Problem:** Various data processing uses `any`
**Files:**
- `lib/api.ts` (lines 44, 91, 146, 268)
- `lib/exchange-rates.ts` (line 106)
- `lib/notifications.ts` (lines 13, 73)

**Solution for api.ts:**
```typescript
// Instead of:
const updates: any = { /* fields */ };

// Use:
const updates: Partial<Product> = { /* fields */ };
// or
const updates: Record<string, unknown> = { /* fields */ };
```

**Solution for notifications.ts:**
```typescript
interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string | number | boolean>;
}

interface NotificationOptions extends NotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}
```

---

## 💡 Low Priority (Acceptable Usage)

### 11. Third-Party Library Type Definitions

These are acceptable as they provide types for libraries without official TypeScript support:

**Files:**
- `types/html5-qrcode.d.ts` - QR code scanner library
- `types/leaflet-routing-machine.d.ts` - Leaflet routing plugin

**Recommendation:** Keep as-is, but add comments:

```typescript
// Note: Using 'any' for untyped third-party library
// Consider finding or creating proper type definitions
result: any
```

### 12. Context Data Structures

**Files:**
- `contexts/ChatsContext.tsx` (lines 30, 31, 49)
- `contexts/DeliveryPackagesContext.tsx` (line 91)

**Current:**
```typescript
participants: any[] | null;
metadata: any | null;
attachments: any[] | null;
```

**Solution:** Define based on actual data:

```typescript
interface ChatParticipant {
  user_id: string;
  role: 'customer' | 'vendor' | 'admin';
  joined_at: string;
  name: string;
  avatar_url?: string;
}

interface ChatMetadata {
  order_id?: string;
  product_id?: string;
  last_read_at?: string;
  [key: string]: unknown; // For extensibility
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'video';
  url: string;
  name: string;
  size: number;
  mime_type: string;
}
```

---

## 🔧 Refactoring Strategy

### Phase 1: Critical & High Priority (Week 1)
1. Create new type definition files
2. Fix error handling (easiest win)
3. Update orderHelpers.ts types
4. Fix auth event handlers
5. Add GeoJSON types

### Phase 2: Medium Priority (Week 2)
1. Update component props
2. Fix chart tooltips
3. Improve data processing types
4. Add validation types

### Phase 3: Documentation & Testing
1. Document acceptable `any` usage
2. Add ESLint rules to prevent new `any`
3. Update tsconfig.json strictness
4. Write tests for typed functions

---

## 🛠️ Tools & Configuration

### ESLint Configuration
Add to `.eslintrc.json`:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-call": "warn"
  }
}
```

### TypeScript Configuration
Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## 📊 Progress Tracking

Total `any` occurrences: ~100+

- 🚨 Critical: 20 instances
- ⚠️ High: 40 instances
- 📝 Medium: 30 instances
- 💡 Low/Acceptable: 10 instances

**Estimated effort:** 12-16 hours total

---

## ✅ Verification Checklist

After refactoring:

- [ ] Run `npm run type-check` successfully
- [ ] All tests pass
- [ ] No new TypeScript errors
- [ ] Code still compiles
- [ ] Runtime behavior unchanged
- [ ] Documentation updated
- [ ] ESLint rules enforced
- [ ] Team review completed

---

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Supabase TypeScript Guide](https://supabase.com/docs/guides/api/typescript-support)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Type-safe error handling](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript)
