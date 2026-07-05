// Regla de cobro: hora completa o fracción (mínimo 1 hora).
// Si prefieres cobrar por minuto exacto, cambia horasCobradas por (minutos / 60).
export function calcularTiempoYCosto(fechaIngreso, horaIngreso, valorHora) {
  const inicio = new Date(`${fechaIngreso}T${horaIngreso}`);
  const ahora = new Date();
  const segundosTotales = Math.max(0, Math.floor((ahora - inicio) / 1000));
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  const horasCobradas = Math.max(1, Math.ceil(minutos / 60));
  const costo = horasCobradas * (valorHora || 0);
  return { minutos, segundos, horas, mins, costo };
}
