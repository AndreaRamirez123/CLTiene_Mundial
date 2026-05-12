-- ============================================
-- CLTiene Mundial 2026 - Esquema MySQL (SaaS Multi-Tenant)
-- Monedas NUNCA se restan (Coljuegos)
-- ============================================

CREATE DATABASE IF NOT EXISTS cltiene_mundial
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cltiene_mundial;

-- ============================================
-- 0. EMPRESAS (Tenants)
-- ============================================
CREATE TABLE empresas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE COMMENT 'Identificador URL-friendly',
  estado ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_slug (slug),
  INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- ============================================
-- 0.1 CONFIG MARCA (Personalización por empresa)
-- ============================================
CREATE TABLE config_marca (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL UNIQUE,
  nombre_app VARCHAR(150) NOT NULL DEFAULT 'CLTiene Mundial',
  subtitulo VARCHAR(150) NOT NULL DEFAULT 'Mundial 2026',
  logo_url TEXT DEFAULT NULL,
  color_primario VARCHAR(10) NOT NULL DEFAULT '#FD7751',
  color_secundario VARCHAR(10) NOT NULL DEFAULT '#ED1E28',
  color_acento VARCHAR(10) NOT NULL DEFAULT '#ECA82D',
  color_fondo VARCHAR(10) NOT NULL DEFAULT '#0f0a1e',
  terminos_condiciones LONGTEXT DEFAULT NULL,
  politica_privacidad LONGTEXT DEFAULT NULL,
  publicidad_json LONGTEXT DEFAULT NULL,
  beneficios_json LONGTEXT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 1. JUGADORES
-- ============================================
CREATE TABLE jugadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  uid VARCHAR(128) NOT NULL UNIQUE COMMENT 'UID interno',
  email VARCHAR(255) NOT NULL,

  UNIQUE KEY uk_email_empresa (email, empresa_id),
  nombre VARCHAR(150) NOT NULL DEFAULT '',
  nick VARCHAR(32) DEFAULT NULL COMMENT 'Nick público único por empresa',
  nick_normalizado VARCHAR(32) DEFAULT NULL COMMENT 'Nick en minúsculas para búsqueda',
  telefono VARCHAR(30) DEFAULT '',
  correo VARCHAR(255) DEFAULT '',

  -- Encuesta de registro
  tipojugador ENUM('natural','empresa','organizacion','explorar') DEFAULT NULL,
  relacion_cltiene ENUM('cliente','escuchado','explorando','nuevo') DEFAULT NULL,
  es_referido TINYINT(1) DEFAULT 0,
  nombre_referidor VARCHAR(150) DEFAULT '',

  -- Sistema de monedas 
  monedas INT UNSIGNED NOT NULL DEFAULT 0,
  monedas_totales_ganadas INT UNSIGNED NOT NULL DEFAULT 0,

  -- Misiones
  goles INT UNSIGNED NOT NULL DEFAULT 0,

  -- Progreso
  predicciones_count INT UNSIGNED NOT NULL DEFAULT 0,
  predicciones_acertadas INT UNSIGNED NOT NULL DEFAULT 0,
  nivel ENUM('inactivo','activo','muy_activo') NOT NULL DEFAULT 'activo',

  -- Referidos
  codigo_referido VARCHAR(10) NOT NULL COMMENT 'Codigo unico para compartir',
  referido_por VARCHAR(10) DEFAULT '' COMMENT 'Codigo de quien lo refirio',
  referidos_count INT UNSIGNED NOT NULL DEFAULT 0,

  -- Misiones completadas 
  misiones_completadas JSON DEFAULT ('[]'),

  -- Trivia
  trivias_jugadas INT UNSIGNED NOT NULL DEFAULT 0,
  ultimo_trivia DATE DEFAULT NULL,

  -- Bonos
  ultimo_bono_diario DATE DEFAULT NULL,
  dias_consecutivos INT UNSIGNED NOT NULL DEFAULT 0,
  ultimo_acceso DATETIME DEFAULT NULL,

  -- Notificaciones
  fcm_token VARCHAR(500) DEFAULT NULL,

  -- Canje
  canal_contacto ENUM('whatsapp','email','telefono') DEFAULT NULL,
  elegible_canje TINYINT(1) NOT NULL DEFAULT 0,

  -- Metadata
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_empresa (empresa_id),
  INDEX idx_monedas (monedas DESC),
  INDEX idx_nivel (nivel),
  INDEX idx_codigo_referido (codigo_referido),
  INDEX idx_referido_por (referido_por),
  UNIQUE KEY uk_nick_empresa (empresa_id, nick_normalizado),

  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB;

-- ============================================
-- 2. PARTIDOS
-- ============================================
CREATE TABLE partidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  grupo VARCHAR(5) DEFAULT NULL COMMENT 'Grupo A-L',
  local_equipo VARCHAR(100) NOT NULL,
  visitante_equipo VARCHAR(100) NOT NULL,
  bandera_local VARCHAR(10) NOT NULL COMMENT 'Codigo ISO bandera',
  bandera_visitante VARCHAR(10) NOT NULL,
  fecha DATE NOT NULL,
  hora VARCHAR(10) NOT NULL COMMENT 'HH:MM',
  fase ENUM('Grupos','Dieciseisavos','Octavos','Cuartos','Semifinales','Tercer puesto','Final') NOT NULL,
  estado ENUM('pendiente','en_curso','finalizado') NOT NULL DEFAULT 'pendiente',
  goles_local TINYINT UNSIGNED DEFAULT NULL,
  goles_visitante TINYINT UNSIGNED DEFAULT NULL,
  resultado ENUM('local','visitante','empate') DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_empresa (empresa_id),
  INDEX idx_fase_fecha (fase, fecha),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha),

  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB;

