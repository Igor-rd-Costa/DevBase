"use client";

import CodeTabsHeader from "@/components/code/tabs/code-tabs-header";


export default function CodeViewPanel() {
  return (
    <section className="w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-600 grid grid-rows-[auto_1fr]">
      <CodeTabsHeader />
      <div></div>
    </section>
  );
}