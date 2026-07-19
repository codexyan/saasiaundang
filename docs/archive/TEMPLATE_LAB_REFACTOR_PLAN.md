# 🔧 TEMPLATE LAB REFACTOR - COMPLETE PLAN

**Date:** 2026-06-07  
**Status:** In Progress  
**Task:** Simplify Identity + Separate Loading Tab

---

## 📋 **USER REQUEST:**

```
1. Hapus kategori & tipografi dari Identity ✅ DONE
2. Hapus slug field (auto dari title) ⏳ IN PROGRESS  
3. Pisahkan Loading dari Opening ⏳ IN PROGRESS
4. Tab baru: Identitas | Warna | Opening | Loading | Sections | JSON
```

---

## ✅ **COMPLETED (Commit 037108e):**

1. **Kategori & Tipografi Removed:**
   - Info cards deleted from Identity tab
   - Old CRUD code hidden with `className="hidden"`

2. **ConfigTab Type Updated:**
   - Added 'loading' to type definition
   - Type now: `'identity' | 'colors' | 'opening' | 'loading' | 'sections' | 'json'`

---

## ⏳ **REMAINING TASKS:**

### **Task 1: Add Loader2 Import**

**File:** `components/admin/tabs/TemplateLab.tsx`  
**Line:** 5-9

**Current:**
```typescript
import {
  FlaskConical, Save, RefreshCw, Maximize2,
  ChevronUp, ChevronDown, Eye, EyeOff, Palette, Type,
  LayoutTemplate, Code2, Sparkles, Plus, Trash2, Rocket, X, GripVertical, Play, Check,
} from 'lucide-react'
```

**Change To:**
```typescript
import {
  FlaskConical, Save, RefreshCw, Maximize2,
  ChevronUp, ChevronDown, Eye, EyeOff, Palette, Type,
  LayoutTemplate, Code2, Sparkles, Loader2, Plus, Trash2, Rocket, X, GripVertical, Play, Check,
} from 'lucide-react'
```

---

### **Task 2: Update Tab Navigation**

**File:** `components/admin/tabs/TemplateLab.tsx`  
**Line:** ~752-758

**Current:**
```typescript
{([
  ['identity', LayoutTemplate, 'Identitas'],
  ['colors',   Palette,        'Warna'],
  ['opening',  Sparkles,       'Opening'],
  ['sections', Type,           'Sections'],
  ['json',     Code2,          'JSON'],
] as [ConfigTab, React.ElementType, string][]).map(([id, Icon, label]) => (
```

**Change To:**
```typescript
{([
  ['identity', LayoutTemplate, 'Identitas'],
  ['colors',   Palette,        'Warna'],
  ['opening',  Sparkles,       'Opening'],
  ['loading',  Loader2,        'Loading'],
  ['sections', Type,           'Sections'],
  ['json',     Code2,          'JSON'],
] as [ConfigTab, React.ElementType, string][]).map(([id, Icon, label]) => (
```

---

### **Task 3: Remove Slug Field from Identity**

**File:** `components/admin/tabs/TemplateLab.tsx`  
**Line:** ~815-832

**Find and REMOVE:**
```typescript
<Field label="Slug (ID Unik)">
  <div className="flex gap-1.5">
    <input
      value={config.slug}
      onChange={e => setConfig(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
      className={inputCls + ' flex-1 font-mono text-xs'}
      placeholder="contoh: jawa-emas-modern"
    />
    <button
      onClick={() => setConfig(prev => ({ ...prev, slug: prev.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
      className="px-2.5 py-2 text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-600 shrink-0"
      title="Generate dari nama"
    >
      Auto
    </button>
  </div>
  <p className="text-[9px] text-gray-400 mt-1">Huruf kecil + strip. Dipakai sebagai ID unik template.</p>
</Field>
```

**Find the Nama Template field and UPDATE to auto-generate slug:**

**Current Nama Template field** (around line 745-753):
```typescript
<div className="flex items-center gap-2 mb-3">
  <FlaskConical className="w-5 h-5 text-indigo-600" />
  <h2 className="font-bold text-gray-900">Template Lab</h2>
  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold ml-1">BETA</span>
</div>
<input
  value={config.name}
  onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))}
  className="w-full px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
  placeholder="Nama template..."
/>
```

