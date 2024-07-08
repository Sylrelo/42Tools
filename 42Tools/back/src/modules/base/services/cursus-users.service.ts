import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CursusUser } from '../entities/cursus-users';
import { ICursusUser } from 'src/Interfaces/42';

export class CursusUserService {
  constructor(
    @InjectRepository(CursusUser)
    private readonly repo: Repository<CursusUser>,
  ) { }

  async updateCursusUserFromApi(cursusUsers: ICursusUser[]) {
    for (const cursusUser of cursusUsers) {
      try {

        let existingCursus = await this.repo.findOneBy({ apiId: cursusUser.id })
        const cursusUserEntity = CursusUser.FromApi(cursusUser);

        if (existingCursus != null) {
          existingCursus = {
            ...existingCursus,
            ...cursusUserEntity
          }
        } else {
          existingCursus = cursusUserEntity;
        }

        await this.repo.save(existingCursus);
      } catch (error) {
        console.error(error?.message, cursusUser)
      }
    }

    // Remove migrated useless cursuses
    await this.repo.delete({
      end_at: IsNull(),
      begin_at: IsNull(),
      grade: IsNull(),
      user: {
        id: cursusUsers[0].user.id
      }
    })
  }
}