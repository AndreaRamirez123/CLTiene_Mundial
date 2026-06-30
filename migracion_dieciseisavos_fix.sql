-- ============================================================
-- MIGRACIÓN: Corregir partidos de Dieciseisavos (Eliminatoria de 32)
-- Mundial 2026 - partidos reales verificados
-- Ejecutar en Supabase Studio / MySQL en la tabla correcta
-- ============================================================

-- PASO 1: Borrar predicciones de Dieciseisavos incorrectos
-- (los cruces generados automáticamente estaban mal)
DELETE pr FROM predicciones pr
INNER JOIN partidos pa ON pr.partido_id = pa.id
WHERE pa.fase = 'Dieciseisavos';

-- PASO 2: Borrar los Dieciseisavos incorrectos
DELETE FROM partidos WHERE fase = 'Dieciseisavos';

-- PASO 3: Insertar los partidos REALES de la Eliminatoria de 32
-- (para todas las empresas activas)

-- ── 28 Jun (FINALIZADO) ──────────────────────────────────────
INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Sudáfrica', 'za', 'Canadá', 'ca', '2026-06-28', '14:00', 'Dieciseisavos', 'finalizado', 0, 1, 'visitante'
FROM empresas WHERE estado = 'activa';

-- ── 29 Jun (FINALIZADOS) ─────────────────────────────────────
-- Países Bajos vs Marruecos → 1-1, Marruecos gana en penales
INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Países Bajos', 'nl', 'Marruecos', 'ma', '2026-06-29', '12:00', 'Dieciseisavos', 'finalizado', 1, 1, 'visitante'
FROM empresas WHERE estado = 'activa';

-- Alemania vs Paraguay → 1-1, Paraguay gana en penales
INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Alemania', 'de', 'Paraguay', 'py', '2026-06-29', '16:00', 'Dieciseisavos', 'finalizado', 1, 1, 'visitante'
FROM empresas WHERE estado = 'activa';

-- Brasil vs Japón → 2-1, Brasil gana
INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Brasil', 'br', 'Japón', 'jp', '2026-06-29', '20:00', 'Dieciseisavos', 'finalizado', 2, 1, 'local'
FROM empresas WHERE estado = 'activa';

-- ── 30 Jun (PENDIENTES - HOY) ────────────────────────────────
INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Costa de Marfil', 'ci', 'Noruega', 'no', '2026-06-30', '12:00', 'Dieciseisavos', 'pendiente', NULL, NULL, NULL
FROM empresas WHERE estado = 'activa';

INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Francia', 'fr', 'Suecia', 'se', '2026-06-30', '16:00', 'Dieciseisavos', 'pendiente', NULL, NULL, NULL
FROM empresas WHERE estado = 'activa';

INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'México', 'mx', 'Ecuador', 'ec', '2026-06-30', '20:00', 'Dieciseisavos', 'pendiente', NULL, NULL, NULL
FROM empresas WHERE estado = 'activa';

-- ── 1 Jul (PENDIENTES - MAÑANA) ──────────────────────────────
INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Inglaterra', 'gb-eng', 'Rep. Democrática del Congo', 'cd', '2026-07-01', '11:00', 'Dieciseisavos', 'pendiente', NULL, NULL, NULL
FROM empresas WHERE estado = 'activa';

INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Bélgica', 'be', 'Senegal', 'sn', '2026-07-01', '15:00', 'Dieciseisavos', 'pendiente', NULL, NULL, NULL
FROM empresas WHERE estado = 'activa';

INSERT INTO partidos (empresa_id, grupo, local_equipo, bandera_local, visitante_equipo, bandera_visitante, fecha, hora, fase, estado, goles_local, goles_visitante, resultado)
SELECT id, NULL, 'Estados Unidos', 'us', 'Bosnia y Herzegovina', 'ba', '2026-07-01', '19:00', 'Dieciseisavos', 'pendiente', NULL, NULL, NULL
FROM empresas WHERE estado = 'activa';

-- ── NOTA: Faltan los partidos del 2 y 3 de julio ─────────────
-- Agrégalos desde el Panel Admin → Partidos → Crear partido
-- o añadiendo más bloques INSERT aquí con la misma estructura.

-- ── PASO 4: Re-evaluar predicciones para finalizados del 28-29 jun ──
-- Esto lo hace el backend automáticamente al llamar re-evaluar.
-- También puedes usar el Panel Admin → Partidos → botón "Re-evaluar"
-- para cada partido de Dieciseisavos que ya tenga resultado.

SELECT CONCAT('✅ Partidos de Dieciseisavos corregidos para empresa_id: ', id) AS resultado
FROM empresas WHERE estado = 'activa';
