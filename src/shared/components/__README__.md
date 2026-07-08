# Shared Components — Design System

> Reusable, accessible, typed UI primitives. Every component ships with a unit test, an axe-core a11y audit, and this README documents usage.

---

## Index

| Component | Description |
|-----------|-------------|
| [Avatar](#avatar) | Image with initials fallback |
| [Badge](#badge) | Numeric, dot, or text status indicator |
| [Button](#button) | Variants, sizes, icon slot, loading state |
| [Checkbox](#checkbox) | Accessible styled checkbox |
| [ConfirmDialog](#confirmdialog) | Modal confirmation dialog |
| [DataTable](#datatable) | Sortable table with sticky header |
| [Drawer](#drawer) | Slide-in panel with focus trap |
| [EmptyState](#emptystate) | Icon + heading + description + optional CTA |
| [ErrorBoundary](#errorboundary) | Catches render errors, shows fallback |
| [ErrorDisplay](#errordisplay) | Error message display with retry |
| [Input](#input) | Label, error, helper text, prefix/suffix |
| [Modal](#modal) | Dialog with focus trap + Esc to close |
| [OptimizedImage](#optimizedimage) | Responsive `<picture>` with AVIF/WebP |
| [Pagination](#pagination) | Prev/next + page numbers + aria-current |
| [Radio](#radio) | Accessible styled radio button |
| [Select](#select) | Native `<select>` with consistent styling |
| [Skeleton](#skeleton) | Placeholder shimmer loading state |
| [Spinner](#spinner) | SVG loading indicator |
| [Table](#table) | See [DataTable](#datatable) |
| [Tabs](#tabs) | ARIA tablist + keyboard navigation |
| [Toast / ToastRegion](#toast--toastregion) | Stacked notifications with aria-live |
| [Tooltip](#tooltip) | Hover/focus tooltip with delay |
| [VirtualizedDataTable](#virtualizeddatatable) | Virtualized table for > 50 rows |

---

## Component conventions

All components follow these rules:

1. **Functional components + hooks** — no class components
2. **Explicit props interface** — exported and documented
3. **Forward refs** — via `React.forwardRef` where the underlying DOM element matters
4. **Semantic HTML first** — ARIA only when no native element exists
5. **CSS Modules** — scoped styles via `*.module.css`
6. **Test coverage** — render, interaction, edge cases, a11y

---

## Usage patterns

### Basic import

```tsx
import { Button, Input, Modal } from '@/shared/components';
```

### Controlled component

```tsx
const [value, setValue] = useState('');
<Input
  label="Email"
  type="email"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={validationError}
/>
```

### With form libraries

Components integrate with React Hook Form via standard ref forwarding:

```tsx
import { useForm } from 'react-hook-form';
import { Input } from '@/shared/components';

const { register } = useForm<{ email: string }>();
<Input label="Email" {...register('email')} />
```

---

## Component API

### Avatar

```tsx
<Avatar
  src="https://example.com/avatar.jpg"
  alt="User Name"
  size="md"        // 'sm' | 'md' | 'lg' | number
  fallback="UN"    // initials fallback (2 chars)
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Image URL |
| `alt` | `string` | `'Avatar'` | Alt text |
| `size` | `'sm' \| 'md' \| 'lg' \| number` | `'md'` | Size preset or px |
| `fallback` | `string` | — | Initials (first 2 chars) |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Image loading strategy |

---

### Badge

```tsx
<Badge variant="success">Active</Badge>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Color variant |
| `size` | `'sm' \| 'md'` | `'md'` | Size |
| `dot` | `boolean` | `false` | Dot-only mode (no text) |

---

### Button

```tsx
<Button
  variant="primary"     // 'primary' | 'secondary' | 'ghost' | 'danger'
  size="md"             // 'sm' | 'md' | 'lg'
  loading={isLoading}   // shows spinner, disables
  fullWidth             // 100% width
  icon={<Icon />}       // leading icon
  onClick={handleClick}
>
  Save
</Button>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size |
| `loading` | `boolean` | `false` | Shows spinner, sets `aria-disabled` |
| `disabled` | `boolean` | `false` | Disabled state |
| `fullWidth` | `boolean` | `false` | 100% width |
| `icon` | `ReactNode` | — | Leading icon element |

---

### Checkbox

```tsx
<Checkbox
  label="Accept terms"
  checked={accepted}
  onChange={setAccepted}
  error={errorMessage}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Visible label |
| `checked` | `boolean` | — | Controlled checked state |
| `onChange` | `(checked: boolean) => void` | — | Change handler |
| `error` | `string` | — | Validation error message |

---

### DataTable

```tsx
<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status' },
  ]}
  data={items}
  sortKey={sortKey}
  sortDir={sortDir}
  onSort={handleSort}
  emptyMessage="No items found."
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Column[]` | — | Column definitions |
| `data` | `T[]` | — | Row data |
| `sortKey` | `string` | — | Currently sorted column key |
| `sortDir` | `'asc' \| 'desc'` | — | Sort direction |
| `onSort` | `(key: string) => void` | — | Sort handler |
| `emptyMessage` | `string` | — | Message when data is empty |

---

### Modal

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Confirm Delete"
  ariaLabel="Delete confirmation dialog"
>
  <p>Are you sure?</p>
  <Button onClick={handleDelete}>Delete</Button>
</Modal>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Show/hide |
| `onClose` | `() => void` | — | Close handler (Esc, backdrop, X) |
| `title` | `string` | — | Dialog title |
| `ariaLabel` | `string` | — | Screen reader label (if no title) |

Accessibility: focus trap, Esc to close, returns focus to trigger, `aria-modal="true"`.

---

### Toast / ToastRegion

```tsx
<ToastRegion>
  <Toast
    variant="success"   // 'success' | 'error' | 'warning' | 'info'
    message="Saved!"
    onDismiss={handleDismiss}
  />
</ToastRegion>
```

Toasts are managed via Redux `uiSlice`. Dispatch `addToast`:

```tsx
import { uiActions } from '@/store/uiSlice';
dispatch(uiActions.addToast({ variant: 'success', message: 'Saved!' }));
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `ToastVariant` | — | Visual type |
| `message` | `string` | — | Toast text |
| `onDismiss` | `() => void` | — | Dismiss handler |

Accessibility: `role="status"`, `aria-live="polite"`, auto-dismiss with pause on hover.

---

## Accessibility

All components target **WCAG 2.2 AA** minimum:

- Semantic HTML (native `<button>`, `<input>`, `<table>`, `<nav>`, etc.)
- Visible focus indicators (never `outline: none` globally)
- Keyboard navigation (Tab, Enter/Space, Arrow keys, Escape)
- ARIA attributes where native elements don't exist
- Color contrast ≥ 4.5:1 text / 3:1 UI
- `prefers-reduced-motion` respected

Each component has an `*.axe.test.tsx` file that runs axe-core on every variant.

---

## Adding a new component

1. Create `ComponentName.tsx` + `ComponentName.module.css`
2. Create `ComponentName.test.tsx` (render, interaction, edge cases)
3. Create `ComponentName.axe.test.tsx` (a11y audit)
4. Export from `src/shared/components/index.ts`
5. Add entry to this README
