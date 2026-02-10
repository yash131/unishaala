import { v4 as uuidv4 } from 'uuid';
import { getCollection } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'unishaala-secret-key-2025';

// Simple base64 encoding for JWT-like tokens
export function createToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = { ...payload, iat: now, exp: now + 86400 * 7 }; // 7 days
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const signature = Buffer.from(JWT_SECRET + base64Header + base64Payload).toString('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch (e) {
    return null;
  }
}

export async function hashPassword(password) {
  // Simple hash for demo - in production use bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function getUserFromToken(token) {
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const users = await getCollection('users');
  return await users.findOne({ id: payload.userId });
}
