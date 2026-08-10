export type JsonErrorOptions = ResponseInit & {
  fallbackMessage?: string;
};

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export async function readJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON payload.");
  }
}

export function jsonError(error: unknown, options: JsonErrorOptions = {}) {
  const { fallbackMessage = "Unexpected server error.", ...init } = options;
  return json(
    {
      success: false,
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    init,
  );
}

export function isFormFile(value: FormDataEntryValue): value is File {
  return typeof value === "object" && "arrayBuffer" in value && "name" in value;
}
