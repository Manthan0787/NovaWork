// Vercel Serverless API entry point
// This file re-exports the Express app for Vercel's native /api routing
import app from '../server/src/server.js';
export default app;
