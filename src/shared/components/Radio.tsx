/**
 * Radio — accessible radio group compound component.
 *
 * Compound usage:
 *   <Radio.Group name="status" value={value} onChange={setValue} label="Filter by status">
 *     <Radio value="active" label="Active" />
 *     <Radio value="paused" label="Paused" />
 *     <Radio value="completed" label="Completed" />
 *   </Radio.Group>
 *
 * The `<Radio.Group>` parent manages state (name, value, onChange) and injects
 * `checked`, `name`, and `onChange` into each `<Radio>` child via `cloneElement`.
 *
 * Accessibility:
 *  - `role="radiogroup"` on the group container with `aria-label`
 *  - Each radio: native `<input type="radio">` with associated `<label>`
 *  - Arrow key navigation (Up/Down/Left/Right) within the group
 *  - Disabled radios are skipped during keyboard navigation
 */
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';

import styles from './Radio.module.css';

// ── Types ───────────────────────────────────────────────────────────

export interface RadioProps {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  /** @internal Injected by Radio.Group */
  readonly name?: string;
  /** @internal Injected by Radio.Group */
  readonly checked?: boolean;
  /** @internal Injected by Radio.Group */
  readonly onChange?: () => void;
}

export interface RadioGroupProps {
  readonly name: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly children: ReactNode;
}

// ── Radio (individual option) ───────────────────────────────────────

/**
 * Individual radio option. Injected props (`name`, `checked`, `onChange`)
 * are provided by the parent `<Radio.Group>`. Consumers pass only
 * `value`, `label`, and optional `disabled`.
 */
function Radio({
  value: _value,
  label,
  disabled = false,
  name,
  checked = false,
  onChange,
}: RadioProps): ReactElement {
  const id = useId();

  return (
    <div className={`${styles.option} ${disabled ? styles.disabledOption : ''}`}>
      <input
        type="radio"
        id={id}
        name={name}
        value={_value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={styles.input}
      />
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
    </div>
  );
}

// ── Type guard ──────────────────────────────────────────────────────

function isRadioElement(child: ReactNode): child is ReactElement<RadioProps> {
  return isValidElement<RadioProps>(child) && child.type === Radio;
}

// ── RadioGroup container ────────────────────────────────────────────

/**
 * Radio group container. Manages selection state and keyboard navigation.
 * Renders `role="radiogroup"` with `aria-label`.
 */
function RadioGroup({
  name,
  value,
  onChange,
  label,
  children: childrenProp,
}: RadioGroupProps): ReactElement {
  const groupRef = useRef<HTMLDivElement>(null);

  // Enrich children with injected props.
  const enrichedChildren = Children.map(childrenProp, (child) => {
    if (isRadioElement(child)) {
      return cloneElement<RadioProps>(child, {
        name,
        checked: child.props.value === value,
        onChange: () => onChange(child.props.value),
      });
    }
    return child;
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const radioElements =
        groupRef.current?.querySelectorAll<HTMLInputElement>(
          'input[type="radio"]:not([disabled])',
        );

      if (!radioElements || radioElements.length === 0) return;

      const currentIndex = Array.from(radioElements).findIndex(
        (el) => el.checked,
      );
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;

      let newIndex: number | undefined;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (safeIndex + 1) % radioElements.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = (safeIndex - 1 + radioElements.length) % radioElements.length;
          break;
      }

      if (newIndex !== undefined && newIndex !== safeIndex) {
        const nextRadio = radioElements[newIndex];
        if (nextRadio) {
          nextRadio.checked = true;
          nextRadio.focus();
          onChange(nextRadio.value);
        }
      }
    },
    [onChange],
  );

  return (
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={label}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className={styles.group}
      >
      {enrichedChildren}
    </div>
  );
}

// ── Compound namespace ──────────────────────────────────────────────
Radio.Group = RadioGroup;

export { Radio };
