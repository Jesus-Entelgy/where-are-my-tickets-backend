import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'applications' })
export class Application {
  @PrimaryColumn({
    type: 'varchar',
    length: 32,
    default: () => 'md5(gen_random_uuid()::text)',
  })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  name: string;
}
