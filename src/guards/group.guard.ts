import {
  CanActivate,
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'

import { Reflector } from '@nestjs/core'
import { META_GROUPNAME } from '../decorators/group.decorator'

@Injectable()
export class GroupGuard implements CanActivate {
    /*
    * Guard written to secure API calls trying to access a group, who's access
    * is limited to group members of a group named "groupName" + "groupID",
    * accessing the API with a query of ?groupName=groupID. If the user is not
    * a member of that group, access is denied
    * 
    * The groupname is defined with the decorator @GroupName('groupName')
    * */

  logger = new Logger(GroupGuard.name)
  
  constructor(
    private readonly reflector: Reflector
  ) {}

  getRequest(context: ExecutionContext): any {
    return context.switchToHttp().getRequest()
  }
  
  canActivate(context: ExecutionContext): 
    boolean | Promise<boolean> {   

    const meta = this.reflector.get<{groupName: string, unlimitedScope?: string}>(META_GROUPNAME, context.getHandler())
    try {

      const request = this.getRequest(context);

      if (meta.unlimitedScope) {
        if (request.scopes.includes(meta.unlimitedScope)) {
          return true
        }
      }

      const groups: string[] = request.user.groups.filter((group: string) => {return group.startsWith(meta.groupName)});

      const groupIds: number[] = groups.map((group: string) => {return parseInt(group.replace(meta.groupName, ''))});

      if (groupIds.includes(parseInt(request.query[meta.groupName + "Id"]))) {
        return true
      } else {
        throw new UnauthorizedException(); 
      }
    } catch(error) {
      this.logger.error(`Uncaught exception handling user info`, error)
      throw new UnauthorizedException()
    }
  }
}
