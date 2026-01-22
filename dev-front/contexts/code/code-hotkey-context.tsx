"use client";

import { SetStateFn } from "@/types/shared";
import { useCallback, useMemo, useState } from "react";

type CodeHotKeyAction =
  "next-tab" |
  "previous-tab" |
  "new-tab" |
  "close-tab";

type CodeHotkeyKeyCombo = string;

type CodeHotkeyActions = Record<CodeHotKeyAction, CodeHotkeyKeyCombo|null>;

const defaultHotkeys: CodeHotkeyActions = {
  "next-tab": "Ctrl+Tab",
  "previous-tab": "Ctrl+Shift+Tab",
  "new-tab": "Ctrl+N",
  "close-tab": "Ctrl+W",
}


export interface CodeHotkeyContextType {
  hotkeys: CodeHotkeyActions,
  setHotkeys: SetStateFn<CodeHotkeyActions>,
  setHotkey: (action: CodeHotKeyAction, key: CodeHotkeyKeyCombo) => void,
  removeHotkey: (action: CodeHotKeyAction) => void,
}

export function useCodeHotkey() {
  const [hotkeys, setHotkeys] = useState<CodeHotkeyActions>(defaultHotkeys);

  const setHotkey = useCallback((action: CodeHotKeyAction, key: CodeHotkeyKeyCombo) => {
    setHotkeys((prev) => ({ ...prev, [action]: key }));
  }, [setHotkeys]);

  const removeHotkey = useCallback((action: CodeHotKeyAction) => {
    setHotkeys((prev) => ({ ...prev, [action]: null }));
  }, [setHotkeys]);

  const hotkeyContext: CodeHotkeyContextType = useMemo(() => ({
    hotkeys,
    setHotkeys,
    setHotkey,
    removeHotkey,
  }), [hotkeys, setHotkeys, setHotkey, removeHotkey]);

  return hotkeyContext;
}
