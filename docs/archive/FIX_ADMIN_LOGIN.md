# 🔧 ADMIN LOGIN FIX - LANGKAH CEPAT

**Issue:** Tidak bisa masuk ke admin dashboard meski pakai akun superadmin  
**Cause:** Session lama tidak punya field `role`  
**Solution:** Logout & Login ulang untuk refresh session

---

## ✅ **SOLUSI CEPAT (5 DETIK)**

### **Langkah 1: Logout**
```
1. Klik "Keluar" di navbar
2. Atau buka: http://localhost:3000/api/auth/logout
3. Session terhapus
```

### **Langkah 2: Login Ulang**
```
Email: superadmin@iaundang.online
Password: superadmin123

Klik "Masuk"
```

### **Langkah 3: Cek Navbar**
```
Setelah login, lihat navbar:
✅ Harusnya muncul: "Admin Panel" (bukan "Dashboard")
✅ Klik "Admin Panel"
✅ Redirect ke /admin
```

---

## 🔍 **KENAPA HARUS LOGOUT?**

### **Session Lama (Sebelum Fix):**
```json
{
  "userId": "...",
  "email": "superadmin@iaundang.online"
  // TIDAK ADA role field! ❌
}
```

### **Session Baru (Setelah Login Ulang):**
```json
{
  "userId": "...",
  "email": "superadmin@iaundang.online",
  "role": "admin"  // ← Ada role! ✅
}
```

### **Code:**
```typescript
// Navbar.tsx cek:
user.role === 'admin' ? '/admin' : '/dashboard'

// Kalau session lama (no role):
undefined === 'admin' → false → /dashboard ❌

// Kalau session baru (with role):
'admin' === 'admin' → true → /admin ✅
```

---

## 💻 **TECHNICAL DETAILS**

### **API Endpoint Sudah Benar:**

**File:** `app/api/auth/me/route.ts`

```typescript
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      role: session.role ?? (isAdmin(session) ? 'admin' : 'user'),  // ← Returns role!
      isAdmin: isAdmin(session),
    },
  })
}
```

### **Login Endpoint Sets Role:**

**File:** `app/api/auth/login/route.ts`

```typescript
// When creating session:
const payload: SessionPayload = {
  userId: user.id,
  email: user.email,
  role: user.role,  // ← Sets role in session
}

await createSession(payload)
```

### **Navbar Checks Role:**

**File:** `components/ui/Navbar.tsx`

```typescript
const [user, setUser] = useState<{ 
  email: string; 
  role?: string  // ← Checks this
} | null>(null)

// Fetch user:
useEffect(() => {
  fetch('/api/auth/me')
    .then((r) => r.json())
    .then(({ user }) => { 
      setUser(user ?? null)  // ← Gets role from API
    })
}, [])

// Redirect logic:
<Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
  {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
</Link>
```

---

## 🧪 **VERIFICATION**

### **Check 1: API Response**
```bash
# Open browser console (F12)
fetch('/api/auth/me')
  .then(r => r.json())
  .then(d => console.log(d))

# Expected BEFORE logout:
{
  user: {
    email: "superadmin@iaundang.online",
    role: undefined  // ← No role! ❌
  }
}

# Expected AFTER fresh login:
{
  user: {
    email: "superadmin@iaundang.online",
    role: "admin"  // ← Has role! ✅
  }
}
```

### **Check 2: Navbar Text**
```
BEFORE logout:
Navbar shows: "Dashboard" ❌

AFTER fresh login:
Navbar shows: "Admin Panel" ✅
```

### **Check 3: Redirect**
```
Click navbar button:

BEFORE:
Click "Dashboard" → /dashboard (user page) ❌

AFTER:
Click "Admin Panel" → /admin (admin page) ✅
```

---

## 🚨 **IF STILL NOT WORKING**

### **Option 1: Clear Browser Cookies**
```bash
1. F12 → Application tab
2. Cookies → http://localhost:3000
3. Delete "session" cookie
4. Refresh page
5. Login again
```

### **Option 2: Clear All Storage**
```bash
Chrome/Edge:
1. F12 → Application tab
2. Clear storage → Clear site data
3. Refresh page
4. Login again
```

### **Option 3: Incognito Mode**
```bash
1. Open incognito/private window
2. Go to http://localhost:3000
3. Login with superadmin credentials
4. Should work immediately ✅
```

---

## 📊 **EXPECTED FLOW**

### **Admin Login Flow:**
```
1. Open /login
2. Enter superadmin@iaundang.online / superadmin123
3. Click "Masuk"
4. API creates session with role: "admin"
5. Redirect to /dashboard (atau langsung /admin)
6. Navbar fetches /api/auth/me
7. Gets user.role = "admin"
8. Shows "Admin Panel" button
9. Click → Redirect to /admin ✅
```

### **User Login Flow:**
```
1. Open /login
2. Enter user email/password
3. Click "Masuk"
4. API creates session with role: "user"
5. Redirect to /dashboard
6. Navbar fetches /api/auth/me
7. Gets user.role = "user"
8. Shows "Dashboard" button
9. Click → Redirect to /dashboard ✅
```

---

## ✅ **CHECKLIST**

```
☐ Logout dari current session
☐ Login ulang dengan superadmin credentials
☐ Lihat navbar → "Admin Panel" muncul
☐ Klik "Admin Panel"
☐ Redirect ke /admin
☐ Admin panel terbuka
☐ ✅ SUCCESS!
```

---

## 📝 **SUMMARY**

```
ISSUE:
Admin tidak bisa masuk dashboard admin

ROOT CAUSE:
Session lama tidak punya field role
Navbar check role tapi role = undefined

SOLUTION:
1. Logout
2. Login ulang
3. Session baru akan punya role field
4. Navbar akan detect role = 'admin'
5. Redirect ke /admin ✅

WHY THIS WORKS:
- Login creates new session with role
- Old session had no role (created before fix)
- New session has role (created after fix)
- Navbar can now properly detect admin

RESULT:
✅ Admin → /admin
✅ User → /dashboard
✅ Role-based navigation working!
```

---

**LOGOUT & LOGIN ULANG!** 🔄  
**SESSION AKAN REFRESH!** ✅  
**ROLE AKAN TERDETEKSI!** 🎯  
**ADMIN DASHBOARD ACCESSIBLE!** 🚀

**QUICK FIX: Logout → Login → Done!** ⚡
