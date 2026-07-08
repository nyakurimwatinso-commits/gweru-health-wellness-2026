import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

// Define the environment type to include your new KV namespace binding.
// Typed loosely so the build doesn't require Cloudflare Workers types.
type KVLike = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
};
type Env = {
  HSC_SCORES?: KVLike;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Helper to provide standard CORS headers so your app won't block requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const typedEnv = env as Env;

    // Handle Preflight OPTIONS requests for CORS safety
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // -------------------------------------------------------------
    // DATABASE ENDPOINT: /api/scores
    // -------------------------------------------------------------
    if (url.pathname === "/api/scores") {
      try {
        if (!typedEnv?.HSC_SCORES) {
          // KV binding not configured (e.g. local dev). Return empty defaults.
          if (request.method === "GET") {
            return new Response(JSON.stringify({}), { status: 200, headers: corsHeaders });
          }
          if (request.method === "POST") {
            return new Response(
              JSON.stringify({ success: false, message: "KV not configured in this environment" }),
              { status: 200, headers: corsHeaders },
            );
          }
        }
        if (request.method === "GET") {
          const rawData = await typedEnv.HSC_SCORES.get("match_data");
          return new Response(rawData || JSON.stringify({ matches: [] }), {
            status: 200,
            headers: corsHeaders,
          });
        }

        if (request.method === "POST") {
          const body = await request.text();
          // Simple validation to ensure it's valid json
          JSON.parse(body); 
          await typedEnv.HSC_SCORES.put("match_data", body);
          return new Response(JSON.stringify({ success: true, message: "Scores updated successfully" }), {
            status: 200,
            headers: corsHeaders,
          });
        }
      } catch (dbError: any) {
        return new Response(JSON.stringify({ error: dbError.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // -------------------------------------------------------------
    // DATABASE ENDPOINT: /api/vote
    // -------------------------------------------------------------
    if (url.pathname === "/api/vote") {
      try {
        if (!typedEnv?.HSC_SCORES) {
          if (request.method === "GET") {
            return new Response(JSON.stringify({}), { status: 200, headers: corsHeaders });
          }
          if (request.method === "POST") {
            return new Response(
              JSON.stringify({ success: false, votes: {} }),
              { status: 200, headers: corsHeaders },
            );
          }
        }
        if (request.method === "GET") {
          const rawVotes = await typedEnv.HSC_SCORES.get("poll_votes");
          return new Response(rawVotes || JSON.stringify({}), {
            status: 200,
            headers: corsHeaders,
          });
        }

        if (request.method === "POST") {
          const { teamName } = await request.json() as { teamName: string };
          if (!teamName) {
            return new Response(JSON.stringify({ error: "Missing teamName" }), { status: 400, headers: corsHeaders });
          }

          // Get existing votes, increment target, save back
          const rawVotes = await typedEnv.HSC_SCORES.get("poll_votes");
          const votesMap = rawVotes ? JSON.parse(rawVotes) : {};
          votesMap[teamName] = (votesMap[teamName] || 0) + 1;

          await typedEnv.HSC_SCORES.put("poll_votes", JSON.stringify(votesMap));
          return new Response(JSON.stringify({ success: true, votes: votesMap }), {
            status: 200,
            headers: corsHeaders,
          });
        }
      } catch (voteError: any) {
        return new Response(JSON.stringify({ error: voteError.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // Standard frontend rendering fallback route
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
