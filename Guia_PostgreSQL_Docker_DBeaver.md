# Guía Completa: Instalación de PostgreSQL con Docker en Windows y Conexión con DBeaver

## Introducción

Esta guía documenta paso a paso el proceso completo para instalar y configurar un entorno de desarrollo local basado en:

- Windows
- WSL 2 (Windows Subsystem for Linux)
- Docker Desktop
- PostgreSQL 17 ejecutándose en un contenedor Docker
- DBeaver como cliente gráfico de administración

Al finalizar esta guía tendrás:

✅ Docker funcionando en Windows

✅ Un contenedor PostgreSQL persistente

✅ DBeaver conectado a PostgreSQL

✅ Tablas de ejemplo creadas

✅ Datos de prueba cargados

---

# Arquitectura Final

```text
┌─────────────────────┐
│      Windows        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       WSL 2         │
│ Ubuntu 24.04 LTS    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Docker Desktop    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ PostgreSQL 17       │
│ Docker Container    │
└──────────┬──────────┘
           │ Port 5432
           ▼
┌─────────────────────┐
│      DBeaver        │
└─────────────────────┘
```

# Paso 1: Comprobar si Docker está instalado

```powershell
docker --version
```

# Paso 2: Verificar soporte para virtualización

```powershell
systeminfo | findstr /i "Hyper-V"
```

# Paso 3: Instalar WSL

```powershell
wsl --install
```

Reiniciar el equipo.

# Paso 4: Verificar instalación de WSL

```powershell
wsl --version
```

# Paso 5: Instalar Ubuntu

```powershell
wsl --install Ubuntu-24.04
```

# Paso 6: Verificar Ubuntu

```powershell
wsl -l -v
```

# Paso 7: Instalar Docker Desktop

Descargar Docker Desktop AMD64 y usar configuración WSL2.

# Paso 8: Verificar Docker

```powershell
docker --version
docker run hello-world
```

# Paso 9: Crear volumen persistente

```powershell
docker volume create postgres-data
```

# Paso 10: Crear contenedor PostgreSQL

```powershell
docker run -d `
  --name postgres-dev `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=pruebas `
  -p 5432:5432 `
  -v postgres-data:/var/lib/postgresql/data `
  postgres:17
```

# Paso 11: Instalar DBeaver

https://dbeaver.io/download/

# Paso 12: Configurar conexión

- Host: localhost
- Puerto: 5432
- Base de datos: pruebas
- Usuario: postgres
- Contraseña: postgres

# Paso 13: Crear tablas

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE applications (
    id VARCHAR(32) PRIMARY KEY DEFAULT md5(gen_random_uuid()::text),
    name VARCHAR(100) NOT NULL UNIQUE
);
```

# Paso 14: Datos de prueba

```sql
INSERT INTO users (email, first_name, last_name, password)
VALUES
('jesus.carrion@example.com', 'Jesus', 'Carrion', 'password123'),
('luis.rodriguez@example.com', 'Luis', 'Rodriguez', 'password123'),
('alejandro.garcia@example.com', 'Alejandro', 'Garcia', 'password123'),
('maria.lopez@example.com', 'Maria', 'Lopez', 'password123'),
('sofia.martinez@example.com', 'Sofia', 'Martinez', 'password123');

INSERT INTO applications (name)
VALUES
('MesaOne'), ('TaskForge'), ('SprintVision'), ('TechPulse'), ('CloudGestor'),
('DevTrack'), ('InfraControl'), ('ServiceHub'), ('Nexo Digital'), ('ProyectoFlow'),
('CodePilot'), ('DeployMaster'), ('InsightOps'), ('DataSphere'), ('TeamBridge'),
('ControlIT'), ('WorkSync'), ('Arquitectura 360'), ('Nodo Empresarial'), ('Código Central');
```

# Paso 15: Verificar los datos

```sql
SELECT * FROM applications;

SELECT * FROM users;
```

# Operaciones habituales

### Ver contenedores ejecutándose
```PowerShell
docker stop postgres-dev
```

### Detener PostgreSQL
```PowerShell
docker stop postgres-dev
```

### Iniciar PostgreSQL
```PowerShell
docker start postgres-dev
```

### Ver logs
```PowerShell
docker logs postgres-dev
```

### Acceder al contenedor
```PowerShell
docker exec -it postgres-dev bash
```

### Abrir consola PostgreSQL
```PowerShell
docker exec -it postgres-dev psql -U postgres -d pruebas
```

### Listar tablas

Dentro de PostgreSQL:

```sql
\dt
```

### Ver estructura de una tabla

```sql
\d users
```
### Salir de PostgreSQL

```sql
\q
```

# Copias de seguridad

### Backup
```PowerShell
docker exec postgres-dev pg_dump -U postgres pruebas > backup.sql
```

### Restauración
```PowerShell
docker exec -i postgres-dev psql -U postgres pruebas < backup.sql
```