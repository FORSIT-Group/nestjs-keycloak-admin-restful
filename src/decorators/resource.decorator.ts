import { SetMetadata, CustomDecorator } from '@nestjs/common'

export const META_RESOURCE = 'keycloak-resource'
/**
 * Decorator that assigns Metadata to be used by a ResourceGuard.
 * Can be used in combination with the @DefineScope decorator.
 * 
 * For example: \
 * `@DefineResource('project-management')`
 * 
 * @param resource name of the Keycloak resource.
 *
 * @fritzforsit
 */
export const DefineResource = (resource: string): CustomDecorator<string> =>
  SetMetadata<string, string>(META_RESOURCE, resource)
