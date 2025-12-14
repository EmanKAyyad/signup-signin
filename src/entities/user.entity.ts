import { Exclude, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity()
export class User {
  @ObjectIdColumn()
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  _id: ObjectId;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ select: false })
  @Exclude()
  password: string;
}
