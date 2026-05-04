-- Rotacion diaria de trivia: banco + seleccion fija por empresa y fecha.

ALTER TABLE preguntas
  ADD COLUMN ultima_usada DATE DEFAULT NULL,
  ADD COLUMN veces_usada INT UNSIGNED NOT NULL DEFAULT 0,
  ADD INDEX idx_rotacion (tipo, activa, ultima_usada, veces_usada);

CREATE TABLE IF NOT EXISTS trivias_diarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  fecha DATE NOT NULL,
  pregunta_ids JSON NOT NULL COMMENT 'IDs de las 6 preguntas asignadas a la empresa para ese dia',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_empresa_fecha (empresa_id, fecha),
  INDEX idx_fecha (fecha),
  CONSTRAINT fk_trivias_diarias_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB;
