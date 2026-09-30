import { apiCall } from "./apiCall";

export const getLoggedInUserandDocuments = async () => {
  const user = await apiCall("/me", "GET");
  const documents = await apiCall("/docs", "GET");
  return [user, documents] as const;
};

export const createDocument = async () => {
  return await apiCall("/docs", "POST");
};

export const getDocuments = async () => {
  return await apiCall("/docs", "GET");
};

export const deleteDocument = async (documentId: string) => {
  return await apiCall(`/docs/${documentId}`, "DELETE");
};

export const getDocument = async (linkId: string) => {
  return await apiCall(`/docs/${linkId}`, "GET");
};
