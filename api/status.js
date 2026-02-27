export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID do pagamento é obrigatório' });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    return res.status(200).json({
      status: data.status,
      status_detail: data.status_detail,
      transaction_amount: data.transaction_amount,
      id: data.id
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
