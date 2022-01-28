import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
/**
 * Parameter Decorator that is used to retrieve the ids of all
 * Keycloak groups with the given prefix the User is a member of.
 * 
 * For example:
 * `function(@UserGroups('project') groups: number[])`
 * 
 * @param groupName prefix for the Keycloak groups.
 * 
 * @returns number[]: a list of the groups ids.
 *
 * @fritzforsit
 */
export const UserGroups = createParamDecorator(
    (groupName:string, ctx: ExecutionContext) => {
      try {
        const request = ctx.switchToHttp().getRequest();
        const groups: string[] = request.user.groups.filter((group: string) => 
            {return group.startsWith(groupName)});
        const groupIds: number[] = groups.map((group: string) => 
            {return parseInt(group.replace(groupName, ''))});
        
        return groupIds;
      } catch(error) {
        throw new InternalServerErrorException("Error fetching user groups")
      };
    }
  );
/**
 * Parameter Decorator that is used to retrieve all user resource scopes.
 * Must be run after a RessourceGuard is used without the @DefineScope decorator
 * 
 * For example:
 * `function(@UserGScopes() scopes: string[])`
 * 
 * @returns string[]: a list of all resource scopes the user has access to on the
 * current resource.
 *
 * @fritzforsit
 */
export const UserScopes = createParamDecorator(
  (data:any, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const scopes: string[] = request.scopes
      
      return scopes;
    } catch(error) {
      throw new InternalServerErrorException("Error fetching user scopes")
    };
  }
);

/**
 * Parameter Decorator that is used retrieve the current users Keycloak Roles.
 * 
 * For example:
 * `function(@UserRoles() userRoles: string[])`
 * 
 * @returns string[]: the users Keycloak roles
 *
 * @fritzforsit
 */
export const UserRoles = createParamDecorator(
  (data:any, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const roles: string[] = request.user.roles
      
      return roles;
    } catch(error) {
      throw new InternalServerErrorException("Error fetching user scopes")
    };
  }
);

/**
 * Parameter Decorator that is used retrieve the current users Keycloak id.
 * 
 * For example:
 * `function(@UserId() userId: string)`
 * 
 * @returns string: the Keycloak Id
 *
 * @fritzforsit
 */
export const UserId = createParamDecorator(
  (data:any, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const id: string[] = request.user.sub
      
      return id;
    } catch(error) {
      throw new InternalServerErrorException("Error fetching users Keycloak id")
    };
  }
);