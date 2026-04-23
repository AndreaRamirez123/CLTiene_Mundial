# Propuesta de Integración: CLTiene Mundial + CUN 360

| Campo | Valor |
|-------|-------|
| Proyecto | CLTiene Mundial 2026 |
| Integración solicitada | Acceso embebido desde CUN 360 |
| Fecha | 22 de abril de 2026 |
| Estado | Evaluación de viabilidad |

---

## 1. Contexto de la solicitud

La CUN cuenta con la plataforma **CUN 360**, utilizada por el personal administrativo para el registro de asistencia y otras funcionalidades. Se desea **embeber la aplicación CLTiene Mundial 2026** dentro de CUN 360, de forma que un usuario ya autenticado en CUN 360 pueda acceder directamente a la plataforma del Mundial sin necesidad de registrarse ni iniciar sesión nuevamente.

### URL de integración propuesta por CUN 360

```
https://aplicacionmundial.com/?user=didier_gonzalez@cun.edu.co
```

Cuando el usuario hace clic en la opción del Mundial dentro de CUN 360, se le redirige a esa URL con su correo institucional como parámetro.

---

## 2. Viabilidad técnica

> **La integración es técnicamente viable y se puede implementar sin afectar el flujo de registro y login existente de la plataforma CLTiene Mundial.**

El flujo actual (login tradicional, registro manual, Google Sign-In) **se mantiene intacto** para usuarios que accedan directamente a la aplicación. El acceso vía CUN 360 opera como un **flujo adicional de autenticación automática (SSO)**.

---

## 3. Flujo propuesto

1. El usuario inicia sesión normalmente en CUN 360 con su correo `@cun.edu.co`.
2. Al seleccionar la opción del Mundial dentro de CUN 360, este redirige al usuario a la URL de la plataforma incluyendo el correo como parámetro.
3. La aplicación CLTiene Mundial detecta el parámetro `user` en la URL al cargar.
4. El backend valida el correo y verifica si el usuario existe en la base de datos:
   - **Si no existe**: se crea automáticamente con datos mínimos (correo, nombre extraído del correo, origen = `cun_360`).
   - **Si existe**: se recupera la cuenta.
5. Se emite un token JWT válido y el usuario es llevado directamente al **Dashboard del Mundial**, sin pasar por login ni registro.

### Bases de datos

Las bases de datos de CUN 360 y CLTiene Mundial **permanecen independientes**. La plataforma del Mundial mantiene su propio registro de jugadores y lo alimenta automáticamente cuando un usuario de CUN 360 accede por primera vez.

---

## 4. Cambios requeridos en la aplicación

| Componente | Cambio | Magnitud |
|------------|--------|----------|
| **Backend (NestJS)** | Nuevo endpoint `POST /auth/sso-cun` para autenticación automática | Bajo (~30 líneas) |
| **Frontend (React)** | Detección del parámetro `?user=` en la URL y llamada al endpoint de SSO | Bajo (~20 líneas) |
| **Login y registro tradicionales** | **Sin cambios** | Ninguno |

---

## 5. Consideración crítica de seguridad

Enviar únicamente el correo como parámetro en la URL **no es seguro**, pues cualquier persona podría suplantar a otro usuario modificando la URL manualmente (por ejemplo, `?user=rector@cun.edu.co`).

### Se recomienda acordar con el equipo de CUN 360 uno de los siguientes mecanismos:

| Opción | Nivel de seguridad | Complejidad |
|--------|--------------------|-------------|
| **Token firmado (HMAC) con secreto compartido y expiración** | Alta | Media |
| **JWT firmado por CUN 360 validado por la app** | Muy alta | Media |
| **Whitelist de IPs del servidor CUN 360** | Media | Baja |
| Solo correo sin validación adicional | **Baja — no recomendada** | Muy baja |

**Recomendación oficial**: solicitar al equipo de CUN 360 el envío de un **token firmado con expiración** junto al correo, para validar que la solicitud proviene efectivamente de CUN 360.

---

## 6. Estimación de tiempos

| Tarea | Tiempo estimado |
|-------|-----------------|
| Coordinación técnica con equipo CUN 360 (definir mecanismo de seguridad) | 1 día |
| Desarrollo endpoint SSO en el backend | 0.5 día |
| Ajuste del frontend para detección automática | 0.5 día |
| Pruebas de integración | 1 día |
| Despliegue y validación en producción | 0.5 día |
| **Total** | **3 – 4 días hábiles** |

---

## 7. Modelo comercial propuesto (cómo se vende esta integración)

### 7.1 El reto comercial

