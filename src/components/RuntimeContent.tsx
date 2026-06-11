"use client";

import { createContext, useContext } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { RuntimeKnowledgeContent } from "../types";
import { createDefaultRuntimeContent } from "../lib/runtime-content";

type RuntimeContentContextValue = {
  content: RuntimeKnowledgeContent;
  setContent: Dispatch<SetStateAction<RuntimeKnowledgeContent>>;
};

const RuntimeContentContext = createContext<RuntimeContentContextValue>({
  content: createDefaultRuntimeContent(),
  setContent: () => undefined
});

export function RuntimeContentProvider({
  children,
  content,
  setContent
}: {
  children: ReactNode;
  content: RuntimeKnowledgeContent;
  setContent: Dispatch<SetStateAction<RuntimeKnowledgeContent>>;
}) {
  return <RuntimeContentContext.Provider value={{ content, setContent }}>{children}</RuntimeContentContext.Provider>;
}

export function useRuntimeContent() {
  return useContext(RuntimeContentContext);
}
