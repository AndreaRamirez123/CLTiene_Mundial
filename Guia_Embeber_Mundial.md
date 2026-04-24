# Guía Rápida — Embeber Mundial CLTiene en CUN 360

## Paso 1 — Crear la sesión del usuario

Desde el **backend** de CUN 360 (nunca desde el navegador), llamar al endpoint:

```
POST https://cltiene-backend-293865702055.us-central1.run.app/auth/sso-cun-api
```

**Headers**:
```
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

**Body**:
```json
{
  "email": "usuario@cun.edu.co",
  "nombre": "Nombre Apellido",
  "telefono": "3001234567",
  "departamento": "Cundinamarca",
  "ciudad": "Bogotá"
}
```

**Respuesta**:
```json
{
  "session_token": "abc123...",
  "expires_in": 300
}
```

> El token dura 5 minutos, single-use.

---

## Paso 2 — Embeber en CUN 360

Con el `session_token` recibido, insertar un iframe en la vista de CUN 360:

```html
<iframe
  src="https://mundial-2.web.app/?session=TOKEN_AQUI"
  style="width:100%; height:100vh; border:0;"
  allow="clipboard-read; clipboard-write">
</iframe>
```

El Mundial detecta el `?session=` en la URL, loguea al usuario automáticamente y muestra el dashboard.

---

## Ejemplo completo — Node.js

```javascript
app.get('/mundial/entrar', async (req, res) => {
  const usuario = req.session.usuario;

  const { data } = await axios.post(
    'https://cltiene-backend-293865702055.us-central1.run.app/auth/sso-cun-api',
    {
      email: usuario.correo,
      nombre: usuario.nombre_completo,
      telefono: usuario.celular,
    },
    {
      headers: { Authorization: `Bearer ${process.env.MUNDIAL_API_KEY}` },
    }
  );

  res.render('mundial-embed', { sessionToken: data.session_token });
});
```

En el template `mundial-embed`:
```html
<iframe src="https://mundial-2.web.app/?session={{sessionToken}}" style="width:100%; height:100vh; border:0;"></iframe>
```

---

## Errores comunes

| Código | Causa |
|--------|-------|
| 401 | API Key incorrecta |
| 400 | Email vacío o dominio distinto a `@cun.edu.co` |

---

## Datos de contacto

- API Key: se entrega por canal seguro.
- Soporte: _[correo]_
