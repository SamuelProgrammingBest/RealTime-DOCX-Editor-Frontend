export type DocumentItem = {
  id: string;
  title: string;
  updated: string;
  updatedAt?: string;
  recentlyUpdated: boolean;
  category: "Personal" | "Shared";
  color: string;
};

export type DashboardUser = {
  username?: string;
  name?: string;
  email?: string;
};

type ApiDocument = {
  _id?: string;
  id?: string;
  linkId?: string;
  title?: string;
  updatedAt?: string;
  createdAt?: string;
  collaborators?: unknown[];
};

import { EventEmitter } from "events";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

export class CustomSocketProvider extends EventEmitter {
  doc: Y.Doc;
  awareness: Awareness;

  constructor(doc: Y.Doc, awareness: Awareness) {
    super();
    this.doc = doc;
    this.awareness = awareness;
  }
}

const documentColors = ["#FFC800", "#1CB0F6", "#CE82FF", "#FF8A65", "#58CC02"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function getUser(value: unknown): DashboardUser | null {
  const response = asRecord(value);
  const user = asRecord(response?.user ?? response?.data) ?? response;
  if (!user || !(user.username || user.name || user.email)) return null;

  return {
    username: typeof user.username === "string" ? user.username : undefined,
    name: typeof user.name === "string" ? user.name : undefined,
    email: typeof user.email === "string" ? user.email : undefined,
  };
}

function getDocumentArray(value: unknown): ApiDocument[] {
  if (Array.isArray(value)) return value as ApiDocument[];

  const response = asRecord(value);
  const data = asRecord(response?.data);
  const result = asRecord(response?.result);
  const candidates = [
    response?.documents,
    response?.docs,
    response?.data,
    response?.result,
    data?.documents,
    data?.docs,
    result?.documents,
    result?.docs,
  ];
  const documents = candidates.find(Array.isArray);
  return Array.isArray(documents) ? (documents as ApiDocument[]) : [];
}

function getSingleDocument(value: unknown): ApiDocument | null {
  const response = asRecord(value);
  if (!response) return null;

  const candidates = [
    response.document,
    response.doc,
    response.data,
    response.result,
  ];
  const document = candidates
    .map(asRecord)
    .find(
      (candidate) =>
        candidate && (candidate._id || candidate.linkId || candidate.title),
    );
  if (document) return document as ApiDocument;
  if (response._id || response.linkId || response.title)
    return response as ApiDocument;
  return null;
}

function formatUpdatedDate(value?: string): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeDocument(document: ApiDocument, index: number): DocumentItem {
  const updatedAt = document.updatedAt ?? document.createdAt;
  const updatedTime = updatedAt ? new Date(updatedAt).getTime() : Number.NaN;
  const timeSinceUpdate = Date.now() - updatedTime;

  return {
    id: String(document._id ?? document.id ?? document.linkId ?? index),
    title: document.title?.trim() || "Untitled",
    updated: formatUpdatedDate(updatedAt),
    updatedAt,
    recentlyUpdated:
      Number.isFinite(updatedTime) &&
      timeSinceUpdate >= 0 &&
      timeSinceUpdate < 24 * 60 * 60 * 1000,
    category: document.collaborators?.length ? "Shared" : "Personal",
    color: documentColors[index % documentColors.length],
  };
}

export function normalizeDocuments(value: unknown): DocumentItem[] {
  const documents = getDocumentArray(value);
  if (documents.length) return documents.map(normalizeDocument);

  const document = getSingleDocument(value);
  return document ? [normalizeDocument(document, 0)] : [];
}

export function base64ToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let index = 0; index < binaryString.length; index++) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  return bytes;
}
