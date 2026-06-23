-- ==========================================
-- HU1: CUENTAS BANCARIAS
-- ==========================================
CREATE TABLE cuentas_bancarias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR UNIQUE NOT NULL, 
  nombre_cuenta VARCHAR NOT NULL, 
  entidad_bancaria VARCHAR NOT NULL,
  descripcion TEXT,
  estado VARCHAR DEFAULT 'activo', 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activamos la seguridad para Cuentas Bancarias
ALTER TABLE cuentas_bancarias ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HU2: PAGOS DE CLIENTES (CABECERA)
-- ==========================================
CREATE TABLE pagos_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pago VARCHAR UNIQUE NOT NULL, 
  descripcion TEXT NOT NULL,
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cuenta_bancaria_id UUID REFERENCES cuentas_bancarias(id),
  cliente_id VARCHAR NOT NULL, 
  estado VARCHAR DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activamos la seguridad para Pagos de Clientes
ALTER TABLE pagos_clientes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HU3: DETALLE DE PAGO (FACTURAS)
-- ==========================================
CREATE TABLE detalles_pago (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pago_id UUID REFERENCES pagos_clientes(id) ON DELETE CASCADE,
  factura_id VARCHAR NOT NULL, 
  monto_pagado NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activamos la seguridad para los Detalles de Pago
ALTER TABLE detalles_pago ENABLE ROW LEVEL SECURITY;