-- ============================================
-- 3. PREDICCIONES 
-- ============================================
CREATE TABLE predicciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jugador_id INT NOT NULL,
  partido_id INT NOT NULL,
  resultado ENUM('local','visitante','empate') NOT NULL,
  goles_local TINYINT UNSIGNED NOT NULL DEFAULT 0,
  goles_visitante TINYINT UNSIGNED NOT NULL DEFAULT 0,
  estado ENUM('pendiente','acertada_simple','acertada_especial','fallida') NOT NULL DEFAULT 'pendiente',
  monedas_ganadas INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Solo positivo o 0',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_jugador_partido (jugador_id, partido_id),
  FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,
  FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,

  INDEX idx_jugador (jugador_id),
  INDEX idx_partido_estado (partido_id, estado)
) ENGINE=InnoDB;

-- ============================================
-- 4. TRANSACCIONES 
-- ============================================
CREATE TABLE transacciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jugador_id INT NOT NULL,
  tipo ENUM(
    'registro',
    'bono_diario',
    'bono_apuesta',
    'prediccion_simple',
    'prediccion_especial',
    'bono_referido',
    'trivia'
  ) NOT NULL,
  monto INT UNSIGNED NOT NULL COMMENT 'Siempre >= 0',
  saldo_anterior INT UNSIGNED NOT NULL,
  saldo_nuevo INT UNSIGNED NOT NULL,
  descripcion VARCHAR(255) NOT NULL DEFAULT '',
  referencia_id INT DEFAULT NULL COMMENT 'ID del partido/trivia relacionado',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,

  INDEX idx_jugador_fecha (jugador_id, created_at DESC),
  INDEX idx_jugador_tipo (jugador_id, tipo)
) ENGINE=InnoDB;

-- ============================================
-- 5. TRIVIAS HISTORIAL 
-- ============================================
CREATE TABLE trivias_historial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jugador_id INT NOT NULL,
  correctas TINYINT UNSIGNED NOT NULL DEFAULT 0,
  total_preguntas TINYINT UNSIGNED NOT NULL DEFAULT 5,
  goles_ganados TINYINT UNSIGNED NOT NULL DEFAULT 0,
  primera_vez TINYINT(1) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_jugador_fecha (jugador_id, fecha),
  FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,

  INDEX idx_jugador (jugador_id)
) ENGINE=InnoDB;

