// Regla de cobro: hora completa o fracción (mínimo 1 hora).
// Si prefieres cobrar por minuto exacto, cambia horasCobradas por (minutos / 60).
function construirFechaLocal(fechaIngreso, horaIngreso) {
  if (!fechaIngreso || !horaIngreso) return new Date(NaN);
  const [anio, mes, dia] = String(fechaIngreso).split("-").map(Number);
  const [hora, minuto, segundo = 0] = String(horaIngreso)
    .split(":")
    .map(Number);

  return new Date(anio, mes - 1, dia, hora, minuto, segundo);
}

export function calcularTiempoYCosto(fechaIngreso, horaIngreso, valorHora) {
  const inicio = construirFechaLocal(fechaIngreso, horaIngreso);
  const ahora = new Date();

  if (Number.isNaN(inicio.getTime())) {
    return { minutos: 0, segundos: 0, horas: 0, mins: 0, costo: 0 };
  }
  
  if (inicio > ahora) {
    inicio.setDate(inicio.getDate() - 1);
  }

  const segundosTotales = Math.max(0, Math.floor((ahora - inicio) / 1000));
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  const horasCobradas = Math.max(1, Math.ceil(minutos / 60));
  const costo = horasCobradas * (valorHora || 0);
  return { minutos, segundos, horas, mins, costo };
}
