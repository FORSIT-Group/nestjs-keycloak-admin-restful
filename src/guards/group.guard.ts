import {
  CanActivate,
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'

import { Reflector } from '@nestjs/core'
import { META_GROUPNAME } from '../decorators/group.decorator'
/**
 * Guard that is used to restrict access within a UMA resource by Keycloak 
 * group membership. Must be run after a ResourceGuard .
 * Use the @DefineGroup decorator to define the group prefix.
 * If the @DefineGroup decorator is given an unlimitedScope, access to this scope
 * bypasses the GroupGuard.
 * The Guards expects a url query queryName(defaults to groupName + "Id")=id
 * The Guard grants access, if the user is a member of the Keycloak group 
 * groupName+id.
 * 
 * For example: \
 * `@Get()` \
 * `@DefineGroup('project','scope-unlimited)` \
 * `@UseGuards(GroupGuard)` \
 * `function(@Query query: any) {}`
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

    const meta = this.reflector.get<{groupName: string, unlimitedScope?: string, idSuffix: string}>(META_GROUPNAME, context.getHandler())
    try {

      const request = this.getRequest(context);

      if (meta.unlimitedScope) {
        if (request.scopes.includes(meta.unlimitedScope)) {
          return true
        }
      }

      const allGroups = request.user.groups

      if (!allGroups) {
        return false
      }

      const groups: string[] = request.user.groups.filter((group: string) => {return group.startsWith(meta.groupName)});

      if (!groups) {
        return false
      }

      const groupIds: string[] = groups.map((group: string) => {return group.replace(meta.groupName, '')});

      if (groupIds.includes(request.query[meta.groupName + "Id"])) {
        return true
      } else {
        return false
      }
    } catch(error) {
      this.logger.error(`Uncaught exception handling user info`, error)
      throw new UnauthorizedException()
    }
  }
}
