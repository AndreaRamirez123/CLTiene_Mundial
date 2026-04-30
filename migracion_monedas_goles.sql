-- ============================================================================
-- MIGRACIÓN: Inversión Monedas/Goles + Nuevos tipos de transacción
-- ============================================================================
-- Modelo nuevo:
--   • MONEDAS  → recompensa por interacción (misiones, bono diario, trivia,
--                referidos). Se gastan canjeando beneficios.
--   • GOLES    → solo se ganan acertando predicciones del Mundial. Definen
--                el ranking. Top 3 reciben premios al finalizar.
--
-- Ejecutar contra la BD `cltiene_mundial`.
--
-- ⚠️ IMPORTANTE: en MySQL los ALTER TABLE son auto-commit (NO se pueden
-- rollbackear), aunque estén dentro de un START TRANSACTION. Por eso este
-- script ejecuta los ALTER fuera de la transacción y solo envuelve la
-- limpieza de datos (TRUNCATE/UPDATE) en una transacción real.
--
-- Si algún ALTER falla por "Duplicate column" o "Unknown column" significa
-- que ese cambio ya se aplicó en una corrida anterior — saltar al siguiente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Estructura: agregar columna goles_ganados en predicciones
-- (Si la columna ya existe, este ALTER falla — es esperado, salta al paso 2)
-- ----------------------------------------------------------------------------
ALTER TABLE predicciones
  ADD COLUMN goles_ganados INT UNSIGNED NOT NULL DEFAULT 0
  AFTER estado;

-- ----------------------------------------------------------------------------
-- 2) Estructura: actualizar enum de transacciones (agregar mision, canje)
-- ----------------------------------------------------------------------------
ALTER TABLE transacciones
  MODIFY COLUMN tipo ENUM(
    'registro',
    'bono_diario',
    'bono_referido',
    'trivia',
    'mision',
    'canje',
    'bono_apuesta',
    'prediccion_simple',
    'prediccion_especial'
  ) NOT NULL;

-- ----------------------------------------------------------------------------
-- 3) Estructura: permitir monto negativo en transacciones (para canjes)
-- ----------------------------------------------------------------------------
ALTER TABLE transacciones
  MODIFY COLUMN monto INT NOT NULL;

-- ----------------------------------------------------------------------------
-- 3.b) Renombrar trivias_historial.goles_ganados → monedas_ganadas
-- ----------------------------------------------------------------------------
ALTER TABLE trivias_historial
  CHANGE COLUMN goles_ganados monedas_ganadas TINYINT UNSIGNED NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 4) LIMPIEZA DE DATOS DE PRUEBA (envuelta en transacción real)
-- ----------------------------------------------------------------------------
-- Vacía las tablas transaccionales pero mantiene catálogos (empresas,
-- partidos, config_marca, preguntas).
-- ----------------------------------------------------------------------------

START TRANSACTION;

-- Transaccionales de jugadores (orden importa por foreign keys)
TRUNCATE TABLE canjes;
TRUNCATE TABLE trivias_historial;
TRUNCATE TABLE predicciones;
TRUNCATE TABLE transacciones;

-- Sesiones SSO temporales (si existen)
TRUNCATE TABLE sso_sessions;

-- Resetear contadores de jugadores SIN borrarlos (mantiene cuentas/SSO)
UPDATE jugadores SET
  monedas = 0,
  monedas_totales_ganadas = 0,
  goles = 0,
  predicciones_count = 0,
  predicciones_acertadas = 0,
  trivias_jugadas = 0,
  ultimo_trivia = NULL,
  ultimo_runner = NULL,
  ultimo_bono_diario = NULL,
  dias_consecutivos = 0,
  misiones_completadas = NULL,
  elegible_canje = 0,
  canal_contacto = NULL,
  nivel = 'inactivo'
WHERE id > 0;

-- ⚠️ Si prefieres BORRAR jugadores también (dejar solo superadmin), descomenta:
-- DELETE FROM jugadores
--  WHERE email NOT IN ('andrea_ramirezt@cun.edu.co', 'andrearamirezt1992@gmail.com');

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN (consultas de chequeo, ejecutar aparte)
-- ============================================================================
-- SELECT COUNT(*) AS jugadores FROM jugadores;
-- SELECT COUNT(*) AS predicciones FROM predicciones;
-- SELECT COUNT(*) AS transacciones FROM transacciones;
-- SHOW COLUMNS FROM predicciones LIKE 'goles_ganados';
-- SHOW COLUMNS FROM transacciones LIKE 'tipo';
