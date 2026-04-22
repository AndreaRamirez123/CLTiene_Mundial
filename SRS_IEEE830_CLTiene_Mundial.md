# Especificación de Requisitos de Software (SRS)

## Proyecto: CLTiene Mundial 2026

**Plataforma de predicciones y engagement para el Mundial de Fútbol 2026**

---

**Documento basado en el estándar IEEE 830-1998**

| Campo | Valor |
|-------|-------|
| Cliente | CLTiene / Multiservicios CL Tiene |
| Proveedor | Equipo de desarrollo CLTiene Mundial |
| Versión del documento | 1.0 |
| Fecha de emisión | 21 de abril de 2026 |
| Estado | Desplegado en producción |
| Frontend (web) | https://mundial-2.web.app/ |
| Backend (API) | https://cltiene-mundial-backend-293865702055.us-central1.run.app |
| Hosting frontend | Firebase Hosting (proyecto `mundial-2`) |
| Pipeline backend | Google Cloud Build → Cloud Run |
| Base de datos | Google Cloud SQL (consola GCP) |

---

## Tabla de contenido

1. Introducción
   1.1 Propósito
   1.2 Alcance
   1.3 Definiciones, acrónimos y abreviaturas
   1.4 Referencias
   1.5 Visión general del documento
2. Descripción general
   2.1 Perspectiva del producto
   2.2 Funciones del producto
   2.3 Características de los usuarios
   2.4 Restricciones
   2.5 Suposiciones y dependencias
3. Requisitos específicos
   3.1 Requisitos funcionales
   3.2 Requisitos no funcionales
   3.3 Requisitos de interfaz
   3.4 Requisitos de base de datos
4. Arquitectura e infraestructura de despliegue
5. Anexos

> Los costos de operación y mantenimiento se presentan en un documento independiente: **`Propuesta_Economica_CLTiene_Mundial.md`**.

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos funcionales y no funcionales, y la arquitectura de despliegue de la plataforma **CLTiene Mundial 2026**, una aplicación web y móvil de predicciones, trivias y recompensas asociada al Mundial de Fútbol 2026. Su audiencia principal es el cliente (CLTiene / Multiservicios CL Tiene) y tiene como objetivo servir como referencia técnica de la solución entregada. Los costos de operación se documentan por separado en la **Propuesta Económica**.

### 1.2 Alcance

La plataforma permite a los usuarios:

- Registrarse y autenticarse (correo, Google).
- Realizar predicciones **gratuitas** sobre partidos del mundial.
- Ganar monedas por actividades (registro, bono diario, predicciones acertadas, referidos, trivia, misiones).
- Acumular goles mediante misiones.
- Participar en un ranking público basado en monedas acumuladas.
- Canjear premios al finalizar el mundial si cumplen criterios mínimos de actividad.
- Recibir notificaciones push (FCM) y correos transaccionales.

El alcance del documento cubre: requisitos del sistema desplegado, infraestructura cloud contratada e integraciones externas.

### 1.3 Definiciones, acrónimos y abreviaturas

| Término | Definición |
|---------|-----------|
| SRS | Software Requirements Specification |
| API | Application Programming Interface |
| FCM | Firebase Cloud Messaging |
| JWT | JSON Web Token |
| MAU | Monthly Active Users |
| SMTP | Simple Mail Transfer Protocol |
| WIP | Plataforma externa de gestión (wiptool.com) |
| MVP | Minimum Viable Product |
| vCPU | CPU virtual |
| GCP | Google Cloud Platform |

### 1.4 Referencias

- IEEE Std 830-1998 – Recommended Practice for Software Requirements Specifications.
- [MODELO_RELACIONAL.md](MODELO_RELACIONAL.md) – Modelo de datos del sistema.
- Documentación oficial de Google Cloud Run: https://cloud.google.com/run/pricing
- Documentación oficial de Firebase: https://firebase.google.com/pricing
- Documentación oficial de OpenAI API: https://openai.com/api/pricing
- Normativa Coljuegos aplicable a juegos de azar promocionales.

### 1.5 Visión general del documento

La sección 2 describe de manera general el producto, sus usuarios y el contexto operativo. La sección 3 detalla los requisitos funcionales y no funcionales. La sección 4 presenta la arquitectura desplegada. La sección 5 entrega el **desglose de costos de operación** —objetivo principal de este entregable— seguido de proyecciones por escenarios de uso.

---

## 2. Descripción general

### 2.1 Perspectiva del producto

CLTiene Mundial 2026 es un producto **nuevo** e independiente, integrado con el ecosistema comercial de CLTiene a través de la plataforma externa **WIP Tool**. Sigue una arquitectura cliente-servidor distribuida en la nube:

