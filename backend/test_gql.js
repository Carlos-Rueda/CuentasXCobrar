async function getFreshToken() {
  try {
    const response = await fetch('https://ad-modulo-facturacion.onrender.com/auth/test-token');
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.error('Error fetching token:', error);
  }
  return '';
}

async function run() {
  const token = await getFreshToken();

  // Query facturas with nested client information (only valid fields)
  const query = `
    query {
      facturas(limit: 100) {
        items {
          id
          numeroFactura
          clienteId
          total
          estado
          cliente {
            id
            cedula
            nombre
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://ad-modulo-facturacion.onrender.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    const body = await response.json();
    console.log('Data:', JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('Error fetching GraphQL:', err);
  }
}

run();
