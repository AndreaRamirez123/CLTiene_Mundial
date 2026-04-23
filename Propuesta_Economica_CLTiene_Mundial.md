# Propuesta Económica y Costos de Operación

## Proyecto: CLTiene Mundial 2026

| Campo | Valor |
|-------|-------|
| Cliente | CLTiene / Multiservicios CL Tiene |
| Aplicación | https://mundial-2.web.app/ |
| Fecha del reporte | 21 de abril de 2026 |
| Fuente de datos | Consola Google Cloud – cuenta "Pago de Firebase" |
| Moneda | USD (referencias en COP a tasa ~4.000/USD) |

---

## Resumen ejecutivo

Este documento presenta:
1. Los **costos reales de infraestructura** de la plataforma (lo que cuesta operarla).
2. La **propuesta comercial sugerida** al cliente (cuánto se recomienda cobrar).
3. Escenario central proyectado: **60.000 usuarios activos** durante el mundial.

### Cifras clave

| Concepto | Valor |
|----------|-------|
| **Costo operativo actual** (15 usuarios, abril 2026) | **USD $1 / mes** |
| **Costo operativo proyectado** (60.000 usuarios, mundial) | **USD $280 – $490 / mes** |
| **Costo por usuario durante el mundial** | **USD $0.005 – $0.008 / mes** (~20 – 33 COP) |
| **Precio comercial sugerido al cliente** (60k usuarios) | **USD $3.500 – $5.000 / mes** |
| **Margen bruto estimado** | **85% – 90%** |
| **Total sugerido para los 2 meses del mundial** | **USD $7.000 – $10.000** (~28 – 40 M COP) |

---

## 1. Estado actual de operación

La plataforma está desplegada y en funcionamiento, operando en **Firebase plan Blaze (pay-as-you-go)**. El consumo es mínimo gracias al escalado automático.

| Servicio | Rol en la aplicación | Costo diario actual |
|----------|---------------------|---------------------|
| Google Cloud SQL (MySQL 8) | Base de datos principal | ~USD $0.015 |
| Google Cloud Run | Backend NestJS (API) | USD $0.00 |
| Firebase Hosting | Frontend web | USD $0.00 |
| Firebase Auth | Autenticación de usuarios | USD $0.00 |
| Firebase Cloud Messaging | Notificaciones push | USD $0.00 |
| Artifact Registry | Imágenes Docker del backend | ~USD $0.015 |
| Secret Manager | Credenciales de producción | <USD $0.01 |

### Costo mensual actual

> **USD $0.45 – $1.00 / mes**

Los servicios Cloud Run, Hosting, Auth y FCM permanecen dentro del tier gratuito y **escalan a cero** cuando no hay tráfico.

---

## 2. Escenario proyectado para el Mundial: 60.000 usuarios activos/mes

Este es el escenario central recomendado para la planeación financiera del proyecto.

### 2.1 Desglose de costos con 60.000 usuarios

| Servicio | Costo mensual estimado | Notas |
|----------|------------------------|-------|
| **Cloud SQL** (base de datos) | USD $150 – $250 | Escalar a `db-custom-2-7680` (2 vCPU, 7.5 GB) |
| **Cloud Run** (backend) | USD $40 – $100 | ~6M requests/mes proyectados |
| **Firebase Hosting** (web) | USD $20 – $50 | Supera 10 GB de transferencia gratuita |
| **Firebase Auth** | USD $55 | 50k gratis + 10k adicionales × USD $0.0055 |
| **Firebase Cloud Messaging** | USD $0 | Gratis ilimitado |
| **OpenAI API** (trivias) | USD $5 – $15 | No escala con usuarios |
| **Cloud Build + Artifact + Secret** | ~USD $1 | Casi fijo |
| **SMTP transaccional** | USD $10 – $20 | Migración recomendada desde Gmail |
| **Total mensual** | **USD $280 – $490** | |

### 2.2 Totales para los 2 meses del mundial

