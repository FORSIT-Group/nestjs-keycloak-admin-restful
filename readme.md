## Keycloak Admin Client for NestJs



## Initialize KeycloakModule

Then on your app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import KeycloakModule, { AuthGuard, ResourceGuard } from 'nestjs-keycloak-admin'
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    KeycloakModule.register({
      baseUrl: '',
      realmName: ''
      clientSecret: '',
      clientId: ''
    })
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD, 
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD, 
      useClass: ResourceGuard
    },
    //KeycloakModule goes here
  ],
})
export class AppModule {}
```

Optionally add KeycloakModule to your providers, if you want to manage your keycloak via the REST Api,
add KeycloakModule to providers, and import in you other Modules as follows:

```typescript
@Module({
  providers: [KeycloakModule],
})
export class DemoModule {}
```

 The API can then be accessed in your service, as a @keycloak/keycloak-admin-client,
 with access determined by the client service account.

```typescript
import { KeycloakService } from 'nestjs-keycloak-admin';

@Injectable()
export class DemoService {
    constructor(
        private readonly keycloak: KeycloakService) {};

    async accessKeycloak() {
        return await this.keycloak.client.users.find({search: "foo"})
    }
}
```

### Gating your Api using UMA resources

This module uses pre defined UMA resources with different scopes (NOT CRUD) to limit access.
Scopes can further limit access to members of a certain keycloak Group. All information needed for
authorization is stored in the request, and can be used for external logic using parameter decorators.


```typescript
import { Controller, Get, Query, Body } from '@nestjs/common';
import { DefineResource, DefineGroup, DefineScope, UserGroups, UserScopes } from 'nestjs-keycloak-admin';
import { PrismaExceptionFilter } from '../../prisma/prisma-exception.filter';
import { LimitedUserManagementService } from './limited-user-management.service';

@Controller('api/gated-endpoint')
@DefineResource('gated-endpoint')

export class GatedEndpointController {
    constructor(private readonly service: GatedEndpointService) {}

    @DefineScope('admin') //limiting access to one scope doesnt append to the result, dont try to use parameter decorators afterwards
    @Post('delete-stuff')
    deleteFunction(@Body() body: any){
      return this.service.deleteFunction(body);
    }

    @DefineScope('') //resets scope
    @Get('view-group-users')

    @DefineGroup('testgroup', 'admin')    //keycloak members of groups named testgroup1(2,3...) can access this query if the URL Query contains ?testgroupId=1(2,3...)
                                          //the 'admin' option supplies an optional argument. users with access to that scope, can access that api endpoint regardless of group memberships
    @UseGuards(GroupGuard)
    viewGroupUsers(
      @Query() query: any)                                     
    {
      return this.service.viewGroupUsers(query.testgroupId)
    }

    @Get('list-this-user-testgroups')
    listThisUserTestgroups(
      @UserGroups('testgroup') testgroups: number[],  //passes all matching group ids to perform query mutations
      @UserId() id: string)                           //passes the active users keycloak id
    {
      return this.service.listThisUserTestgroups(testgroups, id)
    }
}
```
