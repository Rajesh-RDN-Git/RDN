// TextEncoder/TextDecoder for libs that need them
import { TextEncoder, TextDecoder } from 'util';

const g = global as unknown as { TextEncoder?: unknown; TextDecoder?: unknown };
if (!g.TextEncoder) g.TextEncoder = TextEncoder;
if (!g.TextDecoder) g.TextDecoder = TextDecoder;
