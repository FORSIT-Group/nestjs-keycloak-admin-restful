# Keycloak Admin Client for NestJs

This repository is a fork of https://github.com/anonrig/nestjs-keycloak-admin with a restful structure.

## Initialize KeycloakModule

Adjust your `app.module.ts` like this, to activated the authentication and authorization guards.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import KeycloakModule, { AuthGuard, ResourceGuard } from 'nestjs-keycloak-admin-restful'
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

Optionally add the `KeycloakModule` to your providers. If you want to manage Keycloak via the REST API,
add KeycloakModule to providers and import it in the other Modules as follow:

```typescript
@Module({
  providers: [KeycloakModule],
})
export class DemoModule {}
```

Afterwards the `KeycloakService` can be injected in your service and accessed within the application context.

```typescript
import { KeycloakService } from 'nestjs-keycloak-admin-restful';

@Injectable()
export class DemoService {
    constructor(
        private readonly keycloak: KeycloakService) {};

    async accessKeycloak() {
        return await this.keycloak.client.users.find({search: "foo"})
    }
}
```

### Use UMA resources in your API

This module uses predefined UMA resources with different scopes **(NOT CRUD)** to limit access.
Scopes can further limit access to members of a certain Keycloak group. All information needed for
authorization is stored in the request and can be used for external logic using decorators with parameter.


```typescript
import { Controller, Get, Query, Body } from '@nestjs/common';
import { DefineResource, DefineGroup, DefineScope, UserGroups, UserScopes } from 'nestjs-keycloak-admin-restful';
import { PrismaExceptionFilter } from '../../prisma/prisma-exception.filter';
import { LimitedUserManagementService } from './limited-user-management.service';

@Controller('api/gated-endpoint')
@DefineResource('gated-endpoint')

export class GatedEndpointController {
    constructor(private readonly service: GatedEndpointService) {}

    @DefineScope('admin') // Limiting access to one scope doesn't append to the result. Don't try to use parameter decorators afterwards.
    @Post('delete-stuff')
    deleteFunction(@Body() body: any){
      return this.service.deleteFunction(body);
    }

    @DefineScope('') //resets scope
    @Get('view-group-users')

    @DefineGroup('testgroup', 'admin')    // Keycloak members of groups named testgroup1(2,3...) can access this query, if the URL Query contains ?testgroupId=1(2,3...).
                                          // The 'admin' option supplies an optional argument. Users with access to that scope, can access that API endpoint regardless of group memberships.
    @UseGuards(GroupGuard)
    viewGroupUsers(
      @Query() query: any)                                     
    {
      return this.service.viewGroupUsers(query.testgroupId)
    }

    @Get('list-this-user-testgroups')
    listThisUserTestgroups(
      @UserGroups('testgroup') testgroups: number[],  // Passes all matching group ids to perform query mutations.
      @UserId() id: string)                           // Passes the active users Keycloak id.
    {
      return this.service.listThisUserTestgroups(testgroups, id)
    }
}
```

## Release process

The release is made manually of the master branch. To create a new release, do these steps:

1. Adjust `version` in [package.json](package.json).
2. Commit and push the changes.
3. Go to the [release workflow](https://github.com/FORSIT-Group/nestjs-keycloak-admin-restful/actions/workflows/release.yml) in GitHub Actions.
4. There you have a dropdown button with the text `Run workflow`. If you don't see it, you need rights to run GitHub Actions.
5. Click on the button, select the master branch and click on `Run workflow`.
