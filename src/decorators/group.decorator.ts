import { SetMetadata, CustomDecorator } from '@nestjs/common'
import { CRUD } from '../@types/scope'

export const META_GROUPNAME = 'keycloak-groupname'
/**
 * Decorator that assigns Metadata to be used by a GroupGuard.
 *
 * For example: \
 * `@DefineGroup('read', 'project', 'unlimited', 'projectId')` \
 * `@UseGuards(GroupGuard)`
 *
 * @param scopeType CRUD operation.
 * @param groupName Prefix that is used by all Keycloak groups.
 * @param unlimitedSuffix Optional parameter, that defines a scope, that can bypass the GroupGuard.
 * @param paramName Optional suffix that defines to which URL parameter the group is referred to.
 * Defaults to groupName + "Id"
 *
 * @fritzforsit
 */
export const DefineGroup = (
  scopeType: CRUD,
  groupName: string,
  unlimitedSuffix?: string,
  paramName?: string
): CustomDecorator<string> =>
  SetMetadata<
    string,
    { scopeType: CRUD; groupName: string; unlimitedSuffix?: string; paramName?: string }
  >(META_GROUPNAME, {
    scopeType: scopeType,
    groupName: groupName,
    unlimitedSuffix: unlimitedSuffix,
    paramName: paramName ? paramName : groupName + 'Id',
  })
