import { SetMetadata, CustomDecorator } from '@nestjs/common'
import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const META_SCOPE = 'keycloak-scope'

export const DefineScope = (scope: string): CustomDecorator<string> =>
  SetMetadata<string, string>(META_SCOPE, scope)

export const UserScopes = createParamDecorator(
    /*
    * returns a list of all projects the user is a member of.
    * */
    (data:any, ctx: ExecutionContext) => {
      try {
        const request = ctx.switchToHttp().getRequest();
        const scopes: string[] = request.scopes
        
        return scopes;
      } catch(error) {
        throw new InternalServerErrorException()
      };
    }
  );