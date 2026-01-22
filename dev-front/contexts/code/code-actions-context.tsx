"use client";

import { CodeAction } from "@/types/code";
import { useCallback, useMemo, useState } from "react";


export type CodeActionsContextType = {
  do: (action: CodeAction) => void,
  undo: (action: CodeAction) => void,
  redo: (action: CodeAction) => void
}

export function useCodeActions() {
  const [actions, setActions] = useState<CodeAction[]>([]);
  const [redoStack, setRedoStack] = useState<CodeAction[]>([]);


  const executeDoAction = useCallback((action: CodeAction) => {
    
  }, []);

  const executeUndoAction = useCallback((action: CodeAction) => {
  }, []);


  const doAction = useCallback((action: CodeAction) => {
    setActions(prev => [...prev, action]);
    executeDoAction(action);
    setRedoStack([]);
  }, [executeDoAction, setActions, setRedoStack]);

  const undoAction = useCallback((action: CodeAction) => {
    setActions(prev => {
      const action = prev.pop();
      if (!action) {
        return prev;
      }
      executeUndoAction(action);
      setRedoStack(prev => [...prev, action]);
      return prev;
    })
  }, [executeUndoAction, setRedoStack]);

  const redoAction = useCallback((action: CodeAction) => {
    setRedoStack(prev => {
      const action = prev.pop();
      if (!action) {
        return prev;
      }
      executeDoAction(action);
      setActions(prev => [...prev, action]);
      return prev;
    });
  }, [executeDoAction, setRedoStack]);


  const actionsContext: CodeActionsContextType = useMemo(() => ({
    do: doAction,
    undo: undoAction,
    redo: redoAction,
  }), [doAction, undoAction, redoAction]);

  return actionsContext;
}


