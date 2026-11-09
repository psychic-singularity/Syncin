import * as Y from "yjs";
import type * as MonacoType from "monaco-editor";
import type { Awareness } from "y-protocols/awareness";

/**
 * Lightweight re-entrant execution lock to avoid mutual feedback loops
 * between Monaco's onDidChangeContent and Yjs's ytext.observe.
 */
function createMutex(): (fn: () => void) => void {
  let locked = false;
  return (fn: () => void) => {
    if (locked) return;
    locked = true;
    try {
      fn();
    } finally {
      locked = false;
    }
  };
}

class RelativeSelection {
  constructor(
    public readonly start: Y.RelativePosition,
    public readonly end: Y.RelativePosition
  ) {}
}

function createRelativeSelection(
  editor: MonacoType.editor.IStandaloneCodeEditor,
  model: MonacoType.editor.ITextModel,
  type: Y.Text
): RelativeSelection | null {
  const sel = editor.getSelection();
  if (!sel) return null;
  const startPos = sel.getStartPosition();
  const endPos = sel.getEndPosition();
  const start = Y.createRelativePositionFromTypeIndex(type, model.getOffsetAt(startPos));
  const end = Y.createRelativePositionFromTypeIndex(type, model.getOffsetAt(endPos));
  return new RelativeSelection(start, end);
}

function createMonacoSelectionFromRelativeSelection(
  editor: MonacoType.editor.IStandaloneCodeEditor,
  type: Y.Text,
  relSel: RelativeSelection,
  doc: Y.Doc,
  monaco: typeof MonacoType
): MonacoType.Selection | null {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc);
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc);
  if (start !== null && end !== null && start.type === type && end.type === type) {
    const model = editor.getModel();
    if (!model) return null;
    const startPos = model.getPositionAt(start.index);
    const endPos = model.getPositionAt(end.index);
    return new monaco.Selection(
      startPos.lineNumber,
      startPos.column,
      endPos.lineNumber,
      endPos.column
    );
  }
  return null;
}

/**
 * MonacoBinding
 *
 * Synchronizes a Monaco Editor text model with a Yjs Y.Text instance.
 * Accepts the live Monaco API instance passed from @monaco-editor/react to eliminate
 * all subpath bundling and version mismatch issues.
 */
export class MonacoBinding {
  public readonly doc: Y.Doc;
  public readonly ytext: Y.Text;
  public readonly monacoModel: MonacoType.editor.ITextModel;
  public readonly editor: MonacoType.editor.IStandaloneCodeEditor;
  public readonly awareness: Awareness | null;
  public readonly monaco: typeof MonacoType;

  private readonly mux = createMutex();
  private _savedSelection: RelativeSelection | null = null;
  private _decorations: string[] = [];
  private _ytextObserver: (event: Y.YTextEvent) => void;
  private _monacoChangeHandler: MonacoType.IDisposable;
  private _monacoDisposeHandler: MonacoType.IDisposable;
  private _cursorChangeHandler: MonacoType.IDisposable | null = null;
  private _beforeTransaction: () => void;
  private _rerenderDecorations: () => void;

