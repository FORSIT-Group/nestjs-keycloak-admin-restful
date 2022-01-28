import { Logger, Global } from '@nestjs/common'
import AdminClient from '@keycloak/keycloak-admin-client'
import { Client, Issuer, TokenSet } from 'openid-client'
import { ResourceManager } from './lib/resource-manager'
import { PermissionManager } from './lib/permission-manager'
import { KeycloakModuleOptions } from './@types/package'
import KeycloakConnect, { Keycloak } from 'keycloak-connect'
import { UMAConfiguration } from './@types/uma'
import Axios from 'axios'

@Global()
export class KeycloakService {
  private logger = new Logger(KeycloakService.name)

  private tokenSet?: TokenSet
  private issuerClient?: Client

  private baseUrl: string

  public umaConfiguration?: UMAConfiguration
  public readonly options: KeycloakModuleOptions

  public connect: Keycloak
  public permissionManager!: PermissionManager
  public resourceManager!: ResourceManager
  public client: AdminClient

  constructor(options: KeycloakModuleOptions) {
    if (!options.baseUrl.startsWith('http')) {
      throw new Error(`Invalid base url. It should start with either http or https.`)
    }
    this.options = options
    this.baseUrl = new URL(`/auth/realms/${options.realmName}`, options.baseUrl).href

    const keycloak: any = new KeycloakConnect({}, {
      resource: this.options.clientId,
      realm: this.options.realmName,
      'auth-server-url': new URL('/auth', this.options.baseUrl).href,
      secret: this.options.clientSecret,
    } as any)

    keycloak.accessDenied = (req: any, _res: any, next: any) => {
      req.accessDenied = true
      next()
    }

    this.connect = keycloak as Keycloak
    this.client = new AdminClient({
      baseUrl: this.options.baseUrl,
      realmName: this.options.realmName,
    })

  }

  async initialize(): Promise<void> {
    if (this.umaConfiguration) {
      return
    }

    const baseURL = this.baseUrl
    const umaRequester = Axios.create({ baseURL })

    const { data } = await umaRequester.get<UMAConfiguration>(
      '/.well-known/uma2-configuration'
    )

    const { clientId, clientSecret } = this.options

    this.umaConfiguration = data

    this.resourceManager = new ResourceManager(this, data.resource_registration_endpoint)
    this.permissionManager = new PermissionManager(this, data.token_endpoint)

    const keycloakIssuer = await Issuer.discover(data.issuer)

    this.issuerClient = new keycloakIssuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
    })

    this.tokenSet = await this.issuerClient.grant({
      clientId,
      clientSecret,
      grant_type: 'client_credentials',
    })

    if (this.tokenSet?.access_token) this.client.setAccessToken(this.tokenSet?.access_token)

    if (this.tokenSet.expires_at) {
      this.logger.verbose(`Initial token expires at ${this.tokenSet.expires_at}`)
    }
  }

  async refreshGrant(): Promise<TokenSet | undefined | null> {
    if (this.tokenSet && !this.tokenSet.expired()) {
      return this.tokenSet
    }

    if (!this.tokenSet) {
      this.logger.warn(`Missing token set on refreshGrant.`)
      return null
    }

    // try fetching refreshToken for ClientCredentialGrant - not recommended!!
    if (!!this.options.useRefreshToken) {

      const { refresh_token } = this.tokenSet

      if (!!refresh_token) {
        this.logger.debug(`Refreshing grant token`)
        this.tokenSet = await this.issuerClient?.refresh(refresh_token)
        return this.tokenSet
      }
      this.logger.debug(`Refresh token is missing. Reauthenticating.`)
    }

    this.tokenSet = await this.issuerClient?.grant({
      clientId: this.options.clientId,
      clientSecret: this.options.clientSecret,
      grant_type: 'client_credentials',
    })

    if (this.tokenSet?.access_token) {
      this.client.setAccessToken(this.tokenSet?.access_token)
      return this.tokenSet
    }
    this.logger.error(`Failed on refreshGrant.`)
  }
}