| Escenario | Total 2 meses | En pesos (COP ~4.000/USD) |
|-----------|---------------|---------------------------|
| Optimista | **USD $560** | **~2.2 millones** |
| Promedio | **USD $770** | **~3.1 millones** |
| Pesimista | **USD $980** | **~3.9 millones** |

### 2.3 Costo por usuario durante el mundial

| Escenario | Total mensual | **Por usuario/mes** | En pesos |
|-----------|---------------|---------------------|----------|
| Optimista | USD $280 | **USD $0.0047** | **~19 COP** |
| Promedio | USD $385 | **USD $0.0064** | **~26 COP** |
| Pesimista | USD $490 | **USD $0.0082** | **~33 COP** |

---

## 3. Proyección por otros volúmenes de usuarios

| Usuarios activos/mes | Costo mensual estimado | Costo por usuario/mes |
|---------------------|------------------------|-----------------------|
| < 1.000 | USD $10 – $30 | ~USD $0.020 (~80 COP) |
| 1.000 – 10.000 | USD $40 – $100 | ~USD $0.014 (~56 COP) |
| 10.000 – 50.000 | USD $120 – $250 | ~USD $0.007 (~28 COP) |
| **50.000 – 200.000** | **USD $300 – $500** | **~USD $0.004 (~16 COP)** |

> A mayor cantidad de usuarios, menor el costo por persona. Esto se debe a que una parte del costo (base de datos) es fijo y se distribuye entre más jugadores.

---

## 4. Propuesta Comercial — Precios sugeridos al cliente

La tabla a continuación presenta **precios sugeridos de venta al cliente**, calculados para mantener un margen bruto saludable considerando:

- Costos de infraestructura
- Mantenimiento técnico (desarrollo, correcciones, actualizaciones)
- Soporte al cliente
- Reserva para imprevistos (10%)

### 4.1 Planes por tier de usuarios

| Tier | Usuarios activos | Precio mensual sugerido | En pesos (COP) | Margen bruto |
|------|-----------------|-------------------------|----------------|--------------|
| **Starter (0 – 25)** | Hasta 25 | **USD $400 / mes** | ~1.6 M COP | 54% |
| **Starter (26 – 50)** | 26 – 50 | **USD $550 / mes** | ~2.2 M COP | 64% |
| **Starter (51 – 100)** | 51 – 100 | **USD $800 / mes** | ~3.2 M COP | 71% |
| **Starter (101 – 150)** | 101 – 150 | **USD $1.100 / mes** | ~4.4 M COP | 76% |
| **Starter (151 – 200)** | 151 – 200 | **USD $1.400 / mes** | ~5.6 M COP | 79% |
| **Growth** | 201 – 1.000 | **USD $1.400 + USD $3/usuario adicional** | — | ~80% |
| **Scale** | 1.001 – 10.000 | **USD $3.800 + USD $1.50/usuario adicional** | — | ~85% |
| **Enterprise** | 10.000 – 50.000 | **USD $17.000 + USD $0.80/usuario adicional** | — | ~88% |
| **Gran evento** (Mundial) | 50.000 – 100.000 | **USD $3.500 – $5.000 / mes** (contrato fijo) | ~14 – 20 M COP | **85 – 90%** |

### 4.2 Escenario recomendado para el Mundial (60.000 usuarios)

| Concepto | Valor |
|----------|-------|
| Precio mensual sugerido | **USD $3.500 – $5.000** |
| Duración del mundial | 2 meses (junio – julio 2026) |
| **Total a cobrar al cliente por el mundial** | **USD $7.000 – $10.000** |
| Equivalente en pesos colombianos | **~28 – 40 millones COP** |
| Costo real de operación | USD $560 – $980 |
| **Ganancia neta estimada** | **USD $6.000 – $9.000** (~24 – 36 M COP) |

### 4.3 Servicios adicionales sugeridos (facturar aparte)

