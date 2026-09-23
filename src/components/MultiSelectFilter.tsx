'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectFilterProps {
  label?: string;
  placeholder?: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  minWidth?: string;
}

export default function MultiSelectFilter({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  minWidth = '180px',
}: MultiSelectFilterProps) {
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Determine display text for the trigger button
  const defaultPlaceholder = placeholder || commonT('allStatuses') || 'All Statuses';
  let displayText = defaultPlaceholder;
  if (selectedValues.length === 1) {
    const found = options.find((o) => o.value === selectedValues[0]);
    displayText = found ? found.label : selectedValues[0];
  } else if (selectedValues.length > 1 && selectedValues.length < options.length) {
    displayText = `${selectedValues.length} ${commonT('selected') || 'selected'}`;
  } else if (selectedValues.length === options.length && options.length > 0) {
    displayText = defaultPlaceholder;
  }

  const isAllSelected = selectedValues.length === options.length && options.length > 0;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#525f80',
            marginBottom: '4px',
            textAlign: isRtl ? 'right' : 'left',
          }}
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '40px',
          minWidth: minWidth,
          padding: '0 12px',
          fontSize: '14px',
          color: selectedValues.length > 0 ? '#2a3142' : '#6c757d',
          background: '#ffffff',
          border: isOpen ? '1px solid #28aaa9' : '1px solid #ced4da',
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: selectedValues.length > 0 ? 500 : 400,
          }}
        >
          {displayText}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedValues.length > 0 && selectedValues.length < options.length && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#e6f7f7',
                color: '#28aaa9',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 600,
                minWidth: '18px',
              }}
            >
              {selectedValues.length}
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
              color: '#6c757d',
              flexShrink: 0,
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            [isRtl ? 'right' : 'left']: 0,
            zIndex: 1050,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            minWidth: '200px',
            padding: '6px 0',
            maxHeight: '280px',
            overflowY: 'auto',
            direction: isRtl ? 'rtl' : 'ltr',
            textAlign: isRtl ? 'right' : 'left',
          }}
        >
          {/* Action Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 12px 8px',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '12px',
            }}
          >
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isAllSelected}
              style={{
                background: 'none',
                border: 'none',
                color: isAllSelected ? '#adb5bd' : '#28aaa9',
                cursor: isAllSelected ? 'default' : 'pointer',
                padding: 0,
                fontWeight: 500,
                fontSize: '12px',
              }}
            >
              {commonT('selectAll') || 'Select All'}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={selectedValues.length === 0}
              style={{
                background: 'none',
                border: 'none',
                color: selectedValues.length === 0 ? '#adb5bd' : '#ec4561',
                cursor: selectedValues.length === 0 ? 'default' : 'pointer',
                padding: 0,
                fontWeight: 500,
                fontSize: '12px',
              }}
            >
              {commonT('clearAll') || 'Clear All'}
            </button>
          </div>

          {/* Options List */}
          <div style={{ padding: '4px 0' }}>
            {options.map((option) => {
              const checked = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: checked ? '#f8fafc' : 'transparent',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = checked ? '#f1f5f9' : '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = checked ? '#f8fafc' : 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleOption(option.value)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#28aaa9',
                      cursor: 'pointer',
                      margin: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      color: checked ? '#2a3142' : '#525f80',
                      fontWeight: checked ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {option.color && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: option.color,
                        }}
                      />
                    )}
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
