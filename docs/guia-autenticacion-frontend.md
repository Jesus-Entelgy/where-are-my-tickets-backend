# Guía de autenticación y autorización para frontend

Este documento describe cómo registrarse, iniciar sesión, enviar el access
token, usar Swagger y conocer los permisos actuales de cada ruta.

## 1. URLs

Con la configuración local habitual:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`

El puerto puede cambiar si se configura `PORT`.

## 2. Roles

La API reconoce estos roles:

- `USER`: rol asignado a las cuentas creadas mediante registro.
- `ADMIN`: rol para las cuentas de administrador creadas por la seed.

El frontend no debe enviar ni elegir el rol al registrarse. El backend obtiene
el rol de la cuenta y lo incluye en el access token.

## 3. Rutas públicas

Estas rutas no necesitan `Authorization`:

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/` | Mensaje de bienvenida. |
| `GET` | `/applications` | Lista las aplicaciones. |
| `POST` | `/auth/register` | Registra una cuenta nueva. |
| `POST` | `/auth/login` | Valida credenciales y devuelve un access token. |
| `GET` | `/users` | Lista todos los usuarios. |

**Importante:** `GET /users` está intencionadamente sin protección para
facilitar el desarrollo. Devuelve información de usuarios, incluido su correo
y rol. No debe considerarse una ruta segura para producción.

### Registrar una cuenta

`POST /auth/register`

```json
{
  "email": "ana@example.com",
  "password": "una-clave-segura",
  "firstName": "Ana",
  "lastName": "Garcia"
}
```

La respuesta es `201 Created` e incluye `id`, `email`, `firstName`, `lastName`
y `role`. La contraseña no se devuelve. Las cuentas nuevas tienen rol `USER`.
La contraseña debe ocupar como máximo 72 bytes en UTF-8.

### Iniciar sesión

`POST /auth/login`

```json
{
  "email": "ana@example.com",
  "password": "una-clave-segura"
}
```

Respuesta `200 OK`:

```json
{
  "access_token": "<JWT>"
}
```

Si las credenciales no son válidas, la API responde `401 Unauthorized`.

## 4. Enviar el access token

El token es de tipo **Bearer**. En cada solicitud protegida, envíalo en la
cabecera HTTP `Authorization`:

```http
Authorization: Bearer <access_token>
```

Ejemplo con `fetch`:

