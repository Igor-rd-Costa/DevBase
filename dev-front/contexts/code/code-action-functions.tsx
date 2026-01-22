"use client";

import { 
  CodeAddTabFunction, 
  CodeAddTabGroupFunction, 
  CodePasteFunction, 
  CodeCutFunction, 
  CodeRedoFunction, 
  CodeDeleteFunction, 
  CodeRemoveTabFunction, 
  CodeSelectAllFunction, 
  CodeUndoFunction, 
  CodeRemoveTabGroupFunction, 
  CodeReplaceFunction, 
  CodeCopyFunction, 
} from "@/types/code";
import { useCallback, useMemo } from "react";


export type CodeActionFunctions = {
  //General
  copy: CodeCopyFunction
  paste: CodePasteFunction
  cut: CodeCutFunction
  selectAll: CodeSelectAllFunction
  undo: CodeUndoFunction
  redo: CodeRedoFunction
  delete: CodeDeleteFunction
  replace: CodeReplaceFunction

  //Tabs
  addTab: CodeAddTabFunction
  removeTab: CodeRemoveTabFunction
  addTabGroup: CodeAddTabGroupFunction
  removeTabGroup: CodeRemoveTabGroupFunction
}

export function useCodeActionFunctions() {
  const copy = useCallback(() => {
  
  }, []);

  const paste = useCallback(() => {
    
  }, []);

  const cut = useCallback(() => {
    
  }, []);

  const selectAll = useCallback(() => {
    
  }, []);

  const undo = useCallback(() => {
    
  }, []);

  const redo = useCallback(() => {
    
  }, []);

  const deleteFn = useCallback(() => {
    
  }, []);

  const replace = useCallback(() => {
    
  }, []);


  const addTab = useCallback(() => {
    
  }, []);

  const removeTab = useCallback(() => {
    
  }, []);

  const addTabGroup = useCallback(() => {
    
  }, []);

  const removeTabGroup = useCallback(() => {
    
  }, []);

  const functions: CodeActionFunctions = useMemo(() => ({
    copy,
    paste,
    cut,
    selectAll,
    undo,
    redo,
    delete: deleteFn,
    replace,
    addTab,
    removeTab,
    addTabGroup,
    removeTabGroup,
  }), [addTab, addTabGroup, copy, cut, deleteFn, paste, redo, removeTab, removeTabGroup, replace, selectAll, undo]);

  return functions;
}