# Plan de Integración de Autenticación JWT (NestJS + PostgreSQL)

## Objetivo

Implementar autenticación y autorización de forma incremental, comprendiendo cada paso antes de avanzar al siguiente.

Objetivo final:

```text
POST /auth/register
POST /auth/login

GET /tickets        -> Protegido
POST /tickets       -> Protegido
PUT /tickets/:id    -> Protegido
DELETE /tickets/:id -> Protegido + Rol ADMIN
```

---

# Fase 0 - Situación Actual

Se asume que la aplicación NestJS ya arranca correctamente:

```bash
npm run start:dev
```

Y existe una estructura similar a:

```text
src/
├── app.module.ts
├── tickets/
├── users/
└── main.ts
```

---

# Fase 1 - Preparar la Entidad User

## Objetivo

Tener una estructura sólida para almacenar usuarios.

## Tareas

### Añadir columna `role`

```sql
users
------
id
email
first_name
last_name
password_hash
role
created_at
updated_at
```

Valores iniciales:

```text
USER
ADMIN
```

### Sustituir `password` por `password_hash`

Nunca se almacenarán contraseñas en texto plano.

### Crear un usuario administrador en la seed.

Haz que el primer usuario de la seed tenga el rol de ADMIN. El resto de usuarios deben tener el rol de USER. De esta forma cada vez que levante la BBDD y se ejecute la semilla, siempre tendre un usuario con el rol de ADMIN.


## Resultado esperado

Endpoint de prueba:

```http
GET /users
```

Debe devolver usuarios con sus roles.

---

# Fase 2 - Registro de Usuarios

## Objetivo

Permitir crear nuevos usuarios.

## Endpoint

```http
POST /auth/register
```

Body:

```json
{
  "email": "jesus@test.com",
  "password": "123456",
  "firstName": "Jesús",
  "lastName": "Carrión"
}
```

## Dependencias

```bash
npm install bcrypt
npm install @types/bcrypt -D
```

## Requisito

Guardar únicamente:

```text
password_hash
```

Nunca:

```text
password
```

## Resultado esperado

La base de datos almacena un hash bcrypt en lugar de la contraseña original.

---

# Fase 3 - Login Sin JWT

## Objetivo

Validar credenciales antes de introducir JWT.

## Endpoint

```http
POST /auth/login
```

## Validaciones

- El usuario existe.
- La contraseña es correcta.

## Respuesta temporal

```json
{
  "message": "Login correcto"
}
```

Todavía no se genera ningún token.

---

# Fase 4 - Integración de JWT

## Objetivo

Generar Access Tokens.

## Dependencias

```bash
npm install @nestjs/jwt
npm install @nestjs/passport
npm install passport
npm install passport-jwt
```

## Login

La respuesta pasa a ser:

```json
{
  "access_token": "xxxxx"
}
```

## Payload recomendado

```json
{
  "sub": "user-id",
  "email": "jesus@test.com",
  "role": "USER"
}
```

## Resultado esperado

El token puede inspeccionarse en jwt.io y visualizar correctamente el payload.

---

# Fase 5 - Crear JwtStrategy

## Objetivo

Que NestJS sepa interpretar y validar JWT.

## Alcance

Crear la estrategia de Passport/JWT.

Todavía no se protege ningún endpoint.

## Resultado esperado

NestJS es capaz de leer:

```http
Authorization: Bearer <token>
```

---

# Fase 6 - Crear JwtAuthGuard

## Objetivo

Proteger el primer endpoint.

## Endpoint recomendado

```http
GET /profile
```

## Casos esperados

### Sin token

```http
401 Unauthorized
```

### Con token válido

```http
200 OK
```

## Resultado esperado

Validación completa del mecanismo JWT.

---

# Fase 7 - Proteger el Módulo Tickets

## Objetivo

Exigir autenticación para trabajar con tickets.

## Endpoints protegidos

```text
GET /tickets
POST /tickets
PUT /tickets/:id
DELETE /tickets/:id
```

## Resultado esperado

Sin token:

```http
401 Unauthorized
```

Con token válido:

```http
200 OK
```

---

# Fase 8 - Roles y Autorización

## Objetivo

Diferenciar usuarios normales y administradores.

## Elementos a crear

- Decorador `@Roles()`
- `RolesGuard`

## Ejemplo

```ts
@Roles('ADMIN')
```

## Resultado esperado

Usuario normal:

```http
403 Forbidden
```

Administrador:

```http
200 OK
```

---

# Fase 9 - Usuario Autenticado

## Objetivo

Acceder al usuario autenticado desde cualquier controlador.

## Endpoint recomendado

```http
GET /me
```

Respuesta:

```json
{
  "id": "...",
  "email": "jesus@test.com",
  "role": "USER"
}
```

## Resultado esperado

Utilizar:

```ts
req.user
```

para obtener la identidad del usuario autenticado.

---

# Fase 10 - Logout Básico

## Objetivo

Cerrar sesión utilizando únicamente Access Tokens.

## Backend

No requiere implementación especial.

## Frontend

Eliminar token almacenado:

```javascript
localStorage.removeItem('access_token');
```

Y redirigir al login.

---

# Alcance de la Versión 1

## Incluye

- Registro de usuarios.
- Login.
- Contraseñas hasheadas con bcrypt.
- JWT Access Token.
- Endpoints protegidos.
- Roles ADMIN y USER.
- Endpoint `/me`.
- Logout.

## No incluye todavía

- Refresh Tokens.
- Tabla `user_sessions`.
- Revocación de sesiones.
- Multi-dispositivo.
- Rotación de tokens.

---

# Recomendación de Trabajo

No avanzar a la siguiente fase hasta que la fase actual funcione correctamente y haya sido validada mediante Postman, Swagger o pruebas manuales.

El objetivo es comprender completamente cada paso antes de aumentar la complejidad del sistema.
