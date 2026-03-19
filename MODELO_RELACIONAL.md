# Modelo Relacional - CLTiene Mundial 2026

## Principios del modelo (adaptado a Coljuegos)

- **Nunca se restan monedas** - Todo es acumulable, el jugador jamas pierde
- Las predicciones son **gratuitas** (no cuestan monedas)
- Se **ganan monedas** por: registro, bono diario, predicciones correctas, bono por apostar, referidos, trivia, misiones
- Los **goles** son un sistema paralelo de puntos (se ganan con misiones)
- El **ranking** se basa en monedas acumuladas
- El **canje** solo se habilita al finalizar el mundial y requiere actividad minima

---

## Diagrama de colecciones Firestore

```
jugadores (1) ──────< predicciones (N)
    │                      │
    │                      └──── partido_id → partidos
    │
    ├──────< transacciones (N)
    │
    ├──────< trivias_historial (N)
    │
    ├──────< canjes (N)
    │
    └──── misiones_completadas[] (embebido)

partidos (independiente)
```

---

## 1. jugadores

Coleccion principal del jugador. Almacena perfil, saldo, progreso y datos del registro.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `uid` | string (PK) | ID de Firebase Auth |
| `email` | string | Correo electronico |
| `nombre` | string | Nombre completo |
| `telefono` | string | Numero de contacto |
| `correo` | string | Correo personal (registro) |
| **Encuesta de registro** | | |
| `tipojugador` | string | 'natural', 'empresa', 'organizacion', 'explorar' |
| `relacionCLTiene` | string | 'cliente', 'escuchado', 'explorando', 'nuevo' |
| `esReferido` | boolean | Si fue referido por otro jugador |
| `nombreReferidor` | string | Nombre de quien lo refirio |
| **Sistema de monedas** | | |
| `monedas` | number | Saldo acumulado de monedas (NUNCA baja) |
| `monedas_totales_ganadas` | number | Total historico de monedas ganadas |
| **Sistema de goles** | | |
| `goles` | number | Goles acumulados (misiones) |
| **Progreso** | | |
| `predicciones` | number | Cantidad total de predicciones realizadas |
| `predicciones_acertadas` | number | Cantidad de predicciones correctas |
| `nivel` | string | 'muy_activo', 'activo', 'inactivo' |
| **Misiones** | | |
| `misiones_completadas` | string[] | IDs de misiones completadas |
| **Referidos** | | |
| `codigo_referido` | string | Codigo unico para compartir (8 chars del UID) |
| `referido_por` | string | Codigo de quien lo refirio |
| `referidos_count` | number | Cantidad de personas que refirio |
| **Trivia** | | |
| `trivias_jugadas` | number | Total de trivias jugadas |
| `ultimo_trivia` | string | Fecha de ultima trivia (YYYY-MM-DD) |
| **Bonos** | | |
| `ultimo_bono_diario` | string | Fecha de ultimo bono diario (YYYY-MM-DD) |
| `dias_consecutivos` | number | Dias consecutivos de ingreso |
| `ultimo_acceso` | Date | Ultima fecha de acceso |
| **Notificaciones** | | |
| `fcm_token` | string | Token de Firebase Cloud Messaging |
| **Canje** | | |
| `canal_contacto` | string | 'whatsapp', 'email', 'telefono' (para canje) |
| `elegible_canje` | boolean | Si cumple requisitos minimos de juego |
| **Metadata** | | |
| `createdAt` | string | Fecha de registro (ISO) |

### Reglas de nivel:
- `muy_activo`: monedas >= 500
- `activo`: monedas >= 100
- `inactivo`: monedas < 100

---

## 2. partidos

Todos los partidos del Mundial 2026.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string (PK) | ID auto-generado |
| `grupo` | string | Grupo del torneo (A-L) |
| `local` | string | Nombre equipo local |
| `visitante` | string | Nombre equipo visitante |
| `bandera_l` | string | Codigo bandera local (ISO) |
| `bandera_v` | string | Codigo bandera visitante (ISO) |
| `fecha` | string | Fecha del partido (YYYY-MM-DD) |
| `hora` | string | Hora del partido (HH:MM) |
| `fase` | string | 'Grupos', 'Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinales', 'Tercer puesto', 'Final' |
| `estado` | string | 'pendiente', 'en_curso', 'finalizado' |
| `goles_local` | number | Goles equipo local (post-partido) |
| `goles_visitante` | number | Goles equipo visitante (post-partido) |
| `resultado` | string | 'local', 'visitante', 'empate' (post-partido) |
| `createdAt` | Date | Fecha de creacion |

---

## 3. predicciones

Predicciones de los jugadores. **Son gratuitas** - no cuestan monedas.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string (PK) | ID auto-generado |
| `uid` | string (FK) | ID del jugador |
| `partido_id` | string (FK) | ID del partido |
| `resultado` | string | Prediccion: 'local', 'visitante', 'empate' |
| `goles_local` | number | Prediccion marcador local |
| `goles_visitante` | number | Prediccion marcador visitante |
| `estado` | string | 'pendiente', 'acertada_simple', 'acertada_especial', 'fallida' |
| `monedas_ganadas` | number | Monedas ganadas (0 si fallo, nunca negativo) |
| `createdAt` | Date | Fecha de creacion |

### Logica de recompensa por prediccion (NUNCA se pierde):
| Resultado | Monedas ganadas |
|-----------|-----------------|
| Acierto resultado simple (gana/empata/pierde) | +50 |
| Acierto especial (marcador exacto) | +100 |
| Fallo | 0 (no pierde nada) |

---

## 4. transacciones

