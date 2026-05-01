-- Script para crear la tabla de auditoría y asegurar la trazabilidad de cambios críticos
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo los administradores pueden ver los registros de auditoría
CREATE POLICY "Solo administradores pueden ver logs de auditoría" 
ON audit_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Permitir inserción a usuarios autenticados (el sistema registrará las acciones)
CREATE POLICY "Usuarios autenticados pueden insertar logs" 
ON audit_logs
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);