**Change To:**
```typescript
<div className="flex items-center gap-2 mb-3">
  <FlaskConical className="w-5 h-5 text-indigo-600" />
  <h2 className="font-bold text-gray-900">Template Lab</h2>
  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold ml-1">BETA</span>
</div>
<input
  value={config.name}
  onChange={e => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setConfig(prev => ({ ...prev, name, slug }))
  }}
  className="w-full px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
  placeholder="Nama template..."
/>
<p className="text-[9px] text-gray-400 mt-1">
  Slug otomatis: <span className="font-mono font-semibold text-indigo-600">{config.slug || 'template-baru'}</span>
</p>
```

---

### **Task 4: Create New Loading Tab**

**File:** `components/admin/tabs/TemplateLab.tsx`  
**Location:** After Opening tab, before Sections tab (around line 1498)

**Add This Code:**
```typescript
{/* ── Loading ── */}
{activeTab === 'loading' && (
  <div className="space-y-5">
    <p className="text-xs text-gray-500">
      Konfigurasi loading screen untuk preview admin. Loading screen TIDAK muncul di undangan live.
    </p>

    {/* Info box */}
    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
      <div className="flex items-start gap-3">
        <div className="text-2xl">ℹ️</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900 mb-1">
            Preview Admin Saja
          </p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Loading screen TIDAK muncul di undangan live (langsung masuk). 
            Setting ini hanya untuk preview di mockup admin saat klik tab "Loading".
          </p>
        </div>
      </div>
    </div>

    {/* Teks Loading */}
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        Teks Loading
      </label>
      <input
        value={cfg.loading.text}
        onChange={e => setConfig(prev => ({
          ...prev,
          config: { ...prev.config, loading: { ...prev.config.loading, text: e.target.value } },
        }))}
        className={inputCls}
        placeholder="MEMBUKA UNDANGAN..."
      />
    </div>

    {/* Warna Background */}
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        Warna Background Loading
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={cfg.loading.background_color}
          onChange={e => setConfig(prev => ({
            ...prev,
            config: { ...prev.config, loading: { ...prev.config.loading, background_color: e.target.value } },
          }))}
          className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200"
        />
        <input
          value={cfg.loading.background_color}
          onChange={e => setConfig(prev => ({
            ...prev,
            config: { ...prev.config, loading: { ...prev.config.loading, background_color: e.target.value } },
          }))}
          className={inputCls + ' font-mono flex-1'}
          placeholder="#2c4a34"
        />
      </div>
    </div>

    {/* Preview Button */}
    <div>
      <button
        onClick={() => setPreviewMode('loading')}
        className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-2.5 transition-colors"
      >
        <Play className="w-4 h-4 fill-current" /> Preview Loading di Mockup
      </button>
      <p className="text-[9px] text-gray-400 mt-2">
        Klik untuk melihat loading screen di mockup preview (kanan).
      </p>
    </div>
  </div>
)}
```

---

### **Task 5: Remove Loading Settings from Opening Tab**

**File:** `components/admin/tabs/TemplateLab.tsx`  
**Line:** ~1421-1473

**Find and REMOVE this entire section:**
```typescript
{/* ── Loading Screen Settings ── */}
<div className="pt-4 border-t border-gray-100">
  <div className="flex items-center justify-between mb-3">
    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
      Loading Screen
    </p>
    <button
      onClick={() => setPreviewMode('loading')}
      className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2 py-1 transition-colors"
    >
      <Play className="w-2.5 h-2.5 fill-current" /> Preview
    </button>
  </div>
  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-3">
    <p className="text-[9px] text-blue-700 leading-relaxed">
      <strong>Info:</strong> Loading screen TIDAK muncul di undangan live (langsung masuk).
      Setting ini hanya untuk preview di mockup admin.
    </p>
  </div>
  <div className="space-y-4">
    <Field label="Teks Loading">
      <input
        value={cfg.loading.text}
        onChange={e => setConfig(prev => ({
          ...prev,
          config: { ...prev.config, loading: { ...prev.config.loading, text: e.target.value } },
        }))}
        className={inputCls}
      />
    </Field>
    <Field label="Warna Background Loading">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={cfg.loading.background_color}
          onChange={e => setConfig(prev => ({
            ...prev,
            config: { ...prev.config, loading: { ...prev.config.loading, background_color: e.target.value } },
          }))}
          className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200"
        />
        <input
          value={cfg.loading.background_color}
          onChange={e => setConfig(prev => ({
            ...prev,
            config: { ...prev.config, loading: { ...prev.config.loading, background_color: e.target.value } },
          }))}
          className={inputCls + ' font-mono flex-1'}
        />
      </div>
    </Field>
  </div>
</div>
```

