"use client";

import DevHeader from "@/components/dev-header";
import { CodeContextProvider } from "@/contexts/code/code-context";
import CodeTabsHeader from "@/components/code/tabs/code-tabs-header";


type CodeLayoutProps = {
  children?: React.ReactNode,
  className?: string
}


export default function CodeLayout({ children, className = "" }: CodeLayoutProps) {
  return (
    <CodeContextProvider>
      <div className="h-full w-full overflow-hidden grid grid-rows-[auto_1fr]">
        <DevHeader />
        <main className={`w-full h-full overflow-hidden grid grid-cols-[auto_1fr] ${className}`}>
          {children}
        </main>
      </div>
    </CodeContextProvider>
  )
}