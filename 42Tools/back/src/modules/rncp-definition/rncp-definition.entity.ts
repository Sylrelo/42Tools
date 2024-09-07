import "reflect-metadata"
import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { RncpDefinitionProjects } from "./rncp-definition-projects"


@Entity()
export class RncpDefinition {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: 6 })
    level: number

    @Column()
    option: string

    @Column()
    section: string

    @Column({ default: 10000 })
    totalProjectExperience: number

    @Column({ default: 3 })
    totalProjectCount: number

    @OneToMany(
        () => RncpDefinitionProjects,
        rncpProject => rncpProject.rncp
    )
    projects: RncpDefinitionProjects[]

    @Column({ default: 0 })
    levelRequired: number

    @Column({ default: 0 })
    eventRequired: number

    @Column({ default: 0 })
    proExperienceRequired: number

    @Column({ nullable: false, default: "0-0" })
    rncpKey: string;

    constructor(id?: number) {
        this.id = id ?? undefined
    }
}


