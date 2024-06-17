import "reflect-metadata"
import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class LastPageAggregate {
    @PrimaryColumn()
    type: number

    @Column()
    page: number

    @Column()
    updatedAt: number
}

