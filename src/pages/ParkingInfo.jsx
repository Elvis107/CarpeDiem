import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";

export default function ParkingInfo() {
    const navigate = useNavigate();

    const [availableSpaces, setAvailableSpaces] = useState(32);
    const [menuOpen, setMenuOpen] = useState(false);

    const totalSpaces = 32;
    const occupiedSpaces = totalSpaces - availableSpaces;

    const occupancyPercentage =
        totalSpaces > 0
            ? Math.round((occupiedSpaces / totalSpaces) * 100)
            : 0;

    useEffect(() => {
        const loadAvailability = async () => {
            try {
            } catch (error) {
                console.error(
                    "Error al obtener disponibilidad:",
                    error
                );
            }
        };

        loadAvailability();
    }, []);

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
        });

        setMenuOpen(false);
    };

    return (
        <div className="bg-light min-vh-100">

            <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
                <div className="container py-2">

                    <button
                        type="button"
                        className="navbar-brand d-flex align-items-center border-0 bg-transparent p-0"
                        onClick={() => scrollToSection("inicio")}
                    >
                        <div
                            className="d-flex align-items-center justify-content-center bg-success rounded-3 me-2"
                            style={{
                                width: "42px",
                                height: "42px",
                            }}
                        >
                            <Icon
                                icon="mdi:parking"
                                width="25"
                                className="text-white"
                            />
                        </div>

                        <div className="text-start">
                            <div className="fw-bold text-dark">
                                CARPE DIEM
                            </div>

                            <small
                                className="text-muted"
                                style={{
                                    fontSize: "0.65rem",
                                }}
                            >
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
                            icon={
                                menuOpen
                                    ? "line-md:close"
                                    : "line-md:menu"
                            }
                            width="28"
                        />
                    </button>

                    <div
                        className={`navbar-collapse ${
                            menuOpen ? "show" : ""
                        }`}
                    >
                        <ul className="navbar-nav mx-auto gap-lg-3">

                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="nav-link border-0 bg-transparent"
                                    onClick={() =>
                                        scrollToSection("inicio")
                                    }
                                >
                                    Inicio
                                </button>
                            </li>

                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="nav-link border-0 bg-transparent"
                                    onClick={() =>
                                        scrollToSection(
                                            "disponibilidad"
                                        )
                                    }
                                >
                                    Disponibilidad
                                </button>
                            </li>

                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="nav-link border-0 bg-transparent"
                                    onClick={() =>
                                        scrollToSection("tarifas")
                                    }
                                >
                                    Tarifas
                                </button>
                            </li>

                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="nav-link border-0 bg-transparent"
                                    onClick={() =>
                                        scrollToSection("ubicacion")
                                    }
                                >
                                    Ubicación
                                </button>
                            </li>

                        </ul>

                    </div>

                </div>
            </nav>

            <section
                id="inicio"
                className="bg-white border-bottom"
            >
                <div className="container py-5 py-lg-6">

                    <div className="row align-items-center g-5">

                        <div className="col-lg-7">

                            <div className="d-inline-flex align-items-center bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 mb-4">

                                <span
                                    className="bg-success rounded-circle me-2"
                                    style={{
                                        width: "8px",
                                        height: "8px",
                                    }}
                                ></span>

                                <small className="fw-semibold">
                                    Sistema activo
                                </small>

                            </div>

                            <h1
                                className="display-3 fw-bold text-dark mb-4"
                                style={{
                                    lineHeight: "1.1",
                                }}
                            >
                                Estacionamiento
                                <span className="text-success">
                                    {" "}
                                    simple, seguro y eficiente.
                                </span>
                            </h1>

                            <p className="lead text-muted mb-4">
                                Administra tu estacionamiento de forma
                                rápida y eficiente. Consulta la
                                disponibilidad de espacios, conoce
                                nuestras tarifas y accede al sistema
                                de gestión.
                            </p>

                            <div className="d-flex flex-wrap gap-3">

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-lg px-4 d-flex align-items-center gap-2"
                                    onClick={() =>
                                        scrollToSection(
                                            "disponibilidad"
                                        )
                                    }
                                >
                                    <Icon
                                        icon="line-md:arrow-down"
                                        width="22"
                                    />

                                    Ver disponibilidad
                                </button>

                            </div>

                        </div>

                        <div className="col-lg-5">

                            <div className="card border-0 shadow-sm">

                                <div className="card-body p-4 p-lg-5">

                                    <div className="d-flex justify-content-between align-items-center mb-4">

                                        <div>
                                            <h5 className="fw-bold mb-1">
                                                Disponibilidad
                                            </h5>

                                            <small className="text-muted">
                                                Estado actual del
                                                estacionamiento
                                            </small>
                                        </div>

                                        <div
                                            className="d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-3"
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                            }}
                                        >
                                            <Icon
                                                icon="mdi:parking"
                                                width="28"
                                                className="text-success"
                                            />
                                        </div>

                                    </div>

                                    <div className="text-center py-3">

                                        <div className="display-2 fw-bold text-success">
                                            {availableSpaces}
                                        </div>

                                        <p className="text-muted mb-0">
                                            espacios disponibles de{" "}
                                            {totalSpaces}
                                        </p>

                                    </div>

                                    <div
                                        className="progress mt-4 mb-2"
                                        style={{
                                            height: "10px",
                                        }}
                                    >
                                        <div
                                            className="progress-bar bg-success"
                                            role="progressbar"
                                            style={{
                                                width: `${occupancyPercentage}%`,
                                            }}
                                        ></div>
                                    </div>

                                    <div className="d-flex justify-content-between small text-muted">

                                        <span>
                                            Ocupación
                                        </span>

                                        <span className="fw-semibold">
                                            {occupancyPercentage}%
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="row g-3 mt-5">

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body d-flex align-items-center">

                                    <div
                                        className="bg-success bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:car-multiple"
                                            width="26"
                                            className="text-success"
                                        />
                                    </div>

                                    <div>
                                        <small className="text-muted">
                                            Capacidad
                                        </small>

                                        <h5 className="fw-bold mb-0">
                                            {totalSpaces} espacios
                                            totales
                                        </h5>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body d-flex align-items-center">

                                    <div
                                        className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:clock-outline"
                                            width="26"
                                            className="text-primary"
                                        />
                                    </div>

                                    <div>
                                        <small className="text-muted">
                                            Horario de atención
                                        </small>

                                        <h5 className="fw-bold mb-0">
                                            10:00 - 20:00 hrs
                                        </h5>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body d-flex align-items-center">

                                    <div
                                        className="bg-warning bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:map-marker"
                                            width="26"
                                            className="text-warning"
                                        />
                                    </div>

                                    <div>
                                        <small className="text-muted">
                                            Ubicación
                                        </small>

                                        <h5 className="fw-bold mb-0">
                                            Granaderos 1667
                                        </h5>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            </section>

            <section
                id="disponibilidad"
                className="py-5 py-lg-6"
            >
                <div className="container">

                    <div className="text-center mb-5">

                        <span className="text-success fw-semibold text-uppercase small">
                            Disponibilidad
                        </span>

                        <h2 className="fw-bold mt-2">
                            Consulta nuestros espacios
                        </h2>

                        <p
                            className="text-muted mx-auto"
                            style={{
                                maxWidth: "650px",
                            }}
                        >
                            Revisa de manera rápida el estado actual
                            del estacionamiento y conoce cuántos
                            espacios se encuentran disponibles.
                        </p>

                    </div>

                    <div className="row g-4">

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body p-4 text-center">

                                    <div
                                        className="bg-success bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "70px",
                                            height: "70px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:parking"
                                            width="36"
                                            className="text-success"
                                        />
                                    </div>

                                    <h2 className="fw-bold text-success">
                                        {availableSpaces}
                                    </h2>

                                    <h5 className="fw-semibold">
                                        Espacios disponibles
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Actualmente disponibles
                                        para estacionar.
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body p-4 text-center">

                                    <div
                                        className="bg-danger bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "70px",
                                            height: "70px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:car"
                                            width="36"
                                            className="text-danger"
                                        />
                                    </div>

                                    <h2 className="fw-bold text-danger">
                                        {occupiedSpaces}
                                    </h2>

                                    <h5 className="fw-semibold">
                                        Espacios ocupados
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Vehículos actualmente
                                        estacionados.
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body p-4 text-center">

                                    <div
                                        className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "70px",
                                            height: "70px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:car-multiple"
                                            width="36"
                                            className="text-primary"
                                        />
                                    </div>

                                    <h2 className="fw-bold text-primary">
                                        {totalSpaces}
                                    </h2>

                                    <h5 className="fw-semibold">
                                        Capacidad total
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Capacidad máxima del
                                        estacionamiento.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="card border-0 shadow-sm mt-4">

                        <div className="card-header bg-white border-bottom">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <h5 className="fw-bold mb-1">

                                        <Icon
                                            icon="mdi:view-grid-outline"
                                            className="text-success me-2"
                                        />

                                        Estado de los espacios

                                    </h5>

                                    <small className="text-muted">
                                        Representación visual de la
                                        disponibilidad
                                    </small>

                                </div>

                                <span className="badge bg-success bg-opacity-10 text-success">
                                    En vivo
                                </span>

                            </div>

                        </div>

                        <div className="card-body p-4">

                            <div className="d-flex flex-wrap gap-4 mb-4">

                                <div className="d-flex align-items-center gap-2">

                                    <span
                                        className="bg-success rounded"
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                        }}
                                    ></span>

                                    <small className="text-muted">
                                        Disponible
                                    </small>

                                </div>

                                <div className="d-flex align-items-center gap-2">

                                    <span
                                        className="bg-danger rounded"
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                        }}
                                    ></span>

                                    <small className="text-muted">
                                        Ocupado
                                    </small>

                                </div>

                            </div>

                            <div className="row row-cols-4 row-cols-sm-6 row-cols-md-8 g-2">

                                {Array.from({
                                    length: totalSpaces,
                                }).map((_, i) => {

                                    const isOccupied =
                                        i < occupiedSpaces;

                                    return (
                                        <div
                                            className="col"
                                            key={i}
                                        >
                                            <div
                                                className={`border rounded-3 p-2 text-center ${
                                                    isOccupied
                                                        ? "bg-danger bg-opacity-10 border-danger"
                                                        : "bg-success bg-opacity-10 border-success"
                                                }`}
                                            >
                                                <Icon
                                                    icon="mdi:car"
                                                    width="20"
                                                    className={
                                                        isOccupied
                                                            ? "text-danger"
                                                            : "text-success"
                                                    }
                                                />

                                                <div
                                                    className={`small fw-semibold mt-1 ${
                                                        isOccupied
                                                            ? "text-danger"
                                                            : "text-success"
                                                    }`}
                                                >
                                                    {i + 1}
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}

                            </div>

                        </div>

                    </div>

                </div>
            </section>

            <section className="bg-white border-top border-bottom py-5 py-lg-6">

                <div className="container">

                    <div className="text-center mb-5">

                        <span className="text-success fw-semibold text-uppercase small">
                            El estacionamiento Carpe Diem ofrece:
                        </span>

                        <h2 className="fw-bold mt-2">
                            Una experiencia pensada para ti
                        </h2>

                    </div>

                    <div className="row g-4">

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body p-4">

                                    <div
                                        className="bg-success bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center mb-4"
                                        style={{
                                            width: "55px",
                                            height: "55px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:shield-check-outline"
                                            width="30"
                                            className="text-success"
                                        />
                                    </div>

                                    <h5 className="fw-bold">
                                        Seguridad
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Control y registro de los
                                        vehículos que ingresan y salen
                                        del estacionamiento para
                                        brindar seguridad durante su
                                        estadía.
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body p-4">

                                    <div
                                        className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center mb-4"
                                        style={{
                                            width: "55px",
                                            height: "55px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:clock-fast"
                                            width="30"
                                            className="text-primary"
                                        />
                                    </div>

                                    <h5 className="fw-bold">
                                        Rapidez
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Procesos de entrada y salida
                                        ágiles para reducir los
                                        tiempos de espera.
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body p-4">

                                    <div
                                        className="bg-warning bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center mb-4"
                                        style={{
                                            width: "55px",
                                            height: "55px",
                                        }}
                                    >
                                        <Icon
                                            icon="mdi:thumb-up-outline"
                                            width="30"
                                            className="text-warning"
                                        />
                                    </div>

                                    <h5 className="fw-bold">
                                        Fácil y práctico
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Un proceso sencillo y cómodo
                                        para estacionar tu vehículo
                                        sin complicaciones.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            <section
                id="tarifas"
                className="py-5 py-lg-6"
            >

                <div className="container">

                    <div className="text-center mb-5">

                        <span className="text-success fw-semibold text-uppercase small">
                            Tarifas
                        </span>

                        <h2 className="fw-bold mt-2">
                            Precios simples y transparentes
                        </h2>

                        <p className="text-muted">
                            Conoce nuestras tarifas según el tipo de
                            vehículo.
                        </p>

                    </div>

                    <div className="row justify-content-center g-4">

                        <div className="col-md-5">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body p-4 p-lg-5">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <span className="badge bg-success bg-opacity-10 text-success mb-2">
                                                Categoría A
                                            </span>

                                            <h4 className="fw-bold">
                                                Vehículos normales
                                            </h4>

                                        </div>

                                        <div className="d-flex gap-2">

                                            <Icon
                                                icon="mdi:car-outline"
                                                width="34"
                                                className="text-success"
                                            />

                                            <Icon
                                                icon="mdi:car-side"
                                                width="34"
                                                className="text-success"
                                            />

                                            <Icon
                                                icon="mdi:motorbike"
                                                width="34"
                                                className="text-success"
                                            />

                                        </div>

                                    </div>

                                    <p className="text-muted">
                                        Automóviles particulares,
                                        sedanes y motocicletas.
                                    </p>

                                    <div className="my-4">

                                        <span className="display-6 fw-bold">
                                            $1.400
                                        </span>

                                        <span className="text-muted">
                                            {" "}/ hora
                                        </span>

                                    </div>

                                    <hr />

                                    <div className="d-flex align-items-center mb-3">

                                        <Icon
                                            icon="line-md:confirm"
                                            className="text-success me-2"
                                        />

                                        <span>
                                            Espacio estándar
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-5">

                            <div className="card border-0 shadow-sm h-100">

                                <div className="card-body p-4 p-lg-5">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <span className="badge bg-primary bg-opacity-10 text-primary mb-2">
                                                Categoría B
                                            </span>

                                            <h4 className="fw-bold">
                                                Vehículos grandes
                                            </h4>

                                        </div>

                                        <div className="d-flex gap-2 flex-wrap justify-content-end">

                                            <Icon
                                                icon="mdi:pickup-truck"
                                                width="34"
                                                className="text-primary"
                                            />

                                            <Icon
                                                icon="mdi:truck-outline"
                                                width="34"
                                                className="text-primary"
                                            />

                                            <Icon
                                                icon="mdi:car-estate"
                                                width="34"
                                                className="text-primary"
                                            />

                                            <Icon
                                                icon="mdi:van-utility"
                                                width="34"
                                                className="text-primary"
                                            />

                                        </div>

                                    </div>

                                    <p className="text-muted">
                                        Camionetas, SUV, furgones y
                                        pickups.
                                    </p>

                                    <div className="my-4">

                                        <span className="display-6 fw-bold">
                                            $1.600
                                        </span>

                                        <span className="text-muted">
                                            {" "}/ hora
                                        </span>

                                    </div>

                                    <hr />

                                    <div className="d-flex align-items-center mb-3">

                                        <Icon
                                            icon="line-md:confirm"
                                            className="text-success me-2"
                                        />

                                        <span>
                                            Espacios de mayor tamaño
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

           <section
    id="ubicacion"
    className="bg-white border-top py-5 py-lg-6"
>
    <div className="container">

        <div className="row align-items-center g-5">

            <div className="col-lg-6">

                <span className="text-success fw-semibold text-uppercase small">
                    Ubicación
                </span>

                <h2 className="fw-bold mt-2 mb-4">
                    Encuéntranos fácilmente
                </h2>

                <p className="text-muted">
                    Estamos ubicados en una zona estratégica de la
                    ciudad, permitiendo un acceso rápido y cómodo.
                </p>

                <div className="mt-4">

                    <div className="d-flex align-items-start mb-4">

                        <div
                            className="bg-success bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                            style={{
                                width: "48px",
                                height: "48px",
                            }}
                        >
                            <Icon
                                icon="mdi:map-marker"
                                width="25"
                                className="text-success"
                            />
                        </div>

                        <div>
                            <h6 className="fw-bold mb-1">
                                Dirección
                            </h6>

                            <p className="text-muted mb-0">
                                Granaderos 1667, Calama
                            </p>
                        </div>

                    </div>

                    <div className="d-flex align-items-start mb-4">

                        <div
                            className="bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                            style={{
                                width: "48px",
                                height: "48px",
                            }}
                        >
                            <Icon
                                icon="mdi:clock-outline"
                                width="25"
                                className="text-primary"
                            />
                        </div>

                        <div>
                            <h6 className="fw-bold mb-1">
                                Horario
                            </h6>

                            <p className="text-muted mb-0">
                                Lunes a Domingo · 10:00 - 20:00 hrs
                            </p>
                        </div>

                    </div>

                    <div className="d-flex align-items-start">

                        <div
                            className="bg-warning bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                            style={{
                                width: "48px",
                                height: "48px",
                            }}
                        >
                            <Icon
                                icon="mdi:phone"
                                width="25"
                                className="text-warning"
                            />
                        </div>

                        <div>
                            <h6 className="fw-bold mb-1">
                                Atención
                            </h6>

                            <p className="text-muted mb-0">
                                Atención para consultas y reservas.
                            </p>
                        </div>

                    </div>

                </div>

            </div>

            <div className="col-lg-6">

                <div
                    className="card border-0 shadow-sm overflow-hidden"
                    style={{
                        height: "400px",
                    }}
                >

                    <iframe
                        title="Ubicación Carpe Diem"
                        src="https://www.google.com/maps?q=Granaderos+1667,+Calama,+Chile&output=embed"
                        width="100%"
                        height="100%"
                        style={{
                            border: 0,
                        }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>

                </div>

            </div>

        </div>

    </div>
</section>

            <footer className="bg-dark text-white pt-5 pb-4">

                <div className="container">

                    <div className="row align-items-center">

                        <div className="col-lg-7 col-md-7">

                            <div className="d-flex align-items-center mb-3">

                                <div
                                    className="d-flex align-items-center justify-content-center rounded-3 me-3"
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        backgroundColor: "#198754",
                                    }}
                                >
                                    <Icon
                                        icon="mdi:parking"
                                        width="28"
                                        height="28"
                                        className="text-white"
                                    />
                                </div>

                                <div>

                                    <h5 className="fw-bold mb-0">
                                        CARPE DIEM
                                    </h5>

                                    <small className="text-secondary">
                                        Smart Parking System
                                    </small>

                                </div>

                            </div>

                            <p className="text-secondary small mb-0 pe-lg-5">
                                Una experiencia de estacionamiento más
                                segura, rápida y sencilla para todos
                                nuestros clientes.
                            </p>

                        </div>

                        <div className="col-lg-5 col-md-5 mt-4 mt-md-0 text-md-end">

                            <h6 className="fw-bold mb-2">
                                Administración
                            </h6>

                            <p className="text-secondary small mb-3">
                                Acceso exclusivo para la gestión interna
                                del estacionamiento.
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="btn btn-success d-inline-flex align-items-center px-3 py-2 rounded-3"
                            >
                                <Icon
                                    icon="mdi:shield-lock-outline"
                                    width="18"
                                    className="me-2"
                                />

                                Acceso administrativo

                                <Icon
                                    icon="line-md:arrow-right"
                                    width="18"
                                    className="ms-2"
                                />
                            </button>

                        </div>

                    </div>

                    <hr className="border-secondary opacity-25 my-4" />

                    <div className="row align-items-center">

                        <div className="col-md-6">

                            <p className="text-secondary small mb-0">
                                © {new Date().getFullYear()} CARPE DIEM.
                                Todos los derechos reservados.
                            </p>

                        </div>

                        <div className="col-md-6 text-md-end mt-2 mt-md-0">

                            <span className="text-secondary small">
                                Smart Parking System
                            </span>

                        </div>

                    </div>

                </div>

            </footer>

        </div>
    );
}