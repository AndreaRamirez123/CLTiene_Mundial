# Guía Rápida — Embeber Mundial CLTiene en CUN 360

## Datos de conexión

| Dato | Valor |
|------|-------|
| URL Backend | `https://cltiene-backend-293865702055.us-central1.run.app` |
| URL Frontend (Mundial) | `https://mundial-2.web.app` |
| API Key | `cun_sso_key_2026_a8f3d9e2b5c7h1k4m6n9p2q5r8t1v4w7y0` |
| Empresa (slug) | `cun` |
| Dominio permitido | `@cun.edu.co` |

⚠️ **La API Key debe almacenarse como variable de entorno en el backend de CUN 360**. Nunca exponerla en el frontend ni en el repositorio de código.

---

## Paso 1 — Crear la sesión del usuario

Desde el **backend** de CUN 360 (nunca desde el navegador), llamar al endpoint:

```
POST https://cltiene-backend-293865702055.us-central1.run.app/auth/sso-cun-api
```

**Headers**:
```
Authorization: Bearer cun_sso_key_2026_a8f3d9e2b5c7h1k4m6n9p2q5r8t1v4w7y0
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

**Campos**:

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `email` | string | ✅ Sí (debe ser `@cun.edu.co`) |
| `nombre` | string | No |
| `telefono` | string | No |
| `departamento` | string | No |
| `ciudad` | string | No |

**Respuesta (200 OK)**:
```json
{
  "session_token": "abc123...",
  "expires_in": 300,
  "redirect_url_hint": "/?session=abc123..."
}
```

> El token dura 5 minutos y es de un solo uso.

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

## Ejemplo completo — Node.js (Express)

```javascript
app.get('/mundial/entrar', async (req, res) => {
  const usuario = req.session.usuario;

  try {
    const { data } = await axios.post(
      'https://cltiene-backend-293865702055.us-central1.run.app/auth/sso-cun-api',
      {
        email: usuario.correo,
        nombre: usuario.nombre_completo,
        telefono: usuario.celular,
        departamento: usuario.departamento,
        ciudad: usuario.ciudad,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MUNDIAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.render('mundial-embed', { sessionToken: data.session_token });
  } catch (err) {
    console.error('Error SSO Mundial:', err.response?.data);
    res.status(500).send('No se pudo acceder al Mundial. Intente nuevamente.');
  }
});
```

En el template `mundial-embed`:
```html
<iframe
  src="https://mundial-2.web.app/?session={{sessionToken}}"
  style="width:100%; height:100vh; border:0;">
</iframe>
```

---

## Ejemplo completo — PHP

```php
<?php
$apiKey = getenv('MUNDIAL_API_KEY');
$datos = [
    'email' => $usuario['correo'],
    'nombre' => $usuario['nombre_completo'],
    'telefono' => $usuario['celular'],
    'departamento' => $usuario['departamento'],
    'ciudad' => $usuario['ciudad'],
];

$ch = curl_init('https://cltiene-backend-293865702055.us-central1.run.app/auth/sso-cun-api');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($datos));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey,
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

$sessionToken = $response['session_token'];
?>

<iframe
  src="https://mundial-2.web.app/?session=<?= urlencode($sessionToken) ?>"
  style="width:100%; height:100vh; border:0;">
</iframe>
```

---

## Errores comunes

| Código | Causa | Solución |
|--------|-------|----------|
| 401 | API Key incorrecta | Verificar que `Authorization: Bearer <API_KEY>` sea exactamente el valor entregado |
| 400 | Email vacío | Enviar `email` en el body |
| 400 | Dominio distinto a `@cun.edu.co` | Solo se aceptan correos institucionales CUN |

---

## Notas importantes

1. **La API Key es confidencial** — no exponer en logs, frontend ni repositorio público.
2. **Llamar siempre desde el backend de CUN 360**, no desde JavaScript del navegador.
3. **El token SSO expira en 5 minutos** — generarlo al momento del clic del usuario, no con anticipación.
4. **El usuario se crea automáticamente** en el primer acceso con un bono de bienvenida de 100 monedas.
5. **Los accesos subsiguientes** del mismo correo no duplican usuarios — actualizan el existente.

---

## Flujo visual

```
Usuario hace clic en "Mundial" dentro de CUN 360
         │
         ▼
Backend CUN 360 → POST /auth/sso-cun-api (con API Key + datos usuario)
         │
         ▼
Backend Mundial → devuelve { session_token, expires_in: 300 }
         │
         ▼
Backend CUN 360 → renderiza iframe con ?session=TOKEN
         │
         ▼
Frontend Mundial → consume token, loguea usuario, muestra dashboard
```

---

## Soporte

| Canal | Contacto |
|-------|----------|
| Soporte técnico | andrea_ramirezt@cun.edu.co |
| Incidentes | andrea_ramirezt@cun.edu.co |

---

## Versionado

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-04-24 | Versión inicial — SSO server-to-server con iframe |
