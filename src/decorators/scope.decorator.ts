import { SetMetadata, CustomDecorator } from '@nestjs/common'

export const META_SCOPE = 'keycloak-scope'
/**
 * Decorator that assigns Metadata to be used by a ResourceGuard.
 * Must used in combination with the @DefineResource decorator.
 * Limits access to Users who own the supplied scope.
 * 
 * For example: \
 * `@DefineResource('administration')` \
 * `@DefineScope('scope-administration')`
 * 
 * @param scope name of the Keycloak resource scope.
 *
 * @fritzforsit
 */
export const DefineScope = (scope: string): CustomDecorator<string> =>
  SetMetadata<string, string>(META_SCOPE, scope)
