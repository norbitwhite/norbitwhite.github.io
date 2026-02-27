export default async function handler(req, res) {
  // Preflight do CORS (quando chama pelo navegador)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { valor, descricao, email } = req.body || {};

    const amount = Number(valor);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "valor inválido" });
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado na Vercel" });
    }

    // idempotency evita criar cobranças duplicadas se clicar 2x
    const idempotencyKey =
      (globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const payload = {
      transaction_amount: amount,
      description: descricao || "Pagamento",
      payment_method_id: "pix",
      payer: {
        email: email || "comprador@exemplo.com"
      }
    };

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Falha ao criar pagamento",
        details: data
      });
    }

    const qr = data?.point_of_interaction?.transaction_data?.qr_code_base64 || null;
    const copiaECola = data?.point_of_interaction?.transaction_data?.qr_code || null;

    return res.status(200).json({
      payment_id: data.id,
      status: data.status,
      valor: data.transaction_amount,
      qr_code_base64: qr,      // para mostrar imagem
      qr_code_copia_e_cola: copiaECola // para copiar
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
