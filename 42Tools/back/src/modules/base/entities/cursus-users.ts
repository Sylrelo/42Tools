import { ICursusUser } from "src/Interfaces/42";
import { Users } from "src/modules/users/users.entity";
import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Cursus } from "./cursus";
import { DateForDb } from "src/utils";

@Entity({ name: "cursus_users" })
export class CursusUser {
    @PrimaryColumn()
    id: number

    @Column({ nullable: true })
    grade: string

    @Column({ type: "float", default: 0 })
    level: number

    @Column({ type: "timestamptz", nullable: true })
    begin_at: Date | number | string

    @Column({ type: "timestamptz", nullable: true })
    end_at: Date | number | string

    @ManyToOne(() => Users, { cascade: ["insert"] })
    user: Users

    @ManyToOne(() => Cursus, { cascade: ["insert"] })
    cursus: Cursus

    static FromApi(input: ICursusUser) {
        const entity = new CursusUser();

        entity.id = input.id;

        entity.grade = input.grade;

        entity.begin_at = DateForDb(input?.begin_at);

        entity.end_at = DateForDb(input?.end_at);

        entity.level = input.level;

        entity.user = new Users(input.user.id);

        entity.cursus = Cursus.FromApi(input.cursus);

        return entity;
    }
}