-- ============================================
-- 6. CANJES 
-- ============================================
CREATE TABLE canjes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jugador_id INT NOT NULL,
  monedas_canjeadas INT UNSIGNED NOT NULL,
  beneficio VARCHAR(255) NOT NULL,
  categoria ENUM('descuento','plan_especial','consultoria','premio') NOT NULL,
  estado ENUM('solicitado','en_contacto','entregado','cancelado') NOT NULL DEFAULT 'solicitado',
  canal_contacto ENUM('whatsapp','email','telefono') NOT NULL,
  notas_asesor TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,

  INDEX idx_jugador (jugador_id),
  INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- ============================================
-- 7. NOTIFICACIONES LOG
-- ============================================
CREATE TABLE notificaciones_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jugador_id INT NOT NULL,
  tipo ENUM('previa_fecha','recordatorio_pendiente','inactividad') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  enviada TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,

  INDEX idx_jugador_fecha (jugador_id, created_at DESC)
) ENGINE=InnoDB;

-- ============================================
-- 8. PREGUNTAS TRIVIA
-- ============================================
CREATE TABLE preguntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pregunta TEXT NOT NULL,
  opciones JSON NOT NULL COMMENT 'Array de 4 strings',
  correcta TINYINT UNSIGNED NOT NULL COMMENT 'Indice 0-3 de la respuesta correcta',
  empresa_id INT DEFAULT NULL COMMENT 'NULL = global, con valor = solo esa empresa',
  tipo ENUM('mundial','empresa') NOT NULL DEFAULT 'mundial',
  dia_semana TINYINT UNSIGNED DEFAULT NULL COMMENT '0=dom, 1=lun, ..., 6=sab, NULL=cualquier dia',
  activa TINYINT(1) NOT NULL DEFAULT 1,
  ultima_usada DATE DEFAULT NULL,
  veces_usada INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  INDEX idx_empresa_tipo (empresa_id, tipo),
  INDEX idx_activa (activa),
  INDEX idx_rotacion (tipo, activa, ultima_usada, veces_usada)
) ENGINE=InnoDB;

-- ============================================
-- 8.1 TRIVIA DIARIA POR EMPRESA
-- ============================================
CREATE TABLE trivias_diarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  fecha DATE NOT NULL,
  pregunta_ids JSON NOT NULL COMMENT 'IDs de las 6 preguntas asignadas a la empresa para ese dia',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_empresa_fecha (empresa_id, fecha),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================
-- VISTA: Ranking (filtrable por empresa_id)
-- ============================================
CREATE OR REPLACE VIEW ranking_general AS
SELECT
  j.id,
  j.uid,
  j.nombre,
  j.monedas,
  j.predicciones_count,
  j.predicciones_acertadas,
  j.nivel,
  j.goles,
  j.empresa_id,
  RANK() OVER (PARTITION BY j.empresa_id ORDER BY j.monedas DESC) AS posicion
FROM jugadores j
ORDER BY j.empresa_id, j.monedas DESC;

-- ============================================
-- SSO SESSIONS (tokens temporales single-use para integracion CUN 360)
-- ============================================
CREATE TABLE IF NOT EXISTS sso_sessions (
  token VARCHAR(64) PRIMARY KEY,
  jugador_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  used TINYINT NOT NULL DEFAULT 0,

  INDEX idx_jugador (jugador_id),
  INDEX idx_expires (expires_at),
  FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- VISTA: Elegibilidad de canje (filtrable por empresa_id)
-- ============================================
CREATE OR REPLACE VIEW elegibilidad_canje AS
SELECT
  j.id,
  j.uid,
  j.nombre,
  j.monedas,
  j.predicciones_count,
  j.empresa_id,
  COUNT(DISTINCT p.fase) AS fases_participadas,
  CASE
    WHEN j.predicciones_count >= 11 THEN 1
    WHEN COUNT(DISTINCT p.fase) >= 4 THEN 1
    ELSE 0
  END AS es_elegible
FROM jugadores j
LEFT JOIN predicciones pr ON pr.jugador_id = j.id
LEFT JOIN partidos p ON p.id = pr.partido_id
GROUP BY j.id;
