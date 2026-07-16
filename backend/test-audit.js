const protobuf = require('protobufjs');
const axios = require('axios');

async function testCreds(apiKey, usuario, clave) {
  try {
    const authUrl = 'https://712286fsib.execute-api.us-east-1.amazonaws.com/default/api-auth-central';
    const authRes = await axios.post(authUrl, {
      api_key: apiKey,
      usuario: usuario,
      clave: clave,
      ip: '127.0.0.1'
    });
    
    const token = authRes.data.token;
    console.log(`Token obtained for [${apiKey}/${usuario}]:`, token ? token.substring(0, 30) + '...' : 'none');

    const protoPath = require('path').join(__dirname, 'src', 'auditoria', 'proto', 'auditoria.proto');
    const root = protobuf.loadSync(protoPath);
    const AuditoriaRequestMessage = root.lookupType('AuditoriaRequest');
    const AuditoriaResponseMessage = root.lookupType('AuditoriaResponse');

    const payload = {
      token: token,
      idFuncion: 1,
      accion: 'GET /api/auditoria/historial',
      descripcion: 'Accion en modulo CUENTAS_POR_COBRAR',
      observacion: '{"status":"SUCCESS","responseSize":2}',
      ipUsuario: '127.0.0.1'
    };

    const message = AuditoriaRequestMessage.create(payload);
    const buffer = Buffer.from(AuditoriaRequestMessage.encode(message).finish());

    const auditoriaUrl = 'https://98l52rpey8.execute-api.us-east-1.amazonaws.com/default/api-pistas-auditoria';
    const response = await axios.post(auditoriaUrl, buffer, {
      headers: { 'Content-Type': 'application/x-protobuf' },
      responseType: 'arraybuffer'
    });
    
    const decoded = AuditoriaResponseMessage.decode(response.data);
    console.log(`Success for [${apiKey}/${usuario}]:`, decoded);
  } catch (err) {
    let errorMsg = err.message;
    if (err.response && err.response.data) {
      const data = err.response.data;
      if (Buffer.isBuffer(data)) {
        errorMsg = data.toString('utf-8');
      } else if (data instanceof ArrayBuffer) {
        errorMsg = Buffer.from(data).toString('utf-8');
      } else if (typeof data === 'string') {
        errorMsg = data;
      } else {
        errorMsg = JSON.stringify(data);
      }
    }
    console.log(`Failed for [${apiKey}/${usuario}]:`, errorMsg);
  }
}

async function run() {
  // Test case 1: MODULE_API_KEY (cxc) + user credentials (HenryMoreta)
  await testCreds('dev_key_cxc_111', 'HenryMoreta', 'Elvolver2026*');
  
  // Test case 2: Key csc + user credentials
  await testCreds('dev_key_cxc_111', 'HenryMoreta', 'Elvolver2026*');
}

run();
