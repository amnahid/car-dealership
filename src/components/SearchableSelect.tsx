'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  error,
}: SearchableSelectProps) {
  const t = useTranslations('SearchableSelect');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayPlaceholder = placeholder || t('placeholder');

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case 'Backspace':
        if (search === '' && value) {
          onChange('');
        }
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    fontSize: '14px',
    borderRadius: '0',
    padding: isRtl ? '0 30px 0 12px' : '0 12px 0 30px',
    border: error ? '1px solid #dc3545' : `1px solid ${isOpen ? '#28aaa9' : '#ced4da'}`,
    background: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    textAlign: isRtl ? 'right' : 'left'
  };

  // Re-adjust padding because of icons
  const finalInputStyle: React.CSSProperties = {
    ...inputStyle,
    paddingLeft: isRtl ? '12px' : '12px', 
    paddingRight: isRtl ? '30px' : '30px',
  };

  return (
    <div style={{ position: 'relative', textAlign: isRtl ? 'right' : 'left' }} ref={containerRef}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#2a3142',
            marginBottom: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: '#dc3545' }}> *</span>}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : (selectedOption?.label || '')}
          onChange={(e) => {
            e.stopPropagation();
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={(e) => {
            e.stopPropagation();
            !disabled && setIsOpen(true);
          }}
          onClick={(e) => {
            e.stopPropagation();
            !disabled && setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? displayPlaceholder : (selectedOption?.label || displayPlaceholder)}
          disabled={disabled}
          style={{
            ...finalInputStyle,
            color: selectedOption && !isOpen ? '#333' : '#999',
          }}
          autoComplete="off"
        />

        <div
          style={{
            position: 'absolute',
            right: isRtl ? 'auto' : '10px',
            left: isRtl ? '10px' : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#666',
          }}
        >
          {isOpen ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ced4da',
            borderTop: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: isRtl ? 'right' : 'left',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: '12px',
                textAlign: 'center',
                color: '#999',
                fontSize: '14px',
              }}
            >
              {t('noResults')}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: index === highlightedIndex ? '#f0f8f8' : '#fff',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '14px',
                  color: option.value === value ? '#28aaa9' : '#333',
                  fontWeight: option.value === value ? 500 : 400,
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{error}</p>
      )}
    </div>
  );
}
