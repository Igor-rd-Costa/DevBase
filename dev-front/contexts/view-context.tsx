"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ViewMode, ConfiguredProjectMode } from "@/types/view-mode";

interface ViewContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    configuredProjectMode: ConfiguredProjectMode | null;
    setConfiguredProjectMode: (mode: ConfiguredProjectMode | null) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.APP);
    const [configuredProjectMode, setConfiguredProjectMode] = useState<ConfiguredProjectMode | null>(null);

    return (
        <ViewContext.Provider value={{
            viewMode,
            setViewMode,
            configuredProjectMode,
            setConfiguredProjectMode
        }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (context === undefined) {
        throw new Error("useView must be used within a ViewProvider");
    }
    return context;
}
