/**
 * Tabs — accessible tab interface with keyboard navigation.
 *
 * Compound component: `<Tabs>` wraps `<Tabs.Tab>` triggers and `<Tabs.Panel>` panels.
 * Tabs and panels are matched by their declaration order (first Tab → first Panel).
 *
 * Supports controlled mode (`index` + `onChange`) and uncontrolled mode (`defaultIndex`).
 *
 * @example
 *   <Tabs label="Project views" defaultIndex={0} onChange={(i) => log(i)}>
 *     <Tabs.Tab label="Details" />
 *     <Tabs.Tab label="Activity" disabled />
 *     <Tabs.Panel>Content for Details</Tabs.Panel>
 *     <Tabs.Panel>Content for Activity</Tabs.Panel>
 *   </Tabs>
 *
 * Accessibility:
 *  - `role="tablist"` on container, `role="tab"` on each trigger,
 *    `role="tabpanel"` on each panel
 *  - `aria-selected`, `aria-controls`, `aria-labelledby` all wired via `useId`
 *  - Arrow key navigation (Left/Right/Home/End) per WAI-ARIA tabs pattern
 *  - Only active tab in tab order (`tabIndex={0}`), others are `tabIndex={-1}`
 *  - Disabled tab: `aria-disabled="true"`, not focusable by arrow keys
 */
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import styles from './Tabs.module.css';

// ── Subcomponent types ──────────────────────────────────────────────

export interface TabProps {
  readonly label: string;
  readonly disabled?: boolean;
  /** @internal Injected by Tabs parent */
  readonly isSelected?: boolean;
  /** @internal Injected by Tabs parent */
  readonly onActivate?: () => void;
  /** @internal Injected by Tabs parent */
  readonly id?: string;
  /** @internal Injected by Tabs parent */
  readonly panelId?: string;
  /** @internal Injected by Tabs parent */
  readonly tabIndex?: number;
}

export interface PanelProps {
  readonly children: ReactNode;
  /** @internal Injected by Tabs parent */
  readonly isActive?: boolean;
  /** @internal Injected by Tabs parent */
  readonly id?: string;
  /** @internal Injected by Tabs parent */
  readonly tabId?: string;
}

// ── Subcomponents ───────────────────────────────────────────────────

/**
 * Tab trigger element. Injected props are provided by the parent `<Tabs>`.
 * Consumers pass only `label` and optional `disabled`.
 */
export function Tab({
  label,
  disabled = false,
  isSelected = false,
  onActivate,
  id,
  panelId,
  tabIndex,
}: TabProps): ReactElement {
  return (
    <button
      role="tab"
      type="button"
      id={id}
      className={`${styles.tab} ${isSelected ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
      aria-selected={isSelected}
      aria-controls={panelId}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
      onClick={disabled ? undefined : onActivate}
    >
      {label}
    </button>
  );
}

/**
 * Tab panel content. Only renders when `isActive` is true.
 * Injected props are provided by the parent `<Tabs>`.
 */
export function Panel({
  children,
  isActive = false,
  id,
  tabId,
}: PanelProps): ReactElement | null {
  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={tabId}
      className={styles.panel}
    >
      {children}
    </div>
  );
}

// ── Type guards for Children.map filtering ──────────────────────────

function isTabElement(child: ReactNode): child is ReactElement<TabProps> {
  return isValidElement<TabProps>(child) && child.type === Tab;
}

function isPanelElement(child: ReactNode): child is ReactElement<PanelProps> {
  return isValidElement<PanelProps>(child) && child.type === Panel;
}

// ── Main Tabs container ─────────────────────────────────────────────

export interface TabsProps {
  readonly children: ReactNode;
  readonly label: string;
  readonly defaultIndex?: number;
  readonly index?: number;
  readonly onChange?: (index: number) => void;
}

export function Tabs({
  children: childrenProp,
  label,
  defaultIndex = 0,
  index: controlledIndex,
  onChange,
}: TabsProps): ReactElement {
  const isControlled = controlledIndex !== undefined;
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const activeIndex = isControlled ? controlledIndex : internalIndex;

  const baseId = useId();

  const handleTabSelect = useCallback(
    (idx: number) => {
      if (!isControlled) {
        setInternalIndex(idx);
      }
      onChange?.(idx);
    },
    [isControlled, onChange],
  );

  // Separate and enrich Tab and Panel children with injected props.
  // Memoized so it only recomputes when active tab or children change.
  const { tabChildren, panelChildren, safeActiveIndex } = useMemo(() => {
    const tabs: ReactElement<TabProps>[] = [];
    const panels: ReactElement<PanelProps>[] = [];

    Children.forEach(childrenProp, (child) => {
      if (isTabElement(child)) {
        const idx = tabs.length;
        tabs.push(
          cloneElement<TabProps>(child, {
            isSelected: activeIndex === idx,
            onActivate: () => handleTabSelect(idx),
            id: `${baseId}-tab-${idx}`,
            panelId: `${baseId}-panel-${idx}`,
            tabIndex: activeIndex === idx ? 0 : -1,
          }),
        );
      } else if (isPanelElement(child)) {
        const idx = panels.length;
        panels.push(
          cloneElement<PanelProps>(child, {
            isActive: activeIndex === idx,
            id: `${baseId}-panel-${idx}`,
            tabId: `${baseId}-tab-${idx}`,
          }),
        );
      }
    });

    const clampedIndex = Math.min(activeIndex, tabs.length - 1, panels.length - 1);

    return { tabChildren: tabs, panelChildren: panels, safeActiveIndex: clampedIndex };
  }, [childrenProp, activeIndex, baseId, handleTabSelect]);

  // ── Keyboard navigation ───────────────────────────────────────────
  // Read tab children from a ref to keep the callback stable.
  const tabChildrenRef = useRef(tabChildren);
  tabChildrenRef.current = tabChildren;

  const safeActiveIndexRef = useRef(safeActiveIndex);
  safeActiveIndexRef.current = safeActiveIndex;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentTabs = tabChildrenRef.current;
      const currentIndex = safeActiveIndexRef.current;
      const total = currentTabs.length;
      if (total === 0) return;

      let newIndex: number | undefined;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          // Find next non-disabled tab.
          newIndex = (currentIndex + 1) % total;
          while (newIndex !== currentIndex && currentTabs[newIndex]?.props.disabled) {
            newIndex = (newIndex + 1) % total;
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = (currentIndex - 1 + total) % total;
          while (newIndex !== currentIndex && currentTabs[newIndex]?.props.disabled) {
            newIndex = (newIndex - 1 + total) % total;
          }
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = total - 1;
          break;
      }

      if (newIndex !== undefined && newIndex !== currentIndex && !currentTabs[newIndex]?.props.disabled) {
        handleTabSelect(newIndex);
        // Focus the newly selected tab button.
        const tabButton = document.getElementById(`${baseId}-tab-${newIndex}`);
        tabButton?.focus();
      }
    },
    [baseId, handleTabSelect],
  );

  return (
    <div className={styles.wrapper}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className={styles.tablist}
      >
        {tabChildren}
      </div>
      {panelChildren[safeActiveIndex]}
    </div>
  );
}

// ── Compound namespace ──────────────────────────────────────────────
Tabs.Tab = Tab;
Tabs.Panel = Panel;