Historial de **todas** las monedas ganadas. Solo registros positivos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string (PK) | ID auto-generado |
| `uid` | string (FK) | ID del jugador |
| `tipo` | string | Tipo de transaccion (ver tabla abajo) |
| `monto` | number | Cantidad de monedas (siempre >= 0) |
| `saldo_anterior` | number | Saldo antes de la transaccion |
| `saldo_nuevo` | number | Saldo despues de la transaccion |
| `descripcion` | string | Descripcion legible |
| `referencia_id` | string | ID del partido/trivia/mision relacionado (opcional) |
| `createdAt` | Date | Fecha de creacion |

### Tipos de transaccion:
| tipo | Descripcion | Monedas |
|------|-------------|---------|
| `registro` | Bono de bienvenida | +100 |
| `bono_diario` | Bono por acceso diario | +10 a +70 (segun fase) |
| `bono_apuesta` | Bono por predecir en fecha | +10 por partido del dia |
| `prediccion_simple` | Acierto resultado simple | +50 |
| `prediccion_especial` | Acierto marcador exacto | +100 |
| `bono_referido` | Alguien se registro con tu codigo | +50 |
| `trivia` | Trivia diaria completada | +1 a +5 (segun aciertos) |

---

## 5. trivias_historial

Registro de cada trivia jugada (una por dia).

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string (PK) | ID auto-generado |
| `uid` | string (FK) | ID del jugador |
| `correctas` | number | Cantidad de respuestas correctas (0-5) |
| `total_preguntas` | number | Total de preguntas (5) |
| `goles_ganados` | number | Goles otorgados |
| `primera_vez` | boolean | Si fue la primera trivia (bono mision) |
| `fecha` | string | Fecha de la trivia (YYYY-MM-DD) |
| `createdAt` | Date | Fecha de creacion |

---

## 6. canjes

Solicitudes de canje de monedas por beneficios (post-mundial).

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string (PK) | ID auto-generado |
| `uid` | string (FK) | ID del jugador |
| `monedas_canjeadas` | number | Cantidad de monedas a canjear |
| `beneficio` | string | Descripcion del beneficio elegido |
| `categoria` | string | 'descuento', 'plan_especial', 'consultoria', 'premio' |
| `estado` | string | 'solicitado', 'en_contacto', 'entregado', 'cancelado' |
| `canal_contacto` | string | 'whatsapp', 'email', 'telefono' |
| `notas_asesor` | string | Notas del asesor CLTiene |
| `createdAt` | Date | Fecha de solicitud |
| `updatedAt` | Date | Ultima actualizacion |

### Requisito minimo para canjear (al menos UNO):
- Haber realizado >= 11 predicciones
- Haber participado en >= 4 fases del torneo

---

## 7. Misiones (definidas en codigo, no en BD)

Las misiones se definen en el backend (misiones.service.ts). El progreso se guarda en `jugadores.misiones_completadas[]`.

| ID Mision | Tipo | Recompensa | Validacion |
|-----------|------|------------|------------|
| `perfil_creado` | auto | +10 goles | Jugador existe en Firestore |
| `primera_prediccion` | auto | +5 goles | predicciones > 0 |
| `invita_amigo` | auto | +5 goles | Alguien se registro con tu codigo |
| `ver_video` | manual | +3 goles | Ver video 30s minimo |
| `trivia_mundial` | auto | +4 goles | trivias_jugadas > 0 |
| `siete_dias` | auto | +7 goles | dias_consecutivos >= 7 |

---

## 8. Bonos diarios por fase del mundial

| Fase | Fechas | Monedas/dia |
|------|--------|-------------|
| Zona de grupos (inicio) | Jun 11-23 | 10 |
| Zona de grupos (final) | Jun 24-27 | 60 |
| Dieciseisavos | Jun 28 - Jul 3 | 20 |
| Octavos | Jul 4-7 | 30 |
| Cuartos | Jul 9-11 | 40 |
| Semifinales | Jul 14-15 | 50 |
| Tercer puesto | Jul 18 | 60 |
| Final | Jul 19 | 70 |

---

## 9. Bono por apostar (por fecha)

10 monedas por cada partido del dia donde el jugador haya hecho prediccion.

Ejemplo: Si un dia tiene 4 partidos y el jugador predijo los 4, gana +40 monedas de bono.

---

## Flujo de monedas (solo acumulativo)

```
ENTRADA DE MONEDAS (nunca sale):
  +100  Registro
  +10~70  Bono diario (segun fase)
  +10/partido  Bono por predecir
  +50   Prediccion simple correcta
  +100  Prediccion especial correcta (marcador exacto)
  +50   Referido (alguien se registra con tu codigo)
  +1~5  Trivia diaria (1 por correcta, min 1)

SALIDA DE MONEDAS:
  NINGUNA - Las monedas NUNCA se restan
  El canje solo ocurre al final del mundial
```

---

## Ranking

El ranking se calcula en tiempo real basado en `jugadores.monedas` (ORDER BY monedas DESC).

**Datos publicos del ranking:**
- Posicion (#1, #2, etc.)
- Nombre del jugador
- Cantidad de predicciones

**Datos NO publicos** (segun PDF):
- Cantidad exacta de monedas de otros jugadores
- Esto es interno para CLTiene

---

## Indices recomendados para Firestore

```
jugadores:
  - monedas DESC (para ranking)
  - nivel ASC (para segmentacion)

predicciones:
  - uid + partido_id (unicidad)
  - uid + createdAt DESC (historial)
  - partido_id + estado (para resolver predicciones)

transacciones:
  - uid + createdAt DESC (historial)
  - uid + tipo (filtrar por tipo)

partidos:
  - fase + fecha ASC (listar por fase)
  - estado + fecha ASC (partidos pendientes)

trivias_historial:
  - uid + fecha (unicidad diaria)
```
