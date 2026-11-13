---
name: anti-slop-ui
description: Enforces clean, purposeful, high-density UI design without AI slop, decorative noise, or unnecessary DOM nesting. Use when creating, styling, or refactoring frontend interfaces, components, forms, layouts, or pages (React, Next.js, Tailwind CSS, HTML/CSS), or whenever the user asks for clean UI, minimal UI, or invokes anti-slop.
---

# Anti-Slop UI

Build clean, production-grade, high-density user interfaces. Eliminate generic AI aesthetic clichés ("AI slop"): unnecessary container nesting, gratuitous gradients, placeholder metrics, decorative icon proliferation, and redundant explanatory copy. Every pixel, element, and layout choice must serve a real user goal.

---

## 1. Strictly Banned Patterns (AI Slop)

1. **No Gratuitous Gradients & Glowing Halos:**
   - Do NOT add `bg-gradient-to-r from-purple-500 to-indigo-600`, glowing borders (`shadow-[0_0_..._#8b5cf6]`), arbitrary backdrop blurs (`backdrop-blur-md`), or translucent floating glassmorphism cards unless explicitly requested.
   - Use solid surfaces, subtle borders (`border-border` or `border-zinc-200/800`), and clean contrast.

2. **No Decorative Icon Proliferation:**
   - Do NOT stick an icon next to every single bullet point, list item, table header, or card title.
   - Icons must serve an explicit functional purpose: navigation, interactive controls, or distinct state indicators (e.g., error/warning/success).

3. **No Redundant Subtitles & Explanatory Fluff:**
   - Ban meaningless subtitles that echo the heading (e.g., Header: `"Projects"`, Subtitle: `"View and manage all your projects here"`).
   - If the heading is clear, omit the subtitle. Put content directly where the user expects it.

4. **No Synthetic Noise & Fake Polish:**
   - Do NOT generate fake metric badges (`+14.2% from last week`), placeholder charts, dummy sparklines, or unrequested dynamic stats unless the feature specification requires them.
   - Avoid decorative pill tags (`"Active"`, `"Pro"`, `"Trending"`) attached arbitrarily to headings or cards.

5. **No DOM Nesting Abuse (Div Soup):**
   - Do NOT wrap single elements in nested `<div>` tags just to apply margins or flex wrappers.
   - Keep the DOM tree flat and semantic (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<table>`, `<form>`).

6. **No Reinventing Standard Controls:**
   - Do NOT build custom dropdowns, dialogs, tooltips, or popovers using unstyled `<div>`s and raw state if standard accessible primitives (such as Radix UI, Headless UI, shadcn/ui, or native HTML elements) are available.

---

## 2. Core UI Guidelines

### Density & Scannability
- **High Information Density:** Prefer compact tables, data grids, and structured key-value lists over sparse, giant floating cards.
- **Scannable Layouts:** Use monospaced fonts for IDs, hashes, timestamps, and numbers where tabular alignment aids comparison.
- **Compact Padding:** Avoid excessive whitespace (`p-10` or `p-12` on everyday cards). Default to crisp, proportional padding (`p-3` to `p-6`).

### Typography & Hierarchy
- **Single Dominant Element:** Establish one clear visual focal point per screen or card.
- **Crisp Weight Contrast:** Differentiate hierarchy using font weight (`font-medium`, `font-semibold`) and neutral tone contrast (`text-foreground` vs `text-muted-foreground`), not random font size jumps.
- **Tight Headings:** Use tracking adjustments (`tracking-tight`) for display headers to keep typography cohesive.

### Colors & Surfaces
- **Systematic Palette:** Stick to a cohesive semantic theme (background, surface, muted, accent, destructive).
- **Subtle Borders:** Prefer 1px hairline borders (`border-zinc-200 dark:border-zinc-800`) over heavy drop shadows.
- **States:** Interactive elements must have clear, predictable hover, focus-visible, and active states.

### Actions & Forms
- **One Primary Action:** Each screen or section should have at most one primary button. Secondary actions use outline or ghost variants.
- **Destructive Isolation:** Separate destructive actions (delete, revoke) visually from standard workflows.
- **Form Labels:** Keep labels concise and associated directly with inputs. Don't use placeholders as replacements for visible labels.

---

## 3. Concrete Examples: Slop vs. Anti-Slop

### Example 1: Metrics / Status Card

❌ **AI Slop:**
```tsx
// Nested containers, gratuitous gradient, redundant subtitle, fake trend badge, decorative icon
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-6 shadow-xl border border-indigo-500/20 backdrop-blur-xl">
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
        <Database className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">Database Usage</h3>
        <p className="text-xs text-zinc-400">Current database storage consumption</p>
      </div>
    </div>
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
      <TrendingUp className="w-3 h-3" /> +12%
    </span>
  </div>
  <div className="mt-4">
    <span className="text-3xl font-extrabold text-white">42.8 GB</span>
    <span className="text-sm text-zinc-400 ml-2">of 100 GB</span>
  </div>
</div>
```

✅ **Anti-Slop:**
```tsx
// Clean, flat, scannable, functional
<div className="rounded-lg border border-border bg-card p-4">
  <div className="flex items-center justify-between text-sm text-muted-foreground">
    <span>Storage</span>
    <span className="font-mono text-xs">42.8%</span>
  </div>
  <div className="mt-2 text-2xl font-semibold tracking-tight">
    42.8 GB <span className="text-sm font-normal text-muted-foreground">/ 100 GB</span>
  </div>
  <div className="mt-3 h-1.5 w-full rounded-full bg-secondary">
    <div className="h-1.5 rounded-full bg-primary" style={{ width: "42.8%" }} />
  </div>
</div>
```

---

### Example 2: List / Table Item

❌ **AI Slop:**
```tsx
// Div soup, floating card per item, decorative icons on every field, redundant labels
<div className="flex flex-col gap-3">
  {users.map(user => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white">
          <UserIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-zinc-900">{user.name}</div>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Mail className="w-3 h-3" /> {user.email}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Active</span>
        <button className="p-2 hover:bg-zinc-100 rounded-lg"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
      </div>
    </div>
  ))}
</div>
```

✅ **Anti-Slop:**
```tsx
// Clean tabular layout, high scannability, no decorative icon clutter
<table className="w-full text-left text-sm">
  <thead className="border-b border-border text-xs text-muted-foreground">
    <tr>
      <th className="py-2 font-medium">Name</th>
      <th className="py-2 font-medium">Email</th>
      <th className="py-2 font-medium">Status</th>
      <th className="py-2 text-right font-medium">Actions</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-border">
    {users.map(user => (
      <tr key={user.id} className="hover:bg-muted/50">
        <td className="py-2.5 font-medium">{user.name}</td>
        <td className="py-2.5 font-mono text-xs text-muted-foreground">{user.email}</td>
        <td className="py-2.5">
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </td>
        <td className="py-2.5 text-right">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/users/${user.id}`}>Edit</Link>
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 4. Pre-Send Quality Checklist

Before finalizing any UI code, verify against these questions:
1. **Can I remove 20-30% of the DOM nodes** without changing visual or functional behavior?
2. **Did I add any gradient, glow, or glass blur** that wasn't requested? (If yes, replace with solid/border).
3. **Does every icon perform a clear task?** (If decorative only, remove it).
4. **Is there any redundant subtitle text?** (If it merely repeats the header, delete it).
5. **Are fonts, borders, and margins consistent and compact?**
6. **Are form fields using accessible, standard controls and semantic labels?**
