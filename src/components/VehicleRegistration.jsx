import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";

const CATEGORIAS = [
  {
    nombre: "Beneficiado",
    valor: "beneficiado",
    icono: "mdi:car-select",
    color: "success",
  },
  {
    nombre: "Normal",
    valor: "normal",
    icono: "mdi:car-outline",
    color: "primary",
  },
  {
    nombre: "Grande",
    valor: "grande",
    icono: "mdi:car-estate",
    color: "warning",
  },
  {
    nombre: "Motocicleta",
    valor: "motocicleta",
    icono: "mdi:motorbike",
    color: "info",
  },
];

const LISTAS_VACIAS = {
  beneficiado: [],
  normal: [],
  grande: [],
  motocicleta: [],
};

export default function Statistics({ onClose }) {
  const [patente, setPatente] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("beneficiado");

  const [vehiculos, setVehiculos] = useState(LISTAS_VACIAS);
  const [categoriasDB, setCategoriasDB] = useState({});
  const [seccionAbierta, setSeccionAbierta] = useState(null);

  const [loading, setLoading] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Estado de la ventana de edición.
  const [modalAbierto, setModalAbierto] = useState(false);
  const [patenteOriginal, setPatenteOriginal] = useState("");
  const [patenteEditada, setPatenteEditada] = useState("");
  const [categoriaEditada, setCategoriaEditada] =
    useState("beneficiado");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");
  const [mensajeEdicion, setMensajeEdicion] = useState("");

  // se encarga de ocultar el mensaje de exito de registro despues de 2 segundos.
  useEffect(() => {
    if (!mensaje) return;

    const temporizador = setTimeout(() => {
      setMensaje("");
    }, 2000);

    return () => clearTimeout(temporizador);
  }, [mensaje]);

  useEffect(() => {
    if (!mensajeEdicion) return;

    const temporizador = setTimeout(() => {
      setMensajeEdicion("");
    }, 2000);

    return () => clearTimeout(temporizador);
  }, [mensajeEdicion]);

  // formato que debe tener la patente de BC-DF-12.
  const formatearPatente = (valor) => {
    const limpio = valor
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 6);

    let resultado = "";

    for (let i = 0; i < limpio.length; i++) {
      if (i === 2 || i === 4) {
        resultado += "-";
      }

      resultado += limpio[i];
    }

    return resultado;
  };

  // se encarga de validar el formato que tien la petente.
  const validarPatente = (valor) =>
    /^[B-DF-HJ-NP-TV-Z]{2}-[B-DF-HJ-NP-TV-Z]{2}-[0-9]{2}$/.test(
      valor,
    );

  // se encarga de cargar las categorias desde supabase.
  const cargarCategorias = async () => {
    const { data, error: errorCategorias } = await supabase
      .from("categoria_vehiculo")
      .select("id_categoria, nombre_categoria");

    if (errorCategorias) {
      throw new Error(
        `Error al cargar categorías: ${errorCategorias.message}`,
      );
    }

    const mapa = {};

    (data || []).forEach((categoria) => {
      const nombre = String(categoria.nombre_categoria || "")
        .trim()
        .toLowerCase();

      mapa[nombre] = categoria.id_categoria;
    });

    const faltantes = CATEGORIAS.filter(
      (categoria) =>
        mapa[categoria.nombre.toLowerCase()] == null,
    );

    if (faltantes.length > 0) {
      throw new Error(
        `No se encontraron estas categorías en Supabase: ${faltantes
          .map((categoria) => categoria.nombre)
          .join(", ")}.`,
      );
    }

    setCategoriasDB(mapa);
    return mapa;
  };

  // se encarga de cargar y distribuir los vehiculos por cada categoría monstrando su informacion.
  const cargarVehiculos = async (mapaRecibido) => {
    let mapa = mapaRecibido || categoriasDB;

    if (Object.keys(mapa).length === 0) {
      mapa = await cargarCategorias();
    }

    const { data, error: errorVehiculos } = await supabase
      .from("vehiculo")
      .select("patente, id_categoria")
      .order("patente", { ascending: true });

    if (errorVehiculos) {
      throw new Error(
        `Error al cargar vehículos: ${errorVehiculos.message}`,
      );
    }

    const listas = {
      beneficiado: [],
      normal: [],
      grande: [],
      motocicleta: [],
    };

    const categoriaPorId = new Map(
      Object.entries(mapa).map(([nombre, id]) => [
        String(id),
        nombre,
      ]),
    );

    (data || []).forEach((vehiculo) => {
      const nombreCategoria = categoriaPorId.get(
        String(vehiculo.id_categoria),
      );

      const categoria = CATEGORIAS.find(
        (item) =>
          item.nombre.toLowerCase() === nombreCategoria,
      );

      if (categoria) {
        listas[categoria.valor].push(vehiculo);
      }
    });

    setVehiculos(listas);
  };

  // se encarga de actualizar informacion del panel.
  const cargarDatos = async () => {
    setCargandoLista(true);
    setError("");

    try {
      const mapa = await cargarCategorias();
      await cargarVehiculos(mapa);
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      setError(
        err.message || "No se pudieron cargar los vehículos.",
      );
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // registra una patente nueva.
  const registrarVehiculo = async (e) => {
    e.preventDefault();

    setError("");
    setMensaje("");

    const patenteLimpia = patente.trim().toUpperCase();

    if (!validarPatente(patenteLimpia)) {
      setError(
        "La patente debe tener el formato BC-DF-12, con cuatro consonantes y dos números.",
      );
      return;
    }

    setLoading(true);

    try {
      let mapa = categoriasDB;

      if (Object.keys(mapa).length === 0) {
        mapa = await cargarCategorias();
      }

      const categoria = CATEGORIAS.find(
        (item) => item.valor === categoriaSeleccionada,
      );

      if (!categoria) {
        throw new Error("Selecciona una categoría válida.");
      }

      const idCategoria = mapa[categoria.nombre.toLowerCase()];

      if (idCategoria == null) {
        throw new Error(
          `No se encontró la categoría ${categoria.nombre} en Supabase.`,
        );
      }

      // se encarga de comprobar si la patente ya se encuentra registrada.
      const { data: existente, error: errorBusqueda } =
        await supabase
          .from("vehiculo")
          .select("patente, id_categoria")
          .eq("patente", patenteLimpia)
          .maybeSingle();

      if (errorBusqueda) {
        throw new Error(errorBusqueda.message);
      }

      if (existente) {
        const categoriaExistente = CATEGORIAS.find(
          (item) =>
            String(mapa[item.nombre.toLowerCase()]) ===
            String(existente.id_categoria),
        );

        if (
          String(existente.id_categoria) === String(idCategoria)
        ) {
          setMensaje(
            `La patente ${patenteLimpia} ya está registrada como ${categoria.nombre}.`,
          );
        } else {
          setError(
            `La patente ${patenteLimpia} ya está registrada como ${
              categoriaExistente?.nombre || "otra categoría"
            }. No se modificó su registro.`,
          );
        }

        return;
      }

      // insertar el nuevo vehículo.
      const { error: errorInsert } = await supabase
        .from("vehiculo")
        .insert({
          patente: patenteLimpia,
          id_categoria: idCategoria,
        });

      if (errorInsert) {
        throw new Error(errorInsert.message);
      }

      setPatente("");
      setMensaje(
        `La patente ${patenteLimpia} se registró correctamente como ${categoria.nombre}.`,
      );

      await cargarVehiculos(mapa);
    } catch (err) {
      console.error("Error registrando vehículo:", err);
      setError(
        err.message || "No se pudo registrar el vehículo.",
      );
    } finally {
      setLoading(false);
    }
  };

  // se encarga de abrir una ventana emergente para editar el vehiculo seleccionado.
  const abrirEdicion = (vehiculo, categoria) => {
    setPatenteOriginal(vehiculo.patente);
    setPatenteEditada(vehiculo.patente);
    setCategoriaEditada(categoria.valor);

    setErrorEdicion("");
    setMensajeEdicion("");
    setModalAbierto(true);
  };

  // se encarga de cerrar y limpiar la ventana emergente.
  const cerrarEdicion = () => {
    if (guardandoEdicion) return;

    setModalAbierto(false);
    setPatenteOriginal("");
    setPatenteEditada("");
    setCategoriaEditada("beneficiado");
    setErrorEdicion("");
    setMensajeEdicion("");
  };

  // guarda los cambios que se realizaron en la edicion.
  const guardarEdicion = async (e) => {
    e.preventDefault();

    setErrorEdicion("");
    setMensajeEdicion("");

    const patenteNueva = patenteEditada.trim().toUpperCase();

    if (!validarPatente(patenteNueva)) {
      setErrorEdicion(
        "La patente debe tener el formato BC-DF-12, con cuatro consonantes y dos números.",
      );
      return;
    }

    const categoria = CATEGORIAS.find(
      (item) => item.valor === categoriaEditada,
    );

    if (!categoria) {
      setErrorEdicion("Selecciona una categoría válida.");
      return;
    }

    setGuardandoEdicion(true);

    try {
      let mapa = categoriasDB;

      if (Object.keys(mapa).length === 0) {
        mapa = await cargarCategorias();
      }

      const idCategoria = mapa[categoria.nombre.toLowerCase()];

      if (idCategoria == null) {
        throw new Error(
          `No se encontró la categoría ${categoria.nombre} en Supabase.`,
        );
      }

      // verifica si la nueva patente pertenece a otro vehiculo.
      const { data: existente, error: errorBusqueda } =
        await supabase
          .from("vehiculo")
          .select("patente")
          .eq("patente", patenteNueva)
          .maybeSingle();

      if (errorBusqueda) {
        throw new Error(errorBusqueda.message);
      }

      if (
        existente &&
        existente.patente !== patenteOriginal
      ) {
        throw new Error(
          `La patente ${patenteNueva} ya está registrada en otro vehículo.`,
        );
      }

      // se encarga de actualizar la patente y categoría.
      const { data, error: errorActualizacion } = await supabase
        .from("vehiculo")
        .update({
          patente: patenteNueva,
          id_categoria: idCategoria,
        })
        .eq("patente", patenteOriginal)
        .select("patente, id_categoria");

      if (errorActualizacion) {
        throw new Error(
          `No se pudieron guardar los cambios. ${errorActualizacion.message}`,
        );
      }

      if (!data || data.length === 0) {
        throw new Error(
          "No se actualizó el vehículo. Comprueba los permisos de Supabase.",
        );
      }

      await cargarVehiculos(mapa);

      setSeccionAbierta(categoriaEditada);
      setModalAbierto(false);

      setMensajeEdicion("");
      setMensaje(
        `La patente ${patenteNueva} se actualizó correctamente.`,
      );

      setPatenteOriginal("");
      setPatenteEditada("");
    } catch (err) {
      console.error("Error editando vehículo:", err);
      setErrorEdicion(
        err.message || "No se pudo actualizar el vehículo.",
      );
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // se encarga de abrir o cerrar una lista de vehículos.
  const alternarSeccion = (valor) => {
    setSeccionAbierta((actual) =>
      actual === valor ? null : valor,
    );
  };

  const categoriaActual = CATEGORIAS.find(
    (item) => item.valor === categoriaSeleccionada,
  );

  const categoriaModalActual = CATEGORIAS.find(
    (item) => item.valor === categoriaEditada,
  );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="mb-2">Registro de vehículos</h2>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="mb-3">
            <Icon icon="mdi:car-plus" className="me-2" />
            Registrar patente
          </h5>

          <form onSubmit={registrarVehiculo}>
            <div className="mb-3">
              <label className="form-label d-block mb-2">
                Categoría del vehículo
              </label>

              <div className="row g-2">
                {CATEGORIAS.map((categoria) => {
                  const seleccionada =
                    categoriaSeleccionada === categoria.valor;

                  return (
                    <div
                      className="col-6 col-md-3"
                      key={categoria.valor}
                    >
                      <button
                        type="button"
                        className={`btn w-100 d-flex align-items-center justify-content-center gap-2 py-2 px-2 ${
                          seleccionada
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => {
                          setCategoriaSeleccionada(categoria.valor);
                          setError("");
                          setMensaje("");
                        }}
                        aria-pressed={seleccionada}
                      >
                        <Icon
                          icon={categoria.icono}
                          className="fs-5 flex-shrink-0"
                        />

                        <span className="small fw-semibold">
                          {categoria.nombre}
                        </span>

                        {seleccionada && (
                          <Icon
                            icon="mdi:check-circle"
                            className="small flex-shrink-0"
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-3">
              <label
                htmlFor="patenteVehiculo"
                className="form-label"
              >
                Patente del vehículo
              </label>

              <input
                id="patenteVehiculo"
                type="text"
                className="form-control"
                placeholder="BC-DF-12"
                value={patente}
                onChange={(e) => {
                  setPatente(formatearPatente(e.target.value));
                  setError("");
                  setMensaje("");
                }}
                maxLength={8}
                autoComplete="off"
                required
              />
            </div>

            {error && (
              <div
                className="alert alert-danger d-flex align-items-start gap-2"
                role="alert"
              >
                <Icon
                  icon="mdi:alert-circle-outline"
                  className="fs-5 flex-shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            {mensaje && (
              <div
                className="alert alert-success d-flex align-items-start gap-2"
                role="status"
                aria-live="polite"
              >
                <Icon
                  icon="mdi:check-circle-outline"
                  className="fs-5 flex-shrink-0"
                />
                <span>{mensaje}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              disabled={loading || patente.length !== 8}
            >
              <Icon icon="mdi:content-save-outline" />

              {loading
                ? "Registrando..."
                : `Registrar ${categoriaActual?.nombre.toLowerCase()}`}
            </button>
          </form>
        </div>
      </div>

      <div className="d-flex flex-column gap-3">
        {CATEGORIAS.map((categoria) => {
          const abierta = seccionAbierta === categoria.valor;
          const lista = vehiculos[categoria.valor] || [];

          return (
            <div
              className="card border-0 shadow-sm"
              key={categoria.valor}
            >
              <button
                type="button"
                className="card-header bg-white border-0 p-3 d-flex align-items-center justify-content-between gap-3 text-start"
                onClick={() => alternarSeccion(categoria.valor)}
                aria-expanded={abierta}
              >
                <div className="d-flex align-items-center gap-3">
                  <Icon
                    icon={categoria.icono}
                    className={`fs-4 text-${categoria.color}`}
                  />

                  <div>
                    <div className="fw-semibold">
                      Vehículos {categoria.nombre.toLowerCase()}
                    </div>

                    <small className="text-secondary">
                      {lista.length} patentes registradas
                    </small>
                  </div>
                </div>

                <Icon
                  icon={
                    abierta
                      ? "mdi:chevron-up"
                      : "mdi:chevron-down"
                  }
                  className="fs-4"
                />
              </button>

              {abierta && (
                <div className="card-body p-3">
                  {cargandoLista ? (
                    <div className="text-center py-4">
                      <Icon
                        icon="mdi:loading"
                        className="fs-3"
                      />
                      <p className="mb-0 mt-2">
                        Cargando vehículos...
                      </p>
                    </div>
                  ) : lista.length === 0 ? (
                    <div className="text-center text-secondary py-4">
                      <Icon
                        icon="mdi:car-off"
                        className="fs-1 mb-2"
                      />

                      <p className="mb-0">
                        No hay vehículos registrados en esta categoría.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Patente</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>

                        <tbody>
                          {lista.map((vehiculo) => (
                            <tr key={vehiculo.patente}>
                              <td className="fw-semibold">
                                <Icon
                                  icon={
                                    categoria.valor === "motocicleta"
                                      ? "mdi:motorbike"
                                      : "mdi:car-outline"
                                  }
                                  className="me-2"
                                />

                                {vehiculo.patente}
                              </td>

                              <td>{categoria.nombre}</td>

                              <td>
                                <span
                                  className={`badge bg-${categoria.color}`}
                                >
                                  Registrado
                                </span>
                              </td>

                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                                  onClick={() =>
                                    abrirEdicion(vehiculo, categoria)
                                  }
                                  title="Editar vehículo"
                                >
                                  <Icon icon="mdi:pencil-outline" />
                                  Editar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalAbierto && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1055,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarEdicion();
            }
          }}
        >
          <div
            className="card border-0 shadow-lg w-100"
            style={{
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "14px",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloEditarVehiculo">
              
            <div className="card-header bg-white border-0 d-flex align-items-center justify-content-between p-4 pb-2">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary"
                  style={{ width: "46px", height: "46px" }}
                >
                  <Icon
                    icon="mdi:car-edit"
                    style={{ fontSize: "26px" }}
                  />
                </div>

                <div>
                  <h5
                    id="tituloEditarVehiculo"
                    className="mb-1"
                  >
                    Editar vehículo
                  </h5>

                  <small className="text-secondary">
                    Modifica la patente o su categoría
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={cerrarEdicion}
                disabled={guardandoEdicion}
                aria-label="Cerrar ventana"
              />
            </div>

            <div className="card-body p-4">
              <form onSubmit={guardarEdicion}>
                <div className="mb-3">
                  <label
                    htmlFor="patenteEditada"
                    className="form-label fw-semibold"
                  >
                    Patente del vehículo
                  </label>

                  <input
                    id="patenteEditada"
                    type="text"
                    className="form-control"
                    placeholder="BC-DF-12"
                    value={patenteEditada}
                    onChange={(e) => {
                      setPatenteEditada(
                        formatearPatente(e.target.value),
                      );
                      setErrorEdicion("");
                      setMensajeEdicion("");
                    }}
                    maxLength={8}
                    autoComplete="off"
                    required
                    autoFocus
                  />

                  <small className="text-secondary">
                    Patente original: {patenteOriginal}
                  </small>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Categoría del vehículo
                  </label>

                  <div className="row g-2">
                    {CATEGORIAS.map((categoria) => {
                      const seleccionada =
                        categoriaEditada === categoria.valor;

                      return (
                        <div
                          className="col-6"
                          key={categoria.valor}
                        >
                          <button
                            type="button"
                            className={`btn w-100 d-flex align-items-center justify-content-center gap-2 py-3 ${
                              seleccionada
                                ? "btn-primary"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() => {
                              setCategoriaEditada(categoria.valor);
                              setErrorEdicion("");
                              setMensajeEdicion("");
                            }}
                            aria-pressed={seleccionada}
                          >
                            <Icon
                              icon={categoria.icono}
                              className="fs-5"
                            />

                            <span className="small fw-semibold">
                              {categoria.nombre}
                            </span>

                            {seleccionada && (
                              <Icon icon="mdi:check-circle" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {errorEdicion && (
                  <div
                    className="alert alert-danger d-flex align-items-start gap-2"
                    role="alert"
                  >
                    <Icon
                      icon="mdi:alert-circle-outline"
                      className="fs-5 flex-shrink-0"
                    />
                    <span>{errorEdicion}</span>
                  </div>
                )}

                {mensajeEdicion && (
                  <div
                    className="alert alert-success"
                    role="status"
                  >
                    {mensajeEdicion}
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={cerrarEdicion}
                    disabled={guardandoEdicion}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary d-inline-flex align-items-center gap-2"
                    disabled={
                      guardandoEdicion ||
                      patenteEditada.length !== 8 ||
                      !categoriaModalActual
                    }
                  >
                    <Icon
                      icon={
                        guardandoEdicion
                          ? "mdi:loading"
                          : "mdi:content-save-outline"
                      }
                    />

                    {guardandoEdicion
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}