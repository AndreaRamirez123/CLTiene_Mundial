type JugadorActividad = {
  ultimo_acceso?: Date | string | null;
  predicciones_count?: number | null;
  trivias_jugadas?: number | null;
  dias_consecutivos?: number | null;
};

const ZONA_COLOMBIA = 'America/Bogota';
const formateadorFechaColombia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_COLOMBIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function fechaColombiaISO(fecha = new Date()) {
  const partes = formateadorFechaColombia.formatToParts(fecha);
  const valores = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value]),
  );
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function fechaISOADiaUTC(fechaISO: string) {
  const [year, month, day] = fechaISO.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function convertirFecha(valor?: Date | string | null) {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function diferenciaEnDias(desde: Date, hasta: Date) {
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.floor(
    (fechaISOADiaUTC(fechaColombiaISO(hasta)) -
      fechaISOADiaUTC(fechaColombiaISO(desde))) /
      msPorDia,
  );
}

export function actualizarRachaDeAcceso<T extends JugadorActividad>(
  jugador: T,
  ahora = new Date(),
) {
  const ultimoAcceso = convertirFecha(jugador.ultimo_acceso);

  if (!ultimoAcceso) {
    jugador.dias_consecutivos = 1;
    jugador.ultimo_acceso = ahora;
    return jugador;
  }

  const dias = diferenciaEnDias(ultimoAcceso, ahora);

  if (dias <= 0) {
    jugador.ultimo_acceso = ahora;
    return jugador;
  }

  if (dias === 1) {
    jugador.dias_consecutivos = (jugador.dias_consecutivos || 0) + 1;
  } else {
    jugador.dias_consecutivos = 1;
  }

  jugador.ultimo_acceso = ahora;
  return jugador;
}

export function calcularNivelActividad(jugador: JugadorActividad) {
  const ultimoAcceso = convertirFecha(jugador.ultimo_acceso);
  const predicciones = jugador.predicciones_count || 0;
  const trivias = jugador.trivias_jugadas || 0;
  const racha = jugador.dias_consecutivos || 0;

  if (!ultimoAcceso) return 'inactivo';

  const diasSinIngresar = diferenciaEnDias(ultimoAcceso, new Date());
  const participacionAlta = predicciones >= 5 || trivias >= 3 || racha >= 3;
  const participacionBase = predicciones > 0 || trivias > 0 || racha > 0;

  if (diasSinIngresar <= 2 && participacionAlta) return 'muy_activo';
  if (diasSinIngresar <= 7 && participacionBase) return 'activo';
  return 'inactivo';
}
