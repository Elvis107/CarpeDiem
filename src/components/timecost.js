// ============================================================
// CONSTRUCCIÓN DE FECHA LOCAL
// ============================================================

function construirFechaLocal(fechaIngreso, horaIngreso) {
  if (!fechaIngreso || !horaIngreso) {
    return new Date(NaN);
  }

  const [anio, mes, dia] = String(fechaIngreso)
    .split("-")
    .map(Number);

  const [hora, minuto, segundo = 0] = String(horaIngreso)
    .split(":")
    .map(Number);

  return new Date(
    anio,
    mes - 1,
    dia,
    hora,
    minuto,
    segundo,
  );
}


// ============================================================
// CÁLCULO DE TIEMPO Y COSTO
// ============================================================
//
// Regla de cobro:
//
// - Primeros 30 minutos = valor_media_hora
// - Cada bloque adicional de 30 minutos:
//      valor_hora - valor_media_hora
//
// Ejemplo Normal:
// valor_hora       = 1450
// valor_media_hora = 750
//
// 30 min  = 750
// 60 min  = 1450
// 90 min  = 2150
// 120 min = 2850
//
// Para motocicleta:
// valor_hora       = 1400
// valor_media_hora = 700
//
// 30 min  = 700
// 60 min  = 1400
// 90 min  = 2100
// 120 min = 2800
//
// ============================================================

export function calcularTiempoYCosto(
  fechaIngreso,
  horaIngreso,
  valorHora,
  valorMediaHora,
) {
  const inicio = construirFechaLocal(
    fechaIngreso,
    horaIngreso,
  );

  const ahora = new Date();


  if (Number.isNaN(inicio.getTime())) {
    return {
      minutos: 0,
      segundos: 0,
      horas: 0,
      mins: 0,
      costo: 0,
    };
  }

  if (inicio > ahora) {
    inicio.setDate(inicio.getDate() - 1);
  }


  const segundosTotales = Math.max(
    0,
    Math.floor((ahora - inicio) / 1000),
  );

  const minutos = Math.floor(
    segundosTotales / 60,
  );

  const segundos = segundosTotales % 60;

  const horas = Math.floor(
    minutos / 60,
  );

  const mins = minutos % 60;


  const hora = Number(valorHora) || 0;
  const mediaHora = Number(valorMediaHora) || 0;

  let costo = 0;

  if (hora > 0 && mediaHora > 0) {

    const bloques = Math.max(
      1,
      Math.ceil(minutos / 30),
    );


    const valorBloqueAdicional =
      hora - mediaHora;

    costo =
      mediaHora +
      Math.max(0, bloques - 1) *
      valorBloqueAdicional;

  } else if (hora > 0) {
    const horasCobradas = Math.max(
      1,
      Math.ceil(minutos / 60),
    );

    costo = horasCobradas * hora;
  }

  return {
    minutos,
    segundos,
    horas,
    mins,
    costo,
  };
}