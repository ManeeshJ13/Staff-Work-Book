import { serialize } from 'cookie';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', 
    serialize('admin-auth', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    })
  );
  
  res.status(200).json({ success: true });
}