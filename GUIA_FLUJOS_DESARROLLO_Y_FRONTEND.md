# Flujos de desarrollo y guía para el equipo frontend

Este documento describe cómo preparar el proyecto, trabajar en funcionalidades y levantar el backend para integrarlo con el frontend.

## Arquitectura y motivo de la configuración

Se usan dos configuraciones de entorno para que el desarrollo local y el stack del equipo puedan ejecutarse a la vez sin competir por los mismos puertos:

| Entorno | Archivo local | Proceso NestJS | API en el host | PostgreSQL en el host |
| --- | --- | --- | --- | --- |
| Desarrollo interno | `.env.development` | Local, con `npm run start:dev` | `http://localhost:3000` | `localhost:5432` |
| Equipo frontend | `.env.team` | Contenedor Docker | `http://localhost:3001` | `localhost:5433` |

Dentro de la red Docker, los puertos no cambian: NestJS escucha en `3000` y PostgreSQL en `5432`. El contenedor del backend se conecta a PostgreSQL usando `postgres:5432`; los puertos `3001` y `5433` solo se publican en el host para el equipo.

Los proyectos Compose tienen nombres distintos. Por eso se pueden ejecutar a la vez: habrá dos contenedores PostgreSQL independientes y un contenedor NestJS (el del equipo). Cada base de datos conserva sus datos en un volumen distinto.

El `docker-compose.yml` selecciona `.env.development` o `.env.team` mediante `APP_ENV`. Los comandos `start:*` cargan la configuración local con Node.js; NestJS no carga archivos `.env` por su cuenta. Los archivos reales con credenciales están ignorados por Git y Docker:

- [.env.development.example](./.env.development.example) es la plantilla de desarrollo.
- [.env.example](./.env.example) es la plantilla para el equipo; se copia como `.env.team`.
- No se deben incluir contraseñas reales en las plantillas ni subir los archivos `.env.development` o `.env.team` al repositorio.

## Guía para desarrollar funcionalidades

### Requisitos

- Node.js 22 y npm.
- Docker Desktop instalado y en ejecución.
- Acceso a este repositorio.

### Preparación inicial

Desde la carpeta raíz del backend:

1. Instala las dependencias:

   ```powershell
   npm ci
   ```

2. Si todavía no tienes el archivo local, copia la plantilla:

   ```powershell
   Copy-Item .env.development.example .env.development
   ```

3. Edita `.env.development` y sustituye `DB_PASSWORD` por la contraseña local que usarás para PostgreSQL. No compartas ni subas este archivo.

### Inicio del trabajo diario

1. Prepara la base local:

   ```powershell
   npm run app:up
   ```

   El comando espera a que PostgreSQL esté listo, aplica las migraciones pendientes y después vacía las tablas declaradas como entidades y las vuelve a sembrar. Los usuarios de prueba usan `password123`; son solo para desarrollo. Aunque el volumen de Docker se conserva, los datos de las tablas se reinician cada vez que se ejecuta `app:up`. PostgreSQL se publica en `localhost:5432`.

   TypeORM no compara automáticamente las entidades con el esquema de PostgreSQL. Cuando cambie el esquema, crea una nueva migración; `app:up` ejecutará las que aún no estén registradas como aplicadas.

2. En otra terminal, inicia NestJS en modo watch:

   ```powershell
   npm run start:dev
   ```

   La aplicación se conecta a PostgreSQL en `localhost:5432` y escucha en `localhost:3000`.

3. Abre Swagger para revisar las rutas disponibles:

   - `http://localhost:3000/api`

   Actualmente el backend tiene la ruta `GET /`; las operaciones de negocio deben añadirse al implementar funcionalidades.

4. Antes de compartir los cambios, ejecuta las comprobaciones:

   ```powershell
   npm test
   npm run lint
   npm run build
   ```

   En el estado actual, hay una prueba conocida que espera `"Hello World!"`, aunque el controlador devuelve otro mensaje. Tenlo en cuenta al interpretar el resultado de `npm test`.

