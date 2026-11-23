import { User, UserRole } from '../users/user.entity.js';
import { Application } from '../applications/application.entity.js';
import dataSource from './data-source.js';

const SEED_USERS: Array<Omit<User, 'id'>> = [
  {
    email: 'jesus.carrion@example.com',
    firstName: 'Jesus',
    lastName: 'Carrion',
    passwordHash:
      'scrypt$16384$8$1$xRTNRKaN-bFlpJ0huKC4jw$mcxuOrzzXTiyk81oMfGebY1mnD6ErCJVnHa5ZeFwSEmrZQty-8ebbDyEPcShkZLL-yEW-pjbskQ7yCsjhmaA-A',
    role: UserRole.ADMIN,
  },
  {
    email: 'luis.rodriguez@example.com',
    firstName: 'Luis',
    lastName: 'Rodriguez',
    passwordHash:
      'scrypt$16384$8$1$EPFZxHgfdiqKG6yeuwNHQQ$r1__27kUgansLZO3HS_0bylztNOxLSRvZZFmZ0cffQ2PFoifxZ-zqwTKmmPhOpRm9Rpa11jZ7Lj2iRdOslRplA',
    role: UserRole.USER,
  },
  {
    email: 'alejandro.garcia@example.com',
    firstName: 'Alejandro',
    lastName: 'Garcia',
    passwordHash:
      'scrypt$16384$8$1$XqQrMXC9dWG2qM5x2pP7aQ$3bJ6Rn1EsmAcRx-4eIcIs1DdeZgzWztZil7HEoB-eVvtx3AOsXZ9uC3l6gaDOMZrQcdfwdhS4Ov69P5nPI0oRw',
    role: UserRole.USER,
  },
  {
    email: 'maria.lopez@example.com',
    firstName: 'Maria',
    lastName: 'Lopez',
    passwordHash:
      'scrypt$16384$8$1$vkNV4H-yTABFyeobm18dmQ$49yGrbnQY2AwvH__Vz4HxxIL_VBiQq9QqXLAaA-6KSgrwVxXVMP0EvKil_vKe9kHvAkHmcVdtRkj4ukEDBJtow',
    role: UserRole.USER,
  },
  {
    email: 'sofia.martinez@example.com',
    firstName: 'Sofia',
    lastName: 'Martinez',
    passwordHash:
      'scrypt$16384$8$1$l-m-UafaljCjBv-9mzE7hA$Gqvvj8aRXaB76MV6Fx7URSkL-gsZPwFoLyD3PPN73HOlo2zjVFt0jLkPKv2_O5ZtmNx02Om5-W2JiWN4IlLp5w',
    role: UserRole.USER,
  },
];

const SEED_APPLICATIONS: Array<Omit<Application, 'id'>> = [
  { name: 'MesaOne' },
  { name: 'TaskForge' },
  { name: 'SprintVision' },
  { name: 'TechPulse' },
  { name: 'CloudGestor' },
  { name: 'DevTrack' },
  { name: 'InfraControl' },
  { name: 'ServiceHub' },
  { name: 'Nexo Digital' },
  { name: 'ProyectoFlow' },
  { name: 'CodePilot' },
  { name: 'DeployMaster' },
  { name: 'InsightOps' },
  { name: 'DataSphere' },
  { name: 'TeamBridge' },
  { name: 'ControlIT' },
  { name: 'WorkSync' },
  { name: 'Arquitectura 360' },
  { name: 'Nodo Empresarial' },
  { name: 'Código Central' },
];

await dataSource.initialize();

try {
  await dataSource.transaction(async (manager) => {
    await manager.query(
      'TRUNCATE TABLE "users", "applications", "tickets" RESTART IDENTITY',
    );
    await manager.getRepository(User).insert(SEED_USERS);
    await manager.getRepository(Application).insert(SEED_APPLICATIONS);
  });

  console.info(
    `Database reset; seeded ${SEED_USERS.length} users and ${SEED_APPLICATIONS.length} applications.`,
  );
} finally {
  await dataSource.destroy();
}
