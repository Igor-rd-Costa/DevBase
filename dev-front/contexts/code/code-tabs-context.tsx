"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  CodeAddTabData, 
  CodeAddTabFunction, 
  CodeAddTabGroupData, 
  CodeGetTabFunction, 
  CodeGetTabGroupFunction, 
  CodeGetTabGroupsFunction, 
  CodeGetTabsFunction, 
  CodeTab, 
  CodeTabGroup, 
  CodeUpdateTabData, 
  CodeUpdateTabGroupData, 
  CodeUpdateTabFunction,
  CodeRemoveTabFunction, 
  CodeRemoveTabGroupFunction,
  CodeAddTabGroupFunction,
  CodeUpdateTabGroupFunction
} from "@/types/code";
import { randomUUID as uuid } from "crypto";


export type CodeTabsContextType = {
  src: {
    tabs: CodeTab[],
    setTabs: React.Dispatch<React.SetStateAction<CodeTab[]>>,
    tabGroups: CodeTabGroup[],
    setTabGroups: React.Dispatch<React.SetStateAction<CodeTabGroup[]>>
  }
  getTabs: CodeGetTabsFunction,
  getTab: CodeGetTabFunction,
  addTab: CodeAddTabFunction,
  updateTab: CodeUpdateTabFunction,
  removeTab: CodeRemoveTabFunction,
  getTabGroups: CodeGetTabGroupsFunction,
  getTabGroup: CodeGetTabGroupFunction,
  addTabGroup: CodeAddTabGroupFunction,
  updateTabGroup: CodeUpdateTabGroupFunction,
  removeTabGroup: CodeRemoveTabGroupFunction,
}

export function useCodeTabs() {
  const [tabs, setTabs] = useState<CodeTab[]>([]);
  const [tabGroups, setTabGroups] = useState<CodeTabGroup[]>([]);

  const getTabs = useCallback(() => tabs, [tabs]);
  
  const getTab = useCallback((id: string) => tabs.find((tab) => tab.id === id) || null, [tabs]);

  const addTab = useCallback((data: CodeAddTabData) => 
    setTabs((prev) => [...prev, { ...data, id: uuid() }])
  , [setTabs]);

  const updateTab = useCallback((id: string, data: CodeUpdateTabData) => 
    setTabs((prev) => prev.map((tab) => tab.id === id ? { ...tab, ...data } : tab))
  , [setTabs]);

  const removeTab = useCallback((id: string) => 
    setTabs((prev) => prev.filter((tab) => tab.id !== id))
  , [setTabs]);

  const getTabGroups = useCallback(() => tabGroups, [tabGroups]);

  const getTabGroup = useCallback((id: string) => tabGroups.find((group) => group.id === id) || null, [tabGroups]);

  const addTabGroup = useCallback((data: CodeAddTabGroupData) => 
    setTabGroups((prev) => [...prev, { ...data, id: uuid() }])
  , [setTabGroups]);

  const updateTabGroup = useCallback((id: string, data: CodeUpdateTabGroupData) => 
    setTabGroups((prev) => prev.map((group) => group.id === id ? { ...group, ...data } : group))
  , [setTabGroups]);

  const removeTabGroup = useCallback((id: string) => 
    setTabGroups((prev) => prev.filter((group) => group.id !== id))
  , [setTabGroups]);

  const tabsContext: CodeTabsContextType = useMemo(() => ({
    src: {
      tabs,
      setTabs,
      tabGroups,
      setTabGroups,
    },
    getTabs,
    getTab,
    addTab,
    updateTab,
    removeTab,
    getTabGroups,
    getTabGroup,
    addTabGroup,
    updateTabGroup,
    removeTabGroup,
  }), [getTabs, getTab, addTab, updateTab, removeTab, getTabGroups, getTabGroup, addTabGroup, updateTabGroup, removeTabGroup]);

  return tabsContext;
}