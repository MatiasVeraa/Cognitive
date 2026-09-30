import type { NextRequest } from 'next/server';
import { protegerSitios } from '@/lib/sitios';

/**
 * Todo pasa por acá: los archivos de public/ (las propuestas) no pasan por
 * ningún layout, así que este es el único lugar donde pedir la contraseña antes
 * de entregarlos. La lógica está en lib/sitios.ts.
 */
export function proxy(request: NextRequest) {
  return protegerSitios(request);
}
