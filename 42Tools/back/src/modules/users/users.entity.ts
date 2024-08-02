import 'reflect-metadata';
import { AfterLoad, Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { ProjectUsers } from '../project-users/project-users.entity';
import { IUser } from 'src/Interfaces/42';
import { EventUser } from '../events/event-user.entity';
import { CachedRncpProgress } from '../rncp-progress/rncp-progress.entity';
import { UserLocation } from '../user-locations/user-location.entity';
import { CursusUser } from '../base/entities/cursus-users';
import dayjs from 'dayjs';

@Entity({ name: 'users' })
export class Users {
  @PrimaryColumn()
  id: number;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: false })
  login: string;

  @Column({ default: '' })
  fullName: string;

  @Column({ nullable: true })
  poolYear: string;

  @Column({ nullable: true })
  poolMonth: string;

  /** @deprecated for CursusUser relation */
  @Column({ nullable: true, type: 'float' })
  poolLevel: number;

  @Column({ default: false })
  isAlumni: boolean;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ nullable: true })
  campusId: number;

  @Column({ nullable: true, type: 'timestamp' })
  lastSeenAt?: Date | string | number;

  @Column({ nullable: true, type: 'timestamp' })
  lastUpdatedAt?: Date | string | number;

  @Column({ nullable: true, type: 'timestamp' })
  lastCachedProgressUpdatedAt?: Date | string | number;

  /** @deprecated for CursusUser relation */
  @Column({ default: 0, type: 'float' })
  @Index()
  level: number;

  @Column({ default: 0 })
  @Index()
  correctionPoint: number;

  @Column({ default: 0 })
  @Index()
  wallet: number;

  @Column({ default: false })
  isStaff: boolean;

  @Column({ default: null, type: 'date' })
  apprenticeshipStartDate?: number;

  @Column({ default: null, type: 'date' })
  apprenticeshipEndDate?: number;

  @Column({ default: null })
  apprenticeshipRythm?: string;

  @OneToMany(() => CachedRncpProgress, (cached) => cached.user)
  cachedRncpProgress: CachedRncpProgress[];

  @OneToMany(() => ProjectUsers, (projectUser) => projectUser.user)
  projectUser: ProjectUsers[];

  @OneToMany(() => EventUser, (eventUser) => eventUser.user)
  eventUser: EventUser[];

  @OneToMany(() => UserLocation, (userLocaion) => userLocaion.user)
  userLocations: UserLocation[];

  @OneToMany(() => CursusUser, (cursusUser) => cursusUser.user)
  cursuses: CursusUser[];

  @Column({ default: false })
  ignoreFutureUpdate: boolean;

  @Column({ type: 'timestamp', nullable: true })
  blackholeDate: string | number | Date;

  @Column({ type: 'timestamp', nullable: true })
  alumnifiedAt: string | number | Date;

  @Column({ type: 'timestamp', nullable: true })
  anonymizationDate: string | number | Date;

  primaryCursusLevel: number = -1;

  @AfterLoad()
  getPrimaryCursusLevel() {
    if (this.cursuses == null) {
      return;
    }

    const activeCursuses = this.cursuses.filter((cursus) => cursus.end_at == null && cursus.isActive === true);
    activeCursuses.sort((a, b) => dayjs(b.begin_at).diff(a.begin_at));

    if (activeCursuses[0] != null) this.primaryCursusLevel = activeCursuses[0].level;
  }

  constructor(userId?: number) {
    if (userId != null) {
      this.id = userId;
      this.login = '';
    }
  }

  static FromUserApi(user: IUser): Users {
    const newUser = new Users();

    newUser.fromUserApi(user);

    return newUser;
  }

  fromUserApi(user: IUser) {
    this.id = user.id;

    if (user?.email != null) this.email = user.email;

    if (user?.login != null) this.login = user.login;

    if (user?.usual_full_name != null || user?.displayname != null) this.fullName = user.usual_full_name ?? user.displayname;

    if (user?.['staff?'] != null) this.isStaff = user['staff?'];

    if (user?.['alumni?'] != null) this.isAlumni = user['alumni?'];

    if (user?.image?.link != null) this.profilePicture = user.image.link;

    if (this?.login?.startsWith('3b3-') === true) {
      this.profilePicture = null;
      this.email = null;
    }

    if (user?.pool_month != null) this.poolMonth = user.pool_month;

    if (user?.pool_year != null) this.poolYear = user.pool_year;

    if (user?.correction_point != null) this.correctionPoint = user.correction_point ?? 0;

    if (user?.wallet != null) this.wallet = user.wallet ?? 0;

    if (user.campus_users != null && Array.isArray(user.campus_users)) {
      const campus = user.campus_users.find((c) => c.is_primary) ?? user.campus_users?.[0];
      this.campusId = campus?.campus_id ?? undefined;
    }

    if (user?.cursus_users != null && Array.isArray(user.cursus_users)) {
      const mainCursus = user.cursus_users.find((c) => c.cursus.kind.toLowerCase() === 'main');
      const mainCursusDeprecated = user.cursus_users.find((c) => c.cursus.kind.toLowerCase() === 'main_deprecated');

      const poolCursus = user.cursus_users.find((c) => c.cursus.kind.toLowerCase() === 'piscine');
      const poolCursusDeprecated = user.cursus_users.find((c) => c.cursus.kind.toLowerCase() === 'piscine_deprecated');

      this.level = mainCursus?.level ?? mainCursusDeprecated?.level ?? -1;
      this.poolLevel = poolCursus?.level ?? poolCursusDeprecated?.level ?? -1;

      this.blackholeDate ??= mainCursus?.blackholed_at ?? mainCursusDeprecated?.blackholed_at ?? null;
    }

    if (user?.anonymize_date != null) this.anonymizationDate = user.anonymize_date;

    if (user?.alumnized_at != null) this.alumnifiedAt = user.alumnized_at;
  }
}
