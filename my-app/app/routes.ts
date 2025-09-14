import type { RouteConfig } from "@react-router/dev/routes";

export default [
  { path: "/", file: "routes/home.tsx" },
  { path: "/schedule", file: "routes/schedule.tsx" },
] satisfies RouteConfig;