- **Frontend (web)**: SPA React + Vite, desplegada en **Firebase Hosting** (proyecto `mundial-2`) bajo el dominio `https://mundial-2.web.app/`.
- **Aplicación móvil**: empaquetada con Capacitor (Android/iOS) a partir del mismo código del frontend.
- **Backend**: API REST en NestJS, construida con **Google Cloud Build** y desplegada en **Google Cloud Run** (región `us-central1`).
- **Persistencia**: **Google Cloud SQL (MySQL 8.x)**, administrada desde la consola de Google Cloud, con acceso vía TypeORM.
- **Servicios auxiliares**: OpenAI (trivias/IA), Firebase Auth/FCM, SMTP (recuperación de contraseña), WIP Tool (integración comercial).

### 2.2 Funciones del producto

| Módulo | Funcionalidad |
|--------|---------------|
| Autenticación | Registro por correo, login, Google Sign-In, recuperación de contraseña por correo, JWT. |
| Usuarios / Jugadores | Perfil, encuesta de registro, niveles de actividad, tokens FCM. |
| Predicciones | Pronósticos de partidos, validación contra resultados reales, otorgamiento de monedas. |
| Partidos | Administración y sincronización de partidos del mundial. |
| Monedas / Goles | Sistema dual de recompensas no decrementable. |
| Misiones | Retos que otorgan goles y monedas. |
| Trivia | Preguntas diarias generadas por IA (OpenAI gpt-4o-mini). |
| Ranking | Listado público por monedas acumuladas. |
| Canjes | Solicitud de premios al cierre del mundial con reglas de elegibilidad. |
| Notificaciones | Push (FCM) y correo (SMTP). |
| Noticias | Sección informativa editable desde panel admin. |
| Panel administrativo | Gestión de partidos, misiones, usuarios, marcas, premios. Roles admin y superadmin. |
| Integración WIP | Sincronización bidireccional con plataforma comercial CLTiene. |

### 2.3 Características de los usuarios

| Rol | Descripción | Privilegios |
|-----|-------------|-------------|
| Jugador final | Cliente / consumidor que participa en predicciones. | Predicciones, trivia, ranking, canjes. |
| Administrador | Operador comercial CLTiene. | Gestión de contenido, usuarios y premios. |
| Superadministrador | Gestor técnico del sistema. | Control total, auditoría, configuraciones críticas. |

### 2.4 Restricciones

- Cumplimiento con normativa **Coljuegos**: las predicciones son **gratuitas**, no se restan monedas, el canje requiere cumplir actividad mínima y sólo se habilita al finalizar el mundial.
- El backend debe operar en región **us-central1** (Cloud Run) para optimizar costos y latencia hacia Colombia.
- Navegadores soportados: Chrome, Edge, Safari, Firefox (últimas 2 versiones estables).
- App móvil mínima: Android 8+ / iOS 13+.

### 2.5 Suposiciones y dependencias

- El cliente mantiene activas sus cuentas de Google Cloud, Firebase y OpenAI durante la vigencia del mundial.
- El cliente asume directamente los cargos de infraestructura (no incluidos en el desarrollo).
- La integración con WIP Tool se mantiene con las credenciales provistas.
- El SMTP actual opera sobre Gmail; si se requiere mayor volumen se migrará a proveedor transaccional.

---

## 3. Requisitos específicos

### 3.1 Requisitos funcionales (resumen)

| ID | Requisito |
|----|-----------|
| RF-01 | El sistema debe permitir el registro de jugadores con correo, contraseña y encuesta inicial. |
| RF-02 | El sistema debe permitir login tradicional y con Google. |
| RF-03 | El sistema debe permitir recuperación de contraseña vía correo electrónico. |
| RF-04 | El jugador debe poder realizar predicciones de forma gratuita antes del inicio del partido. |
| RF-05 | El sistema debe otorgar monedas por acciones válidas sin restar en ningún caso. |
| RF-06 | El sistema debe calcular y mostrar el ranking en tiempo razonable (<3 s). |
| RF-07 | El sistema debe generar trivias diarias mediante OpenAI. |
| RF-08 | El sistema debe enviar notificaciones push y correos transaccionales. |
| RF-09 | El administrador debe poder crear, editar y eliminar partidos, misiones y noticias. |
| RF-10 | El sistema debe registrar todas las transacciones de monedas para auditoría. |
| RF-11 | El canje de premios sólo se habilita al finalizar el mundial y para jugadores elegibles. |
| RF-12 | El sistema debe integrarse con WIP Tool para sincronización comercial. |

### 3.2 Requisitos no funcionales

| Atributo | Requisito |
|----------|-----------|
| Disponibilidad | ≥ 99.5% mensual (Cloud Run + Firebase SLA). |
| Escalabilidad | Cloud Run con escalado automático (0 a N instancias). |
| Seguridad | JWT, HTTPS obligatorio, CORS restringido, hashing bcrypt, variables sensibles en `.env`. |
| Rendimiento | Tiempo de respuesta API p95 < 800 ms en endpoints críticos. |
| Compatibilidad | Web responsive + App Android/iOS (Capacitor). |
| Mantenibilidad | Arquitectura modular NestJS; cobertura de linting y build reproducible. |
| Observabilidad | Logs en Cloud Run y Firebase Console. |

