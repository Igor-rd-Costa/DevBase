export type CodeTab = {
  id: string,
  name: string,
  icon: React.ReactNode|string,
}

export type CodeAddTabData = Omit<CodeTab, "id">;
export type CodeUpdateTabData = Partial<CodeTab>;

export type CodeTabGroup = {
  id: string,
  name: string,
  tabs: CodeTab[],
}

export type CodeAddTabGroupData = Omit<CodeTabGroup, "id">;
export type CodeUpdateTabGroupData = Partial<CodeTabGroup>;


export type CodeGetTabsFunction = () => CodeTab[];
export type CodeGetTabFunction = (id: string) => CodeTab|null;
export type CodeAddTabFunction = (data: CodeAddTabData) => void;
export type CodeUpdateTabFunction = (id: string, data: CodeUpdateTabData) => void;
export type CodeRemoveTabFunction = (id: string) => void;
export type CodeGetTabGroupsFunction = () => CodeTabGroup[];
export type CodeGetTabGroupFunction = (id: string) => CodeTabGroup|null;
export type CodeAddTabGroupFunction = (data: CodeAddTabGroupData) => void;
export type CodeUpdateTabGroupFunction = (id: string, data: CodeUpdateTabGroupData) => void;
export type CodeRemoveTabGroupFunction = (id: string) => void;


