import { SetMetadata, CustomDecorator } from '@nestjs/common'
import { CRUD } from '../@types/scope'

export const META_GROUPNAME = 'keycloak-groupname'
/**
 * Decorator that assigns Metadata to be used by a GroupGuard.
 * 
 * For example: \
 * `@DefineGroup('read', 'project', 'unlimited')` \
 * `@UseGuards(GroupGuard)`
 * 
 * @param scope CRUD operation
 * @param groupName prefix that is used by all Keycloak groups
 * @param unlimitedScope optional parameter, that defines a scope that can bypass the Groupguard
 * @param paramName optional suffix that defines how the group is refffered to in the url param.
 * Defaults to groupName + "Id"
 * 
 * @fritzforsit
 */
export const DefineGroup = (scopeType: CRUD, groupName: string, unlimitedSuffix?: string, paramName?: string): CustomDecorator<string> =>
  SetMetadata<string, {scopeType: CRUD, groupName:string, unlimitedSuffix?: string, paramName?: string}>(META_GROUPNAME, {scopeType: scopeType, groupName: groupName, unlimitedSuffix: unlimitedSuffix, paramName: paramName? paramName : groupName + "Id"} )
