"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { defaultKeymap, insertNewline } from "@codemirror/commands";

export interface ChatBoxProps {
    onSend?: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export interface ChatBoxHandle {
    sendMessage: () => void;
    focus: () => void;
}

const ChatBox = forwardRef<ChatBoxHandle, ChatBoxProps>(
    ({ onSend, placeholder = "Type a message...", className = "" }, ref) => {
        const editorRef = useRef<HTMLDivElement>(null);
        const viewRef = useRef<EditorView | null>(null);

        const sendMessage = () => {
            if (viewRef.current) {
                const value = viewRef.current.state.doc.toString().trim();
                if (value && onSend) {
                    onSend(value);
                    viewRef.current.dispatch({
                        changes: { from: 0, to: viewRef.current.state.doc.length, insert: "" },
                    });
                }
            }
        };

        useImperativeHandle(ref, () => ({
            sendMessage,
            focus: () => {
                if (viewRef.current) {
                    viewRef.current.focus();
                }
            },
        }));

        useEffect(() => {
            if (!editorRef.current) return;

            const startState = EditorState.create({
                doc: "",
                extensions: [
                    basicSetup,
                    cmPlaceholder(placeholder),
                    keymap.of([
                        ...defaultKeymap,
                        {
                            key: "Enter",
                            run: () => {
                                sendMessage();
                                return true;
                            },
                            shift: insertNewline,
                        },
                    ]),
                    EditorView.theme({
                        "&": {
                            height: "100%",
                            fontSize: "14px",
                            backgroundColor: "transparent !important",
                        },
                        ".cm-content": {
                            padding: "12px",
                            fontFamily: "inherit",
                        },
                        "&.cm-focused": {
                            outline: "none",
                        },
                        ".cm-activeLine": {
                            backgroundColor: "transparent !important",
                        },
                        ".cm-gutters": {
                            display: "none",
                        },
                        ".cm-scroller": {
                            overflow: "auto",
                            scrollbarWidth: "none",
                        },
                        ".cm-scroller::-webkit-scrollbar": {
                            display: "none",
                        },
                        ".cm-placeholder": {
                            color: "#a1a1aa",
                            fontStyle: "italic",
                        }
                    }, { dark: true }),
                ],
            });

            const view = new EditorView({
                state: startState,
                parent: editorRef.current,
            });

            viewRef.current = view;

            return () => {
                view.destroy();
            };
        }, [onSend, placeholder]);

        return (
            <div className={`relative group flex flex-col w-full h-full ${className}`}>
                <div
                    ref={editorRef}
                    className="w-full h-full min-h-[80px] bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-sm transition-all duration-200 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 focus-within:ring-4 focus-within:ring-zinc-500/5 shadow-sm overflow-hidden"
                />
            </div>
        );
    }
);

ChatBox.displayName = "ChatBox";

export default ChatBox;
