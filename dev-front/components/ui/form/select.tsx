"use client";

import { useState, ReactNode, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { useDialog, DialogType, DialogBaseProps } from "@/contexts/dialog-context";
import SelectPopup, { SelectContent, SelectPopupOption, SelectPopupShow } from "@/components/dialogs/select-popup";

export type { SelectPopupOption } from "@/components/dialogs/select-popup";

type SelectProps<T = string> = {
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
  dialogTitle?: string,
  dialogWidth?: string,
  dialogHeight?: string,
}


export default function Select<T = string>({
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
  dialogTitle,
  dialogWidth = "max-w-lg",
  dialogHeight = "max-h-[70vh]",
}: SelectProps<T>) {
  const dialog = useDialog();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const activeDialogId = useRef<string | null>(null);

  useEffect(() => {
    if (activeDialogId.current) {
      dialog.update(activeDialogId.current, {
        options,
        loading,
        error,
        title: dialogTitle || label,
        multiple,
        showCheckboxes,
        emptyMessage,
      });
    }
    // eslint-disable-next-line
  }, [JSON.stringify(options), loading, error, dialogTitle, label, multiple, showCheckboxes, emptyMessage, dialog]);

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

  const handleOpenDialog = async () => {
    const dialogResult = SelectPopupShow.show(dialog, {
      title: dialogTitle || label,
      options,
      initialValue: value,
      multiple,
      showCheckboxes,
      loading,
      error,
      emptyMessage,
      target: buttonRef.current,
    });

    activeDialogId.current = dialogResult.id;
    const selectionResult = await dialogResult;
    activeDialogId.current = null;

    if (selectionResult !== null) {
      onChange(selectionResult);
    }
  };

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpenDialog}
        className={`w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/10 dark:focus:ring-zinc-400/10 focus:border-zinc-400 dark:focus:border-zinc-500 transition-all duration-200 flex items-center justify-between text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm ${buttonClassName}`}
      >
        <span className="truncate">{getDisplayValue()}</span>
        <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
      </button>
    </div>
  );
}

