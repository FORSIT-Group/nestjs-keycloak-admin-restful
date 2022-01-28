export interface KeycloakUser {
  sub: string
  email_verified: boolean
  name: string
  preferred_username: string
  given_name: string
  family_name: string
  email: string
  groups: string[]
  resource_access: JSON
}
