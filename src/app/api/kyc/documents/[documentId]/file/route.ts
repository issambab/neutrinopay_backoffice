import { NextResponse } from "next/server";

import { fetchKycDocumentFile } from "@/lib/kyc/kyc.server";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { documentId } = await context.params;

  try {
    const file = await fetchKycDocumentFile(documentId);
    return new NextResponse(file.body, {
      headers: responseHeaders(file),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load KYC document file.";
    return new NextResponse(errorHtml(message), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
      status: 400,
    });
  }
}

function responseHeaders(file: {
  contentDisposition: string | null;
  contentLength: string | null;
  contentType: string;
}) {
  const headers = new Headers();
  headers.set("Content-Type", file.contentType);
  if (file.contentDisposition) {
    headers.set("Content-Disposition", file.contentDisposition);
  }
  if (file.contentLength) {
    headers.set("Content-Length", file.contentLength);
  }
  return headers;
}

function errorHtml(message: string) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Document KYC indisponible</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      section { max-width: 520px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; padding: 24px; box-shadow: 0 10px 30px rgba(15, 23, 42, .08); }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 0; color: #475569; line-height: 1.5; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Document KYC indisponible</h1>
        <p>${escapeHtml(message)}</p>
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
