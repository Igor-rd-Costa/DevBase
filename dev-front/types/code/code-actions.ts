import type { CodeTab, CodeTabGroup } from "./code-tabs";

export type CodeCopyFunction = () => void;
export type CodePasteFunction = () => void;
export type CodeCutFunction = () => void;
export type CodeSelectAllFunction = () => void;
export type CodeUndoFunction = () => void;
export type CodeRedoFunction = () => void;
export type CodeDeleteFunction = () => void;
export type CodeReplaceFunction = () => void;

export type CodeActionType =
  "copy" |
  "paste" |
  "cut" |
  "select-all" |
  "undo" |
  "redo" |
  "delete" |
  "replace" |
  "create-tab" |
  "close-tab" |
  "create-tab-group" |
  "close-tab-group";

export type CodeAction = {
  type: CodeActionType
}

export type CodeCreateTabAction = CodeAction & {
  type: "create-tab",
  id: string
}

export type CodeCloseTabAction = CodeAction & {
  type: "close-tab",
  tab: CodeTab
}

export type CodeCreateTabGroupAction = CodeAction & {
  type: "create-tab-group",
  id: string
}

export type CodeCloseTabGroupAction = CodeAction & {
  type: "close-tab-group",
  tabGroup: CodeTabGroup
}

