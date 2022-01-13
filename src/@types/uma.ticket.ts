export interface TicketForm {
  token: string
  audience: string
  grant_type?: string
  resourceId?: string
  scope?: string
  response_mode?: TicketResponseMode
  groups?: string[]
}

export enum TicketResponseMode {
  permissions = 'permissions',
  decision = 'decision',
}

export interface TicketDecisionResponse {
  result: boolean
}

export interface TicketPermissionResponse {
  scopes: string[]
  rsid: string
  rsname: string
  groups: string[]
}