### 3.3 Requisitos de interfaz

- **Interfaz de usuario**: React 19 + TailwindCSS 4, componentes accesibles, soporte mobile-first.
- **Interfaz de hardware**: dispositivos móviles estándar, no requiere hardware especializado.
- **Interfaz de software**:
  - API REST JSON sobre HTTPS.
  - Autenticación por `Authorization: Bearer <JWT>`.
  - Webhooks/integraciones con WIP Tool vía API Key.
- **Interfaz de comunicaciones**: HTTPS (TLS 1.2+), SMTP 587 STARTTLS.

### 3.4 Requisitos de base de datos

- Motor: MySQL 8.x.
- Entidades principales: `jugadores`, `partidos`, `predicciones`, `transacciones`, `misiones`, `preguntas`, `canjes`, `noticias`, `empresas`, `config_marca`, `notificacion_log`, `trivia_historial`.
- Respaldos diarios automáticos.
- Retención mínima de logs transaccionales: 12 meses.

---

## 4. Arquitectura e infraestructura de despliegue

```
 Usuario final
     │ HTTPS
     ▼
 ┌────────────────────────┐        ┌───────────────────────────┐
 │  Firebase Hosting      │  API   │  Google Cloud Run          │
 │  (React + Vite SPA)    │──────▶ │  Backend NestJS (us-c1)    │
 │  mundial-2.web.app     │        │  Build: Google Cloud Build │
 └────────────────────────┘        └─────────────┬─────────────┘
                                                 │ TypeORM
                                                 ▼
                                   ┌──────────────────────────┐
                                   │  Google Cloud SQL        │
                                   │  MySQL 8.x (GCP Console) │
                                   └──────────────────────────┘
 Servicios externos:
   - Firebase Auth / FCM (notificaciones push)
   - OpenAI API (gpt-4o-mini)
   - WIP Tool API
   - SMTP Gmail (correos)
```

| Componente | Proveedor | Región | Plan |
|-----------|-----------|--------|------|
| Frontend SPA | **Firebase Hosting** (proyecto `mundial-2`) | Global CDN | Spark / Blaze |
| Dominio público | `mundial-2.web.app/` | Global | — |
| Build backend | **Google Cloud Build** | us-central1 | Pay-per-use |
| Backend API | **Google Cloud Run** | us-central1 | Pay-per-use |
| Base de datos | **Google Cloud SQL (MySQL 8)** | us-central1 | Instancia gestionada |
| Autenticación | Firebase Auth | Global | Spark / Blaze |
| Notificaciones | Firebase Cloud Messaging | Global | Gratuito |
| IA de trivias | OpenAI | — | gpt-4o-mini |
| Correos | Gmail SMTP | — | Gratuito |
| Integración CLTiene | WIP Tool | — | Suscripción existente |

---

## 5. Anexos

> **Nota**: los costos de operación y mantenimiento se presentan en el documento independiente [`Propuesta_Economica_CLTiene_Mundial.md`](Propuesta_Economica_CLTiene_Mundial.md).


### 5.1 URLs de producción y paneles de administración

| Componente | URL |
|------------|-----|
| Frontend web | https://mundial-2.web.app/ |
| Backend API | https://cltiene-mundial-backend-293865702055.us-central1.run.app |
| Consola Firebase (frontend + Auth + FCM) | https://console.firebase.google.com → proyecto `mundial-2` |
| Consola Google Cloud (backend + DB) | https://console.cloud.google.com → Cloud Run, Cloud Build, Cloud SQL |

### 5.2 Módulos del backend desplegados

`auth`, `users`, `admin`, `predicciones`, `partidos`, `monedas`, `misiones`, `preguntas`, `ranking`, `canjes`, `noticias`, `notificaciones`, `empresas`, `config-marca`, `wip`.

### 5.3 Entidades persistidas

`jugadores`, `partidos`, `predicciones`, `transacciones`, `preguntas`, `trivia_historial`, `canjes`, `noticias`, `empresas`, `config_marca`, `notificacion_log`.

### 5.4 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 8, TailwindCSS 4, Zustand, TanStack Query, Framer Motion |
| Mobile | Capacitor 8 (Android/iOS) |
| Backend | NestJS 11, TypeORM, Passport + JWT |
| Base de datos | Google Cloud SQL (MySQL 8) |
| Hosting frontend | Firebase Hosting (`firebase deploy`) |
| CI/CD backend | Google Cloud Build → Google Cloud Run |
| Identidad y push | Firebase Auth, Firebase Cloud Messaging |
| IA | OpenAI gpt-4o-mini |

### 5.5 Control de versiones del documento

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 21 de abril de 2026 | Equipo CLTiene Mundial | Versión inicial para entrega a cliente. |

---

*Fin del documento.*
