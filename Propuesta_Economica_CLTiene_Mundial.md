# Propuesta Económica y Costos de Operación

## Proyecto: CLTiene Mundial 2026

| Campo | Valor |
|-------|-------|
| Cliente | CLTiene / Multiservicios CL Tiene |
| Aplicación | https://mundial-2.web.app/ |
| Fecha del reporte | 28 de abril de 2026 (actualizado) |
| Fuente de datos | Google Cloud Pricing Calculator (28 abr 2026) + Consola Google Cloud |
| Moneda | USD (referencias en COP a tasa ~4.000/USD) |
| Región de servicios | Iowa (us-central1) |
| Edición Cloud SQL | Cloud SQL Enterprise — MySQL |

---

## Resumen ejecutivo

Este documento presenta:
1. Los **costos reales de infraestructura** de la plataforma (lo que cuesta operarla).
2. La **propuesta comercial sugerida** al cliente (cuánto se recomienda cobrar).
3. Escenario central proyectado: **30.000 a 60.000 usuarios concurrentes en picos** durante eventos del mundial (peor caso).

> **Nota importante:** En plataformas con picos intensos por eventos deportivos, lo que define el dimensionamiento de la base de datos no es el número de usuarios mensuales, sino los **usuarios concurrentes en hora pico**. Por eso se proyecta sobre 30K-60K concurrentes.

### Cifras clave

| Concepto | Valor |
|----------|-------|
| **Costo operativo actual** (400 usuarios registrados, abril 2026) | **USD $9.37 / mes** (Tier 1 — db-f1-micro) |
| **Costo operativo proyectado** (60K concurrentes, Tier 5 + HA siempre activo) | **USD $2.510 – $2.620 / mes** |
| **Costo operativo proyectado** (escalado progresivo, HA solo en picos) | **USD $1.330 – $1.640 / mes** |
| **Costo por usuario concurrente durante el mundial** | **USD $0.042 / mes** (~170 COP) |
| **Precio comercial sugerido al cliente** (60K concurrentes) | **USD $5.500 – $8.500 / mes** *(revisado)* |
| **Margen bruto estimado** | **55% – 70%** *(antes 85-90%, ajustado por costos reales de BD)* |
| **Total sugerido para los 2 meses del mundial** | **USD $11.000 – $17.000** (~44 – 68 M COP) |

---

## 1. Estado actual de operación

La plataforma está desplegada y en funcionamiento, operando en **Firebase plan Blaze (pay-as-you-go)**. El consumo es mínimo gracias al escalado automático.

| Servicio | Rol en la aplicación | Configuración actual | Costo mensual actual |
|----------|---------------------|----------------------|----------------------|
| Google Cloud SQL (MySQL 8) | Base de datos principal | `db-f1-micro` (1 vCPU comp., 0.6 GB, 10 GB SSD) | **USD $9.37** |
| Google Cloud Run | Backend NestJS (API) | Escalado automático | USD $0.00 |
| Firebase Hosting | Frontend web | Tier gratuito | USD $0.00 |
| Firebase Auth | Autenticación de usuarios | Tier gratuito | USD $0.00 |
| Firebase Cloud Messaging | Notificaciones push | Tier gratuito | USD $0.00 |
| Artifact Registry | Imágenes Docker del backend | — | ~USD $0.45 |
| Secret Manager | Credenciales de producción | — | <USD $0.30 |

### Costo mensual actual

> **USD $10 – $11 / mes** (400 usuarios registrados, ~8% de CPU sostenido en BD)

Los servicios Cloud Run, Hosting, Auth y FCM permanecen dentro del tier gratuito y **escalan a cero** cuando no hay tráfico.

---

## 2. Escenario proyectado para el Mundial: 30K-60K usuarios concurrentes en picos

Este es el escenario central recomendado para la planeación financiera del proyecto. Asume el peor caso de carga durante eventos clave del mundial (partidos importantes, finales, clásicos).

