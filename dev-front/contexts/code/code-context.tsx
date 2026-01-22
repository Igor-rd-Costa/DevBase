"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { CodeTabsContextType, useCodeTabs } from "@/contexts/code/code-tabs-context";
import { GitContextType, useGit } from "@/contexts/code/code-git-context";
import { CodeHotkeyContextType, useCodeHotkey } from "@/contexts/code/code-hotkey-context";
import { CodeActionsContextType, useCodeActions } from "@/contexts/code/code-actions-context";

interface CodeContextType {
  Tabs: CodeTabsContextType,
  Git: GitContextType,
  Hotkey: CodeHotkeyContextType,
  Actions: CodeActionsContextType,
}

const CodeContext = createContext<CodeContextType | undefined>(undefined);

export function CodeContextProvider({ children }: { children: ReactNode }) {
  const tabsContext = useCodeTabs();
  const gitContext = useGit();
  const hotkeyContext = useCodeHotkey();
  const actionsContext = useCodeActions();

  const codeContext: CodeContextType = useMemo(() => ({
    Tabs: tabsContext,
    Git: gitContext,
    Hotkey: hotkeyContext,
    Actions: actionsContext,
  }), [tabsContext, gitContext, hotkeyContext, actionsContext]);

  return (
    <CodeContext.Provider value={codeContext}>
      {children}
    </CodeContext.Provider>
  );
}

export function useCode() {
  const context = useContext(CodeContext);
  if (context === undefined) {
    throw new Error("useCode must be used within a CodeContextProvider");
  }
  return context;
}