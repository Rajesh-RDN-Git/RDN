// TextEncoder/TextDecoder for libs that need them
import { TextEncoder, TextDecoder } from 'util';

if (!global.TextEncoder) {
  // @ts-expect-error - assigning Node TextEncoder to global
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  // @ts-expect-error - assigning Node TextDecoder to global
  global.TextDecoder = TextDecoder;
}
