import "reflect-metadata"
import { AfterLoad, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Users } from "../users/users.entity"
import { Projects } from "../projects/projects.entity"
import { IProjectUser } from "src/Interfaces/42"


@Entity({ name: "projects_users" })
export class ProjectUsers {
    @PrimaryColumn()
    id: number

    @Column({ type: "timestamp", nullable: true })
    createdAt: number | string | Date

    @ManyToOne(
        () => Users,
        users => users.projectUser,
        {
            cascade: ["insert"]
        }
    )
    user: Users

    @ManyToOne(() => Projects, { cascade: ["insert"] })
    project: Projects

    @Column({ default: "finished" })
    status: string

    @Column({ default: false })
    isValidated: boolean

    @Column({ default: 0 })
    finalMark: number

    gainedExperience: number

    @AfterLoad()
    calculate() {
        this.gainedExperience = (this.finalMark * 0.01) * (this.project?.experience ?? 0)
    }

    static FromApi(input: IProjectUser) {
        const newEntity = new ProjectUsers();

        newEntity.id = input.id;

        if (input?.created_at)
            newEntity.createdAt = input.created_at;

        if (input?.final_mark)
            newEntity.finalMark = input.final_mark;

        if (input?.["validated?"])
            newEntity.isValidated = input["validated?"];

        if (input?.status)
            newEntity.status = input.status;

        if (input?.user?.id)
            newEntity.user = new Users(input.user.id);

        if (input?.project)
            newEntity.project = Projects.FromProjectApi(input.project)

        return newEntity;
    }
}

