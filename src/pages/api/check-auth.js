export default function handler(req, res) {
  res.status(200).json({
    authenticated: !!req.cookies['admin-auth']
  });
}