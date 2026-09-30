/**
 * Las propuestas, la contraseña y la protección de los archivos.
 *
 * La contraseña no está escrita en el código, solo su hash. La cookie se valida
 * con Web Crypto y no depende de variables de entorno: es una contraseña
 * compartida con el cliente para mirar propuestas, no una cuenta.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { BASE } from './base';

export const COOKIE = 'da-cognitive-sitios';

/** SHA-256 de la contraseña. Para cambiarla, se reemplaza este valor (README). */
const CLAVE_SHA256 = '7c00006b0ad9927c6786abc9fa112d9778f503562630636e9f9952d2ed38b233';

export const SESION_DIAS = 30;

export interface Propuesta {
  slug: string;
  opcion: string;
  nombre: string;
  /** Qué se quiso lograr. */
  busca: string;
  /** Qué se quiere transmitir. */
  transmite: string;
}

export const PROPUESTAS: readonly Propuesta[] = [
  {
    slug: 'cognitive-a',
    opcion: 'Opción A',
    nombre: 'Narrativa',
    busca:
      'Un sitio editorial y sobrio que cuenta la historia de Cognitive a medida que se recorre: la frase principal se enciende palabra por palabra, las escenas se detienen para leerse y los datos aparecen en el orden en que se cuentan.',
    transmite:
      'Solidez, precisión y trayectoria. Una empresa de ingeniería seria, donde el movimiento acompaña sin distraer.',
  },
  {
    slug: 'cognitive-b',
    opcion: 'Opción B',
    nombre: 'Hologramas',
    busca:
      'Un punto intermedio: más disruptivo que la A, sin llegar al extremo de la C. El isotipo de Cognitive funciona como un proyector: la trayectoria, la presencia regional y las unidades avanzan paso a paso, y cada una se materializa como un holograma.',
    transmite:
      'Tecnología aplicada con identidad propia: innovación con control, con la marca siempre en el centro.',
  },
  {
    slug: 'cognitive-c',
    opcion: 'Opción C',
    nombre: 'Inmersiva',
    busca:
      'Una experiencia que rompe la estética sin romper la marca: el logo se desarma en partículas que acompañan todo el recorrido, y los casos se muestran como los ve la inteligencia artificial, con el mundo escaneado y fichas de lo que detecta.',
    transmite:
      'Capacidad técnica de vanguardia, con el status y la seniority de una empresa consolidada: Cognitive como quien ve lo que otros todavía no ven.',
  },
];

/** Archivos que las tres propuestas comparten (public/compartido): el video del hero, apaisado
 *  y en su recorte vertical para el teléfono. */
const COMPARTIDOS = new Set(['hero-video-1280.mp4', 'hero-video-440.mp4']);

async function sha256(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const resumen = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(resumen), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function esLaClave(clave: string): Promise<boolean> {
  return (await sha256(clave)) === CLAVE_SHA256;
}

/** El valor de la cookie: se deriva del hash, así que cambiar la clave cierra las sesiones. */
export function tokenDeSesion(): Promise<string> {
  return sha256(`${CLAVE_SHA256}:sesion`);
}

export async function tieneSesion(valor: string | undefined): Promise<boolean> {
  return !!valor && valor === (await tokenDeSesion());
}

/** Adónde volver después de ingresar: solo a una propuesta (ruta sin la base). */
export function destinoSeguro(ruta: string | undefined | null): string {
  return ruta && /^\/cognitive-[abc]\//.test(ruta) && !ruta.includes('//') ? ruta : '/';
}

function privado(respuesta: NextResponse, cache: string): NextResponse {
  respuesta.headers.set('Cache-Control', cache);
  return respuesta;
}

/**
 * Proxy (proxy.ts): pide la sesión y traduce las rutas de los sitios exportados
 * a sus archivos. Las rutas llegan sin la base (`/cognitive-a/es/`).
 *
 *  - La portada, el ingreso y los archivos propios de esta app (/_next) pasan:
 *    la portada misma pide la contraseña.
 *  - Sin sesión, cualquier otra ruta vuelve a la portada (y después, adonde iba).
 *  - La raíz de cada propuesta lleva a su home en español: el export no tiene
 *    redirecciones.
 *  - Las páginas se exportan como carpeta/index.html (`trailingSlash`); los
 *    archivos (JS, CSS, imágenes) se entregan tal cual; el video del hero, de
 *    public/compartido.
 *  - Nada se guarda en una caché compartida.
 */
export async function protegerSitios(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const ruta = pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname;

  if (ruta === '/' || ruta === '' || ruta.startsWith('/_next/') || ruta.startsWith('/ingresar')) {
    return NextResponse.next();
  }

  if (!(await tieneSesion(request.cookies.get(COOKIE)?.value))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = `?siguiente=${encodeURIComponent(ruta)}`;
    return NextResponse.redirect(url);
  }

  const [, slug = '', ...resto] = ruta.split('/');
  if (!PROPUESTAS.some((propuesta) => propuesta.slug === slug)) return NextResponse.next();

  const interior = resto.join('/');
  if (interior === '') {
    const url = request.nextUrl.clone();
    url.pathname = `/${slug}/es/`;
    return NextResponse.redirect(url);
  }

  const ultimo = resto[resto.length - 1] ?? '';
  if (ultimo.includes('.')) {
    const url = request.nextUrl.clone();
    if (COMPARTIDOS.has(ultimo)) {
      url.pathname = `/compartido/${ultimo}`;
      return privado(NextResponse.rewrite(url), 'private, max-age=86400');
    }
    // La navegación de Next 16 pide cada segmento como `__next.a.b.__PAGE__.txt`,
    // y el export los guarda anidados: `__next.a/b/__PAGE__.txt`.
    const segmento = /^__next\.(.+)\.txt$/.exec(ultimo)?.[1];
    if (segmento?.includes('.')) {
      const [primero, ...siguientes] = segmento.split('.');
      url.pathname = `/${slug}/${resto.slice(0, -1).map((p) => `${p}/`).join('')}__next.${primero}/${siguientes.join('/')}.txt`;
      return privado(NextResponse.rewrite(url), 'private, max-age=3600');
    }
    return privado(NextResponse.next(), 'private, max-age=3600');
  }

  // El índice de casos en inglés tiene slug propio en el sitio y se exporta como /en/casos.
  const pagina = interior.replace(/\/?$/, '/').replace(/^en\/cases\/$/, 'en/casos/');
  const url = request.nextUrl.clone();
  url.pathname = `/${slug}/${pagina}index.html`;
  return privado(NextResponse.rewrite(url), 'private, no-cache');
}
