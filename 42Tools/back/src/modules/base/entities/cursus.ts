import { ICursus } from "src/Interfaces/42";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "cursus" })
export class Cursus {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    slug: string

    @Column()
    kind: string

    static FromApi(input: ICursus) {
        const entity = new Cursus();

        entity.id = input.id;
        
        entity.name = input.name;

        entity.slug = input.slug;

        entity.kind = input.kind;

        return entity;
    }
}