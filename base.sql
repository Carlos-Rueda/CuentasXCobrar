-- Habilitar la extensión para UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear la tabla cuentas_bancarias
CREATE TABLE "cuentas_bancarias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR NOT NULL,
    "nombre_cuenta" VARCHAR NOT NULL,
    "entidad_bancaria" VARCHAR NOT NULL,
    "descripcion" TEXT,
    "estado" VARCHAR DEFAULT 'activo',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "titular" VARCHAR,
    "tipo_cuenta" VARCHAR,
    "nro_cuenta" VARCHAR,
    "ruc" VARCHAR,

    CONSTRAINT "cuentas_bancarias_pkey" PRIMARY KEY ("id")
);

-- Crear la tabla pagos_clientes
CREATE TABLE "pagos_clientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_pago" VARCHAR NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_pago" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "cuenta_bancaria_id" UUID,
    "cliente_id" VARCHAR NOT NULL,
    "estado" VARCHAR DEFAULT 'activo',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_clientes_pkey" PRIMARY KEY ("id")
);

-- Crear la tabla detalles_pago
CREATE TABLE "detalles_pago" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pago_id" UUID,
    "factura_id" VARCHAR NOT NULL,
    "monto_pagado" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalles_pago_pkey" PRIMARY KEY ("id")
);

-- Crear la tabla movimientos
CREATE TABLE "movimientos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" VARCHAR NOT NULL,
    "cuenta_origen_id" UUID,
    "cuenta_destino_id" UUID,
    "monto" DECIMAL(12,2) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" VARCHAR DEFAULT 'completado',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- Índices Únicos
CREATE UNIQUE INDEX "cuentas_bancarias_codigo_key" ON "cuentas_bancarias"("codigo");
CREATE UNIQUE INDEX "pagos_clientes_numero_pago_key" ON "pagos_clientes"("numero_pago");

-- Relaciones y Claves Foráneas (Foreign Keys)
ALTER TABLE "detalles_pago" ADD CONSTRAINT "detalles_pago_pago_id_fkey" 
    FOREIGN KEY ("pago_id") REFERENCES "pagos_clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "pagos_clientes" ADD CONSTRAINT "pagos_clientes_cuenta_bancaria_id_fkey" 
    FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "cuentas_bancarias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cuenta_destino_id_fkey" 
    FOREIGN KEY ("cuenta_destino_id") REFERENCES "cuentas_bancarias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cuenta_origen_id_fkey" 
    FOREIGN KEY ("cuenta_origen_id") REFERENCES "cuentas_bancarias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
