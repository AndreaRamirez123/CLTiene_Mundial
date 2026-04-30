-- ============================================================================
-- MIGRACIÓN: Agregar campo video_url a config_marca
-- ============================================================================
-- Permite que cada empresa configure desde el admin su propio video de
-- YouTube para la misión "Ver video". Si no se configura, la misión no
-- aparece para esa empresa.
-- ============================================================================

USE cltiene_mundial;

-- Agregar columna video_url (nullable, ya que arranca vacía)
ALTER TABLE config_marca
  ADD COLUMN video_url TEXT NULL
  AFTER beneficios_json;

-- (Opcional) Pre-cargar el video que estaba hardcoded para la empresa default
-- Si quieres que las empresas ya existentes hereden el video anterior, descomenta:
--
-- UPDATE config_marca
-- SET video_url = 'https://youtu.be/QtKq3ugMouI?si=g45EzWN9S3b4em3G'
-- WHERE id > 0;

-- ----------------------------------------------------------------------------
-- VERIFICACIÓN
-- ----------------------------------------------------------------------------
-- SHOW COLUMNS FROM config_marca LIKE 'video_url';
-- SELECT empresa_id, nombre_app, video_url FROM config_marca;
