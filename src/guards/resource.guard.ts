import {
  CanActivate,
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common'

import { KeycloakService } from '../service'
import { Reflector } from '@nestjs/core'
import { META_SCOPE } from '../decorators/scope.decorator'
import {
  TicketResponseMode,
  TicketPermissionResponse,
  TicketDeniedResponse,
  TicketDecisionResponse
} from '../@types/uma.ticket'
import { META_RESOURCE } from '../decorators/resource.decorator'
import { META_PUBLIC } from '../decorators/public.decorator'
import { CRUD } from '../@types/scope'
/**
 * Guard that is used to protect a UMA resource. If a resource is defined
 * with the @DefineResource decorator, the guard checks the users access to
 * any scopes of that resource on the Keycloak.
 * Resource name and all authorised scopes are stored in the request.
 * 
 * If used with a @DefineScope decorator, the guard checks access for the 
 * given scope, and does not append to the request
 * 
 * 
 * For example: \
 * `@DefineResource('administration')` \
 * `@UseGuards(ResourceGuard)`

 * @fritzforsit
 */
@Injectable()
export class ResourceGuard implements CanActivate {
  logger = new Logger(ResourceGuard.name)

  constructor(
    @Inject(KeycloakService)
    private keycloak: KeycloakService,
    private readonly reflector: Reflector
  ) {}

  getRequest(context: ExecutionContext): any {
    return context.switchToHttp().getRequest()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(META_PUBLIC, context.getHandler())

    // Emit process, if endpoint is public.
    if (isPublic) {
      return true
    }

    const request = this.getRequest(context)

    const resource = this.reflector.get<string>(META_RESOURCE, context.getClass())

    // If no @DefineScope() decorator is used in handler, it's generated from http method.
    const scopeData =
      this.reflector.get<{scopeType: CRUD, scopeName: string}>(META_SCOPE, context.getHandler())

    let scope = undefined

    if (scopeData) {
      if (scopeData.scopeType && scopeData.scopeName) {
          scope = `${scopeData.scopeType}-${scopeData.scopeName}`
      }
    }

    // If no resource type is defined as class decorator, emit.
    if (!resource) {
      return true
    }

    // If no access token is defined, probably auth guard failed to load.
    if (!request.accessToken) {
      throw new UnauthorizedException()
    }

    try {
      const response = await this.keycloak.permissionManager.requestTicket({
        token: request.accessToken as string,
        audience: this.keycloak.options.clientId,
        resourceId: resource,
        scope: scope ? `${scope}` : undefined,
        response_mode: scope? 
          TicketResponseMode.decision:
          TicketResponseMode.permissions
      })

      if ((response as TicketDeniedResponse).error) {
        switch ((response as TicketDeniedResponse).error) {
          case "access_denied":
            return false
          default:
            this.logger.error("Exception from UMA server",
              response as TicketDeniedResponse)
            return false            
        }
      }

      if (!!scope) {
        if ((response as TicketDecisionResponse).result) return true;
        return false;
      }

      const [{ scopes, rsid }] = response as TicketPermissionResponse[]
      request.scopes = scopes
      request.resource = await this.keycloak.resourceManager.findById(rsid)

      // check for ownership of any scopes with specific CRUD type

      if (!scopeData) {
        return true
      }

      if (scopes.find((scopeName) => {
        return scopeName.startsWith(CRUD[scopeData.scopeType])
      })) {
        return true
      }   

    } catch (error) {
      this.logger.error(`Uncaught exception from UMA server`, error)
    }
    throw new UnauthorizedException()
  }
}
