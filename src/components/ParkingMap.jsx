import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

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

  const getColor = (estado) => {
    if (estado === "ocupado") return "bg-red-400 border-red-500 text-white";
    if (estado === "reservado")
      return "bg-yellow-300 border-yellow-500 text-yellow-900";
    return "bg-green-100 border-green-400 text-green-800";
  };

  const leftSpots = [
    32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
  ];
  const rightSpots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  const getEspacio = (id) =>
    espacios.find((e) => Number(e.id_espacio) === Number(id));

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
    >
      <div
        ref={contentRef}
        style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
        className="bg-[#d8e8d3] rounded-[35px] p-8 shadow-2xl flex gap-8 items-start"
      >
        {/* Columna izquierda */}
        <div className="flex flex-col gap-2">
          {leftSpots.map((n) => {
            const e = getEspacio(n);
            return (
              <div
                key={n}
                onClick={() => onSpotClick && onSpotClick(e)}
                className={`w-20 h-11 rounded-xl flex flex-col items-center justify-center border text-xs font-semibold cursor-pointer transition-all ${getColor(e?.estado)}`}
              >
                <span>{isXL(n) ? `XL ${n}` : `L ${n}`}</span>
                {e?.patente && (
                  <span className="text-[9px] opacity-75">{e.patente}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Centro */}
        <div className="w-[200px] min-h-[600px] rounded-[30px] border-[5px] border-green-700 flex flex-col items-center justify-start pt-8 gap-2">
          {[1, 2, 3, 4, 5, 6].map((x) => (
            <div key={x} className="w-20 h-16 bg-gray-100 border rounded-md" />
          ))}
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-2">
          {rightSpots.map((n) => {
            const e = getEspacio(n);
            return (
              <div
                key={n}
                onClick={() => onSpotClick && onSpotClick(e)}
                className={`w-20 h-11 rounded-xl flex flex-col items-center justify-center border text-xs font-semibold cursor-pointer transition-all ${getColor(e?.estado)}`}
              >
                <span>{isXL(n) ? `XL ${n}` : `L ${n}`}</span>
                {e?.patente && (
                  <span className="text-[9px] opacity-75">{e.patente}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}