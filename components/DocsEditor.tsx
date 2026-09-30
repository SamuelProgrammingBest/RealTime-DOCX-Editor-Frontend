"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useState, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Download,
  Italic,
  Link2,
  LoaderCircle,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import * as Y from "yjs";
import { base64ToUint8Array } from "@/app/dashboard/utils";
import { editorSchema } from "@/utils/editorSchema";
import EventEmitter from "events";
import { apiCall } from "@/utils/apiCall";

// 1. SIMPLE MOCK PROVIDER WITHOUT AWARENESS TO COMPLETELY PREVENT CURSOR CRASHES
export class SimpleCustomProvider extends EventEmitter {
  doc: Y.Doc;
  constructor(doc: Y.Doc) {
    super();
    this.doc = doc;
  }
  get synced() {
    return true;
  }
  connect() {}
  disconnect() {}
}

interface DocsEditorProps {
  linkId: any;
  document: any;
  socket: any;
  guest: any;
}

export default function DocsEditor({
  guest,
  linkId,
  document,
  socket,
}: DocsEditorProps) {
  const [ydoc] = useState(() => new Y.Doc());
  const isRemoteUpdate = useRef(false);
  const [fontSize, setFontSize] = useState("16px");
  const [blockFormat, setBlockFormat] = useState("paragraph");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [contentLoadError, setContentLoadError] = useState(false);
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  });

  const provider = new SimpleCustomProvider(ydoc);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateColorScheme = () => setPrefersDarkMode(mediaQuery.matches);
    updateColorScheme();
    mediaQuery.addEventListener("change", updateColorScheme);

    return () => mediaQuery.removeEventListener("change", updateColorScheme);
  }, []);

  // 2. INITIALIZE BLOCKNOTE WTH MOCKED STABLE BINDINGS
  const editor = useCreateBlockNote({
    schema: editorSchema,
    autofocus: true,
    collaboration: {
      provider,
      fragment: ydoc.getMap("content") as any, // Targets your explicit Y.Map structure
      user: { name: "User", color: "#000000" },
    },
  });

  // 3. CORRECT DECODE & WATERFALL INITIAL LOAD FROM MONGODB
  useEffect(() => {
    if (!editor || !document?.content) return;

    editor.isEditable = !guest;

    try {
      isRemoteUpdate.current = true;

      // Decode your base64 string to binary array
      const initialUpdate = base64ToUint8Array(document.content);
      Y.applyUpdate(ydoc, initialUpdate, "initial-load");

      // Pull document blocks out of the Y.Map space
      const ymap = ydoc.getMap("content");
      const savedBlocks = ymap.get("content") as any;

      if (savedBlocks && Array.isArray(savedBlocks) && savedBlocks.length > 0) {
        editor.replaceBlocks(editor.document, savedBlocks);
      }
    } catch (err) {
      setContentLoadError(true);
    } finally {
      isRemoteUpdate.current = false;
    }
  }, [editor, document?.content, ydoc]);

  // 4. CAPTURE LOCAL KEYSTROKES & REAL-TIME SOCKET UPDATES
  useEffect(() => {
    if (!editor || !socket || !linkId) return;

    // A. Listen for local typing inside the editor interface
    const unsubscribe = editor.onChange(() => {
      if (isRemoteUpdate.current) return;

      ydoc.transact(() => {
        const ymap = ydoc.getMap("content");
        ymap.set("content", editor.document);
      });
    });

    // B. Capture binary updates generated locally and broadcast to backend
    const handleLocalUpdate = (update: Uint8Array, origin: any) => {
      if (origin === "socket" || origin === "initial-load") return;
      socket.emit("typing-changes", linkId, Array.from(update));
    };

    // C. Listen for incoming character changes typed by remote users
    const handleRemoteUpdate = (incomingUpdate: any) => {
      isRemoteUpdate.current = true;

      const update = new Uint8Array(incomingUpdate);
      Y.applyUpdate(ydoc, update, "socket");

      const ymap = ydoc.getMap("content");
      const remoteBlocks = ymap.get("content") as any;

      if (remoteBlocks && Array.isArray(remoteBlocks)) {
        editor.replaceBlocks(editor.document, remoteBlocks);
      }

      isRemoteUpdate.current = false;
    };

    ydoc.on("update", handleLocalUpdate);
    socket.on("receive-changes", handleRemoteUpdate);

    return () => {
      unsubscribe();
      ydoc.off("update", handleLocalUpdate);
      socket.off("receive-changes", handleRemoteUpdate);
    };
  }, [editor, socket, ydoc, linkId]);

  const formattingActions = [
    {
      label: "Bold",
      icon: Bold,
      active: activeStyles.bold,
      apply: () => editor.toggleStyles({ bold: true }),
    },
    {
      label: "Italic",
      icon: Italic,
      active: activeStyles.italic,
      apply: () => editor.toggleStyles({ italic: true }),
    },
    {
      label: "Underline",
      icon: Underline,
      active: activeStyles.underline,
      apply: () => editor.toggleStyles({ underline: true }),
    },
    {
      label: "Strikethrough",
      icon: Strikethrough,
      active: activeStyles.strike,
      apply: () => editor.toggleStyles({ strike: true }),
    },
  ];

  const alignmentActions = [
    { label: "Align left", icon: AlignLeft, alignment: "left" },
    { label: "Align center", icon: AlignCenter, alignment: "center" },
    { label: "Align right", icon: AlignRight, alignment: "right" },
  ] as const;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(false);

    try {
      const htmlContent = editor.blocksToHTMLLossy(editor.document);

      const response = await apiCall("/download", "POST", {
        title: document.title,
        content: JSON.stringify(htmlContent),
      });

      if (response.status !== "successful") {
        setDownloadError(true);
        return;
      }

      const cleanBase64 = response.document.replace(/\s/g, "");
      // 2. Decode the Base64 string back into binary characters
      const binaryString = window.atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 3. Create the file Blob directly from the decoded bytes array
      const blob = new Blob([bytes.buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // 4. Trigger user download safely using window.document
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.download = `${response.title || "MyDocument"}.docx`;

      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setDownloadError(true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl border-4 border-[#282828] bg-[#1CB0F6] px-4 py-2 font-black shadow-[3px_3px_0_#282828] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
      >
        {isDownloading ? (
          <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          <Download size={18} strokeWidth={2.7} aria-hidden="true" />
        )}
        {isDownloading ? "Preparing Word file…" : "Download Word file"}
      </button>
      {downloadError && (
        <p role="alert" className="mb-4 font-bold text-[#C62828]">
          Could not prepare the Word file. Please try again.
        </p>
      )}
      {contentLoadError && (
        <p role="alert" className="mb-4 font-bold text-[#C62828]">
          Saved document content could not be loaded.
        </p>
      )}
      <div
        role="toolbar"
        aria-label="Document formatting"
        className="sticky top-30 z-20 mb-5 flex flex-wrap items-center gap-1.5 border-4 border-[#282828] bg-[#fffaf0] p-2 shadow-[3px_3px_0_#282828] sm:top-16"
      >
        <select
          aria-label="Text style"
          value={blockFormat}
          disabled={guest}
          onChange={(event) => {
            const format = event.currentTarget.value;
            const block = editor.getTextCursorPosition().block;

            if (format === "paragraph") {
              editor.updateBlock(block, { type: "paragraph" });
            } else if (format.startsWith("heading-")) {
              editor.updateBlock(block, {
                type: "heading",
                props: { level: Number(format.slice(-1)) },
              });
            } else if (format === "bulletListItem") {
              editor.updateBlock(block, { type: "bulletListItem" });
            } else if (format === "numberedListItem") {
              editor.updateBlock(block, { type: "numberedListItem" });
            }

            setBlockFormat(format);
          }}
          className="h-9 max-w-40 rounded-lg border-2 border-[#282828] bg-white px-2 text-sm font-bold disabled:opacity-50"
        >
          <option value="paragraph">Normal text</option>
          <option value="heading-1">Heading 1</option>
          <option value="heading-2">Heading 2</option>
          <option value="heading-3">Heading 3</option>
          <option value="bulletListItem">Bulleted list</option>
          <option value="numberedListItem">Numbered list</option>
        </select>

        <select
          aria-label="Font size"
          value={fontSize}
          disabled={guest}
          onChange={(event) => {
            const nextFontSize = event.currentTarget.value;
            setFontSize(nextFontSize);
            editor.addStyles({ fontSize: nextFontSize });
          }}
          className="h-9 w-18 rounded-lg border-2 border-[#282828] bg-white px-2 text-sm font-bold disabled:opacity-50"
        >
          {["12px", "14px", "16px", "18px", "24px", "32px"].map((size) => (
            <option key={size} value={size}>
              {size.replace("px", "")}
            </option>
          ))}
        </select>

        <span
          aria-hidden="true"
          className="mx-1 h-6 border-l-2 border-[#282828]/20"
        />

        {formattingActions.map(({ label, icon: Icon, active, apply }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            disabled={guest}
            onMouseDown={(event) => event.preventDefault()}
            onClick={apply}
            className={`flex size-9 items-center justify-center rounded-lg border-2 border-[#282828] transition-colors disabled:opacity-50 ${
              active ? "bg-[#FFC800]" : "bg-white hover:bg-[#FFC800]/50"
            }`}
          >
            <Icon size={17} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ))}

        <input
          type="color"
          aria-label="Text color"
          title="Text color"
          defaultValue="#282828"
          disabled={guest}
          onChange={(event) =>
            editor.addStyles({ textColor: event.currentTarget.value })
          }
          className="size-9 cursor-pointer rounded-lg border-2 border-[#282828] bg-white p-1 disabled:opacity-50"
        />

        <button
          type="button"
          aria-label="Insert link"
          title="Insert link"
          disabled={guest}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const url = window.prompt("Enter a link URL");
            if (url) editor.createLink(url, editor.getSelectedText());
          }}
          className="flex size-9 items-center justify-center rounded-lg border-2 border-[#282828] bg-white transition-colors hover:bg-[#FFC800]/50 disabled:opacity-50"
        >
          <Link2 size={17} strokeWidth={2.5} aria-hidden="true" />
        </button>

        <span
          aria-hidden="true"
          className="mx-1 h-6 border-l-2 border-[#282828]/20"
        />

        {alignmentActions.map(({ label, icon: Icon, alignment }) => (
          <button
            key={alignment}
            type="button"
            aria-label={label}
            title={label}
            disabled={guest}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              const block = editor.getTextCursorPosition().block;
              editor.updateBlock(block, {
                props: { textAlignment: alignment },
              });
            }}
            className="flex size-9 items-center justify-center rounded-lg border-2 border-[#282828] bg-white transition-colors hover:bg-[#FFC800]/50 disabled:opacity-50"
          >
            <Icon size={17} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ))}

        <button
          type="button"
          aria-label="Undo"
          title="Undo"
          disabled={guest}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.undo()}
          className="ml-auto flex size-9 items-center justify-center rounded-lg border-2 border-[#282828] bg-white transition-colors hover:bg-[#FFC800]/50 disabled:opacity-50"
        >
          <Undo2 size={17} strokeWidth={2.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Redo"
          title="Redo"
          disabled={guest}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.redo()}
          className="flex size-9 items-center justify-center rounded-lg border-2 border-[#282828] bg-white transition-colors hover:bg-[#FFC800]/50 disabled:opacity-50"
        >
          <Redo2 size={17} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      <BlockNoteView
        editor={editor}
        theme={prefersDarkMode ? "dark" : "light"}
        onSelectionChange={() => {
          const styles = editor.getActiveStyles();
          const block = editor.getTextCursorPosition().block;
          setFontSize(styles.fontSize ?? "16px");
          setActiveStyles({
            bold: Boolean(styles.bold),
            italic: Boolean(styles.italic),
            underline: Boolean(styles.underline),
            strike: Boolean(styles.strike),
          });
          setBlockFormat(
            block.type === "heading"
              ? `heading-${block.props.level}`
              : block.type,
          );
        }}
      />
    </div>
  );
}
