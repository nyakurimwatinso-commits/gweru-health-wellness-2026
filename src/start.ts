import { createStart, createMiddleware } from "@tanstack/react-start";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Standard CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Custom API Request Interceptor to handle the Database and AI endpoints
export const handleApiRequests = async (request: Request, env: any) => {
  const url = new URL(request.url);

  // Handle Preflight OPTIONS requests for CORS safety
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. DATABASE ENDPOINT: /api/scores
  if (url.pathname === "/api/scores") {
    try {
      const kv = env?.HSC_SCORES;
      if (!kv) {
        if (request.method === "POST") {
          return new Response(JSON.stringify({ success: false, message: "KV not configured" }), { status: 200, headers: corsHeaders });
        }
        return new Response(JSON.stringify({}), { status: 200, headers: corsHeaders });
      }
      if (request.method === "GET") {
        const rawData = await kv.get("match_data");
        return new Response(rawData || JSON.stringify({ matches: [] }), { status: 200, headers: corsHeaders });
      }
      if (request.method === "POST") {
        const body = await request.text();
        JSON.parse(body); 
        await kv.put("match_data", body);
        return new Response(JSON.stringify({ success: true, message: "Scores updated" }), { status: 200, headers: corsHeaders });
      }
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }

  // 2. DATABASE ENDPOINT: /api/vote
  if (url.pathname === "/api/vote") {
    try {
      const kv = env?.HSC_SCORES;
      if (!kv) return new Response(JSON.stringify({}), { status: 200, headers: corsHeaders });
      
      if (request.method === "GET") {
        const rawVotes = await kv.get("poll_votes");
        return new Response(rawVotes || JSON.stringify({}), { status: 200, headers: corsHeaders });
      }
      if (request.method === "POST") {
        const { teamName } = await request.json() as { teamName: string };
        if (!teamName) return new Response(JSON.stringify({ error: "Missing teamName" }), { status: 400, headers: corsHeaders });
        const rawVotes = await kv.get("poll_votes");
        const votesMap = rawVotes ? JSON.parse(rawVotes) : {};
        votesMap[teamName] = (votesMap[teamName] || 0) + 1;
        await kv.put("poll_votes", JSON.stringify(votesMap));
        return new Response(JSON.stringify({ success: true, votes: votesMap }), { status: 200, headers: corsHeaders });
      }
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }

  // 3. STATUS ENDPOINT: /api/status
  if (url.pathname === "/api/status") {
    try {
      const kv = env?.HSC_SCORES;
      const isConnected = kv !== undefined && kv !== null && typeof kv.get === "function";

      if (!isConnected) {
        return new Response(
          JSON.stringify({ connected: false, message: "KV binding not found directly in environment context." }),
          { status: 200, headers: corsHeaders }
        );
      }

      const pingKey = "__status_ping__";
      await kv.put(pingKey, "working");
      return new Response(
        JSON.stringify({ connected: true, status: "ok", message: "HSC_SCORES KV namespace connected and functional." }),
        { status: 200, headers: corsHeaders }
      );
    } catch (e: any) {
      return new Response(JSON.stringify({ connected: false, error: e.message }), { status: 500, headers: corsHeaders });
    }
  }

  return null; // Fall through to standard TanStack frontend rendering
};

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