### Cierre del entorno de desarrollo

1. Detén NestJS con `Ctrl+C`.
2. Detén PostgreSQL:

   ```powershell
   npm run app:down
   ```

Este comando detiene el contenedor de PostgreSQL, pero no elimina el volumen. Los datos se reiniciarán la próxima vez que ejecutes `app:up`.

## Guía para el equipo frontend

### Preparación inicial del equipo frontend

Requisitos: Docker Desktop en ejecución, Node.js/npm para ejecutar los scripts y acceso al repositorio del backend.

1. Clona el repositorio y abre una terminal en su carpeta raíz.
2. Si aún no tienes el archivo local, crea la configuración Team desde la plantilla:

   ```powershell
   Copy-Item .env.example .env.team
   ```

3. Edita `.env.team` y sustituye `DB_PASSWORD` por una contraseña local. No compartas ni subas `.env.team`.

No es necesario instalar las dependencias de NestJS en el host para ejecutar el stack Team: Docker construye la imagen del backend.

### Levantar y usar el backend

1. Prepara la base Team y levanta los contenedores de PostgreSQL y NestJS:

   ```powershell
   npm run app:up:team
   ```

   Antes de arrancar el backend, el comando espera a PostgreSQL, aplica migraciones pendientes, vacía las tablas declaradas como entidades y las siembra con los usuarios de prueba. **Cada ejecución de `app:up:team` elimina los datos actuales de esas tablas en Team.** Las contraseñas de prueba son `password123`; no uses estos usuarios fuera del entorno de desarrollo.

2. Comprueba que ambos servicios estén activos:

   ```powershell
   docker compose --env-file .env.team -p where-are-my-tickets-team ps
   ```

   Para consultar los logs del backend:

   ```powershell
   docker compose --env-file .env.team -p where-are-my-tickets-team logs -f backend
   ```

3. Configura el frontend con esta URL base:

   ```text
   http://localhost:3001
   ```

   Swagger está disponible en `http://localhost:3001/api`. PostgreSQL se publica en `localhost:5433` si se necesita conectar con una herramienta local, como DBeaver.

4. Al terminar el trabajo, detén los contenedores del stack Team:

   ```powershell
   npm run app:down:team
   ```

Este comando detiene los contenedores y conserva el volumen. Los datos de las tablas se reiniciarán la próxima vez que ejecutes `app:up:team`.

### Integración con el frontend

- Si el frontend se ejecuta en el host, debe llamar a `http://localhost:3001`.
- Si el frontend se ejecuta dentro de otro contenedor, `localhost` apunta al contenedor del frontend. En ese caso hay que configurar una red Docker compartida o un host accesible desde ese contenedor.
- Actualmente NestJS no configura CORS. Si el navegador bloquea las llamadas por política de mismo origen, habrá que habilitar CORS en el backend para el origen de desarrollo del frontend.
- Swagger solo documenta las rutas implementadas en el backend; no implica que las operaciones de negocio ya estén disponibles.

## Solución de problemas

- **El puerto ya está en uso:** cierra el servicio que ocupa `3000`, `3001`, `5432` o `5433` y vuelve a iniciar el entorno correspondiente.
- **NestJS no conecta con PostgreSQL en desarrollo:** comprueba que `npm run app:up` esté activo y que `.env.development` tenga `DB_HOST=localhost`, `DB_PORT=5432` y la contraseña correcta.
- **El backend Team no conecta con PostgreSQL:** revisa los logs de `backend`. Dentro de Docker la conexión debe usar `DB_HOST=postgres` y `DB_PORT=5432`; el Compose los establece para el contenedor.
- **PowerShell bloquea `npm`:** usa `npm.cmd` en lugar de `npm` (por ejemplo, `npm.cmd run app:up`).
