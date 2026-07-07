import { createFileRoute } from "@tanstack/react-router";

function CacheBusterComponent() {
  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>System Cache Reset</h1>
      <p>Building clean route manifest...</p>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: CacheBusterComponent,
});

