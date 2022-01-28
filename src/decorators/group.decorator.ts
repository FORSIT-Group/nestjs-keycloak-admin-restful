import { SetMetadata, CustomDecorator } from '@nestjs/common'

export const META_GROUPNAME = 'keycloak-groupname'
/**
 * Decorator that assigns Metadata to be used by a GroupGuard.
 * 
 * For example: \
 * `@DefineGroup('project', 'scope-unlimited')` \
 * `@UseGuards(GroupGuard)`
 * 
 * @param groupName prefix that is used by all Keycloak groups
 * @param unlimitedScope optional parameter, that defines a scope that can bypass the Groupguard
 * @param queryName optional suffix that defines how the group is refffered to in the query.
 * Defaults to groupName + "Id"
 * 
 * @fritzforsit
 */
export const DefineGroup = (groupName: string, unlimitedScope?: string, queryName?: string): CustomDecorator<string> =>
  SetMetadata<string, {groupName:string, unlimitedScope?: string, queryName?: string}>(META_GROUPNAME, {groupName: groupName, unlimitedScope: unlimitedScope, queryName: queryName? queryName : groupName + "Id"} )
