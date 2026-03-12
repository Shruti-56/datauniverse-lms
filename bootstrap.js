#!/usr/bin/env node
/**
 * Hostinger entry point - starts the Express backend.
 * The backend serves both /api and the React frontend from backend/public
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('./backend/dist/app.js');
