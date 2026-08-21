import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/ParkingMap.css";

export default function ParkingMap({ onSpotClick }) {
  const [espacios, setEspacios] = useState([]);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fetchEspacios = async () => {
      const { data } = await supabase
        .from("espacios")
        .select("*")
        .order("id_espacio");
      if (data) setEspacios(data);
    };

    fetchEspacios();

    const channel = supabase
      .channel("espacios-realtime")
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

  // Escala el mapa para que siempre quepa completo en su contenedor,
  // sin recortarse y sin necesidad de scroll.
  useEffect(() => {
    const calcularEscala = () => {
      const cont = containerRef.current;
      const el = contentRef.current;
      if (!cont || !el) return;

      const availW = cont.clientWidth;
      const availH = cont.clientHeight;
      const natW = el.offsetWidth;
      const natH = el.offsetHeight;
      if (!natW || !natH) return;

      const nuevaEscala = Math.min(availW / natW, availH / natH, 1);
      setScale(nuevaEscala > 0 ? nuevaEscala : 1);
    };

    calcularEscala();

    const ro = new ResizeObserver(calcularEscala);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", calcularEscala);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calcularEscala);
    };
  }, [espacios.length]);

  const isXL = (n) => [1, 2, 3, 17, 18, 19, 20].includes(n);

  const getColorClass = (estado) => {
    if (estado === "ocupado") return "cd-spot--ocupado";
    if (estado === "reservado") return "cd-spot--reservado";
    return "cd-spot--disponible";
  };

  const leftSpots = [
    32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
  ];
  const rightSpots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  const getEspacio = (id) =>
    espacios.find((e) => Number(e.id_espacio) === Number(id));

  return (
    <div ref={containerRef} className="cd-map-container">
      <div
        ref={contentRef}
        style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
        className="cd-map"
      >
        {/* Columna izquierda */}
        <div className="cd-map__column">
          {leftSpots.map((n) => {
            const e = getEspacio(n);
            return (
              <div
                key={n}
                onClick={() => onSpotClick && onSpotClick(e)}
                className={`cd-spot ${getColorClass(e?.estado)}`}
              >
                <span>{isXL(n) ? `XL ${n}` : `L ${n}`}</span>
                {e?.patente && <span className="cd-spot__plate">{e.patente}</span>}
              </div>
            );
          })}
        </div>

        {/* Centro */}
        <div className="cd-map__lane">
          {[1, 2, 3, 4, 5, 6].map((x) => (
            <div key={x} className="cd-map__lane-slot" />
          ))}
        </div>

        {/* Columna derecha */}
        <div className="cd-map__column">
          {rightSpots.map((n) => {
            const e = getEspacio(n);
            return (
              <div
                key={n}
                onClick={() => onSpotClick && onSpotClick(e)}
                className={`cd-spot ${getColorClass(e?.estado)}`}
              >
                <span>{isXL(n) ? `XL ${n}` : `L ${n}`}</span>
                {e?.patente && <span className="cd-spot__plate">{e.patente}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}