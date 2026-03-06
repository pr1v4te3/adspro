export default async function handler(req, res) {
  const { path, token } = req.query;
  if (!path || !token) return res.status(400).json({ error: "Missing params" });
  const sep = path.includes("?") ? "&" : "?";
  const url = `https://graph.facebook.com/v19.0${path}${sep}access_token=${token}`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
}