### 2.1 Desglose de costos con Tier 5 + HA siempre activo (escenario conservador)

| Servicio | Costo mensual estimado | Notas |
|----------|------------------------|-------|
| **Cloud SQL** (BD primaria + HA) | **USD $2.375,81** | `db-highmem-16` (16 vCPU, 104 GB, 1 TB SSD) + Alta Disponibilidad |
| **Cloud Run** (backend) | USD $40 – $100 | ~6M requests/mes proyectados |
| **Firebase Hosting** (web) | USD $20 – $50 | Supera 10 GB de transferencia gratuita |
| **Firebase Auth** | USD $55 | 50k gratis + ~10k adicionales × USD $0.0055 |
| **Firebase Cloud Messaging** | USD $0 | Gratis ilimitado |
| **OpenAI API** (trivias) | USD $5 – $15 | No escala con usuarios |
| **Cloud Build + Artifact + Secret** | ~USD $1 | Casi fijo |
| **SMTP transaccional** | USD $10 – $20 | Migración recomendada desde Gmail |
| **Total mensual** | **USD $2.506 – $2.616** | |

### 2.2 Desglose alternativo: escalado progresivo (escenario realista)

Si en lugar de mantener Tier 5 + HA todo el mes se escala según demanda real (Tier 3-4 en horas valle, Tier 5 + HA solo en eventos clave), el promedio mensual se reduce:

| Servicio | Costo mensual estimado | Notas |
|----------|------------------------|-------|
| **Cloud SQL** (mix Tier 3 → Tier 5 con HA en picos) | **USD $1.200 – $1.400** | Promedio ponderado por horas en cada tier |
| Resto de servicios | USD $130 – $240 | Igual al escenario conservador |
| **Total mensual** | **USD $1.330 – $1.640** | |

> **Trade-off:** El escalado progresivo ahorra ~40% en costos pero requiere monitoreo activo y operación más compleja. Recomendado solo si se cuenta con personal técnico atento durante el mundial.

### 2.3 Totales para los 2 meses del mundial

| Escenario | Total 2 meses | En pesos (COP ~4.000/USD) |
|-----------|---------------|---------------------------|
| Conservador (Tier 5 + HA siempre) | **USD $5.012 – $5.232** | **~20 – 21 millones** |
| Realista (escalado progresivo) | **USD $2.660 – $3.280** | **~11 – 13 millones** |

### 2.4 Costo por usuario concurrente durante el mundial

| Escenario | Total mensual | **Por usuario concurrente/mes** | En pesos |
|-----------|---------------|----------------------------------|----------|
| Conservador | USD $2.560 | **USD $0.043** | **~170 COP** |
| Realista | USD $1.485 | **USD $0.025** | **~99 COP** |

---

## 3. Tabla de tiers Cloud SQL — Estrategia de escalamiento

Esta tabla muestra el costo mensual de Cloud SQL en cada tier. Permite escalar progresivamente conforme crece la demanda, en lugar de saltar directo al tope.

| Tier | Configuración | Capacidad activos | HA | Costo mensual (USD) |
|------|---------------|-------------------|-----|---------------------|
| **Tier 1 — Actual** | `db-f1-micro` (1 vCPU comp., 0.6 GB, 10 GB SSD) | ~400 registrados | No | **$9,37** |
| Tier 1 con HA | `db-f1-micro` + HA | ~400 registrados | Sí | $28,95 |
| Tier 2 | `db-standard-2` (2 vCPU, 7.5 GB, 50 GB SSD) | 500 – 3.000 | No | $107,12 |
| Tier 3 sin HA | `db-highmem-4` (4 vCPU, 26 GB, 250 GB SSD) | 3.000 – 10.000 | No | $295,96 |
| Tier 3 con HA | `db-highmem-4` + HA | 3.000 – 10.000 | Sí | $591,91 |
| Tier 4 sin HA | `db-highmem-8` (8 vCPU, 52 GB, 500 GB SSD) | 10.000 – 40.000 | No | $591,91 |
| Tier 4 con HA | `db-highmem-8` + HA | 10.000 – 40.000 | Sí | $1.183,82 |
| Tier 5 sin HA | `db-highmem-16` (16 vCPU, 104 GB, 1 TB SSD) | 40.000 – 80.000+ | No | $1.187,90 |
| **Tier 5 — Recomendado Mundial** | `db-highmem-16` + HA | 40.000 – 80.000+ | **Sí** | **$2.375,81** |

