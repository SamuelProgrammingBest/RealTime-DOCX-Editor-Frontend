"use client";

import DocsEditor from "@/components/DocsEditor";
import {
  getCollaboratorProfiles,
  getInitials,
  type CollaboratorProfile,
} from "@/utils/collaborators";
import {
  ArrowLeft,
  Check,
  Copy,
  FileText,
  LoaderCircle,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

type DocumentData = {
  title?: string;
  content?: string;
};

export default function DocumentPage() {
  const { linkId } = useParams<{ linkId: string }>();
  const [document, setDocument] = useState<DocumentData>();
  const [guest, setGuest] = useState<boolean>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const socketInstance = io("http://localhost:4500", {
      withCredentials: true,
    });
    const handleActiveUsers = (activeUsers: unknown) => {
      setCollaborators(getCollaboratorProfiles(activeUsers, socketInstance.id));
    };

    const handleConnect = () => {
      setSocket(socketInstance);
      socketInstance.emit("get_and_join-document", linkId);
      socketInstance.on("active-users", handleActiveUsers);
      setCollaborators(getCollaboratorProfiles([], socketInstance.id));
    };
    const handleDocument = (doc: DocumentData, guest: any) => {
      setDocument(doc);
      setGuest(guest);
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("load-document", handleDocument);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("load-document", handleDocument);
      socketInstance.off("active-users", handleActiveUsers);
      socketInstance.disconnect();
    };
  }, [linkId]);

  const handleTitleChange = (newTitle: string) => {
    socket?.emit("title-change", linkId, newTitle);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  if (!document) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl border-4 border-[#282828] bg-white px-5 py-4 font-extrabold shadow-neobrutalism">
          <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
          Opening document…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf0] px-3 pb-10 pt-3 sm:px-6 sm:pt-5">
      <header className="sticky top-0 z-30 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b-4 border-[#282828] bg-[#fffaf0]/95 pb-4 backdrop-blur-sm">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to documents"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border-4 border-[#282828] bg-white shadow-neobrutalism transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft size={21} strokeWidth={2.8} aria-hidden="true" />
          </Link>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border-4 border-[#282828] bg-[#58CC02] shadow-neobrutalism">
            <FileText size={21} strokeWidth={2.6} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <input
              key={document.title}
              aria-label="Document title"
              defaultValue={document.title || "Untitled document"}
              readOnly={guest}
              onChange={(event) => handleTitleChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="w-full min-w-0 border-0 bg-transparent p-0 text-lg font-black outline-none focus:ring-0 sm:text-xl"
            />
            <p className="mt-0.5 text-xs font-bold text-[#282828]/55">
              Draftwell document
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {guest && (
            <Link
              href={{
                pathname: "/",
                query: { returnTo: `/docs/${linkId}` },
              }}
              aria-label="Sign in or create an account to edit this document"
              className="inline-flex h-11 items-center gap-2 rounded-xl border-4 border-[#282828] bg-[#58CC02] px-3 text-sm font-black shadow-neobrutalism transition-transform hover:-translate-y-0.5 sm:px-4"
            >
              <LogIn size={18} strokeWidth={2.7} aria-hidden="true" />
              <span>Sign in to edit</span>
            </Link>
          )}
          <div className="flex items-center" aria-label="Active collaborators">
            {collaborators.slice(0, 4).map((collaborator, index) => (
              <CollaboratorAvatar
                key={collaborator.id}
                collaborator={collaborator}
                index={index}
              />
            ))}
            {collaborators.length > 4 && (
              <span className="-ml-2 flex size-10 items-center justify-center rounded-full border-[3px] border-[#282828] bg-[#1CB0F6] text-xs font-black">
                +{collaborators.length - 4}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex h-11 items-center gap-2 rounded-xl border-4 border-[#282828] bg-[#FFC800] px-3 font-black shadow-neobrutalism transition-transform hover:-translate-y-0.5 sm:px-4"
          >
            {isCopied ? (
              <Check size={18} strokeWidth={3} aria-hidden="true" />
            ) : (
              <Copy size={18} strokeWidth={2.6} aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {isCopied ? "Copied" : "Share"}
            </span>
          </button>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-7xl" aria-label="Document editor">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-sm font-extrabold text-[#282828]/65">
            {collaborators.length > 1
              ? `${collaborators.length} people here now`
              : "Just you, for now"}
          </p>
          {collaborators[0] && (
            <span className="rounded-lg border-2 border-[#282828] bg-white px-2.5 py-1 text-xs font-black">
              {collaborators.find((person) => person.isCurrentUser)?.name ??
                "You"}
            </span>
          )}
        </div>
        <div className="min-h-[70vh] rounded-2xl border-4 border-[#282828] bg-white p-3 shadow-[6px_6px_0_#282828] sm:p-4 md:p-5">
          <div className="mx-auto max-w-6xl">
            <DocsEditor
              guest={guest}
              linkId={linkId}
              document={document}
              socket={socket}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function CollaboratorAvatar({
  collaborator,
  index,
}: {
  collaborator: CollaboratorProfile;
  index: number;
}) {
  return (
    <span
      title={collaborator.isCurrentUser ? "You" : collaborator.name}
      aria-label={collaborator.isCurrentUser ? "You" : collaborator.name}
      className="-ml-2 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#282828] shadow-[2px_2px_0_#282828] first:ml-0"
      style={{
        zIndex: 10 - index,
        backgroundColor: collaborator.backgroundColor,
      }}
    >
      {collaborator.avatarUrl ? (
        <span
          aria-hidden="true"
          className="size-full bg-cover bg-center"
          style={{ backgroundImage: `url("${collaborator.avatarUrl}")` }}
        />
      ) : (
        <span className="text-[11px] font-black">
          {getInitials(collaborator.name)}
        </span>
      )}
    </span>
  );
}
