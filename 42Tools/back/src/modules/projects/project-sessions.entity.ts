import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Projects } from "./projects.entity";
import { IProjectSession } from "src/Interfaces/42";

@Entity()
export class ProjectSession {

    @PrimaryColumn()
    id: number

    @ManyToOne(() => Projects, { cascade: ["insert", "update"] })
    project: Projects

    @Column({ default: "" })
    description: string

    @Column({ default: 0 })
    experience: number

    @Column({ nullable: true })
    estimatedTime: string

    @Column({ default: -1 })
    campusId: number

    @Column({ default: -1 })
    cursusId: number

    @Column({ type: 'timestamptz', default: () => 'NOW()', nullable: false})
    updatedAt: Date | string | number;

    @Column({ type: 'timestamptz', default: () => 'NOW()', nullable: false })
    createdAt: Date | string | number;

    @Column({ type: 'timestamptz', default: () => 'NOW()', nullable: false})
    addedAt: Date | string | number;

    static FromApi(project: IProjectSession) {
        const entity = new ProjectSession();

        entity.id = project.id;

        if (project?.description)
            entity.description = project.description

        if (project?.difficulty)
            entity.experience = project.difficulty

        if (project?.estimate_time)
            entity.estimatedTime = project.estimate_time

        if (project?.cursus_id)
            entity.cursusId = project.cursus_id

        if (project?.campus_id)
            entity.campusId = project.campus_id

        if (project?.project)
            entity.project = Projects.FromProjectApi(project.project)

        if (project?.updated_at)
            entity.updatedAt = project.updated_at

        if (project?.created_at)
            entity.createdAt = project.created_at

        return entity;
    }

}