### 3.1 Estrategia de escalamiento recomendada

1. **Mantener Tier 1** hasta que el monitoreo muestre CPU sostenido > 60% o RAM > 70%.
2. **Saltar a Tier 2** cuando se acerquen los 500 usuarios concurrentes.
3. **Escalar a Tier 3** progresivamente conforme crece la base de usuarios pre-mundial.
4. **Activar HA** desde el inicio del mundial (no esperar al primer pico crítico).
5. **Subir a Tier 5 + HA** 24-48 h antes del primer evento de alta demanda (partido inaugural).
6. **Considerar Read Replica** adicional si se observa saturación en queries de lectura (no incluida en estos costos — requiere cálculo aparte).

> **No saltar directo del Tier 1 al Tier 5.** Cada cambio de tier en Cloud SQL implica unos minutos de downtime. Escalar progresivamente reduce el riesgo y permite calibrar el dimensionamiento correcto.

---

## 4. Proyección por otros volúmenes de usuarios concurrentes

| Usuarios concurrentes en pico | Tier requerido | Costo Cloud SQL/mes | Costo total infra/mes |
|-------------------------------|----------------|---------------------|------------------------|
| < 500 | Tier 1 | USD $9 – $29 | USD $10 – $40 |
| 500 – 3.000 | Tier 2 | USD $107 | USD $240 – $350 |
| 3.000 – 10.000 | Tier 3 (con HA) | USD $592 | USD $720 – $830 |
| 10.000 – 40.000 | Tier 4 (con HA) | USD $1.184 | USD $1.310 – $1.420 |
| **40.000 – 80.000+** | **Tier 5 (con HA)** | **USD $2.376** | **USD $2.506 – $2.616** |

> Los costos de Cloud Run, Hosting, Auth y demás servicios crecen lentamente comparados con Cloud SQL. El **principal driver de costos a escala es la base de datos**.

---

## 5. Propuesta Comercial — Precios sugeridos al cliente (REVISADA)

> **Aviso de revisión:** Los precios sugeridos en versiones anteriores asumían costos de Cloud SQL menores a los reales. Esta sección se actualiza para mantener un margen bruto mínimo del 55%-70% sobre los costos reales de infraestructura.

La tabla a continuación presenta **precios sugeridos de venta al cliente**, calculados para considerar:

- Costos reales de infraestructura (según Pricing Calculator 28 abr 2026)
- Mantenimiento técnico (desarrollo, correcciones, actualizaciones)
- Soporte al cliente
- Reserva para imprevistos (10%)

### 5.1 Planes por tier de usuarios concurrentes

| Tier comercial | Usuarios concurrentes | Precio mensual sugerido | En pesos (COP) | Margen bruto |
|----------------|----------------------|-------------------------|----------------|--------------|
| **Starter** | Hasta 500 | **USD $400 / mes** | ~1.6 M COP | ~90% |
| **Growth** | 500 – 3.000 | **USD $750 / mes** | ~3.0 M COP | ~65% |
| **Scale** | 3.000 – 10.000 | **USD $1.800 / mes** | ~7.2 M COP | ~58% |
| **Enterprise** | 10.000 – 40.000 | **USD $3.200 / mes** | ~12.8 M COP | ~57% |
| **Gran evento** (Mundial) | 40.000 – 80.000 | **USD $5.500 – $8.500 / mes** | ~22 – 34 M COP | **55 – 70%** |

### 5.2 Escenario recomendado para el Mundial (60K concurrentes)

