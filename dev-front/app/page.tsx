"use client";

import AppPreviewPanel from "@/components/code/app-view-panel";
import CodeLayout from "@/components/code/code-layout";
import CodeViewPanel from "@/components/code/code-view-panel";
import ConfiguredProjectViewPanel from "@/components/code/configured-project-view-panel";
import ChatPanel from "@/components/shared/chat-panel";
import { ViewMode } from "@/types/view-mode";
import { useView, ViewProvider } from "@/contexts/view-context";
import { useMemo } from "react";

function HomeContent() {
  const { viewMode, setViewMode } = useView();

  const ViewPanel = useMemo(() => {
    switch (viewMode) {
      case ViewMode.APP:
        return <AppPreviewPanel />;
      case ViewMode.CODE:
        return <CodeViewPanel />;
      case ViewMode.CONFIGURED_PROJECT:
        return <ConfiguredProjectViewPanel onViewChange={setViewMode} />;
      default:
        return <ConfiguredProjectViewPanel onViewChange={setViewMode} />;
    }
  }, [viewMode, setViewMode]);

  return (
    <CodeLayout>
      <ChatPanel />
      {ViewPanel}
    </CodeLayout>
  );
}

export default function Home() {
  return (
    <ViewProvider>
      <HomeContent />
    </ViewProvider>
  );
}
