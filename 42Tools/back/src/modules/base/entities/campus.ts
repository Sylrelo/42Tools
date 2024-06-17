import { ICampus } from "src/Interfaces/42";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "campus" })
export class Campus {
    @PrimaryColumn()
    id: number

    @Column()
    country: string

    @Column()
    name: string

    @Column()
    timeZone: string

    static FromApi(input: ICampus) {
        const entity = new Campus();

        entity.id = input.id;
        entity.name ??= input?.name ?? entity.name
        entity.timeZone ??= input?.time_zone ?? entity.timeZone
        entity.country ??= input?.country ?? entity.country

        return entity;
    }
}