| Concepto | Valor |
|----------|-------|
| Precio mensual sugerido | **USD $5.500 – $8.500** |
| Duración del mundial | 2 meses (junio – julio 2026) |
| **Total a cobrar al cliente por el mundial** | **USD $11.000 – $17.000** |
| Equivalente en pesos colombianos | **~44 – 68 millones COP** |
| Costo real de operación (conservador) | USD $5.012 – $5.232 |
| Costo real de operación (realista) | USD $2.660 – $3.280 |
| **Ganancia neta estimada (conservador)** | **USD $5.770 – $11.770** (~23 – 47 M COP) |
| **Ganancia neta estimada (realista)** | **USD $7.720 – $14.340** (~31 – 57 M COP) |

### 5.3 Servicios adicionales sugeridos (facturar aparte)

| Servicio | Precio sugerido |
|----------|-----------------|
| Hora de desarrollo / personalización | USD $25 – $50 / hora |
| Soporte prioritario fuera de horario | USD $300 – $500 / mes |
| Migración a proyecto Google Cloud dedicado | USD $500 – $1.000 (único) |
| Dominio personalizado + configuración | USD $100 (único) + dominio |
| Módulo analítico personalizado | USD $1.500 – $3.000 (único) |
| **Read Replica** Cloud SQL (separar lecturas/escrituras) | A calcular según tier elegido |

---

## 6. Costos adicionales opcionales para la operación

| Concepto | Costo | Observación |
|----------|-------|-------------|
| Dominio personalizado | USD $12 – $20 / año | Solo si se desea cambiar `mundial-2.web.app`. |
| SMTP transaccional | USD $10 – $20 / mes | Si se supera el límite de Gmail. |
| **Read Replica Cloud SQL** | +50% – +100% del tier elegido | Recomendado para separar queries de lectura/escritura en picos. |
| **Committed Use Discounts** (CUDs) | -25% a -52% | Si se compromete uso por 1 o 3 años. No aplican para el evento puntual del mundial. |

---

## 7. Costos NO incluidos en este informe

Los siguientes conceptos **no forman parte** de los costos de operación ni de la propuesta comercial:

- Licencia y uso de **WIP Tool** (ya contratada por CLTiene).
- Premios físicos o digitales entregados en los canjes a los jugadores.
- Marketing, pauta digital y adquisición de usuarios.
- Impuestos locales (IVA, retenciones) sobre la facturación.
- **Read Replica** de Cloud SQL (requiere cálculo adicional según configuración).
- Descuentos por uso comprometido (CUDs) — no aplicados en estas estimaciones.

---

## 8. Recomendaciones estratégicas

### Para optimizar costos

1. **Mantener el estado actual (Tier 1)** hasta iniciar el mundial — costo casi cero (~$10/mes).
2. **Escalar Cloud SQL progresivamente** por umbrales de CPU/RAM/conexiones, **nunca saltar directo al tope**.
3. **Activar alertas de presupuesto** en Google Cloud (umbrales 50%, 80%, 100%) — *en proceso*.
4. **Activar alertas de métricas** sobre CPU, memoria y errores 5xx para anticipar la necesidad de escalar — *en proceso*.
5. **Separar CLTiene Mundial** en su propio proyecto de Google Cloud y cuenta propia de OpenAI para que el cliente pueda auditar consumo directamente.
6. **Evaluar escalado programado** del Cloud SQL: subir a Tier 5 + HA antes de cada partido importante y bajar después.

### Para la propuesta comercial

1. **Cobrar un fee fijo** al cliente (no por usuario) para proyectos con pocos usuarios.
2. **Incluir cláusula de volumen**: si supera el tier, se factura automáticamente el siguiente nivel.
3. **Fee único para el evento "Mundial"** en lugar de mensualidad, facturado al inicio.
4. **Ofrecer servicios adicionales** (personalización, reportes, soporte prioritario) como facturación extra.
5. **Documentar contractualmente** que costos imprevistos por demanda extraordinaria (ej. picos > 80K concurrentes) se trasladarán al cliente.