  constructor(
    ytext: Y.Text,
    monacoModel: MonacoType.editor.ITextModel,
    editor: MonacoType.editor.IStandaloneCodeEditor,
    awareness: Awareness | null = null,
    monaco: typeof MonacoType
  ) {
    this.ytext = ytext;
    this.doc = ytext.doc!;
    this.monacoModel = monacoModel;
    this.editor = editor;
    this.awareness = awareness;
    this.monaco = monaco;

    // Save relative selection before transactions to maintain cursor location through remote changes
    this._beforeTransaction = () => {
      this.mux(() => {
        if (this.editor.getModel() === this.monacoModel) {
          this._savedSelection = createRelativeSelection(this.editor, this.monacoModel, this.ytext);
        }
      });
    };
    this.doc.on("beforeAllTransactions", this._beforeTransaction);

    // Decorate remote cursors/selections if awareness is active
    this._rerenderDecorations = () => {
      if (!this.awareness || this.editor.getModel() !== this.monacoModel) {
        if (this._decorations.length > 0) {
          this._decorations = this.editor.deltaDecorations(this._decorations, []);
        }
        return;
      }

      const newDecorations: MonacoType.editor.IModelDeltaDecoration[] = [];
      this.awareness.getStates().forEach((state, clientID) => {
        if (
          clientID !== this.doc.clientID &&
          state.selection &&
          state.selection.anchor &&
          state.selection.head
        ) {
          const anchorAbs = Y.createAbsolutePositionFromRelativePosition(state.selection.anchor, this.doc);
          const headAbs = Y.createAbsolutePositionFromRelativePosition(state.selection.head, this.doc);
          if (anchorAbs !== null && headAbs !== null && anchorAbs.type === this.ytext && headAbs.type === this.ytext) {
            const startIndex = Math.min(anchorAbs.index, headAbs.index);
            const endIndex = Math.max(anchorAbs.index, headAbs.index);
            const start = this.monacoModel.getPositionAt(startIndex);
            const end = this.monacoModel.getPositionAt(endIndex);

            newDecorations.push({
              range: new this.monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
              options: {
                className: `yRemoteSelection yRemoteSelection-${clientID}`,
                hoverMessage: { value: state.user?.name || `Peer #${clientID}` },
              },
            });
          }
        }
      });

      this._decorations = this.editor.deltaDecorations(this._decorations, newDecorations);
    };

    // 1. Listen to Yjs CRDT Text events -> Update Monaco Editor Model
    this._ytextObserver = (event: Y.YTextEvent) => {
      this.mux(() => {
        let index = 0;
        const edits: MonacoType.editor.IIdentifiedSingleEditOperation[] = [];

        event.delta.forEach((op) => {
          if (op.retain !== undefined) {
            index += op.retain;
          } else if (op.insert !== undefined) {
            const pos = this.monacoModel.getPositionAt(index);
            const range = new this.monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
            const text = typeof op.insert === "string" ? op.insert : "";
            edits.push({ range, text, forceMoveMarkers: true });
            index += text.length;
          } else if (op.delete !== undefined) {
            const pos = this.monacoModel.getPositionAt(index);
            const endPos = this.monacoModel.getPositionAt(index + op.delete);
            const range = new this.monaco.Range(pos.lineNumber, pos.column, endPos.lineNumber, endPos.column);
            edits.push({ range, text: "", forceMoveMarkers: true });
          }
        });

        if (edits.length > 0) {
          this.monacoModel.applyEdits(edits);
        }

        // Restore cursor position
        if (this._savedSelection) {
          const sel = createMonacoSelectionFromRelativeSelection(
            this.editor,
            this.ytext,
            this._savedSelection,
            this.doc,
            this.monaco
          );
          if (sel) {
            this.editor.setSelection(sel);
          }
        }
      });

      this._rerenderDecorations();
    };
    this.ytext.observe(this._ytextObserver);

    // Initial value synchronization
    const initialYText = this.ytext.toString();
    if (initialYText.length > 0 && this.monacoModel.getValue() !== initialYText) {
      this.monacoModel.setValue(initialYText);
    } else if (initialYText.length === 0 && this.monacoModel.getValue().length > 0) {
      this.ytext.insert(0, this.monacoModel.getValue());
    }

    // 2. Listen to Monaco model edits -> Update Yjs CRDT Text
    this._monacoChangeHandler = this.monacoModel.onDidChangeContent((event) => {
      this.mux(() => {
        this.doc.transact(() => {
          // Sort changes in reverse order to keep character offsets stable
          const sorted = [...event.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);
          sorted.forEach((change) => {
            this.ytext.delete(change.rangeOffset, change.rangeLength);
            if (change.text.length > 0) {
              this.ytext.insert(change.rangeOffset, change.text);
            }
          });
        }, this);
      });
    });

    // 3. Track cursor movements -> Broadcast via awareness
    if (this.awareness) {
      this._cursorChangeHandler = this.editor.onDidChangeCursorSelection(() => {
        if (this.editor.getModel() === this.monacoModel) {
          const sel = this.editor.getSelection();
          if (sel) {
            const anchorOffset = this.monacoModel.getOffsetAt(sel.getStartPosition());
            const headOffset = this.monacoModel.getOffsetAt(sel.getEndPosition());
            this.awareness?.setLocalStateField("selection", {
              anchor: Y.createRelativePositionFromTypeIndex(this.ytext, anchorOffset),
              head: Y.createRelativePositionFromTypeIndex(this.ytext, headOffset),
            });
          }
        }
      });
      this.awareness.on("change", this._rerenderDecorations);
    }

    // Handle model disposal
    this._monacoDisposeHandler = this.monacoModel.onWillDispose(() => {
      this.destroy();
    });
  }

  public destroy(): void {
    this._monacoChangeHandler.dispose();
    this._monacoDisposeHandler.dispose();
    if (this._cursorChangeHandler) {
      this._cursorChangeHandler.dispose();
    }
    this.ytext.unobserve(this._ytextObserver);
    this.doc.off("beforeAllTransactions", this._beforeTransaction);
    if (this.awareness) {
      this.awareness.off("change", this._rerenderDecorations);
    }
    if (this._decorations.length > 0) {
      try {
        this.editor.deltaDecorations(this._decorations, []);
      } catch {
        // editor may already be disposed
      }
    }
  }
}

