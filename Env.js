/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';


export const __dirname=path.dirname(fileURLToPath(import.meta.url));
export const FACEBOOK_APP_ID=process.env.FACEBOOK_APP_ID
export const REDIRECT_URI=process.env.REDIRECT_URI
export const FACEBOOK_CLIENT_SECRET=process.env.FACEBOOK_CLIENT_SECRET
export const FACEBOOK_GRAPH_API=process.env.FACEBOOK_GRAPH_API
export const FACEBOOK_GRAPH_VERSION=process.env.FACEBOOK_GRAPH_VERSION
export const require=createRequire(import.meta.url);
