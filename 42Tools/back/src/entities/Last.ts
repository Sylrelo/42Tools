import "reflect-metadata"
import { Column, Entity, PrimaryColumn } from "typeorm"


@Entity()
export class LastAggregate {
    @PrimaryColumn()
    type: string

    @Column()
    page: number

    @Column()
    updatedAt: number
}

