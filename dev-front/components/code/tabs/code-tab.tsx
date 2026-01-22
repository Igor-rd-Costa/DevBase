"use client";

type CodeTabProps = {
  label: string,
  isActive?: boolean
}

export default function CodeTab({ label, isActive = false }: CodeTabProps) {
  return (
    <div 
      className={`
        h-full px-3 flex items-center text-xs font-medium cursor-pointer
        transition-all duration-200 ease-in-out
        relative
        ${isActive 
          ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-t border-x border-zinc-200 dark:border-zinc-700 rounded-t-md shadow-sm" 
          : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-t-md"
        }
      `}
    >
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 dark:bg-blue-400" />
      )}
    </div>
  )
}