---

## 9. Totales consolidados del proyecto

### Costos de operación (lo que paga la empresa desarrolladora)

| Fase | Período | Tier Cloud SQL | Costo operativo |
|------|---------|----------------|-----------------|
| Pre-mundial | Abril – mayo 2026 | Tier 1 (actual) | USD $10 / mes |
| Mundial (escenario conservador) | Junio – julio 2026 | Tier 5 + HA siempre | USD $2.510 – $2.620 / mes |
| Mundial (escenario realista) | Junio – julio 2026 | Escalado progresivo | USD $1.330 – $1.640 / mes |
| Post-mundial | Agosto 2026 | Tier 1-2 | USD $10 – $110 / mes |
| **TOTAL 5 meses (conservador)** | | | **USD $5.040 – $5.270** |
| **TOTAL 5 meses (realista)** | | | **USD $2.690 – $3.330** |

### Facturación sugerida al cliente (lo que cobra la empresa desarrolladora)

| Fase | Período | Precio sugerido |
|------|---------|-----------------|
| Pre-mundial (Starter) | Abril – mayo 2026 | USD $400 / mes × 2 = **USD $800** |
| Mundial (Gran evento) | Junio – julio 2026 | USD $5.500 – $8.500 / mes × 2 = **USD $11.000 – $17.000** |
| Post-mundial (Starter) | Agosto 2026 | USD $400 × 1 = **USD $400** |
| **TOTAL 5 meses (facturación)** | | **USD $12.200 – $18.200** |

### Ganancia neta estimada del proyecto

| Concepto | Escenario conservador | Escenario realista |
|----------|------------------------|---------------------|
| Facturación total estimada | USD $12.200 – $18.200 | USD $12.200 – $18.200 |
| Costo operativo total | USD $5.040 – $5.270 | USD $2.690 – $3.330 |
| **Ganancia neta** | **USD $6.930 – $13.160** (~28 – 53 M COP) | **USD $8.870 – $15.510** (~35 – 62 M COP) |
| **Margen bruto promedio** | **~58%** | **~75%** |

---

## 10. Cambios respecto a versiones anteriores

| Concepto | Versión anterior | Versión actual (28 abr 2026) | Razón del cambio |
|----------|------------------|------------------------------|-------------------|
| Cloud SQL para 60K usuarios | USD $150 – $250 | **USD $2.375,81** | Reinterpretación: 60K son **concurrentes en pico**, no activos mensuales. Requiere `db-highmem-16` + HA. |
| Tier recomendado Mundial | `db-custom-2-7680` | `db-highmem-16` + HA | Plataformas con picos intensos requieren dimensionamiento por hora pico. |
| Costo total operación Mundial/mes | USD $280 – $490 | USD $2.510 – $2.620 (conservador) / USD $1.330 – $1.640 (realista) | Recálculo con costos reales de Cloud SQL. |
| Margen bruto estimado | 85% – 90% | 55% – 70% | Costos de infraestructura mucho mayores a los estimados originalmente. |
| Precio comercial sugerido Mundial | USD $3.500 – $5.000 / mes | **USD $5.500 – $8.500 / mes** | Ajuste para mantener margen mínimo del 55%. |
| Fuente de precios | Estimación interna | **Google Cloud Pricing Calculator (28 abr 2026)** | Datos oficiales y verificables. |

---

*Documento con fines comerciales. Los valores son estimaciones basadas en tarifas vigentes de Google Cloud (Pricing Calculator 28 abr 2026), Firebase y OpenAI a abril de 2026, y en prácticas estándar de pricing SaaS para plataformas de engagement y gamificación B2B. Los precios finales al cliente deben considerar también impuestos locales, tasa de cambio vigente y condiciones contractuales específicas. Los precios mostrados no incluyen descuentos por uso comprometido (CUDs) ni costo de Read Replica adicional.*
