/**
 * La portada: sin sesión, pide la contraseña; con sesión, muestra las tres
 * opciones, cada una con lo que se buscó y lo que quiere transmitir, y el
 * enlace a su sitio (public/cognitive-a, -b y -c).
 */
import { cookies } from 'next/headers';
import { BASE } from '@/lib/base';
import { COOKIE, PROPUESTAS, destinoSeguro, tieneSesion } from '@/lib/sitios';

export const dynamic = 'force-dynamic';

export default async function PropuestasDeSitios({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; siguiente?: string }>;
}) {
  const { error, siguiente } = await searchParams;
  const adentro = await tieneSesion((await cookies()).get(COOKIE)?.value);

  return (
    <main className="portada">
      <div className="portada-marco">
        <p className="rotulo">Digital Arts × Cognitive</p>
        <h1>Propuestas de Sitios</h1>

        {adentro ? (
          <ul className="propuestas" role="list">
            {PROPUESTAS.map((propuesta) => (
              <li key={propuesta.slug}>
                {/* <a> y no <Link>: cada propuesta es un sitio estático aparte. */}
                <a className="propuesta" href={`${BASE}/${propuesta.slug}/es/`}>
                  <span className="rotulo rotulo-marca">{propuesta.nombre}</span>
                  <span className="propuesta-opcion">{propuesta.opcion}</span>
                  <span className="propuesta-texto">
                    <span className="rotulo">Qué buscamos</span>
                    {propuesta.busca}
                  </span>
                  <span className="propuesta-texto">
                    <span className="rotulo">Qué transmite</span>
                    {propuesta.transmite}
                  </span>
                  <span className="propuesta-ver">Ver propuesta →</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <form method="post" action={`${BASE}/ingresar/`} className="ingreso">
            <input type="hidden" name="siguiente" value={destinoSeguro(siguiente)} />
            <label htmlFor="clave">Contraseña</label>
            <input
              id="clave"
              name="clave"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'clave-error' : undefined}
            />
            {error ? (
              <p id="clave-error" role="alert" className="ingreso-error">
                La contraseña no es correcta.
              </p>
            ) : null}
            <button type="submit">Ingresar</button>
          </form>
        )}
      </div>
    </main>
  );
}
