"use client";

import React, { useEffect, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type * as MonacoType from "monaco-editor";
import * as Y from "yjs";
import { MonacoBinding } from "@/lib/y-monaco";
import { WebsocketProvider } from "y-websocket";

interface CodeEditorProps {
  initialLanguage?: string;
  defaultValue?: string;
  documentId?: string;
  wsUrl?: string;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected";

/**
 * CodeEditor Component
 *
 * Core Responsibility:
 * Integrates Monaco Editor with Yjs CRDT (`Y.Doc`, `Y.Text`) and connects
 * to the standalone WebSocket server via `y-websocket` for real-time collaboration.
 *
 * Execution Flow (React 19 StrictMode Safe):
 * 1. Uses `useState(() => new Y.Doc())` to ensure CRDT store survives Strict Mode remounts.
 * 2. Connects `WebsocketProvider` to the WS Server at `NEXT_PUBLIC_WS_URL || "ws://localhost:4000"`.
 * 3. On Monaco `onMount`, stores `editorInstance` and `monacoInstance` into state.
 * 4. A reactive `useEffect` binds Monaco and Yjs as soon as both Editor and Provider are available.
 * 5. Transparently reflects both network connection and CRDT binding status in the UI.
 */
export default function CodeEditor({
  initialLanguage = "typescript",
  defaultValue = "// Collaborative Editor Ready\n// Open this URL in another tab to test real-time synchronization!\nconsole.log('Real-time sync active');\n",
  documentId = "demo-document",
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000",
}: CodeEditorProps) {
  // 1. Stable CRDT document instance (survives React Strict Mode remounts)
  const [ydoc] = useState<Y.Doc>(() => new Y.Doc());

  // 2. Reactive instances for deterministic coordination
  const [editorInstance, setEditorInstance] = useState<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<typeof MonacoType | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  // 3. Status state
  const [isBound, setIsBound] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [connectedClients, setConnectedClients] = useState<number>(1);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  // Clean up Y.Doc when component unmounts permanently
  useEffect(() => {
    return () => {
      ydoc.destroy();
    };
  }, [ydoc]);

  // Manage WebSocket Provider connection lifecycle
  useEffect(() => {
    try {
      const wsProvider = new WebsocketProvider(wsUrl, documentId, ydoc);
      setProvider(wsProvider);

      wsProvider.on("status", (event: { status: ConnectionStatus }) => {
        setConnectionStatus(event.status);
      });

      // Seed default template only after initial handshake verifies document is empty
      wsProvider.on("sync", (isSynced: boolean) => {
        if (isSynced) {
          const ytext = ydoc.getText("monaco");
          if (ytext.toString().length === 0 && defaultValue) {
            ytext.insert(0, defaultValue);
          }
        }
      });

      // Track presence / collaborator count via Yjs awareness
      const updateClientCount = () => {
        if (wsProvider.awareness) {
          setConnectedClients(wsProvider.awareness.getStates().size || 1);
        }
      };

      wsProvider.awareness.on("change", updateClientCount);

      return () => {
        wsProvider.awareness.off("change", updateClientCount);
        wsProvider.destroy();
        setProvider(null);
      };
    } catch (err: any) {
      console.error("[CodeEditor] WebSocket error:", err);
      setDiagnosticError(err?.message || String(err));
    }
  }, [wsUrl, documentId, ydoc, defaultValue]);

  // Capture Monaco instances onMount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);
  };

  // Reactively bind Monaco to Yjs once both Editor and Provider are ready
  useEffect(() => {
    if (!editorInstance || !monacoInstance || !provider) {
      return;
    }

    const model = editorInstance.getModel();
    if (!model) {
      setDiagnosticError("Failed to retrieve Monaco text model.");
      return;
    }

    try {
      const ytext = ydoc.getText("monaco");
      const binding = new MonacoBinding(
        ytext,
        model,
        editorInstance,
        provider.awareness,
        monacoInstance
      );

      setIsBound(true);
      setDiagnosticError(null);

      return () => {
        binding.destroy();
        setIsBound(false);
      };
    } catch (err: any) {
      console.error("[CodeEditor] Failed to initialize MonacoBinding:", err);
      setDiagnosticError(err?.message || String(err));
    }
  }, [editorInstance, monacoInstance, provider, ydoc]);

  const getStatusColor = () => {
    if (!isBound) return "bg-amber-500";
    switch (connectionStatus) {
      case "connected":
        return "bg-emerald-500";
      case "connecting":
        return "bg-amber-500";
      case "disconnected":
        return "bg-rose-500";
    }
  };

  const getStatusText = () => {
    if (!isBound) return "Initializing Editor Binding...";
    switch (connectionStatus) {
      case "connected":
        return `Live Sync (Room: ${documentId} · ${connectedClients} online)`;
      case "connecting":
        return `Connecting to WS (${wsUrl})...`;
      case "disconnected":
        return "Disconnected (Offline Mode)";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white">
      {/* Diagnostic Error Banner if an error occurred */}
      {diagnosticError && (
        <div className="bg-red-900 border-b border-red-700 px-4 py-2 text-xs font-mono text-red-100 flex items-center justify-between">
          <span>⚠️ Error: {diagnosticError}</span>
          <button
            onClick={() => setDiagnosticError(null)}
            className="text-red-300 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header / Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] text-xs font-mono bg-[#252526]">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-gray-300">{getStatusText()}</span>
        </div>
        <div className="flex items-center space-x-4 text-gray-400">
          <span>
            WS:{" "}
            <strong
              className={
                connectionStatus === "connected"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }
            >
              {connectionStatus}
            </strong>
          </span>
          <span>
            Editor:{" "}
            <strong
              className={
                isBound ? "text-emerald-400" : "text-amber-400"
              }
            >
              {isBound ? "Bound" : "Unbound"}
            </strong>
          </span>
          <span>Lang: {initialLanguage}</span>
        </div>
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
