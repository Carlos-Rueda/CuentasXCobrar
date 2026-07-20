async function test() {
  console.log('Probar conexión a la API de Compras desde la EC2...');
  try {
    const res = await fetch('http://compras-alb-1632153594.us-east-1.elb.amazonaws.com/api/cxc/gastos');
    console.log('Código de Estado HTTP:', res.status);
    const body = await res.json();
    console.log('Cuerpo de la Respuesta:', JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('Error al conectar con la API de Compras:', err);
  }
}
test();
