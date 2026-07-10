import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.env.STATIC_DIR ?? "out");
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const host = process.env.HOST ?? "0.0.0.0";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

async function existingFile(path) {
  try {
    const metadata = await stat(path);
    return metadata.isFile() ? metadata : null;
  } catch {
    return null;
  }
}

function headersFor(path, metadata) {
  const immutable = path.includes(`${sep}_next${sep}static${sep}`);
  return {
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : path.endsWith(".html") ? "public, max-age=0, must-revalidate" : "public, max-age=3600",
    "Content-Length": metadata.size,
    "Content-Type": contentTypes[extname(path)] ?? "application/octet-stream",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

function sendFile(request, response, path, metadata, status = 200) {
  response.writeHead(status, headersFor(path, metadata));
  if (request.method === "HEAD") return response.end();
  createReadStream(path).on("error", () => response.destroy()).pipe(response);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    return response.end("Method not allowed");
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400);
    return response.end("Bad request");
  }

  let candidate = resolve(root, `.${pathname}`);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  if (pathname.endsWith("/")) candidate = resolve(candidate, "index.html");
  let metadata = await existingFile(candidate);

  if (!metadata && !extname(pathname) && !pathname.endsWith("/")) {
    const indexPath = resolve(candidate, "index.html");
    if (await existingFile(indexPath)) {
      response.writeHead(308, { Location: `${pathname}/${new URL(request.url ?? "/", "http://localhost").search}` });
      return response.end();
    }
  }

  if (metadata) return sendFile(request, response, candidate, metadata);

  const notFound = resolve(root, "404.html");
  metadata = await existingFile(notFound);
  if (metadata) return sendFile(request, response, notFound, metadata, 404);
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, host, () => {
  console.log(`StackScope listening on http://${host}:${port}`);
});

function shutdown() {
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
