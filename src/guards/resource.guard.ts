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
    const scope =
      this.reflector.get<string>(META_SCOPE, context.getHandler())

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

      if (!!scope) {
        if ((response as TicketDecisionResponse).result) return true;
        throw new UnauthorizedException();
      }
      
      if ((response as TicketDeniedResponse).error) {
        throw new 
        UnauthorizedException((response as TicketDeniedResponse).error)
      }

      const [{ scopes, rsid }] = response as TicketPermissionResponse[]
      request.scopes = scopes
      request.resource = await this.keycloak.resourceManager.findById(rsid)
      return true
      
    } catch (error) {
      this.logger.error(`Uncaught exception from UMA server`, error)
    }

    throw new UnauthorizedException()
  }
}
