import { apiCall } from "./apiCall";

export const getLoggedInUserandDocuments = async () => {
  try {
    // const response = {}
    // await apiCall("/me", "GET")

    const response = await Promise.all([
      await apiCall("/me", "GET"),
      await apiCall("/docs", "GET"),
    ]);

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Dashboard related API Error ${error.message}`);
    }
  }
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
