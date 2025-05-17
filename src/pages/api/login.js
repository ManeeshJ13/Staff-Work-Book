import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Hardcoded admin creds (replace with env variables in production)
  const ADMIN_CREDS = {
    username: "admin",
    password: "admin123" // Never use default passwords in production
  };

  const { username, password } = req.body;

  if (username === ADMIN_CREDS.username && password === ADMIN_CREDS.password) {
    // Set a secure cookie
    res.setHeader('Set-Cookie', 
      serialize('admin-auth', 'true', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 hours
        secure: process.env.NODE_ENV === 'production'
      })
    );
    
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}