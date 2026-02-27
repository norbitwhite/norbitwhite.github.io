export default async function handler(req, res) {
  // CORS (pra não dar "Failed to fetch" no front)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  try {
    const { payment_id } = req.query;

    if (!payment_id) {
      return res.status(400).json({ error: "payment_id é obrigatório" });
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(payment_id)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      transaction_amount: data.transaction_amount,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erro interno" });
  }
}
