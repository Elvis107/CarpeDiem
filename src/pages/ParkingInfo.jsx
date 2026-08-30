import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../styles/ParkingInfo.css";

export default function ParkingInfo() {
    const navigate = useNavigate();

    const [espacios, setEspacios] = useState([]);
    const [cargandoEspacios, setCargandoEspacios] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    // Disponibilidad en tiempo real, igual que en el mapa del Dashboard:
    // se trae desde la tabla "espacios" y se actualiza vía canal realtime.
    useEffect(() => {
        const fetchEspacios = async () => {
            const { data, error } = await supabase
                .from("espacios")
                .select("*")
                .order("id_espacio");

            if (!error && data) setEspacios(data);
            setCargandoEspacios(false);
        };

        fetchEspacios();

        const channel = supabase
            .channel("parkinginfo-espacios-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "espacios" },
                (payload) => {
                    setEspacios((prev) =>
                        prev.map((e) =>
                            e.id_espacio === payload.new.id_espacio ? payload.new : e,
                        ),
                    );
                },
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const totalSpaces = espacios.length;
    const availableSpaces = espacios.filter((e) => e.estado === "disponible").length;
    const occupiedSpaces = espacios.filter((e) => e.estado === "ocupado").length;
    const reservedSpaces = espacios.filter((e) => e.estado === "reservado").length;

    const occupancyPercentage =
        totalSpaces > 0
            ? Math.round(((occupiedSpaces + reservedSpaces) / totalSpaces) * 100)
            : 0;

    const getEstadoColorClass = (estado) => {
        if (estado === "ocupado") return "cd-info__spot--ocupado";
        if (estado === "reservado") return "cd-info__spot--reservado";
        return "cd-info__spot--disponible";
    };

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
        });

        setMenuOpen(false);
    };

    return (
        <div className="cd-info bg-light min-vh-100">

            <nav className="cd-info__navbar navbar navbar-expand-lg sticky-top">
                <div className="container py-2">

                    <button
                        type="button"
                        className="navbar-brand d-flex align-items-center border-0 bg-transparent p-0"
                        onClick={() => scrollToSection("inicio")}
                    >
                        <div className="cd-info__brand-icon d-flex align-items-center justify-content-center me-2">
                            <Icon icon="mdi:parking" width="25" />
                        </div>

                        <div className="text-start">
                            <div className="fw-bold cd-info__brand-name">
                                CARPE DIEM
                            </div>

                            <small className="cd-info__brand-sub">
                                SMART PARKING
                            </small>
                        </div>
                    </button>

                    <button
                        type="button"
                        className="navbar-toggler border-0"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Abrir menú"
                        aria-expanded={menuOpen}
                    >
                        <Icon
                            icon={menuOpen ? "line-md:close" : "line-md:menu"}
                            width="28"
                        />
                    </button>

                    <div className={`navbar-collapse ${menuOpen ? "show" : ""}`}>
                        <ul className="navbar-nav mx-auto gap-lg-3">

                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="cd-info__nav-link nav-link border-0 bg-transparent"
                                    onClick={() => scrollToSection("inicio")}
                                >
                                    Inicio
                                </button>
                            </li>

                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="cd-info__nav-link nav-link border-0 bg-transparent"
                                    onClick={() => scrollToSection("disponibilidad")}
                                >
                                    Disponibilidad
                                </button>
                            </li>

                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="cd-info__nav-link nav-link border-0 bg-transparent"
                                    onClick={() => scrollToSection("tarifas")}
                                >
                                    Tarifas
                                </button>
                            </li>

                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="cd-info__nav-link nav-link border-0 bg-transparent"
                                    onClick={() => scrollToSection("ubicacion")}
                                >
                                    Ubicación
                                </button>
                            </li>

                        </ul>

                    </div>

                </div>
            </nav>

            <section id="inicio" className="cd-info__hero border-bottom">
                <div className="container py-5 py-lg-6">

                    <div className="row align-items-center g-5">

                        <div className="col-lg-7">

                            <div className="cd-info__pill-active d-inline-flex align-items-center px-3 py-2 mb-4">
                                <span className="cd-info__pill-dot me-2"></span>
                                <small className="fw-semibold">Sistema activo</small>
                            </div>

                            <h1 className="display-3 fw-bold cd-info__headline mb-4" style={{ lineHeight: "1.1" }}>
                                Estacionamiento{" "}
                                <span className="cd-info__accent-chip">simple, seguro y eficiente.</span>
                            </h1>

                            <p className="lead text-muted mb-4">
                                Administra tu estacionamiento de forma rápida y eficiente.
                                Consulta la disponibilidad de espacios, conoce nuestras
                                tarifas y accede al sistema de gestión.
                            </p>

                            <div className="d-flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className="cd-info__btn-outline btn btn-lg px-4 d-flex align-items-center gap-2"
                                    onClick={() => scrollToSection("disponibilidad")}
                                >
                                    <Icon icon="line-md:arrow-down" width="22" />
                                    Ver disponibilidad
                                </button>
                            </div>

                        </div>

                        <div className="col-lg-5">

                            <div className="cd-info__card card border-0">
                                <div className="card-body p-4 p-lg-5">

                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <h5 className="fw-bold mb-1">Disponibilidad</h5>
                                            <small className="text-muted">
                                                Estado actual del estacionamiento
                                            </small>
                                        </div>

                                        <div className="cd-info__icon-box cd-info__icon-box--green d-flex align-items-center justify-content-center">
                                            <Icon icon="mdi:parking" width="28" />
                                        </div>
                                    </div>

                                    <div className="text-center py-3">
                                        <div className="display-2 fw-bold cd-info__num--green">
                                            {cargandoEspacios ? "…" : availableSpaces}
                                        </div>
                                        <p className="text-muted mb-0">
                                            espacios disponibles de {cargandoEspacios ? "…" : totalSpaces}
                                        </p>
                                    </div>

                                    <div className="progress mt-4 mb-2" style={{ height: "10px" }}>
                                        <div
                                            className="cd-info__progress-fill progress-bar"
                                            role="progressbar"
                                            style={{ width: `${occupancyPercentage}%` }}
                                        ></div>
                                    </div>

                                    <div className="d-flex justify-content-between small text-muted">
                                        <span>Ocupación</span>
                                        <span className="fw-semibold">{occupancyPercentage}%</span>
                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>

                    <div className="row g-3 mt-5">

                        <div className="col-md-4">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="cd-info__icon-box cd-info__icon-box--black d-flex align-items-center justify-content-center me-3">
                                        <Icon icon="mdi:car-multiple" width="26" />
                                    </div>
                                    <div>
                                        <small className="text-muted">Capacidad</small>
                                        <h5 className="fw-bold mb-0">
                                            {cargandoEspacios ? "…" : totalSpaces} espacios totales
                                        </h5>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="cd-info__icon-box cd-info__icon-box--yellow d-flex align-items-center justify-content-center me-3">
                                        <Icon icon="mdi:clock-outline" width="26" />
                                    </div>
                                    <div>
                                        <small className="text-muted">Horario de atención</small>
                                        <h5 className="fw-bold mb-0">08:00 - 22:00 hrs</h5>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="cd-info__icon-box cd-info__icon-box--black d-flex align-items-center justify-content-center me-3">
                                        <Icon icon="mdi:map-marker" width="26" />
                                    </div>
                                    <div>
                                        <small className="text-muted">Ubicación</small>
                                        <h5 className="fw-bold mb-0">Granaderos 1667</h5>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            <section id="disponibilidad" className="py-5 py-lg-6">
                <div className="container">

                    <div className="text-center mb-5">
                        <span className="cd-info__eyebrow">Disponibilidad</span>
                        <h2 className="fw-bold mt-2">Consulta nuestros espacios</h2>
                        <p className="text-muted mx-auto" style={{ maxWidth: "650px" }}>
                            Revisa de manera rápida el estado actual del estacionamiento y
                            conoce cuántos espacios se encuentran disponibles.
                        </p>
                    </div>

                    <div className="row g-4">

                        <div className="col-md-3">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body p-4 text-center">
                                    <div className="cd-info__stat-circle cd-info__stat-circle--green mx-auto mb-3 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:parking" width="32" />
                                    </div>
                                    <h2 className="fw-bold cd-info__num--green">
                                        {cargandoEspacios ? "…" : availableSpaces}
                                    </h2>
                                    <h5 className="fw-semibold">Disponibles</h5>
                                    <p className="text-muted mb-0">Listos para estacionar.</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body p-4 text-center">
                                    <div className="cd-info__stat-circle cd-info__stat-circle--yellow mx-auto mb-3 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:bookmark-outline" width="32" />
                                    </div>
                                    <h2 className="fw-bold cd-info__num--yellow">
                                        {cargandoEspacios ? "…" : reservedSpaces}
                                    </h2>
                                    <h5 className="fw-semibold">Reservados</h5>
                                    <p className="text-muted mb-0">Con reserva activa.</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body p-4 text-center">
                                    <div className="cd-info__stat-circle cd-info__stat-circle--red mx-auto mb-3 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:car" width="32" />
                                    </div>
                                    <h2 className="fw-bold cd-info__num--red">
                                        {cargandoEspacios ? "…" : occupiedSpaces}
                                    </h2>
                                    <h5 className="fw-semibold">Ocupados</h5>
                                    <p className="text-muted mb-0">Vehículos estacionados.</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body p-4 text-center">
                                    <div className="cd-info__stat-circle cd-info__stat-circle--black mx-auto mb-3 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:car-multiple" width="32" />
                                    </div>
                                    <h2 className="fw-bold">
                                        {cargandoEspacios ? "…" : totalSpaces}
                                    </h2>
                                    <h5 className="fw-semibold">Capacidad total</h5>
                                    <p className="text-muted mb-0">Máximo del estacionamiento.</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="cd-info__card card border-0 mt-4">

                        <div className="card-header bg-white border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold mb-1">
                                        <Icon icon="mdi:view-grid-outline" className="cd-info__icon-yellow me-2" />
                                        Estado de los espacios
                                    </h5>
                                    <small className="text-muted">
                                        Representación visual de la disponibilidad
                                    </small>
                                </div>
                                <span className="cd-info__badge-live badge">En vivo</span>
                            </div>
                        </div>

                        <div className="card-body p-4">

                            <div className="d-flex flex-wrap gap-4 mb-4">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="cd-info__legend-dot cd-info__legend-dot--green"></span>
                                    <small className="text-muted">Disponible</small>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="cd-info__legend-dot cd-info__legend-dot--yellow"></span>
                                    <small className="text-muted">Reservado</small>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="cd-info__legend-dot cd-info__legend-dot--red"></span>
                                    <small className="text-muted">Ocupado</small>
                                </div>
                            </div>

                            {cargandoEspacios ? (
                                <p className="text-muted text-center py-4 mb-0">
                                    Cargando estado de los espacios...
                                </p>
                            ) : (
                                <div className="row row-cols-4 row-cols-sm-6 row-cols-md-8 g-2">
                                    {espacios.map((e) => (
                                        <div className="col" key={e.id_espacio}>
                                            <div className={`cd-info__spot text-center ${getEstadoColorClass(e.estado)}`}>
                                                <Icon icon="mdi:car" width="20" />
                                                <div className="small fw-semibold mt-1">
                                                    {e.id_espacio}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                    </div>

                </div>
            </section>

            <section className="cd-info__section-alt border-top border-bottom py-5 py-lg-6">
                <div className="container">

                    <div className="text-center mb-5">
                        <span className="cd-info__eyebrow">El estacionamiento Carpe Diem ofrece:</span>
                        <h2 className="fw-bold mt-2">Una experiencia pensada para ti</h2>
                    </div>

                    <div className="row g-4">

                        <div className="col-md-4">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body p-4">
                                    <div className="cd-info__icon-box cd-info__icon-box--black mb-4 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:shield-check-outline" width="30" />
                                    </div>
                                    <h5 className="fw-bold">Seguridad</h5>
                                    <p className="text-muted mb-0">
                                        Control y registro de los vehículos que ingresan y salen
                                        del estacionamiento para brindar seguridad durante su
                                        estadía.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body p-4">
                                    <div className="cd-info__icon-box cd-info__icon-box--yellow mb-4 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:clock-fast" width="30" />
                                    </div>
                                    <h5 className="fw-bold">Rapidez</h5>
                                    <p className="text-muted mb-0">
                                        Procesos de entrada y salida ágiles para reducir los
                                        tiempos de espera.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="cd-info__card card border-0 h-100">
                                <div className="card-body p-4">
                                    <div className="cd-info__icon-box cd-info__icon-box--black mb-4 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:thumb-up-outline" width="30" />
                                    </div>
                                    <h5 className="fw-bold">Fácil y práctico</h5>
                                    <p className="text-muted mb-0">
                                        Un proceso sencillo y cómodo para estacionar tu vehículo
                                        sin complicaciones.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            <section id="tarifas" className="py-5 py-lg-6">
                <div className="container">

                    <div className="text-center mb-5">
                        <span className="cd-info__eyebrow">Tarifas</span>
                        <h2 className="fw-bold mt-2">Precios simples y transparentes</h2>
                        <p className="text-muted">
                            Conoce nuestras tarifas según el tipo de vehículo.
                        </p>
                    </div>

                    <div className="row justify-content-center g-4">

                        <div className="col-md-4">
                            <div className="cd-info__card cd-info__price-card card border-0 h-100">
                                <div className="card-body p-4 p-lg-5">

                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <span className="cd-info__cat-badge mb-2">Categoría A</span>
                                            <h4 className="fw-bold">City cars y motos</h4>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Icon icon="mdi:car-outline" width="30" className="cd-info__icon-black" />
                                            <Icon icon="mdi:motorbike" width="30" className="cd-info__icon-black" />
                                        </div>
                                    </div>

                                    <p className="text-muted">
                                        Autos pequeños, hatchbacks y motocicletas.
                                    </p>

                                    <div className="my-4">
                                        <span className="display-6 fw-bold">$1.400</span>
                                        <span className="text-muted"> / hora</span>
                                    </div>

                                    <hr />

                                    <div className="d-flex align-items-center mb-2">
                                        <Icon icon="line-md:confirm" className="cd-info__icon-yellow me-2" />
                                        <span>Mínimo $700 (30 min)</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <Icon icon="line-md:confirm" className="cd-info__icon-yellow me-2" />
                                        <span>Espacio estándar</span>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="cd-info__card cd-info__price-card card border-0 h-100">
                                <div className="card-body p-4 p-lg-5">

                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <span className="cd-info__cat-badge mb-2">Categoría B</span>
                                            <h4 className="fw-bold">Tarifa normal</h4>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Icon icon="mdi:car-side" width="30" className="cd-info__icon-black" />
                                        </div>
                                    </div>

                                    <p className="text-muted">
                                        Automóviles particulares y sedanes.
                                    </p>

                                    <div className="my-4">
                                        <span className="display-6 fw-bold">$1.450</span>
                                        <span className="text-muted"> / hora</span>
                                    </div>

                                    <hr />

                                    <div className="d-flex align-items-center mb-2">
                                        <Icon icon="line-md:confirm" className="cd-info__icon-yellow me-2" />
                                        <span>Mínimo $750 (30 min)</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <Icon icon="line-md:confirm" className="cd-info__icon-yellow me-2" />
                                        <span>Espacio estándar</span>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="cd-info__card cd-info__price-card card border-0 h-100">
                                <div className="card-body p-4 p-lg-5">

                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <span className="cd-info__cat-badge mb-2">Categoría C</span>
                                            <h4 className="fw-bold">Camionetas de empresa</h4>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Icon icon="mdi:pickup-truck" width="30" className="cd-info__icon-black" />
                                        </div>
                                    </div>

                                    <p className="text-muted">
                                        Camionetas, furgones y vehículos de empresa.
                                    </p>

                                    <div className="my-4">
                                        <span className="display-6 fw-bold">$1.650</span>
                                        <span className="text-muted"> / hora</span>
                                    </div>

                                    <hr />

                                    <div className="d-flex align-items-center mb-2">
                                        <Icon icon="line-md:confirm" className="cd-info__icon-yellow me-2" />
                                        <span>Mínimo $1.000 (30 min)</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <Icon icon="line-md:confirm" className="cd-info__icon-yellow me-2" />
                                        <span>Espacios de mayor tamaño</span>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            <section id="ubicacion" className="cd-info__section-alt border-top py-5 py-lg-6">
                <div className="container">

                    <div className="row align-items-center g-5">

                        <div className="col-lg-6">

                            <span className="cd-info__eyebrow">Ubicación</span>
                            <h2 className="fw-bold mt-2 mb-4">Encuéntranos fácilmente</h2>

                            <p className="text-muted">
                                Estamos ubicados en una zona estratégica de la ciudad,
                                permitiendo un acceso rápido y cómodo.
                            </p>

                            <div className="mt-4">

                                <div className="d-flex align-items-start mb-4">
                                    <div className="cd-info__icon-box cd-info__icon-box--black me-3 flex-shrink-0 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:map-marker" width="25" />
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-1">Dirección</h6>
                                        <p className="text-muted mb-0">Granaderos 1667, Calama</p>
                                    </div>
                                </div>

                                <div className="d-flex align-items-start mb-4">
                                    <div className="cd-info__icon-box cd-info__icon-box--yellow me-3 flex-shrink-0 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:clock-outline" width="25" />
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-1">Horario</h6>
                                        <p className="text-muted mb-0">
                                            Lunes a Sábado · 08:00 - 22:00 hrs
                                        </p>
                                        <p className="text-muted mb-0">Domingo: Cerrado</p>
                                    </div>
                                </div>

                                <div className="d-flex align-items-start">
                                    <div className="cd-info__icon-box cd-info__icon-box--black me-3 flex-shrink-0 d-flex align-items-center justify-content-center">
                                        <Icon icon="mdi:phone" width="25" />
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-1">Atención</h6>
                                        <p className="text-muted mb-0">
                                            Atención para consultas y reservas.
                                        </p>
                                    </div>
                                </div>

                            </div>

                        </div>

                        <div className="col-lg-6">
                            <div className="cd-info__card card border-0 overflow-hidden" style={{ height: "400px" }}>
                                <iframe
                                    title="Ubicación Carpe Diem"
                                    src="https://www.google.com/maps?q=Granaderos+1667,+Calama,+Chile&output=embed"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            <footer className="cd-info__footer pt-5 pb-4">
                <div className="container">

                    <div className="row align-items-center">

                        <div className="col-lg-7 col-md-7">
                            <div className="d-flex align-items-center mb-3">
                                <div className="cd-info__footer-icon d-flex align-items-center justify-content-center me-3">
                                    <Icon icon="mdi:parking" width="28" height="28" />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-0">CARPE DIEM</h5>
                                    <small className="cd-info__footer-sub">Smart Parking System</small>
                                </div>
                            </div>
                            <p className="cd-info__footer-text small mb-0 pe-lg-5">
                                Una experiencia de estacionamiento más segura, rápida y
                                sencilla para todos nuestros clientes.
                            </p>
                        </div>

                        <div className="col-lg-5 col-md-5 mt-4 mt-md-0 text-md-end">
                            <h6 className="fw-bold mb-2">Administración</h6>
                            <p className="cd-info__footer-text small mb-3">
                                Acceso exclusivo para la gestión interna del estacionamiento.
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="cd-info__admin-btn btn d-inline-flex align-items-center px-3 py-2"
                            >
                                <Icon icon="mdi:shield-lock-outline" width="18" className="me-2" />
                                Acceso administrativo
                                <Icon icon="line-md:arrow-right" width="18" className="ms-2" />
                            </button>
                        </div>

                    </div>

                    <hr className="cd-info__footer-hr my-4" />

                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <p className="cd-info__footer-text small mb-0">
                                © {new Date().getFullYear()} CARPE DIEM. Todos los derechos reservados.
                            </p>
                        </div>
                        <div className="col-md-6 text-md-end mt-2 mt-md-0">
                            <span className="cd-info__footer-text small">Smart Parking System</span>
                        </div>
                    </div>

                </div>
            </footer>

        </div>
    );
}