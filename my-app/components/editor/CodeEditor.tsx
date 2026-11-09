"use client";

import React, { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

interface CodeEditorProps {
  initialLanguage?: string;
  defaultValue?: string;
}

/**
 * CodeEditor Component
 *
 * Core Responsibility:
 * Provides a minimal Monaco Editor instance wired to a local Yjs Y.Doc / Y.Text instance.
 *
 * Execution Flow:
 * 1. Component mounts -> initializes an in-memory Y.Doc and Y.Text('monaco').
 * 2. Monaco Editor loads -> onMount callback fires with editor instance.
 * 3. MonacoBinding binds Y.Text to editor.getModel() -> bidirectional sync active.
 * 4. Component unmounts -> MonacoBinding and Y.Doc destroyed cleanly to prevent memory leaks.
 */
export default function CodeEditor({
  initialLanguage = "typescript",
  defaultValue = "// Step 1: Monaco + Yjs CRDT initialized\nconsole.log('Hello, Collaborative World!');\n",
}: CodeEditorProps) {
  const [isBound, setIsBound] = useState(false);
  const docRef = useRef<Y.Doc | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Initialize Y.Doc once per component lifecycle
  if (!docRef.current) {
    docRef.current = new Y.Doc();
  }

  // Handle Monaco onMount lifecycle
  const handleEditorDidMount: OnMount = (editor) => {
    const ydoc = docRef.current;
    if (!ydoc) return;

    const ytext = ydoc.getText("monaco");
    const model = editor.getModel();

    if (!model) {
      console.error("[CodeEditor] Failed to retrieve Monaco text model.");
      return;
    }

    // Seed default value into Y.Text only if it is currently empty
    if (ytext.toString().length === 0 && defaultValue) {
      ytext.insert(0, defaultValue);
    }

    // Bind Monaco editor model directly to Y.Text
    // The MonacoBinding handles:
    // - Monaco model changes -> Yjs delta transactions
    // - Yjs remote/local transactions -> Monaco model updates without resetting cursor
    try {
      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        null // Awareness will be wired in Step 7
      );
      bindingRef.current = binding;
      setIsBound(true);
    } catch (err) {
      console.error("[CodeEditor] Failed to initialize MonacoBinding:", err);
    }
  };

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        // Disconnect event listeners and model observer
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (docRef.current) {
        // Destroy CRDT document memory store
        docRef.current.destroy();
        docRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white">
      {/* Minimal Header / Status Bar - Unobtrusive per minimal frontend constraint */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] text-xs font-mono bg-[#252526]">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isBound ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <span className="text-gray-300">
            {isBound ? "Yjs Bound (Local CRDT)" : "Initializing Editor..."}
          </span>
        </div>
        <div className="text-gray-400">Lang: {initialLanguage}</div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 w-full overflow-hidden">
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage={initialLanguage}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            tabSize: 2,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}

