-- ============================================================================
-- MIGRACIÓN: Rotación de videos diaria por empresa
-- ============================================================================
-- Cambios:
--   1. config_marca.video_url (string único)  →  videos_json (lista)
--   2. jugadores: nueva columna ultimo_video (similar a ultimo_trivia)
--   3. Misión "ver_video" pasa a ser reclamable diariamente
--
-- IMPORTANTE: si ya tenías un video_url subido, este script lo convierte
-- automáticamente al primer item del array videos_json. NO se pierde.
-- ============================================================================

USE cltiene_mundial;

-- ----------------------------------------------------------------------------
-- 1) Agregar columna videos_json
-- ----------------------------------------------------------------------------
ALTER TABLE config_marca
  ADD COLUMN videos_json LONGTEXT NULL
  AFTER video_url;

-- ----------------------------------------------------------------------------
-- 2) Migrar el video_url existente a videos_json (si existe alguno)
-- ----------------------------------------------------------------------------
UPDATE config_marca
SET videos_json = JSON_ARRAY(
  JSON_OBJECT(
    'id', CONCAT('video_legacy_', id),
    'url', video_url,
    'nombre', 'Video original'
  )
)
WHERE video_url IS NOT NULL AND video_url != '';

-- ----------------------------------------------------------------------------
-- 3) Eliminar columna antigua video_url
-- ----------------------------------------------------------------------------
ALTER TABLE config_marca DROP COLUMN video_url;

-- ----------------------------------------------------------------------------
-- 4) Agregar columna ultimo_video en jugadores
-- ----------------------------------------------------------------------------
ALTER TABLE jugadores
  ADD COLUMN ultimo_video DATE NULL
  AFTER ultimo_runner;

-- ----------------------------------------------------------------------------
-- 5) Resetear "ver_video" en misiones_completadas (porque ya no se completa
--    una sola vez; ahora se rastrea diariamente con ultimo_video)
-- ----------------------------------------------------------------------------
UPDATE jugadores
SET misiones_completadas = JSON_REMOVE(
  misiones_completadas,
  JSON_UNQUOTE(JSON_SEARCH(misiones_completadas, 'one', 'ver_video'))
)
WHERE JSON_SEARCH(misiones_completadas, 'one', 'ver_video') IS NOT NULL;

-- ----------------------------------------------------------------------------
-- VERIFICACIÓN
-- ----------------------------------------------------------------------------
-- SHOW COLUMNS FROM config_marca LIKE 'videos_json';
-- SHOW COLUMNS FROM jugadores LIKE 'ultimo_video';
-- SELECT empresa_id, JSON_LENGTH(videos_json) AS num_videos FROM config_marca;
