import axios, { type AxiosRequestConfig } from "axios";

type ApiMethod = "GET" | "POST" | "DELETE";

export const apiCall = async <TResponse = any>(
  path: string,
  method: ApiMethod,
  body?: unknown,
  headers?: AxiosRequestConfig["headers"],
  withCredentials = true,
): Promise<TResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URI?.replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URI is not configured.");
  }

  const endpoint = path.replace(/^\/+/, "");
  const response = await axios.request<TResponse>({
    url: `${baseUrl}/${endpoint}`,
    method,
    data: method === "GET" ? undefined : body,
    headers,
    withCredentials,
    timeout: 60_000,
  });

  return response.data;
};
