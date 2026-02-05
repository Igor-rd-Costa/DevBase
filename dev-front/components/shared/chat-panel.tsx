"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import ChatBox, { ChatBoxHandle } from "@/components/code/chat/chat-box";

export default function ChatPanel() {
  const chatBoxRef = useRef<ChatBoxHandle>(null);

  const handleSend = (message: string) => {
    console.log("Sending message:", message);
    // TODO: Implement actual message sending logic
  };

  return (
    <section className="w-[22rem] h-full overflow-hidden border-r border-zinc-200 dark:border-zinc-700 shadow-[1px_0_2px_1px_black] grid grid-rows-[1fr_auto] bg-zinc-50/50 dark:bg-zinc-800/50 z-[99]">
      <div className="w-full h-full overflow-hidden">
        {/* Messages list will go here */}
      </div>
      <div className="w-full min-h-[8rem] p-3 overflow-hidden bg-zinc-50/50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full h-full bg-zinc-200 dark:bg-zinc-800 rounded-xl">
          <ChatBox ref={chatBoxRef} onSend={handleSend} placeholder="Ask anything..." />
          <button
            className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors z-10"
            title="Send message"
            onClick={() => chatBoxRef.current?.sendMessage()}
          >
            <Send className="w-4 h-4 relative right-[1px] top-[1px] text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>
      </div>
    </section>
  );
}