```js
const response = await fetch(`${API_BASE_URL}/profile-me`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

No envíes el token en la URL ni en parámetros de consulta. No compartas ni
registres tokens en logs.

El backend espera el token en una cabecera Bearer; no implementa autenticación
mediante cookie `HttpOnly`. Si se conserva el token entre recargas usando
`localStorage`, ten en cuenta que un XSS podría leerlo. No incluyas nunca
`JWT_SECRET` en el bundle ni en variables accesibles desde el navegador: ese
secreto solo pertenece al backend.

### Contenido y duración

El payload del JWT contiene:

- `sub`: id del usuario.
- `email`: correo del usuario.
- `role`: `USER` o `ADMIN`.
- `iat` y `exp`: emisión y expiración.

El token expira a los **15 minutos**. El JWT está firmado, no cifrado: su
payload puede leerse, por lo que no debe contener información secreta.

Actualmente la aplicación usa únicamente el `access_token`. La implementación
de `refresh-token` queda pospuesta: el login no devuelve un refresh token y no
hay un mecanismo para renovar el JWT. Cuando el access token expire, el
frontend debe descartarlo y solicitar al usuario que vuelva a iniciar sesión.

`POST /auth/logout` comprueba que el access token enviado sea válido y devuelve
`200`, pero no lo invalida ni realiza cambios en el backend. Cualquier copia
del token seguirá siendo válida hasta expirar.

## 5. Rutas protegidas y roles

Las rutas protegidas requieren un JWT válido. Además, algunas requieren un rol
concreto:

| Método | Ruta | Rol permitido |
| --- | --- | --- |
| `POST` | `/auth/logout` | `USER` o `ADMIN` |
| `GET` | `/profile-me` | `USER` o `ADMIN` |
| `GET` | `/users/by-email/{email}` | `ADMIN` |
| `GET` | `/tickets` | `ADMIN` |
| `GET` | `/tickets/by-user/{userId}` | `USER` o `ADMIN` |
| `GET` | `/tickets/by-title/{title}` | `USER` o `ADMIN` |
| `GET` | `/tickets/{id}` | `USER` o `ADMIN` |
| `PATCH` | `/tickets/{id}` | `USER` o `ADMIN` |
| `DELETE` | `/tickets/{id}` | `ADMIN` |
| `POST` | `/tickets` | `USER` o `ADMIN` |

Los parámetros `{email}`, `{userId}`, `{title}` e `{id}` son segmentos de la
ruta, no texto literal. Codifica los valores al construir la URL, por ejemplo:

```js
const path = `/users/by-email/${encodeURIComponent(email)}`;
```

El endpoint `GET /profile-me` devuelve la identidad asociada al token:

```json
{
  "id": "user-id",
  "email": "ana@example.com",
  "role": "USER"
}
```

Se puede usar `id` para identificar al usuario actual en la interfaz.

Al cerrar sesión, puedes llamar a `POST /auth/logout` con la cabecera Bearer:
devuelve `200` si el token es válido y `401` si falta, es inválido o expiró.
En cualquier caso, elimina el token del cliente; como el backend no lo revoca,
eliminarlo localmente es lo que cierra la sesión en ese cliente.

### Ejemplos de operaciones con tickets

Crear un ticket (`POST /tickets`):

```json
{
  "title": "Preparar revisión del sprint",
  "description": "Revisar los resultados",
  "priority": "HIGH",
  "status": "OPEN",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Las prioridades permitidas son `LOW`, `MEDIUM`, `HIGH` y `CRITICAL`. Los
estados permitidos son `OPEN`, `IN_PROGRESS`, `RESOLVED` y `CLOSED`.
`userId` debe ser el UUID de un usuario existente.

Actualizar un ticket (`PATCH /tickets/{id}`) envía solo los campos que cambian:

```json
{
  "status": "IN_PROGRESS"
}
```

### Alcance actual de los permisos de tickets

Los roles se comprueban por endpoint. Actualmente, los permisos no comprueban
que el usuario sea propietario del ticket: por ejemplo, un `USER` puede
consultar, actualizar o crear tickets indicando los identificadores aceptados
por esas rutas. No uses restricciones visuales del frontend como sustituto de
una comprobación de autorización del backend.

## 6. Respuestas de autenticación y autorización

- **401 Unauthorized:** falta el token, no es válido, ha expirado o no se pudo
  verificar. Comprueba que se envía la cabecera y, si expiró, vuelve a iniciar
  sesión.
- **403 Forbidden:** el token es válido, pero el rol no está permitido para esa
  ruta. Por ejemplo, `USER` en `GET /tickets` o
  `GET /users/by-email/{email}`.
- **404 Not Found:** no existe el usuario o ticket solicitado.
- **400 Bad Request:** parámetro o datos de entrada no válidos.
- **409 Conflict:** por ejemplo, un email o título que ya existe.

## 7. Usar endpoints protegidos desde Swagger

1. Abre `http://localhost:3000/api`.
2. Ejecuta `POST /auth/login` con las credenciales de una cuenta existente.
3. Copia el valor de `access_token` de la respuesta.
4. Pulsa **Authorize** en Swagger y pega el token **sin** el prefijo `Bearer `.
   Swagger lo añade automáticamente al construir la cabecera.
5. Ejecuta una ruta protegida. El cURL generado debe incluir una cabecera como:

   ```bash
   -H 'Authorization: Bearer <access_token>'
   ```

6. Para probar permisos, inicia sesión con la cuenta del rol necesario. Por
   ejemplo, `GET /tickets` y `GET /users/by-email/{email}` requieren `ADMIN`.

Si Swagger devuelve 401, comprueba que la petición generada incluya
`Authorization`, que el token no haya expirado y que hayas autorizado Swagger
después de iniciar sesión. Si devuelve 403, el token se aceptó pero el rol no
está permitido para esa ruta.
