# Guía Técnica de Integración — CUN 360 ↔ Mundial CLTiene

| Campo | Valor |
|-------|-------|
| Producto | Mundial CLTiene 2026 |
| Versión API | v1 |
| Modalidad | Server-to-Server + Redirect al cliente |
| Seguridad | API Key + Token temporal single-use |

---

## 1. Resumen

Esta guía describe cómo integrar el módulo **Mundial CLTiene 2026** dentro de la plataforma **CUN 360**. El flujo permite que un administrativo autenticado en CUN 360 acceda automáticamente al Mundial **sin registrarse ni iniciar sesión nuevamente**, con todos sus datos sincronizados.

El flujo es **server-to-server**: CUN 360 envía los datos del usuario desde su backend (no desde el navegador), recibe un token temporal, y redirige al usuario al Mundial con ese token.

---

## 2. Flujo técnico

```
┌─────────────┐                    ┌──────────────────┐                ┌──────────────┐
│  Usuario    │                    │  CUN 360 Backend │                │ Mundial API  │
│ (Navegador) │                    │                  │                │   (Cloud Run)│
└──────┬──────┘                    └────────┬─────────┘                └──────┬───────┘
       │                                     │                                │
       │ 1. Clic en "Mundial"                │                                │
       │────────────────────────────────────▶│                                │
       │                                     │                                │
       │                                     │ 2. POST /auth/sso-cun-api      │
       │                                     │    + Authorization: Bearer KEY │
       │                                     │    + { email, nombre, ... }    │
       │                                     │───────────────────────────────▶│
       │                                     │                                │
       │                                     │    3. Valida KEY                │
       │                                     │       Crea/actualiza usuario   │
       │                                     │       Genera session_token     │
       │                                     │                                │
       │                                     │ 4. { session_token: "abc..." } │
       │                                     │◀───────────────────────────────│
       │                                     │                                │
       │ 5. Redirect 302                      │                                │
       │    https://mundial-2.web.app/?session=abc...                         │
       │◀────────────────────────────────────│                                │
       │                                     │                                │
       │ 6. Navegar a URL                    │                                │
       │─────────────────────────────────────┼───────────────────────────────▶│
       │                                     │                                │
       │                                     │  7. POST /auth/sso-session     │
       │                                     │     { session_token }          │
       │◀────────────────────────────────────┼────────────────────────────────│
       │                                     │                                │
       │ 8. JWT + datos usuario              │                                │
       │    Usuario en Dashboard ✅          │                                │
       │                                     │                                │
```

---

## 3. Endpoint 1 — Crear sesión SSO (server-to-server)

### Request

**Método**: `POST`
**URL (producción)**: `https://cltiene-mundial-backend-293865702055.us-central1.run.app/auth/sso-cun-api`
**URL (desarrollo)**: `http://localhost:3000/auth/sso-cun-api`

### Headers

| Header | Valor |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <API_KEY>` |

> El `API_KEY` será entregado por correo de forma segura por el equipo de CLTiene Mundial.

### Body (JSON)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `email` | string | ✅ Sí | Correo institucional (debe terminar en `@cun.edu.co`) |
| `nombre` | string | No | Nombre completo del usuario |
| `telefono` | string | No | Celular (se valida formato 10 dígitos colombiano) |
| `tipojugador` | string | No | Valor: `natural`, `empresa`, `organizacion` o `explorar`. Default: `natural` |
| `relacion_cltiene` | string | No | Valor: `cliente`, `escuchado`, `explorando` o `nuevo`. Default: `nuevo` |
| `departamento` | string | No | Departamento (ej: `Cundinamarca`) |
| `ciudad` | string | No | Ciudad (ej: `Bogotá`) |

### Ejemplo de petición

```bash
curl -X POST https://cltiene-mundial-backend-293865702055.us-central1.run.app/auth/sso-cun-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer cun_sso_key_2026_a8f3d9e2b5c7h1k4m6n9p2q5r8t1v4w7y0" \
  -d '{
    "email": "juan.perez@cun.edu.co",
    "nombre": "Juan Pérez",
    "telefono": "3001234567",
    "tipojugador": "natural",
    "relacion_cltiene": "nuevo",
    "departamento": "Cundinamarca",
    "ciudad": "Bogotá"
  }'
