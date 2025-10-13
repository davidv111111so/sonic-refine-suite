# Admin Access Control Implementation Guide

## Overview
The Spectrum application implements secure, role-based access control to manage premium features. Admins and authorized collaborators receive full, unrestricted access to all features, including the premium "AI Audio Mastering" tab.

## Security Architecture

### 1. Database-Level Role Management
Roles are stored in a separate `user_roles` table to prevent privilege escalation attacks:

```sql
-- Enum for roles
create type public.app_role as enum ('admin', 'moderator', 'user');

-- User roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);
```

### 2. Security Definer Function
A PostgreSQL function checks roles without triggering recursive RLS policies:

```sql
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;
```

### 3. Client-Side Access Control Hook
The `useUserSubscription` hook manages access control in React:

```typescript
// Location: src/hooks/useUserSubscription.ts
export const useUserSubscription = (): UserSubscriptionData => {
  const [subscription, setSubscription] = useState<SubscriptionTier>('free');
  const [role, setRole] = useState<UserRole | null>(null);
  
  // Fetches user profile and role from Supabase
  // Returns: { subscription, role, isAdmin, isPremium, loading }
  
  return {
    subscription,
    role,
    isAdmin: role === 'admin',
    isPremium: subscription === 'premium' || role === 'admin', // Admins bypass premium
    loading,
  };
};
```

## Granting Admin Access

### Method 1: Direct Database Insert (Recommended for Initial Setup)
```sql
-- Insert admin role for specific email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'davidv111111@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Method 2: Admin Dashboard (Future Implementation)
Create an admin interface that allows existing admins to grant roles to other users.

## Access Control Implementation in Components

### Example: Premium Feature Guard
```typescript
import { useUserSubscription } from '@/hooks/useUserSubscription';

const PremiumFeature = () => {
  const { isPremium, isAdmin, loading } = useUserSubscription();

  if (loading) return <LoadingSpinner />;
  
  if (!isPremium) {
    return <PremiumUpgradePrompt />;
  }

  return <FeatureContent />;
};
```

### AI Mastering Tab Implementation
```typescript
// Location: src/components/ai-mastering/AIMasteringTab.tsx
const AIMasteringTab = () => {
  const { isPremium, isAdmin } = useUserSubscription();

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <CardTitle>Premium Feature</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p>AI Audio Mastering is a premium feature.</p>
          {isAdmin && <Badge>Admin Access Granted</Badge>}
        </CardContent>
      </Card>
    );
  }

  return <MasteringInterface />;
};
```

## Authorized Users

### Current Admin Users:
- **davidv111111@gmail.com** - Primary admin with full access

### Adding Collaborators:
To grant admin or premium access to project collaborators:

```sql
-- Grant admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'collaborator@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- OR grant premium subscription
UPDATE public.profiles
SET subscription = 'premium'
WHERE email = 'collaborator@example.com';
```

## Security Best Practices

### ✅ DO:
- Store roles in a separate `user_roles` table
- Use server-side validation (RLS policies + Security Definer functions)
- Check authentication status with `supabase.auth.getSession()`
- Validate on both client and server sides
- Use the `useUserSubscription` hook for consistent access checks

### ❌ DON'T:
- Store roles in localStorage or sessionStorage
- Hardcode admin emails in client code
- Rely solely on client-side checks
- Store roles on the profiles table (privilege escalation risk)
- Use `auth.uid()` directly in RLS policies for role checks

## Row-Level Security Policies

Example RLS policy for premium content:

```sql
-- Only admins and premium users can access premium content
CREATE POLICY "Premium users can access"
ON public.premium_content
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND subscription = 'premium'
  )
);
```

## Testing Access Control

### Test Cases:
1. **Unauthorized User**: Should see upgrade prompts
2. **Premium Subscriber**: Should access premium features
3. **Admin User**: Should bypass all premium restrictions
4. **Logged Out User**: Should see login prompt

### Manual Testing:
```typescript
// In browser console
const { data: { session } } = await supabase.auth.getSession();
console.log('User:', session?.user?.email);

const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', session?.user?.id);
console.log('Roles:', roles);
```

## Troubleshooting

### Issue: Admin not seeing premium features
**Solutions:**
1. Verify role in database:
   ```sql
   SELECT u.email, ur.role 
   FROM auth.users u
   LEFT JOIN user_roles ur ON u.id = ur.user_id
   WHERE u.email = 'davidv111111@gmail.com';
   ```
2. Clear browser cache and refresh
3. Check authentication state in developer tools
4. Verify RLS policies are enabled

### Issue: Privilege escalation vulnerability
**Prevention:**
- Never store roles on `profiles` table where users can edit
- Always use separate `user_roles` table
- Implement proper RLS policies
- Use Security Definer functions for role checks

## Monitoring & Auditing

Consider implementing:
- Access logs for premium features
- Role change audit trail
- Failed access attempt logging
- Periodic security audits

## Future Enhancements

1. **Role Hierarchy**: Implement moderator role with limited admin privileges
2. **Temporary Access**: Grant time-limited premium access
3. **Team Management**: Allow admins to manage team members
4. **Usage Analytics**: Track premium feature usage by role
5. **Automated Testing**: Add integration tests for access control

---

**Last Updated**: 2025-10-13  
**Maintained By**: Spectrum Development Team
