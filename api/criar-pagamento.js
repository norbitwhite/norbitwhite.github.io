function setCors(req, res) {
  // Permite seu GitHub Pages (recomendado)
  res.setHeader("Access-Control-Allow-Origin", "https://norbitwhite.github.io");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(req, res);

  // Preflight (CORS)
  if (req.method === "OPTIONS") return res.status(204).end();

  // Essa rota TEM que ser POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: "MP_ACCESS_TOKEN não configurado no Vercel (Environment Variables)."
      });
    }

    const body = req.body || {};
    const valor = Number(body.valor);
    const descricao = String(body.descricao || "Inscrição");
    const email = String(body.email || "comprador@email.com");
    const whatsapp = String(body.whatsapp || "");
    const nome = String(body.nome || "");

    if (!valor || valor < 1) {
      return res.status(400).json({ error: "Valor inválido." });
    }

    // Cria pagamento PIX no Mercado Pago
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transaction_amount: valor,
        description: descricao,
        payment_method_id: "pix",
        payer: { email },
        metadata: {
          whatsapp,
          nome
        }
      })
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      return res.status(mpRes.status).json({
        error: "Erro ao criar pagamento no Mercado Pago",
        details: mpData
      });
    }

    const payment_id = mpData?.id;
    const status = mpData?.status;
    const qr_code_base64 =
      mpData?.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!payment_id || !qr_code_base64) {
      return res.status(500).json({
        error: "Pagamento criado, mas não veio QR Code.",
        details: mpData
      });
    }

    return res.status(200).json({
      payment_id,
      status,
      qr_code_base64
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro interno" });
  }
}
