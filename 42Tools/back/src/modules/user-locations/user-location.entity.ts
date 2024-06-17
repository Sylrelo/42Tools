import "reflect-metadata"
import { Column, Entity, Index, ManyToOne, PrimaryColumn } from "typeorm"
import { Users } from "../users/users.entity"

@Entity({ name: "users_locations" })
export class UserLocation {
    @PrimaryColumn()
    id: number

    @ManyToOne(
        () => Users,
        {
            nullable: true,
            cascade: ["insert"],
            onDelete: "CASCADE",
        }
    )
    user: Users

    @Column({ type: "timestamp", nullable: true })
    beginAt: Date | string

    @Column({ type: "timestamp", nullable: true })
    endAt: Date | string

    @Column()
    campusId: number

    @Column()
    host: string

    @Column({ type: "timestamp", default: () => "NOW()" })
    addedAt: string | Date | number;
}
