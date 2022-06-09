import {
  CanActivate,
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'

import { Reflector } from '@nestjs/core'
import { CRUD } from '../@types/scope'
import { META_GROUPNAME } from '../decorators/group.decorator'
/**
 * Guard that is used to restrict access within a UMA resource by Keycloak 
 * group membership. Must be run after a ResourceGuard.
 * Use the @DefineGroup decorator to define the group prefix.
 * If the @DefineGroup decorator is given an unlimitedScopeSuffix, access to this scope
 * bypasses the GroupGuard.
 * The Guards expects a url param paramName. This defaults to groupName + "Id", for example,
 * if groupName is project, the default value for paramName is projectId.
 * The Guard grants access, if the user is a member of the Keycloak group.
 * 
 * For example: \
 * `@Get()` \
 * `@DefineGroup('project','create','unlimited')` \
 * `@UseGuards(GroupGuard)` \
 * `function(@Param param: any) {}`
 * 
 * @fritzforsit
 */
@Injectable()
export class GroupGuard implements CanActivate {
  logger = new Logger(GroupGuard.name)
  
  constructor(
    private readonly reflector: Reflector
  ) {}

  getRequest(context: ExecutionContext): any {
    return context.switchToHttp().getRequest()
  }
  
  canActivate(context: ExecutionContext): 
    boolean | Promise<boolean> {   

    const meta = this.reflector.get<{scopeType: CRUD, groupName: string, unlimitedSuffix?: string, paramName: string}>(META_GROUPNAME, context.getHandler())
    try {

      const request = this.getRequest(context);

      if (meta.unlimitedSuffix) {
        let unlimitedScopeName = `${CRUD[meta.scopeType]}-${meta.unlimitedSuffix}`
        if (request.scopes.includes(unlimitedScopeName)) {
          return true
        }
      }

      let limitedScopeName = `${meta.scopeType}-${meta.groupName}-limited`

      if (request.scopes.includes(limitedScopeName)) {

        const allGroups = request.user.groups

        if (!allGroups) {
          return false
        }

        const groups: string[] = request.user.groups.filter((group: string) => {return group.startsWith(meta.groupName)});

        if (!groups) {
          return false
        }

        const groupIds: string[] = groups.map((group: string) => {return group.replace(meta.groupName, '')});

        if (groupIds.includes(request.param[meta.paramName])) {
          return true
        }
      }
      return false

    } catch(error) {
      this.logger.error(`Uncaught exception handling user info`, error)
      throw new UnauthorizedException()
    }
  }
}
