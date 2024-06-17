import "reflect-metadata"
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { ProjectUsers } from "../project-users/project-users.entity"
import { RncpDefinitionProjects } from "../rncp-definition/rncp-definition-projects"
import { IProject, IProjectSession } from "src/Interfaces/42"
import { ProjectSession } from "./project-sessions.entity"


@Entity({ name: "projects" })
export class Projects {
    @PrimaryColumn()
    id: number

    @Column({ nullable: false })
    name: string

    @Column({ nullable: false })
    slug: string

    @Column({ default: "" })
    description: string

    @Column({ default: 0 })
    experience: number

    @Column({ nullable: true })
    estimatedTime: string

    @OneToMany(() => ProjectUsers, projectUser => projectUser.project)
    projectUser: ProjectUsers[]

    @OneToMany(() => RncpDefinitionProjects, rncpProject => rncpProject.project)
    rncpProject: RncpDefinitionProjects[]

    @OneToMany(() => ProjectSession, ps => ps.project)
    projectSession: ProjectSession[]

    constructor(projectId?: number) {
        this.id = projectId ?? undefined
    }

    static FromProjectApi(project: IProject) {
        const projectEntity = new Projects();

        projectEntity.id = project.id;

        if (project?.slug)
            projectEntity.slug = project.slug;

        if (project?.name)
            projectEntity.name = project.name;

        if (project?.difficulty)
            projectEntity.experience = project.difficulty

        return projectEntity;
    }


    static FromProjectSessionApi(project: IProjectSession) {
        const projectEntity = new Projects();

        projectEntity.id = project.id;

        if (project?.project?.slug)
            projectEntity.slug = project.project.slug;

        if (project?.project?.name)
            projectEntity.name = project.project.name;

        if (project?.description)
            projectEntity.description = project.description

        if (project?.difficulty)
            projectEntity.experience = project.difficulty

        if (project?.estimate_time)
            projectEntity.estimatedTime = project.estimate_time

        return projectEntity;
    }
}

