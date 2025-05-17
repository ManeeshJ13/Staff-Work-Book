export async function checkAuth(req) {
  // For API routes
  if (req?.cookies['admin-auth']) return true;
  
  // For pages (client-side)
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
    return data.authenticated;
  }
  
  return false;
}