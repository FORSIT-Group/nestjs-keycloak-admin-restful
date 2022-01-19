import { SetMetadata, CustomDecorator } from '@nestjs/common'
import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const META_GROUPNAME = 'keycloak-groupname'

export const GroupName = (groupName: string, unlimitedScope?: string): CustomDecorator<string> =>
  SetMetadata<string, {groupName:string, unlimitedScope?: string}>(META_GROUPNAME, {groupName: groupName, unlimitedScope: unlimitedScope} )

export const UserGroups = createParamDecorator(
    /*
    * returns a list of the IDs of all groups starting with groupName the user is a member of
    * */
    (groupName:string, ctx: ExecutionContext) => {
      try {
        const request = ctx.switchToHttp().getRequest();
        const groups: string[] = request.user.groups.filter((group: string) => 
            {return group.startsWith(groupName)});
        const groupIds: number[] = groups.map((group: string) => 
            {return parseInt(group.replace(groupName, ''))});
        
        return groupIds;
      } catch(error) {
        throw new InternalServerErrorException()
      };
    }
  );