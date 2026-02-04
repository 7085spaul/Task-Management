import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://task-management-xki8.vercel.app"
    ],
    credentials: true,
  })
);

// ✅ Middlewares
app.use(cookieParser());
app.use(express.json());

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// ✅ Health Check Route
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// ✅ 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ✅ Global Error Handler
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// ✅ Server Start
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