**This section starts around line 1421 and ends around line 1473.**

---

### **Task 6: Update useEffect for Tab Switching**

**File:** `components/admin/tabs/TemplateLab.tsx`  
**Line:** ~495-498

**Current:**
```typescript
useEffect(() => {
  if (activeTab === 'opening') setPreviewMode('cover')
  else if (activeTab !== 'json') setPreviewMode('invitation')
}, [activeTab])
```

**Change To:**
```typescript
useEffect(() => {
  if (activeTab === 'opening') setPreviewMode('cover')
  else if (activeTab === 'loading') setPreviewMode('loading')
  else if (activeTab !== 'json') setPreviewMode('invitation')
}, [activeTab])
```

---

## 📊 **EXPECTED RESULT:**

### **Identity Tab (Simplified):**
```
┌────────────────────────────┐
│ Template Lab BETA          │
│ [Nama template...]         │
│ Slug otomatis: javanese-gold
│                            │
│ 💡 Cara Kerja Template Lab │
│ [collapsible guide]        │
│                            │
│ Eksperimen Tersimpan       │
│ [saved experiments list]   │
└────────────────────────────┘

REMOVED:
❌ Kategori Template info
❌ Tipografi info  
❌ Slug input field
```

### **New Loading Tab:**
```
┌────────────────────────────┐
│ Loading                    │
├────────────────────────────┤
│ ℹ️ Preview Admin Saja      │
│ Loading TIDAK muncul di    │
│ undangan live.             │
│                            │
│ Teks Loading:              │
│ [MEMBUKA UNDANGAN...]      │
│                            │
│ Warna Background:          │
│ [🎨] #2c4a34               │
│                            │
│ [▶ Preview Loading]        │
└────────────────────────────┘
```

### **Opening Tab (Cleaned):**
```
┌────────────────────────────┐
│ Opening                    │
├────────────────────────────┤
│ Konten Opening             │
│ (settings without loading) │
│                            │
│ Musik Latar                │
│ Putar Musik Otomatis [ON]  │
│                            │
│ Cover Settings             │
│ Foto Pasangan Settings     │
│ Decoration Assets          │
└────────────────────────────┘

REMOVED:
❌ Loading Screen Settings
```

### **Tab Structure:**
```
[Identitas] [Warna] [Opening] [Loading] [Sections] [JSON]
    ✅        ✅        ✅        ✅NEW      ✅         ✅
```

---

## ✅ **VERIFICATION CHECKLIST:**

```
After completing all tasks:

☐ Loader2 imported from lucide-react
☐ Tab navigation shows: Identitas | Warna | Opening | Loading | Sections | JSON
☐ Identity tab: No kategori, no tipografi, no slug field
☐ Identity tab: Slug auto-generates from name
☐ Identity tab: Shows slug in small text below name
☐ Loading tab: exists and clickable
☐ Loading tab: Shows loading settings
☐ Loading tab: Has info box about preview-only
☐ Loading tab: Has preview button
☐ Opening tab: NO loading settings
☐ Opening tab: Only opening & music settings
☐ Build successful (npm run build)
☐ No TypeScript errors
☐ All tabs functional
```

---

## 🚀 **EXECUTION ORDER:**

```
1. Task 1: Add Loader2 import
2. Task 2: Update tab navigation
3. Task 3: Remove slug field + add auto-generation
4. Task 6: Update useEffect
5. Task 4: Create Loading tab
6. Task 5: Remove loading from Opening
7. Test build
8. Commit & push
```

---

**GOOD LUCK! 🎯**

File to edit: `components/admin/tabs/TemplateLab.tsx`  
Tasks: 6 targeted edits  
Result: Clean Identity + Separate Loading tab
