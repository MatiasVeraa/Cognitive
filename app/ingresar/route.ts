import { NextResponse, type NextRequest } from 'next/server';
import { BASE } from '@/lib/base';
import { COOKIE, SESION_DIAS, destinoSeguro, esLaClave, tokenDeSesion } from '@/lib/sitios';

/**
 * Ingreso a las propuestas: el formulario de la portada, en HTML común (anda
 * igual con o sin JavaScript). Si la contraseña no es, vuelve a la portada con
 * el aviso; si es, deja la cookie y lleva a donde se iba (o a la portada, con
 * las tres opciones).
 *
 * Es una ruta y no una Server Action: sin JavaScript, el `redirect()` de una
 * Server Action pierde la ruta base y termina en un 404.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const clave = String(form.get('clave') ?? '');
  const siguiente = destinoSeguro(String(form.get('siguiente') ?? ''));

  if (!(await esLaClave(clave))) {
    const volver = siguiente === '/' ? '' : `&siguiente=${encodeURIComponent(siguiente)}`;
    return volverA(`/?error=1${volver}`);
  }

  const respuesta = volverA(siguiente);
  respuesta.cookies.set(COOKIE, await tokenDeSesion(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: BASE,
    maxAge: 60 * 60 * 24 * SESION_DIAS,
  });
  return respuesta;
}

/** 303 a una ruta del sitio. Relativa al dominio: detrás de nginx no hace falta adivinar el host. */
function volverA(ruta: string) {
  return new NextResponse(null, { status: 303, headers: { Location: `${BASE}${ruta}` } });
}
