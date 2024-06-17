import "reflect-metadata"
import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Users } from "../users/users.entity";
import { Event } from "./event.entity";

@Entity({ name: "events_users" })
export class EventUser {
  @PrimaryColumn()
  id: number

  @ManyToOne(
    () => Event,
    {
      cascade: ["insert"]
    }
  )
  event: Event

  @ManyToOne(
    () => Users,
    {
      cascade: ["insert"]
    }
  )
  user: Users


  @Column({ type: "timestamp", default: () => "NOW()" })
  addedAt: string | Date | number;
}

