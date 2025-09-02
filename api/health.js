export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "bookmark-manager-backend",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
}
