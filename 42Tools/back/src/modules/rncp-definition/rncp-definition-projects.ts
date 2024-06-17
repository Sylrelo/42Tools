import "reflect-metadata"
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Projects } from "../projects/projects.entity"
import { RncpDefinition } from "./rncp-definition.entity"


@Entity()
export class RncpDefinitionProjects {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(
        () => RncpDefinition,
        {
            onDelete: "CASCADE"
        }
    )
    rncp: RncpDefinition

    @ManyToOne(
        () => Projects,
        project => project.rncpProject,
        {
            onDelete: "CASCADE",
        }
    )
    project: Projects

    @ManyToMany(
        () => Projects,
        {
            cascade: ["insert", "update"],
        }
    )
    @JoinTable({
        name: "rncp_definition_projects_childrens",
    })
    childrenProjects: Projects[]

    constructor(id?: number) {
        if (id != null)
            this.id = id;
    }
}