Al integrarse con CUN 360, la plataforma del Mundial queda disponible para **todos los administrativos** de la CUN. Sin embargo, no a todos les interesa el fútbol, por lo que **una parte importante nunca usará la aplicación**. Cobrar por el total de usuarios registrados en CUN 360 sería percibido como injusto, ya que incluiría a usuarios que nunca interactúan con la plataforma.

### 7.2 Solución: facturación por engagement real

La plataforma CLTiene Mundial **ya incluye un sistema automático de clasificación de usuarios por nivel de actividad**, lo cual permite implementar un modelo de facturación **basado en uso real**.

#### Clasificación automática del sistema

| Nivel | Criterio | ¿Se factura? |
|-------|----------|--------------|
| **Muy activo** | Se conectó en los últimos 2 días + realizó ≥5 predicciones, ≥3 trivias o tiene racha ≥3 | ✅ Sí |
| **Activo** | Se conectó en los últimos 7 días + realizó al menos una actividad | ✅ Sí |
| **Inactivo** | Más de 7 días sin conectarse o sin actividad | ❌ **No se factura** |

El sistema **recalcula automáticamente cada hora** el nivel de actividad de cada usuario. Esta lógica ya está implementada en el backend (`nivel-actividad.util.ts`).

### 7.3 Tarifas sugeridas para CUN 360

| Concepto | Precio mensual |
|----------|----------------|
| Fee base (infraestructura + mantenimiento) | **USD $500** |
| Por cada usuario **muy activo** | **USD $2.00** |
| Por cada usuario **activo** | **USD $1.00** |
| Usuarios **inactivos** | **USD $0 — no se cobra** |

### 7.4 Ejemplo aplicado a CUN 360 (5.000 administrativos)

Supuesto: el 20% de los administrativos se interesa y usa activamente la plataforma del Mundial (1.000 usuarios), y el 80% permanece inactivo (4.000 usuarios).

| Tipo de usuario | Cantidad | Tarifa | Subtotal |
|-----------------|----------|--------|----------|
| Fee base | 1 | USD $500 | USD $500 |
| Muy activos (30% de los activos) | 300 | USD $2.00 | USD $600 |
| Activos (70% de los activos) | 700 | USD $1.00 | USD $700 |
| Inactivos | 4.000 | USD $0 | USD $0 |
| **TOTAL mensual** | | | **USD $1.800** |
| **Equivalente en pesos** | | | **~7.2 millones COP** |

### 7.5 Comparación con un modelo tradicional por usuario registrado

| Modelo | Base de cobro | Costo mensual al cliente | Percepción del cliente |
|--------|---------------|--------------------------|------------------------|
| Por usuarios registrados | 5.000 × USD $1.50 | USD $7.500 | Injusto — pagan por usuarios fantasma |
| **Por engagement real (propuesto)** | 1.000 activos + fee base | **USD $1.800** | **Justo — solo pagan por uso real** |
| **Ahorro para el cliente** | | **76%** | **Argumento comercial fuerte** |

### 7.6 Reporte mensual de transparencia

Cada mes se entregará al cliente (CUN) un reporte automatizado con:

- Total de usuarios registrados en la plataforma
- Usuarios muy activos (con métrica)
- Usuarios activos
- Usuarios inactivos (**no facturados**)
- Tasa de engagement (% de usuarios que sí usan la plataforma)
- Desglose detallado de la facturación
- Top 10 jugadores del ranking

Esto refuerza la **transparencia** y justifica claramente cada cobro.

### 7.7 Argumento comercial para presentar al cliente

> **"Usted solo paga por los usuarios que realmente usan la plataforma. Si un administrativo de CUN 360 no entra a la aplicación del Mundial o deja de interactuar con ella, no genera ningún costo. La facturación es automática, transparente y basada en métricas reales de uso."**

---

## 8. Conclusión

- ✅ La integración es **viable** sin comprometer el funcionamiento actual de la plataforma del Mundial.
- ✅ Los cambios son **mínimos y localizados**.
- ✅ Se mantienen el login y el registro originales.
- ✅ El modelo comercial **engagement-based** resuelve la objeción de "pagar por usuarios que no usan la app".
- ⚠️ **Es indispensable definir un mecanismo seguro** con el equipo de CUN 360 para evitar suplantación de identidad.

### Siguientes pasos sugeridos

1. Agendar una **reunión técnica** con el equipo de CUN 360 para acordar el mecanismo de seguridad en la URL (token firmado o HMAC).
2. Validar con la dirección de la CUN el **modelo comercial por engagement** propuesto.
3. Coordinar el **cronograma de implementación y despliegue** en producción.

---

*Documento técnico-comercial para aprobación. La implementación iniciará una vez se defina el mecanismo de seguridad con el equipo de CUN 360 y se valide el modelo comercial con la dirección.*
