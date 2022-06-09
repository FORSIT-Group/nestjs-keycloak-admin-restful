import { SetMetadata, CustomDecorator } from '@nestjs/common'

export const META_PUBLIC = 'keycloak-public'
/**
 * Decorator that assigns Metadata to be used by Auth and Resource Guards.
 * Grants public access bypassing all Guards.
 * 
 * For example: \
 * `@Public()`
 *
 * @fritzforsit
 */
export const Public = (): CustomDecorator<string> => SetMetadata<string, boolean>(META_PUBLIC, true)
