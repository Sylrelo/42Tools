import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
            const cursusUserEntity = CursusUser.FromApi(cursusUser);
    
            await this.repo.save(cursusUserEntity);
        } catch(error) {
            console.error(error?.message, cursusUser)
        }
    }
  }
}