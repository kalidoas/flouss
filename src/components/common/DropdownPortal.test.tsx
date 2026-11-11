/**
 * @vitest-environment jsdom
 */
import React, { useRef, act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DropdownPortal } from './DropdownPortal';

const TestDropdown: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button ref={triggerRef} type="button">Trigger</button>
      <DropdownPortal
        isOpen={isOpen}
        onClose={onClose}
        triggerRef={triggerRef}
      >
        <div id="test-dropdown-content">Menu Content</div>
      </DropdownPortal>
    </div>
  );
};

describe('DropdownPortal', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  it('does not render content in body when isOpen is false', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container!);

    await act(async () => {
      root.render(<TestDropdown isOpen={false} onClose={handleClose} />);
    });

    expect(document.getElementById('test-dropdown-content')).toBeNull();
  });

  it('renders content directly into document.body when isOpen is true', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container!);

    await act(async () => {
      root.render(<TestDropdown isOpen={true} onClose={handleClose} />);
    });

    const content = document.getElementById('test-dropdown-content');
    expect(content).not.toBeNull();
    expect(document.body.contains(content)).toBe(true);
  });

  it('triggers onClose when escape key is pressed', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container!);

    await act(async () => {
      root.render(<TestDropdown isOpen={true} onClose={handleClose} />);
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
