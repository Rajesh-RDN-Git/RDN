'use client';

import { useState, useRef, useEffect, ReactNode, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ChevronIcon } from './icons';

interface DropdownContextType {
  isOpen: boolean;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType>({ isOpen: false, close: () => {} });

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: align === 'right' ? rect.right + window.scrollX : rect.left + window.scrollX,
      width: rect.width,
    });
  };

  const toggle = () => {
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

  return (
    <DropdownContext.Provider value={{ isOpen, close: () => setIsOpen(false) }}>
      <div ref={triggerRef} className={`relative inline-block ${className}`}>
        <div onClick={toggle} className="cursor-pointer">
          {trigger}
        </div>
        {isOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={menuRef}
              className="fixed z-dropdown animate-in fade-in-0 zoom-in-95"
              style={{
                top: position.top,
                ...(align === 'right'
                  ? { right: document.documentElement.clientWidth - position.left }
                  : { left: position.left }),
                minWidth: position.width,
              }}
            >
              <div className="rounded-lg border border-gray-200 bg-white py-1 shadow-elevation-2">
                {children}
              </div>
            </div>,
            document.body,
          )}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownItemProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  destructive?: boolean;
}

export function DropdownItem({
  onClick,
  children,
  className = '',
  destructive,
}: DropdownItemProps) {
  const { close } = useContext(DropdownContext);
  return (
    <button
      onClick={() => {
        onClick?.();
        close();
      }}
      className={`flex w-full items-center px-4 py-2 text-left text-body-md transition-colors hover:bg-gray-50 ${
        destructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-100" />;
}

interface DropdownSelectProps {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DropdownSelect({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
}: DropdownSelectProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Dropdown
      className={className}
      trigger={
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-body-md hover:border-gray-400">
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {selected?.label || placeholder}
          </span>
          <ChevronIcon size={16} className="text-gray-400" />
        </div>
      }
    >
      {options.map((opt) => (
        <DropdownItem
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={opt.value === value ? 'bg-primary-50 text-primary-700' : ''}
        >
          {opt.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
