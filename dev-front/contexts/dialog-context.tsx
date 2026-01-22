"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export enum DialogType {
  OK,
  YES_NO,
  NO_BUTTONS,
  CUSTOM
}

export type DialogBaseProps = { onOpenChange: (value: any) => void };

export type DialogRenderType = "dialog" | "popup";

export interface DialogContextType {
  show: <T = any>(
    type: DialogType,
    title: string,
    component: (props: DialogBaseProps) => React.ReactNode,
    props?: object,
    renderType?: DialogRenderType,
    target?: HTMLElement | null
  ) => Promise<T> & { id: string };
  update: (id: string, props: object) => void;
}

const DialogContext = createContext<DialogContextType>({
  show: (() => {
    const p = Promise.resolve(null);
    (p as any).id = "";
    return p as any;
  }) as any,
  update: () => { },
});

export function useDialog() {
  return useContext(DialogContext);
}

interface DialogSettings {
  id: string,
  type: DialogType,
  title: string,
  component: ((props: DialogBaseProps) => React.ReactNode),
  props: object,
  renderType: DialogRenderType,
  target: HTMLElement | null,
}

type DialogWrapperProps = React.PropsWithChildren & {
  type: DialogType,
  title: string,
  onOpenChange: (val: any) => void,
}

type PopupWrapperProps = React.PropsWithChildren & {
  target: HTMLElement | null,
  onOpenChange: (val: any) => void,
}

function PopupWrapper({ target, onOpenChange, children }: PopupWrapperProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Use useLayoutEffect to prevent flickering by calculating position before paint
  React.useLayoutEffect(() => {
    if (!target || !popupRef.current) {
      onOpenChange(null);
      return;
    };

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      const popupRect = popupRef.current?.getBoundingClientRect();
      const popupHeight = popupRect?.height || 0;

      let top = rect.bottom + 4; // Add a small gap
      let left = rect.left;

      // Match width with target
      const width = rect.width;

      if (top + popupHeight > window.innerHeight) {
        popupRef.current!.style.maxHeight = `${window.innerHeight - top - 8}px`;
        if (top < 0) {
          top = Math.max(8, window.innerHeight - popupHeight - 8);
        }
      }

      if (left + width > window.innerWidth) {
        left = window.innerWidth - width - 8;
      }

      if (left < 0) {
        left = 8;
      }

      setPosition({ top, left, width });
    };

    updatePosition();

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [target]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        target &&
        !target.contains(event.target as Node)
      ) {
        onOpenChange(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [target, onOpenChange]);

  if (!target) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-[102] bg-white dark:bg-zinc-900 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-zinc-800/50 overflow-hidden flex flex-col backdrop-blur-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        opacity: position.width ? 1 : 0, // Hide until position is calculated
      }}
    >
      {children}
    </div>
  );
}

function DialogWrapper({ type, title, onOpenChange, children }: DialogWrapperProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-[101] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-zinc-200 dark:border-zinc-800 ring-1 ring-zinc-900/5">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {title}
          </h2>
          <div className="text-zinc-700 dark:text-zinc-300">
            {children}
          </div>
        </div>
        {type !== DialogType.NO_BUTTONS && (
          <div className="flex justify-end gap-2 p-6 pt-0 border-t border-zinc-200 dark:border-zinc-700">
            {type === DialogType.OK ? (
              <button
                type="button"
                onClick={() => onOpenChange(true)}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition-colors shadow-sm"
              >
                Ok
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(true)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition-colors shadow-sm"
                >
                  Yes
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface DialogProviderProps {
  children: React.ReactNode
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [openDialogs, setOpenDialogs] = useState<DialogSettings[]>([]);
  const resolveFunctions = useRef<{ [key: string]: (value: any) => void }>({});

  const onOpenChange = (value: any, id: string) => {
    if (resolveFunctions.current[id]) {
      resolveFunctions.current[id](value);
      delete resolveFunctions.current[id];
    }
    setOpenDialogs((prev) => prev.filter((dialog) => dialog.id !== id));
  };

  useEffect(() => {
    console.log(openDialogs);
  }, [openDialogs])

  const show = <T = any>(
    type: DialogType,
    title: string,
    component: (props: DialogBaseProps) => React.ReactNode,
    props?: object,
    renderType: DialogRenderType = "dialog",
    target?: HTMLElement | null
  ): Promise<T> & { id: string } => {
    const id = crypto.randomUUID();
    const promise = new Promise<T>((resolve) => {
      setOpenDialogs((prev) => {
        let next = prev;

        // If the new dialog is a popup, close any existing popups
        if (renderType === "popup") {
          const popupsToClose = prev.filter(d => d.renderType === "popup");
          popupsToClose.forEach(d => {
            if (resolveFunctions.current[d.id]) {
              resolveFunctions.current[d.id](null);
              delete resolveFunctions.current[d.id];
            }
          });
          next = prev.filter(d => d.renderType !== "popup");
        }

        return [...next, {
          id: id,
          type: type,
          title: title,
          component: component,
          props: props || {},
          renderType: renderType,
          target: target || null,
        }];
      });
      resolveFunctions.current[id] = resolve;
    });

    (promise as any).id = id;
    return promise as Promise<T> & { id: string };
  };

  const update = (id: string, props: object) => {
    setOpenDialogs((prev) =>
      prev.map((dialog) =>
        dialog.id === id
          ? { ...dialog, props: { ...dialog.props, ...props } }
          : dialog
      )
    );
  };

  const contextValue = useMemo(() => ({ show, update }), []);

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {openDialogs.length > 0 && (
        <>
          {openDialogs.map((dialog) => {
            const handleOpenChange = (value: any) => {
              onOpenChange(value, dialog.id);
            };

            if (dialog.renderType === "popup") {
              if (dialog.type !== DialogType.CUSTOM) {
                return (
                  <PopupWrapper key={dialog.id} target={dialog.target} onOpenChange={handleOpenChange}>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        {dialog.title}
                      </h3>
                      <div className="text-zinc-700 dark:text-zinc-300">
                        <dialog.component onOpenChange={handleOpenChange} {...dialog.props} />
                      </div>
                      {dialog.type !== DialogType.NO_BUTTONS && (
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                          {dialog.type === DialogType.OK ? (
                            <button
                              type="button"
                              onClick={() => handleOpenChange(true)}
                              className="px-3 py-1.5 text-sm rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition-colors shadow-sm"
                            >
                              Ok
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                              >
                                No
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenChange(true)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition-colors shadow-sm"
                              >
                                Yes
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </PopupWrapper>
                );
              } else {
                return (
                  <PopupWrapper key={dialog.id} target={dialog.target} onOpenChange={handleOpenChange}>
                    <dialog.component onOpenChange={handleOpenChange} {...dialog.props} />
                  </PopupWrapper>
                );
              }
            } else {
              if (dialog.type !== DialogType.CUSTOM) {
                return (
                  <DialogWrapper key={dialog.id} type={dialog.type} title={dialog.title} onOpenChange={handleOpenChange}>
                    <dialog.component onOpenChange={handleOpenChange} {...dialog.props} />
                  </DialogWrapper>
                );
              } else {
                return <dialog.component key={dialog.id} onOpenChange={handleOpenChange} {...dialog.props} />;
              }
            }
          })}
        </>
      )}
    </DialogContext.Provider>
  );
}

