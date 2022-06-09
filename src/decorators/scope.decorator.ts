import { SetMetadata, CustomDecorator } from '@nestjs/common'
import { CRUD } from '../@types/scope'

export const META_SCOPE = 'keycloak-scope'
/**
 * Decorator that assigns Metadata to be used by a ResourceGuard.
 * Must used in combination with the @DefineResource decorator.
 * Limits access to Users who own the supplied scope.
 *
 * For example: \
 * `@DefineResource('administration')` \
 * `@DefineScope(CRUD.read)`
 *
 * @param scopeType CRUD type of the Keycloak resource scope.
 * @param scopeName Optional argument for checking supplied ownership of a specific scope.
 *
 * @fritzforsit
 */
export const DefineScope = (scopeType: CRUD, scopeName?: string): CustomDecorator<string> =>
  SetMetadata<string, { scopeType: CRUD; scopeName: string | undefined }>(META_SCOPE, {
    scopeType: scopeType,
    scopeName: scopeName,
  })