| Servicio | Precio sugerido |
|----------|-----------------|
| Hora de desarrollo / personalización | USD $25 – $50 / hora |
| Soporte prioritario fuera de horario | USD $300 – $500 / mes |
| Migración a proyecto Google Cloud dedicado | USD $500 – $1.000 (único) |
| Dominio personalizado + configuración | USD $100 (único) + dominio |
| Módulo analítico personalizado | USD $1.500 – $3.000 (único) |

---


## 5. Costos adicionales opcionales para la operación

| Concepto | Costo | Observación |
|----------|-------|-------------|
| Dominio personalizado | USD $12 – $20 / año | Solo si se desea cambiar `mundial-2.web.app`. |
| SMTP transaccional | USD $10 – $20 / mes | Si se supera el límite de Gmail. |
| Alta disponibilidad Cloud SQL | +100% del costo de BD | Recomendado en picos del mundial. |

---

## 6. Costos no incluidos

Los siguientes conceptos **no forman parte** de los costos de operación ni de la propuesta comercial:

- Licencia y uso de **WIP Tool** (ya contratada por CLTiene).
- Premios físicos o digitales entregados en los canjes a los jugadores.
- Marketing, pauta digital y adquisición de usuarios.
- Impuestos locales (IVA, retenciones) sobre la facturación.

---

## 7. Recomendaciones estratégicas

### Para optimizar costos

1. **Mantener el estado actual** hasta iniciar el mundial (costo casi cero).
2. **Escalar Cloud SQL** solo cuando el volumen de usuarios lo requiera.
3. **Activar alertas de presupuesto** en Google Cloud (umbrales 50%, 80%, 100%).
4. **Separar CLTiene Mundial** en su propio proyecto de Google Cloud y cuenta propia de OpenAI para que el cliente pueda auditar consumo directamente.

### Para la propuesta comercial

1. **Cobrar un fee fijo** al cliente (no por usuario) para proyectos con pocos usuarios.
2. **Incluir cláusula de volumen**: si supera el tier, se factura automáticamente el siguiente nivel.
3. **Fee único para el evento "Mundial"** en lugar de mensualidad, facturado al inicio.
4. **Ofrecer servicios adicionales** (personalización, reportes, soporte prioritario) como facturación extra.

---

## 8. Totales consolidados del proyecto

### Costos de operación (lo que paga la empresa desarrolladora)

| Fase | Período | Costo operativo |
|------|---------|-----------------|
| Pre-mundial | Abril – mayo 2026 | USD $1 / mes |
| Mundial (60k usuarios) | Junio – julio 2026 | USD $280 – $490 / mes |
| Post-mundial | Agosto 2026 | USD $1 – $10 / mes |
| **TOTAL 5 meses (operación)** | | **USD $564 – $992** |

### Facturación sugerida al cliente (lo que cobra la empresa desarrolladora)

| Fase | Período | Precio sugerido |
|------|---------|-----------------|
| Pre-mundial (Starter) | Abril – mayo 2026 | USD $400 / mes × 2 = **USD $800** |
| Mundial (Gran evento) | Junio – julio 2026 | USD $3.500 – $5.000 / mes × 2 = **USD $7.000 – $10.000** |
| Post-mundial (Starter) | Agosto 2026 | USD $400 × 1 = **USD $400** |
| **TOTAL 5 meses (facturación)** | | **USD $8.200 – $11.200** |

### Ganancia neta estimada del proyecto

| Concepto | Valor |
|----------|-------|
| Facturación total estimada | USD $8.200 – $11.200 |
| Costo operativo total | USD $564 – $992 |
| **Ganancia neta** | **USD $7.200 – $10.600** (~29 – 42 millones COP) |
| **Margen bruto promedio** | **~90%** |

---

*Documento con fines comerciales. Los valores son estimaciones basadas en tarifas vigentes de Google Cloud, Firebase y OpenAI a abril de 2026, y en prácticas estándar de pricing SaaS para plataformas de engagement y gamificación B2B. Los precios finales al cliente deben considerar también impuestos locales, tasa de cambio vigente y condiciones contractuales específicas.*