```

### Response — 200 OK

```json
{
  "session_token": "k3jH2mN8p9Q1rS4tU5vW6xY7zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU0v",
  "expires_in": 300,
  "redirect_url_hint": "/?session=k3jH2mN8p9Q1rS4tU5vW6xY7zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU0v"
}
```

| Campo | Descripción |
|-------|-------------|
| `session_token` | Token temporal de sesión (single-use, expira en 5 minutos) |
| `expires_in` | Segundos hasta que el token expire |
| `redirect_url_hint` | Path a concatenar al dominio del Mundial |

### Errores posibles

| Código HTTP | Causa |
|-------------|-------|
| 401 | API Key inválida |
| 400 | Email faltante, inválido o dominio distinto a `@cun.edu.co` |
| 400 | Empresa CUN no encontrada en la BD |

---

## 4. Redirección al usuario

Una vez recibido el `session_token`, redirigir al usuario:

```
https://mundial-2.web.app/?session=<session_token>
```

Ejemplo de redirect 302 en diferentes lenguajes:

### PHP
```php
header("Location: https://mundial-2.web.app/?session=" . urlencode($session_token));
exit;
```

### Node.js (Express)
```javascript
res.redirect(`https://mundial-2.web.app/?session=${encodeURIComponent(sessionToken)}`);
```

### Python (Django/Flask)
```python
from urllib.parse import quote
return redirect(f'https://mundial-2.web.app/?session={quote(session_token)}')
```

### .NET (C#)
```csharp
Response.Redirect($"https://mundial-2.web.app/?session={HttpUtility.UrlEncode(sessionToken)}");
```

---

## 5. Endpoint 2 — Consumir sesión (automático, desde el navegador)

Este endpoint lo consume **automáticamente nuestro frontend** cuando el usuario llega con `?session=xxx`. **CUN 360 no debe invocarlo directamente**. Se documenta solo como referencia.

**Método**: `POST /auth/sso-session`
**Body**: `{ "session_token": "xxx" }`
**Response**: `{ "token": "<JWT>", "usuario": { ... } }`

---

## 6. Ejemplo completo de integración (Node.js)

```javascript
const axios = require('axios');

// Endpoint en CUN 360 que el usuario llama al hacer clic en "Mundial"
app.get('/mundial/entrar', async (req, res) => {
  const usuario = req.session.usuario; // Usuario autenticado en CUN 360

  try {
    // 1. Server-to-server: crear sesión en Mundial
    const { data } = await axios.post(
      'https://cltiene-mundial-backend-293865702055.us-central1.run.app/auth/sso-cun-api',
      {
        email: usuario.correo,
        nombre: usuario.nombre_completo,
        telefono: usuario.celular,
        departamento: usuario.departamento,
        ciudad: usuario.ciudad,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MUNDIAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 2. Redirigir al usuario al Mundial
    const url = `https://mundial-2.web.app/?session=${data.session_token}&return=${encodeURIComponent('https://cun360.cun.edu.co')}`;
    res.redirect(url);
  } catch (err) {
    console.error('Error integración Mundial:', err.response?.data);
    res.status(500).send('No se pudo acceder al Mundial. Intente de nuevo.');
  }
});
```

---

## 7. Consideraciones de seguridad

| Medida | Implementada |
|--------|--------------|
| API Key requerida para crear sesión | ✅ |
| Token de sesión de un solo uso | ✅ |
| Expiración de token (5 minutos) | ✅ |
| Validación de dominio `@cun.edu.co` | ✅ |
| API Key viaja solo server-to-server (nunca por navegador) | ✅ |
| Datos del usuario no viajan por URL | ✅ (solo el token) |
| Uso de HTTPS obligatorio en producción | ✅ |

### Recomendaciones adicionales

1. **Rotar el API Key** cada 6 meses (coordinar con equipo CLTiene).
2. **No loggear el API Key** en logs accesibles.
3. **Validar** en CUN 360 que el usuario realmente esté autenticado antes de invocar el endpoint.
4. **Manejar el caso de error**: si el endpoint devuelve error, mostrar mensaje amigable al usuario (no exponer detalles técnicos).

---

## 8. URL de retorno (opcional)

Si CUN 360 quiere que al hacer logout en el Mundial el usuario vuelva a una URL específica de CUN 360, pueden agregar el parámetro `return` a la URL de redirect:

```
https://mundial-2.web.app/?session=xxx&return=https://cun360.cun.edu.co/dashboard
```

El Mundial guardará esa URL y cuando el usuario cierre sesión, lo redirigirá a ese destino.

---

## 9. Contacto

| Equipo | Contacto |
|--------|----------|
| Técnico CLTiene Mundial | [correo de soporte] |
| API Key | Se entrega por canal seguro (correo cifrado o reunión) |
| Soporte incidentes | [correo o canal] |

---

## 10. Historial de versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-04-23 | Versión inicial de integración SSO server-to-server |
