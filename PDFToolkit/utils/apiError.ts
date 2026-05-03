// utils/apiError.ts

export type ApiErrorPayload = {
  error?: string;
  detail?: string;
  code?: string;
};

export class ApiRequestError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

export async function parseApiError(response: Response): Promise<ApiRequestError> {
  let text = "";

  try {
    text = await response.text();
  } catch {
    text = "";
  }

  let payload: ApiErrorPayload | undefined;

  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = undefined;
  }

  const message =
    payload?.error ||
    payload?.detail ||
    text ||
    `Erro na requisição. Status ${response.status}`;

  return new ApiRequestError(response.status, message, payload);
}

export async function ensureOk(response: Response) {
  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response;
}

export async function readJsonOrThrow<T = any>(response: Response): Promise<T> {
  await ensureOk(response);

  try {
    return await response.json();
  } catch {
    throw new Error("Resposta inválida do servidor.");
  }
}

export function ensureFileUrl(data: any): string {
  if (!data?.fileUrl) {
    throw new Error("Backend não retornou fileUrl.");
  }

  return data.fileUrl;
}