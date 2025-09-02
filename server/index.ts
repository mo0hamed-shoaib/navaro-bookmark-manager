import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  
  log(`=== SERVER STARTUP DEBUG ===`);
  log(`All environment variables:`);
  Object.keys(process.env).forEach(key => {
    if (key.includes('PORT') || key.includes('NODE') || key.includes('SUPABASE')) {
      log(`  ${key}: ${process.env[key]}`);
    }
  });
  
  const port = parseInt(process.env.PORT || '5000', 10);
  
  log(`Starting server...`);
  log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log(`Port: ${port}`);
  log(`PORT env var: ${process.env.PORT || 'not set'}`);
  log(`Parsed port: ${port}`);
  log(`Port type: ${typeof port}`);
  log(`Is port valid: ${!isNaN(port) && port > 0 && port < 65536}`);
  
  // Add a small delay to ensure everything is ready
  setTimeout(() => {
    log(`Attempting to start server on port ${port}...`);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`✅ Server started successfully on port ${port}`);
      log(`🌐 Health check available at: http://0.0.0.0:${port}/test`);
      log(`🏠 Root endpoint at: http://0.0.0.0:${port}/`);
      log(`🔍 API health at: http://0.0.0.0:${port}/api/health`);
    }).on('error', (err) => {
      log(`❌ Server failed to start: ${err.message}`);
      log(`Error details: ${err.stack}`);
      process.exit(1);
    });
  }, 1000);
})();
