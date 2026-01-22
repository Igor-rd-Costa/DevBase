"use client";

import AppPreviewPanel from "@/components/code/app-view-panel";
import CodeLayout from "@/components/code/code-layout";
import CodeViewPanel from "@/components/code/code-view-panel";
import ChatPanel from "@/components/shared/chat-panel";
import { useMemo, useState } from "react";


enum ViewMode {
  APP = "app",
  CODE = "code"
}


export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.APP);

  const ViewPanel = useMemo(() => viewMode === ViewMode.APP ? <AppPreviewPanel /> : <CodeViewPanel />, [viewMode]);

  return (
    <CodeLayout>
      <ChatPanel />
      {ViewPanel}
    </CodeLayout>
  );
}
