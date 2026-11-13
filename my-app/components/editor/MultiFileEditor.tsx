"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import type * as MonacoType from "monaco-editor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "@/lib/y-monaco";
import Link from "next/link";

export interface FileItem {
  id: string;
  name: string;
  createdAt: number;
}

interface MultiFileEditorProps {
  roomName: string;
  wsUrl?: string;
}

const USER_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
];

function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

export default function MultiFileEditor({
  roomName,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000",
}: MultiFileEditorProps) {
  // Stable Y.Doc CRDT store (survives React StrictMode double-invocations)
  const [ydoc] = useState<Y.Doc>(() => new Y.Doc());

  // User Identity State
  const [userName, setUserName] = useState<string>("");
  const [userColor, setUserColor] = useState<string>("");
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
  const [tempNameInput, setTempNameInput] = useState("");

  // Editor and WebSocket instances
  const [editorInstance, setEditorInstance] = useState<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<typeof MonacoType | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // File state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>("index.js");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  // Collaborators awareness state
  const [collaborators, setCollaborators] = useState<Array<{
    clientId: number;
    name: string;
    color: string;
    activeFile?: string;
    isTyping?: boolean;
  }>>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [isCopied, setIsCopied] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize user profile from localStorage or prompt
  useEffect(() => {
    const savedName = localStorage.getItem("collab_user_name");
    const savedColor = localStorage.getItem("collab_user_color") || getRandomColor();

    if (savedName && savedName.trim().length > 0) {
      setUserName(savedName.trim());
      setUserColor(savedColor);
      localStorage.setItem("collab_user_color", savedColor);
    } else {
      setUserColor(savedColor);
      localStorage.setItem("collab_user_color", savedColor);
      setIsNamePromptOpen(true);
    }
  }, []);

  // Save Name Handler
  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = tempNameInput.trim();
    if (cleanName.length === 0) return;

    setUserName(cleanName);
    localStorage.setItem("collab_user_name", cleanName);
    setIsNamePromptOpen(false);

    if (provider?.awareness) {
      provider.awareness.setLocalStateField("user", {
        name: cleanName,
        color: userColor,
        activeFile: activeFileId,
        isTyping: false,
      });
    }
  };

  // 2. Manage WebSocket Provider connection lifecycle
  useEffect(() => {
    try {
      const wsProvider = new WebsocketProvider(wsUrl, roomName, ydoc);
      setProvider(wsProvider);

      wsProvider.on("status", (event: { status: "connecting" | "connected" | "disconnected" }) => {
        setConnectionStatus(event.status);
      });

      // Synchronize file catalog from Yjs Map
      const filesMap = ydoc.getMap<FileItem>("files");

      const updateFileList = () => {
        const fileList: FileItem[] = [];
        filesMap.forEach((item) => {
          if (item && item.id) {
            fileList.push(item);
          }
        });
        fileList.sort((a, b) => a.createdAt - b.createdAt);
        setFiles(fileList);
      };

      filesMap.observe(updateFileList);

      // On initial sync, seed index.js if room is brand new
      wsProvider.on("sync", (isSynced: boolean) => {
        if (isSynced) {
          if (filesMap.size === 0) {
            const starterCode = `// Collaborative Room: ${roomName}
// All files and edits synchronize in real-time across collaborators.
// Note: This room automatically resets daily at 00:00 IST.

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const shoppingCart = [
  { name: "Coffee", price: 4.5 },
  { name: "Donut", price: 2.5 },
];

console.log("Total:", calculateTotal(shoppingCart));
`;
            const indexText = ydoc.getText("file:index.js");
            if (indexText.toString().length === 0) {
              indexText.insert(0, starterCode);
            }
            filesMap.set("index.js", {
              id: "index.js",
              name: "index.js",
              createdAt: Date.now(),
            });
          }
          updateFileList();
        }
      });

      // Track awareness (collaborator cursors, active files, typing flags)
      const updateAwareness = () => {
        if (!wsProvider.awareness) return;
        const peerList: Array<{
          clientId: number;
          name: string;
          color: string;
          activeFile?: string;
          isTyping?: boolean;
        }> = [];

        wsProvider.awareness.getStates().forEach((state, cId) => {
          if (cId !== ydoc.clientID && state.user?.name) {
            peerList.push({
              clientId: cId,
              name: state.user.name,
              color: state.user.color || "#3B82F6",
              activeFile: state.user.activeFile,
              isTyping: Boolean(state.user.isTyping),
            });
          }
        });
        setCollaborators(peerList);
      };

      wsProvider.awareness.on("change", updateAwareness);

      return () => {
        filesMap.unobserve(updateFileList);
        wsProvider.awareness.off("change", updateAwareness);
        wsProvider.destroy();
        setProvider(null);
      };
    } catch (err) {
      console.error("[MultiFileEditor] WebSocket connection error:", err);
    }
  }, [wsUrl, roomName, ydoc]);

  // 3. Update local user profile in awareness whenever identity or active file changes
  useEffect(() => {
    if (!provider?.awareness || !userName) return;

    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
      activeFile: activeFileId,
      isTyping: false,
    });
  }, [provider, userName, userColor, activeFileId]);

  // 4. Bind Monaco model to active file's Y.Text
  const bindActiveFile = useCallback(() => {
    if (!editorInstance || !monacoInstance || !activeFileId) return;

    // Dispose existing binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const ytext = ydoc.getText(`file:${activeFileId}`);
    const currentModel = editorInstance.getModel();

    if (currentModel) {
      // Ensure language is javascript
      monacoInstance.editor.setModelLanguage(currentModel, "javascript");

      // Bind Monaco Model to Y.Text
      const binding = new MonacoBinding(
        ytext,
        currentModel,
        editorInstance,
        provider?.awareness || null,
        monacoInstance,
        activeFileId
      );
      bindingRef.current = binding;
    }
  }, [editorInstance, monacoInstance, activeFileId, ydoc, provider]);

  useEffect(() => {
    bindActiveFile();
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [bindActiveFile]);

  // 5. Track typing state and broadcast to peers
  const handleEditorChange = () => {
    if (!provider?.awareness || !userName) return;

    // Set typing flag
    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
      activeFile: activeFileId,
      isTyping: true,
    });

    // Debounce to clear typing flag after 1.2s of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (provider?.awareness) {
        provider.awareness.setLocalStateField("user", {
          name: userName,
          color: userColor,
          activeFile: activeFileId,
          isTyping: false,
        });
      }
    }, 1200);
  };

  // 6. File Operations
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);
    let name = newFileNameInput.trim();
    if (!name) return;

    if (!name.endsWith(".js")) {
      name += ".js";
    }

    // Validation: check for duplicates
    const filesMap = ydoc.getMap<FileItem>("files");
    if (filesMap.has(name)) {
      setFileError("A file with this name already exists.");
      return;
    }

    // Initialize content
    const ytext = ydoc.getText(`file:${name}`);
    if (ytext.toString().length === 0) {
      ytext.insert(0, `// ${name}\n\nexport function example() {\n  return true;\n}\n`);
    }

    filesMap.set(name, {
      id: name,
      name,
      createdAt: Date.now(),
    });

    setNewFileNameInput("");
    setIsCreatingFile(false);
    setActiveFileId(name);
  };

  const handleDeleteFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert("Rooms must maintain at least one file.");
      return;
    }

    const filesMap = ydoc.getMap<FileItem>("files");
    filesMap.delete(fileId);

    // If active file was deleted, switch to first remaining file
    if (activeFileId === fileId) {
      const remaining = files.filter((f) => f.id !== fileId);
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Collaborator typing pill
  const typingCollaborator = collaborators.find((c) => c.isTyping);

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden">
      {/* Header Bar */}
      <header className="flex h-12 w-full items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 text-xs">
        {/* Left: App Brand & Room Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/rooms"
            className="flex items-center gap-1 font-semibold text-zinc-200 hover:text-white transition-colors"
          >
            <span className="font-mono text-emerald-400 font-bold">&lt;/&gt;</span>
            <span>CodeRoom</span>
          </Link>

          <span className="text-zinc-600">/</span>

          <div className="flex items-center gap-1.5 font-mono text-zinc-300 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
            <span>{roomName}</span>
            <button
              onClick={handleCopyLink}
              title="Copy shareable link"
              className="text-zinc-400 hover:text-white transition-colors text-[11px] ml-1"
            >
              {isCopied ? <span className="text-emerald-400 font-sans font-medium">Copied!</span> : "Copy Link"}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 pl-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-emerald-500"
                  : connectionStatus === "connecting"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Center: Live Typing Banner */}
        <div className="hidden md:flex items-center">
          {typingCollaborator && (
            <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px] bg-zinc-950/80 px-2.5 py-1 rounded border border-zinc-800">
              <span
                className="inline-block h-2 w-2 rounded-full animate-ping"
                style={{ backgroundColor: typingCollaborator.color }}
              />
              <span>
                <strong style={{ color: typingCollaborator.color }}>{typingCollaborator.name}</strong> is typing...
              </span>
            </div>
          )}
        </div>

        {/* Right: Reset Notice, Collaborator List & Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center font-mono text-[11px] text-zinc-500">
            <span>Resets at 00:00 IST</span>
          </div>

          {/* Collaborator Avatars */}
          <div className="flex items-center -space-x-1.5">
            {/* Self */}
            {userName && (
              <div
                title={`${userName} (You)`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white border border-zinc-900"
                style={{ backgroundColor: userColor }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Peers */}
            {collaborators.map((peer) => (
              <div
                key={peer.clientId}
                title={`${peer.name}${peer.activeFile ? ` (in ${peer.activeFile})` : ""}${
                  peer.isTyping ? " - Typing..." : ""
                }`}
                className="relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white border border-zinc-900"
                style={{ backgroundColor: peer.color }}
              >
                {peer.name.charAt(0).toUpperCase()}
                {peer.isTyping && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-zinc-900 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {/* User Name Badge (Click to Edit) */}
          <button
            onClick={() => {
              setTempNameInput(userName);
              setIsNamePromptOpen(true);
            }}
            title="Click to change your display name"
            className="flex items-center gap-1 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition-colors text-xs"
          >
            <span className="font-medium max-w-[100px] truncate">{userName || "Set Name"}</span>
            <span className="text-[10px] text-zinc-400">✎</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area (Sidebar + Editor) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: File Explorer */}
        <aside className="flex w-52 flex-col border-r border-zinc-800 bg-zinc-900/60 select-none">
          {/* Files Section Header */}
          <div className="flex h-9 items-center justify-between border-b border-zinc-800/80 px-3 text-[11px] font-semibold text-zinc-400">
            <span>FILES</span>
            <button
              onClick={() => {
                setIsCreatingFile(true);
                setFileError(null);
              }}
              title="Create new JavaScript file"
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded hover:bg-zinc-800"
            >
              + New File
            </button>
          </div>

          {/* Inline Create File Input */}
          {isCreatingFile && (
            <form onSubmit={handleCreateFile} className="border-b border-zinc-800 bg-zinc-950 p-2">
              <input
                type="text"
                autoFocus
                placeholder="filename.js"
                value={newFileNameInput}
                onChange={(e) => setNewFileNameInput(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
              {fileError && <div className="mt-1 text-[10px] text-red-400 font-mono">{fileError}</div>}
              <div className="mt-2 flex justify-end gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setIsCreatingFile(false)}
                  className="rounded px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-2 py-0.5 font-medium text-white hover:bg-emerald-500"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Files List */}
          <nav className="flex-1 overflow-y-auto py-1">
            {files.map((file) => {
              const isActive = file.id === activeFileId;
              const peersInFile = collaborators.filter((c) => c.activeFile === file.id);

              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer font-mono text-xs transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white font-medium border-l-2 border-emerald-500"
                      : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[11px] text-amber-400 font-bold">JS</span>
                    <span className="truncate">{file.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Peer count badge in file */}
                    {peersInFile.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 bg-zinc-950 px-1 py-0.2 rounded border border-zinc-800">
                        <span>●</span>
                        <span>{peersInFile.length}</span>
                      </span>
                    )}

                    {/* Delete button (only if > 1 file) */}
                    {files.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        title={`Delete ${file.name}`}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-0.5 transition-opacity"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer: Daily Reset Reminder */}
          <div className="border-t border-zinc-800 p-2 text-[10px] text-zinc-500 font-mono">
            <div>Daily Reset: 00:00 IST</div>
            <div className="text-zinc-600">Ephemeral room</div>
          </div>
        </aside>

        {/* Right / Center: Active File Tab & Monaco Editor */}
        <main className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
          {/* Tab Header Bar */}
          <div className="flex h-8 items-center border-b border-zinc-800 bg-zinc-900 px-2">
            <div className="flex items-center gap-2 border-b border-emerald-500 bg-[#1e1e1e] px-3 py-1 text-xs font-mono text-zinc-100">
              <span className="text-amber-400 font-bold">JS</span>
              <span>{activeFileId}</span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full h-full relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language="javascript"
              onMount={(editor, monaco) => {
                setEditorInstance(editor);
                setMonacoInstance(monaco);
              }}
              onChange={handleEditorChange}
              options={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                lineNumbers: "on",
                renderWhitespace: "selection",
                minimap: { enabled: false },
                automaticLayout: true,
                tabSize: 2,
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </div>
        </main>
      </div>

      {/* Name Prompt Modal (Prompt on entry or click to rename) */}
      {isNamePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base">Enter Your Name</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Your name will be visible to collaborators and displayed on your live cursor.
            </p>

            <form onSubmit={handleSaveName} className="mt-4">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Sanjay"
                value={tempNameInput}
                onChange={(e) => setTempNameInput(e.target.value)}
                maxLength={24}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />

              <div className="mt-4 flex justify-end gap-2">
                {userName && (
                  <button
                    type="button"
                    onClick={() => setIsNamePromptOpen(false)}
                    className="rounded border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={tempNameInput.trim().length === 0}
                  className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Join Collaboration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

