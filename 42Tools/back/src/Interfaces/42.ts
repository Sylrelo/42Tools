export interface IProjectSession {
    id: number
    solo: boolean
    begin_at: any
    end_at: any
    estimate_time?: any
    duration_days: any
    terminating_after: any
    project_id: number
    campus_id: any
    cursus_id: any
    created_at: string
    updated_at: string
    max_people: any
    is_subscriptable: boolean
    scales: any[]
    uploads: any[]
    team_behaviour: string
    project: IProject
    campus: ICampus
    cursus: any
    evaluations: IEvaluation[]
    difficulty: number
    description: string
}

export interface IProject {
    id: number
    name: string
    slug: string
    parent?: IParent
    children: IChildren[]
    objectives?: string[]
    tier?: number
    attachments: any[]
    created_at: string
    updated_at: string
    exam: boolean
    difficulty: number,

}

export interface IParent {
    name: string
    id: number
    slug: string
    url: string
}

export interface IChildren {
    name: string
    id: number
    slug: string
    url: string
}

export interface IEvaluation {
    id: number
    kind: string
}

export interface ICampusUser {
    "id": number,
    "user_id": number,
    "campus_id": number,
    "is_primary": boolean
}

export interface IUser {
    id: number
    email: string
    login: string
    first_name: string
    last_name: string
    usual_full_name: string
    usual_first_name: any
    url: string
    phone: string
    displayname: string
    kind: string
    image: IImage
    "staff?": boolean
    correction_point: number
    pool_month: string
    pool_year: string
    location: any
    wallet: number
    anonymize_date: string
    data_erasure_date: string
    created_at: string
    updated_at: string
    alumnized_at: any
    "alumni?": boolean
    "active?": boolean
    projects_users: IProjectUser[]
    cursus_users?: ICursusUser[]
    campus?: any[]
    campus_users: ICampusUser[]
    achievements?: any[]
}

export interface IImage {
    link: string
    versions: IVersions
}

export interface IVersions {
    large: string
    medium: string
    small: string
    micro: string
}


export interface IProjectUser {
    id: number
    occurrence: number
    final_mark: number
    status: string
    "validated?": boolean
    current_team_id: number
    project: IProject
    cursus_ids: number[]
    marked_at: string
    marked: boolean
    retriable_at: string
    created_at: string
    updated_at: string
    user: IUser
    teams: ITeam[]
}

export interface IProject {
    id: number
    name: string
    slug: string
    parent_id: any
}


export interface ITeam {
    id: number
    name: string
    url: string
    final_mark: number
    project_id: number
    created_at: string
    updated_at: string
    status: string
    terminating_at: any
    users: string[]
    "locked?": boolean
    "validated?": boolean
    "closed?": boolean
    repo_url: string
    repo_uuid: string
    locked_at: string
    closed_at: string
    project_session_id: number
    project_gitlab_path: any
}

export interface ILocation {
    end_at: any
    id: number
    begin_at: string
    primary: boolean
    host: string
    campus_id: number
    user: IUser
}

export interface IEventUser {
    id: number
    event_id: number
    user_id: number
    user: IUser
    event: IEvent
}

export interface IEvent {
    id: number
    name: string
    description: string
    location: string
    kind: string
    max_people: number
    nbr_subscribers: number
    begin_at: string
    end_at: string
    campus_ids: number[]
    cursus_ids: number[]
    created_at: string
    updated_at: string
    prohibition_of_cancellation: any
    waitlist: any
}

export interface IAuthorizationCodeResponse {
    access_token: string
    token_type: string
    expires_in: number,
    refresh_token: string
    scope: string
    created_at: number,
    secret_valid_until: number
}

export interface ICampus {
    id: number
    name: string
    time_zone: string
    language: ILanguage
    users_count: number
    vogsphere_id: number
    country: string
    address: string
    zip: string
    city: string
    website: string
    facebook: string
    twitter: string
    active: boolean
    public: boolean
    email_extension: string
    default_hidden_phone: boolean
    endpoint: IEndpoint
}

export interface ILanguage {
    id: number
    name: string
    identifier: string
}

export interface IEndpoint {
    id: number
    url: string
    description: string
    created_at: string
    updated_at: string
}

export interface ICursusUser {
    grade: string
    level: number
    skills: ISkill[]
    blackholed_at: any
    id: number
    begin_at: string
    end_at: any
    cursus_id: number
    has_coalition: boolean
    created_at: string
    updated_at: string
    user: IUser
    cursus: ICursus
}

export interface ISkill {
    id: number
    name: string
    level: number
}


export interface ICursus {
    id: number
    created_at: string
    name: string
    slug: string
    kind: string
}


export interface IUserAchievement {
    id: number,
    name: string,
    description: string,
    tier: string,
    kind: string,
    visible: boolean,
    image: string,
    nbr_of_success: null,
    users_url: string
}