"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { DialogContextType, DialogType, DialogBaseProps } from "@/contexts/dialog-context";
import React from "react";

export type SelectPopupOption<T = string> = {
  value: T,
  label: string,
  description?: string,
  disabled?: boolean,
}

type SelectPopupProps<T = string> = {
  label: string,
  placeholder?: string,
  options: SelectPopupOption<T>[],
  value: T | T[] | null,
  onChange: (value: T | T[]) => void,
  multiple?: boolean,
  showCheckboxes?: boolean,
  loading?: boolean,
  error?: string | null,
  emptyMessage?: string,
  getDisplayText?: (selected: T | T[] | null) => string,
  className?: string,
  buttonClassName?: string,
  zIndex?: number,
}

export default function SelectPopup<T = string>({
  label,
  placeholder = "Select option",
  options,
  value,
  onChange,
  multiple = false,
  showCheckboxes = false,
  loading = false,
  error = null,
  emptyMessage = "No options found",
  getDisplayText,
  className = "",
  buttonClassName = "",
  zIndex = 102,
}: SelectPopupProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isSelected = (optionValue: T): boolean => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    if (!multiple && value !== null) {
      return value === optionValue;
    }
    return false;
  };

  const handleOptionClick = (optionValue: T) => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      if (currentValue.includes(optionValue)) {
        onChange(currentValue.filter((v) => v !== optionValue) as T & T[]);
      } else {
        onChange([...currentValue, optionValue] as T & T[]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const getDisplayValue = (): string => {
    if (getDisplayText) {
      return getDisplayText(value);
    }

    if (multiple && Array.isArray(value)) {
      if (value.length === 0) {
        return placeholder;
      }
      if (value.length === 1) {
        const option = options.find((opt) => opt.value === value[0]);
        return option?.label || placeholder;
      }
      return `${value.length} selected`;
    }

    if (!multiple && value !== null) {
      const option = options.find((opt) => opt.value === value);
      return option?.label || placeholder;
    }

    return placeholder;
  };

  return (
    <div className={`relative flex flex-col gap-2 ${className}`} ref={dropdownRef}>
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:focus:ring-zinc-400/20 flex items-center justify-between transition-all ${buttonClassName}`}
      >
        <span className="text-sm truncate">{getDisplayValue()}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          style={{ zIndex }}
          className="absolute top-full mt-2 w-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 max-h-64 overflow-y-auto"
        >
          <SelectContent
            options={options}
            value={value}
            multiple={multiple}
            showCheckboxes={showCheckboxes}
            loading={loading}
            error={error}
            emptyMessage={emptyMessage}
            onOptionClick={handleOptionClick}
          />
        </div>
      )}
    </div>
  );
}

export function SelectContent<T = string>({
  options,
  value,
  onChange,
  multiple = false,
  showCheckboxes = false,
  loading = false,
  error = null,
  emptyMessage = "No options found",
  onOptionClick,
  className = "",
}: {
  options: SelectPopupOption<T>[],
  value: T | T[] | null,
  onChange?: (value: T | T[]) => void,
  multiple?: boolean,
  showCheckboxes?: boolean,
  loading?: boolean,
  error?: string | null,
  emptyMessage?: string,
  onOptionClick?: (optionValue: T) => void,
  className?: string,
}) {
  const isSelected = (optionValue: T): boolean => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    if (!multiple && value !== null) {
      return value === optionValue;
    }
    return false;
  };

  const handleOptionClick = (optionValue: T) => {
    if (onOptionClick) {
      onOptionClick(optionValue);
    } else if (onChange) {
      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        if (currentValue.includes(optionValue)) {
          onChange(currentValue.filter((v) => v !== optionValue) as T & T[]);
        } else {
          onChange([...currentValue, optionValue] as T & T[]);
        }
      } else {
        onChange(optionValue);
      }
    }
  };

  if (loading) {
    return (
      <div className={`px-4 py-4 text-center ${className}`}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`px-4 py-4 text-center ${className}`}>
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!options || options.length === 0) {
    return (
      <div className={`px-4 py-4 text-center ${className}`}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`p-1 flex flex-col gap-0.5 ${className}`}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        const disabled = option.disabled || false;

        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => !disabled && handleOptionClick(option.value)}
            disabled={disabled}
            className={`w-full px-2.5 py-2 flex items-center gap-3 text-left rounded-lg transition-all duration-200 ${selected && !showCheckboxes
              ? "bg-zinc-100 dark:bg-zinc-700 font-medium text-zinc-900 dark:text-zinc-50"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100"
              } ${disabled
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
              }`}
          >
            {showCheckboxes && (
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected
                ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100"
                : "border-zinc-300 dark:border-zinc-600 bg-transparent"
                }`}>
                {selected && (
                  <Check className="w-3 h-3 text-white dark:text-zinc-900 stroke-[3]" />
                )}
              </div>
            )}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className={`text-sm tracking-tight truncate ${selected ? 'font-semibold' : 'font-medium'}`}>
                {option.label}
              </span>
              {option.description && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate leading-tight">
                  {option.description}
                </span>
              )}
            </div>
            {selected && !showCheckboxes && (
              <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

type SelectPopupShowOptions<T = string> = {
  title: string,
  options: SelectPopupOption<T>[],
  initialValue?: T | T[] | null,
  multiple?: boolean,
  showCheckboxes?: boolean,
  loading?: boolean,
  error?: string | null,
  emptyMessage?: string,
  target?: HTMLElement | null,
}

const SelectPopupWithShow = SelectPopup as typeof SelectPopup & {
  show: <T = string>(dialog: DialogContextType, options: SelectPopupShowOptions<T>) => Promise<T | T[] | null> & { id: string }
};

SelectPopupWithShow.show = <T = string>(
  dialog: DialogContextType,
  options: SelectPopupShowOptions<T>
): Promise<T | T[] | null> & { id: string } => {
  let id = "";
  const promise = new Promise<T | T[] | null>((resolve) => {
    let selectedValue: T | T[] | null = options.initialValue || (options.multiple ? [] : null);
    let forceUpdate: (() => void) | null = null;

    const SelectDialogComponent = (props: DialogBaseProps & SelectPopupShowOptions<T>) => {
      const [value, setValue] = useState<T | T[] | null>(selectedValue);

      useEffect(() => {
        forceUpdate = () => {
          setValue(selectedValue);
        };
      }, []);

      const handleOptionClick = (optionValue: T) => {
        if (props.multiple) {
          const currentValue = Array.isArray(value) ? value : [];
          if (currentValue.includes(optionValue)) {
            selectedValue = currentValue.filter((v) => v !== optionValue) as T & T[];
          } else {
            selectedValue = [...currentValue, optionValue] as T & T[];
          }
          setValue(selectedValue);
        } else {
          selectedValue = optionValue;
          setValue(selectedValue);
          props.onOpenChange(null);
          resolve(selectedValue as T);
        }
      };

      const handleDone = () => {
        props.onOpenChange(null);
        resolve(selectedValue as T & T[]);
      };

      const handleClose = () => {
        props.onOpenChange(null);
        resolve(selectedValue as T | T[] | null);
      };

      return (
        <div className="w-full max-h-[70vh] overflow-hidden flex flex-col min-w-[15rem]">
          <div className="px-3 py-2 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-md">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em]">
              {props.title}
            </h3>
            <button
              onClick={handleClose}
              className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SelectContent
              options={props.options}
              value={value}
              multiple={props.multiple}
              showCheckboxes={props.showCheckboxes}
              loading={props.loading}
              error={props.error}
              emptyMessage={props.emptyMessage}
              onOptionClick={handleOptionClick}
            />
            {props.multiple && (
              <div className="flex justify-end gap-2 p-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={handleDone}
                  className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    const dialogResult = dialog.show(
      DialogType.CUSTOM,
      options.title,
      SelectDialogComponent as any,
      options,
      "popup",
      options.target
    );

    id = dialogResult.id;
    dialogResult.then(() => {
      resolve(selectedValue as T | T[] | null);
    });
  });

  (promise as any).id = id;
  return promise as Promise<T | T[] | null> & { id: string };
};

export { SelectPopupWithShow as SelectPopupShow };

