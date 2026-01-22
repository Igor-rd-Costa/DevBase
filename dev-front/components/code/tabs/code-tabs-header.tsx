"use client";

import CodeTab from "@/components/code/tabs/code-tab";

export default function CodeTabsHeader() {
  return (
    <section className="w-full h-[1.5rem] px-2 pt-1 overflow-hidden col-start-2 flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
      <CodeTab label="Tab 1" isActive={true} />
      <CodeTab label="Tab 2" />
      <CodeTab label="Tab 3" />
    </section>
  )
}