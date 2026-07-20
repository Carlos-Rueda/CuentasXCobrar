import { PrismaService } from '../prisma/prisma.service';

let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 60000; // 60 segundos de cooldown

export async function sincronizarGastosCompras(prisma: PrismaService): Promise<void> {
  const now = Date.now();
  if (now - lastSyncTime < SYNC_COOLDOWN_MS) {
    return;
  }
  lastSyncTime = now;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      'http://compras-alb-1632153594.us-east-1.elb.amazonaws.com/api/cxc/gastos',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!response.ok) return;

    const body = await response.json();
    const gastos = Array.isArray(body) ? body : (body.data || []);
    if (gastos.length === 0) return;

    const dbCuentas = await prisma.cuentas_bancarias.findMany({
      select: { id: true }
    });
    const dbCuentaIds = dbCuentas.map((c: any) => c.id.toLowerCase().trim());
    const primaryAccountId = dbCuentas[0]?.id;

    for (const g of gastos) {
      const rawCuentaId = g.cuentaBancariaId || g.cuenta_bancaria_id;
      let targetCuentaId = rawCuentaId?.toLowerCase().trim();
      if (!targetCuentaId || !dbCuentaIds.includes(targetCuentaId)) {
        targetCuentaId = primaryAccountId;
      }

      if (!targetCuentaId) continue;

      const refString = `(Ref: ${g.id})`;
      const existe = await prisma.movimientos.findFirst({
        where: {
          descripcion: {
            contains: refString,
          },
        },
      });

      if (!existe) {
        const dateStr = g.fechaPago || g.fecha_pago || g.fecha_registro || new Date().toISOString();
        const parsedDate = new Date(dateStr);
        await prisma.movimientos.create({
          data: {
            tipo: 'egreso',
            cuenta_origen_id: targetCuentaId,
            cuenta_destino_id: null,
            monto: Number(g.monto || 0),
            descripcion: `Gasto Compras: ${g.motivo || g.detalle || 'Gasto registrado de compras'} (Ref: ${g.id})`,
            estado: 'completado',
            created_at: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
          },
        });
      }
    }
  } catch (e) {
    console.error('Error al sincronizar gastos compras:', e);
  }
}
