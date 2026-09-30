"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  ArrowDownWideNarrow,
  AlertTriangle,
  BookOpenText,
  Clock3,
  FileText,
  FolderClosed,
  LayoutDashboard,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  createDocument as createDocumentRequest,
  deleteDocument as deleteDocumentRequest,
  getDocuments,
  getLoggedInUserandDocuments,
} from "@/utils/getDashboard";
import {
  getUser,
  normalizeDocuments,
  type DashboardUser,
  type DocumentItem,
} from "./utils";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return documents;

    return documents.filter((document) =>
      `${document.title} ${document.category}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [documents, query]);

  useEffect(() => {
    const fetchUserAndDocuments = async () => {
      try {
        setIsLoading(true);
        setLoadError(false);
        const response = await getLoggedInUserandDocuments();
        if (!response) throw new Error("Dashboard response was empty.");
        const loggedInUser = getUser(response[0]);
        if (!loggedInUser) {
          router.replace("/?auth=required");
          return;
        }
        setUser(loggedInUser);
        setDocuments(normalizeDocuments(response[1]));
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 401 || error.response?.status === 403)
        ) {
          router.replace("/?auth=required");
          return;
        }
        setUser(null);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndDocuments();
  }, [retryCount, router]);

  const handleCreateDocument = async () => {
    try {
      setIsCreating(true);
      setCreateError(false);
      await createDocumentRequest();
      setDocuments(normalizeDocuments(await getDocuments()));
      router.push(`/docs/${documents[documents.length - 1].id}`);
    } catch {
      setCreateError(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      setDeletingId(documentToDelete.id);
      setDeleteError(false);
      await deleteDocumentRequest(documentToDelete.id);
      setDocuments((currentDocuments) =>
        currentDocuments.filter(
          (document) => document.id !== documentToDelete.id,
        ),
      );
      setDocumentToDelete(null);
    } catch {
      setDeleteError(true);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <main
        aria-busy="true"
        aria-label="Loading your documents"
        className="min-h-screen px-4 py-5 sm:px-8 sm:py-8"
      >
        <div className="mx-auto max-w-7xl">
          <header className="flex items-center gap-3 border-b-4 border-[#282828] pb-5">
            <span className="flex size-11 items-center justify-center rounded-2xl border-4 border-[#282828] bg-[#58CC02] shadow-neobrutalism">
              <BookOpenText aria-hidden="true" size={23} strokeWidth={2.5} />
            </span>
            <span className="text-xl font-black sm:text-2xl">Draftwell</span>
          </header>
          <div className="mt-10 animate-pulse">
            <div className="h-4 w-28 rounded bg-[#282828]/15" />
            <div className="mt-3 h-10 w-64 rounded bg-[#282828]/15" />
            <div className="mt-3 h-5 w-80 max-w-full rounded bg-[#282828]/10" />
            <div className="mt-8 flex gap-3">
              <div className="h-24 w-40 rounded-2xl border-4 border-[#282828]/15 bg-white" />
              <div className="h-24 w-40 rounded-2xl border-4 border-[#282828]/15 bg-[#FFC800]/35" />
            </div>
            <div className="mt-9 overflow-hidden rounded-2xl border-4 border-[#282828]/15 bg-white">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 border-b-2 border-[#282828]/10 px-4 py-5 last:border-b-0 sm:px-5"
                >
                  <div className="size-11 shrink-0 rounded-xl bg-[#282828]/10" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-48 max-w-full rounded bg-[#282828]/15" />
                    <div className="mt-2 h-3 w-72 max-w-full rounded bg-[#282828]/10" />
                  </div>
                  <div className="hidden h-4 w-28 rounded bg-[#282828]/10 sm:block" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold text-[#282828]/60">
              Loading your workspace…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border-4 border-[#282828] bg-white p-7 text-center shadow-neobrutalism">
          <h1 className="text-2xl font-black">Your workspace could not load</h1>
          <p className="mt-3 font-semibold text-[#282828]/65">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-6 rounded-xl border-4 border-[#282828] bg-[#58CC02] px-5 py-3 font-black shadow-neobrutalism"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (!user)
    return (
      <div className="px-4 py-12 text-center font-bold">Please log in.</div>
    );

  return (
    <main className="min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-b-4 border-[#282828] pb-5">
        <a
          href="/dashboard"
          className="flex items-center gap-3 rounded-2xl"
          aria-label="Draftwell dashboard"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl border-4 border-[#282828] bg-[#58CC02] shadow-neobrutalism">
            <BookOpenText aria-hidden="true" size={23} strokeWidth={2.5} />
          </span>
          <span className="text-xl font-black sm:text-2xl">Draftwell</span>
        </a>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-bold text-[#282828]/65 sm:block">
            Your workspace
          </span>
          <span
            aria-label="Your profile"
            className="flex size-11 items-center justify-center rounded-full border-4 border-[#282828] bg-[#CE82FF] text-sm font-black"
          >
            {(user.username ?? user.name ?? user.email ?? "U")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 pt-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:pt-12">
        <aside className="hidden lg:block">
          <p className="mb-3 px-3 text-xs font-black uppercase text-[#282828]/50">
            Workspace
          </p>
          <nav aria-label="Workspace navigation" className="space-y-2 border-0">
            <a
              href="#documents"
              aria-current="page"
              className="flex items-center gap-3 rounded-2xl border-4 border-[#282828] bg-[#58CC02] px-4 py-3 font-extrabold shadow-neobrutalism"
            >
              <LayoutDashboard aria-hidden="true" size={19} />
              My documents
            </a>
          </nav>

          <div className="mt-10 rounded-2xl border-4 border-[#282828] bg-[#1CB0F6] p-4 shadow-neobrutalism">
            <FolderClosed aria-hidden="true" size={21} />
            <p className="mt-3 font-black">Your documents, in one place.</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-[#282828]/75">
              Open, edit, and organize your Word documents.
            </p>
          </div>
        </aside>

        <section id="documents" className="min-w-0">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase text-[#282828]/55">
                YOUR LIBRARY
              </p>
              <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                My documents
              </h1>
              <p className="mt-3 max-w-xl text-base font-semibold leading-relaxed text-[#282828]/65 sm:text-lg">
                Welcome back, {user.username ?? user.name ?? "writer"}. Pick up
                where you left off or make a fresh page.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateDocument}
              disabled={isCreating}
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-2xl border-4 border-[#282828] bg-[#58CC02] px-5 py-3 font-black shadow-neobrutalism transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 sm:self-auto"
            >
              {isCreating ? (
                <LoaderCircle
                  aria-hidden="true"
                  size={21}
                  className="animate-spin"
                />
              ) : (
                <Plus aria-hidden="true" size={21} strokeWidth={3} />
              )}
              {isCreating ? "Creating…" : "New document"}
            </button>
          </div>
          {createError && (
            <p role="alert" className="mt-4 font-bold text-[#C62828]">
              Could not create a document. Please try again.
            </p>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md sm:gap-4">
            <div className="rounded-2xl border-4 border-[#282828] bg-white p-4 sm:p-5">
              <p className="text-sm font-bold text-[#282828]/60">
                All documents
              </p>
              <p className="mt-1 text-3xl font-black">{documents.length}</p>
            </div>
            <div className="rounded-2xl border-4 border-[#282828] bg-[#FFC800] p-4 sm:p-5">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Clock3 aria-hidden="true" size={16} />
                Documents updated in the past 24 hours
              </p>
              <p className="mt-1 text-3xl font-black">
                {
                  documents.filter((document) => document.recentlyUpdated)
                    .length
                }
              </p>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-sm">
              <Search
                aria-hidden="true"
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#282828]/55"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your documents"
                aria-label="Search your documents"
                className="w-full rounded-2xl border-4 border-[#282828] bg-white py-3 pl-11 pr-4 font-semibold outline-none placeholder:text-[#282828]/45 focus:shadow-neobrutalism"
              />
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-2 self-start rounded-2xl border-4 border-[#282828] bg-white px-4 py-3 font-bold sm:self-auto"
              aria-label="Sort documents by last updated"
              title="Sorted by last updated"
            >
              <ArrowDownWideNarrow aria-hidden="true" size={18} />
              Last updated
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border-4 border-[#282828] bg-white shadow-neobrutalism">
            <div className="hidden grid-cols-[minmax(0,1fr)_170px_120px_44px] gap-4 border-b-4 border-[#282828] bg-[#FFFAEE] px-5 py-3 text-xs font-black uppercase text-[#282828]/55 sm:grid">
              <span>Document</span>
              <span>Last updated</span>
              <span>Access</span>
              <span aria-hidden="true" />
            </div>
            {filteredDocuments.length > 0 ? (
              <ul className="divide-y-2 divide-[#282828]/15">
                {filteredDocuments.map((document) => (
                  <li
                    key={document.id}
                    className="grid gap-3 px-4 py-4 transition-colors hover:bg-[#FFFAEE]/70 sm:grid-cols-[minmax(0,1fr)_170px_120px_44px] sm:items-center sm:gap-4 sm:px-5"
                  >
                    <Link
                      href={`/docs/${document.id}`}
                      target="_blank"
                      className="flex min-w-0 items-center gap-3"
                    >
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl border-4 border-[#282828]"
                        style={{ backgroundColor: document.color }}
                      >
                        <FileText
                          aria-hidden="true"
                          size={20}
                          strokeWidth={2.5}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-extrabold">
                          {document.title}
                        </span>
                      </span>
                    </Link>
                    <p className="pl-14 text-sm font-semibold text-[#282828]/65 sm:pl-0">
                      {document.updated}
                    </p>
                    <span className="ml-14 w-fit rounded-full border-2 border-[#282828] bg-[#FFFAEE] px-3 py-1 text-xs font-extrabold sm:ml-0">
                      {document.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(false);
                        setDocumentToDelete(document);
                      }}
                      className="flex size-10 items-center justify-center rounded-full border-4 border-[#282828] bg-white"
                      aria-label={`More options for ${document.title}`}
                      aria-haspopup="dialog"
                      title={`More options for ${document.title}`}
                    >
                      <MoreHorizontal aria-hidden="true" size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-14 text-center">
                <p className="text-xl font-black">No documents found</p>
                <p className="mt-2 font-semibold text-[#282828]/60">
                  Try another search or create a new document.
                </p>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm font-semibold text-[#282828]/55">
            Showing {filteredDocuments.length} of {documents.length} documents
          </p>
        </section>
      </div>
      {documentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#282828]/55 px-4 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && deletingId === null) {
              setDocumentToDelete(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            aria-describedby="delete-document-description"
            className="w-full max-w-md rounded-2xl border-4 border-[#282828] bg-[#FFFAEE] p-6 shadow-neobrutalism sm:p-7"
          >
            <span className="flex size-12 items-center justify-center rounded-xl border-4 border-[#282828] bg-[#FF4B4B]">
              <AlertTriangle aria-hidden="true" size={23} />
            </span>
            <h2 id="delete-document-title" className="mt-5 text-2xl font-black">
              Delete this document?
            </h2>
            <p
              id="delete-document-description"
              className="mt-2 wrap-break-word font-semibold text-[#282828]/70"
            >
              “{documentToDelete.title}” will be permanently deleted. This
              cannot be undone.
            </p>
            {deleteError && (
              <p role="alert" className="mt-4 font-bold text-[#C62828]">
                The document could not be deleted. Please try again.
              </p>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => setDocumentToDelete(null)}
                className="rounded-xl border-4 border-[#282828] bg-white px-4 py-3 font-extrabold disabled:opacity-60"
              >
                Keep document
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={handleDeleteDocument}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-4 border-[#282828] bg-[#FF4B4B] px-4 py-3 font-extrabold disabled:cursor-wait disabled:opacity-60"
              >
                {deletingId === documentToDelete.id ? (
                  <LoaderCircle
                    aria-hidden="true"
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 aria-hidden="true" size={18} />
                )}
                {deletingId === documentToDelete.id
                  ? "Deleting…"
                  : "Delete document"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
