import "reflect-metadata"
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "events" })
export class Event {
  @PrimaryColumn()
  id: number

  @Column()
  kind: string
}