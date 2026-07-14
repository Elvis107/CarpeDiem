/**
 * ParkingMap.jsx
 * --------------
 * Mapa visual en tiempo real del estacionamiento Carpe Diem.
 * OPTIMIZADO: Alturas compactas y pasillo auto-ajustable para evitar cortes en pantalla.
 */

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ParkingMap({ onSpotClick, orientation = "vertical" }) {
  const isH = orientation === "horizontal";
  const [espacios, setEspacios] = useState([]);

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
              e.id_espacio === payload.new.id_espacio ? payload.new : e
            )
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const isXL = (n) => [1, 2, 3, 17, 18, 19, 20].includes(n);

  const getEstiloEstado = (estado) => {
    if (estado === "ocupado")
      return {
        led: "bg-red-500 shadow-[0_0_7px_2px_rgba(239,68,68,0.85)]",
        ring: "border-red-500/50 hover:border-red-400/70",
        wash: "shadow-[inset_0_0_14px_rgba(239,68,68,0.18)]",
        text: "text-red-50",
      };
    if (estado === "reservado")
      return {
        led: "bg-amber-400 shadow-[0_0_7px_2px_rgba(251,191,36,0.8)]",
        ring: "border-amber-400/50 hover:border-amber-300/70",
        wash: "shadow-[inset_0_0_14px_rgba(251,191,36,0.16)]",
        text: "text-amber-50",
      };
    return {
      led: "bg-emerald-400 shadow-[0_0_7px_2px_rgba(52,211,153,0.75)]",
      ring: "border-emerald-400/40 hover:border-emerald-300/60",
      wash: "shadow-[inset_0_0_10px_rgba(16,185,129,0.12)]",
      text: "text-emerald-50",
    };
  };

  const leftSpots = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];
  const rightSpots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  const getEspacio = (id) => espacios.find((e) => Number(e.id_espacio) === Number(id));

  const renderSpot = (n) => {
    const e = getEspacio(n);
    const s = getEstiloEstado(e?.estado);
    return (
      <div
        key={n}
        onClick={() => onSpotClick && onSpotClick(e)}
        className={`group relative w-14 h-8 rounded-md bg-[#2a2d33] border ${s.ring} ${s.wash} flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all duration-200 hover:scale-[1.06] hover:z-10 shrink-0`}
      >
        <span className="pointer-events-none absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-white/15" />
        <span className="pointer-events-none absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-white/15" />
        <span className="pointer-events-none absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-white/15" />
        <span className="pointer-events-none absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-white/15" />

        <span className={`w-1 h-1 rounded-full ${s.led}`} />

        <span className={`font-stencil text-[9px] tracking-wide leading-none ${s.text}`}>
          {isXL(n) ? `XL·${n}` : `L·${n}`}
        </span>

        {e?.patente && (
          <span className="font-mono text-[6px] tracking-wider text-white/45 leading-none">
            {e.patente}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-gradient-to-b from-[#22252a] to-[#17191c] rounded-2xl p-4 shadow-2xl overflow-visible max-h-full flex flex-col justify-between">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Allerta+Stencil&display=swap');
        .font-stencil { font-family: 'Allerta Stencil', sans-serif; }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #fff 0.5px, transparent 0.5px), radial-gradient(circle at 60% 70%, #fff 0.5px, transparent 0.5px)",
          backgroundSize: "26px 26px, 34px 34px",
        }}
      />
      
      <div className={`relative flex ${isH ? "flex-col items-stretch gap-2" : "flex-row items-center gap-3 justify-center"}`}>
        {/* Primer grupo de espacios */}
        <div className={isH ? "flex flex-row flex-wrap gap-1" : "flex flex-col gap-1"}>
          {leftSpots.map(renderSpot)}
        </div>

        {/* Pasillo central optimizado auto-ajustable */}
        <div
          className={
            isH
              ? "relative w-full min-h-[80px] rounded-xl bg-[#131518] border-2 border-white/10 overflow-hidden flex flex-row items-center justify-center gap-2 px-8"
              : "relative w-[85px] self-stretch rounded-[18px] bg-[#131518] border-2 border-white/10 overflow-hidden flex flex-col items-center justify-between py-3 gap-1"
          }
        >
          <div
            className={
              isH
                ? "pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] opacity-60"
                : "pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] opacity-60"
            }
            style={{
              backgroundImage: isH
                ? "repeating-linear-gradient(to right, #f4b400 0, #f4b400 16px, transparent 16px, transparent 30px)"
                : "repeating-linear-gradient(to bottom, #f4b400 0, #f4b400 16px, transparent 16px, transparent 30px)",
            }}
          />

          <span className="relative z-10 text-[7px] tracking-[0.2em] text-white/30 font-bold uppercase text-center block leading-none">
            ZONA TECHADA
          </span>

          {[1, 2, 3, 4, 5].map((x) => (
            <div
              key={x}
              className="relative z-10 w-12 h-7 rounded-md bg-gradient-to-b from-[#2b2f35] to-[#202226] border border-white/10 flex items-center justify-center shrink-0"
            >
              <div className="w-7 h-3.5 rounded-sm bg-white/[0.04] border border-white/5 shadow-inner" />
            </div>
          ))}
        </div>

        {/* Segundo grupo de espacios */}
        <div className={isH ? "flex flex-row flex-wrap gap-1" : "flex flex-col gap-1"}>
          {rightSpots.map(renderSpot)}
        </div>
      </div>

      {/* Leyenda de estados garantizada sin cortes */}
      <div className="relative mt-3 flex items-center justify-center gap-5 border-t border-white/10 pt-2.5 w-full block">
        <div className="flex items-center justify-center gap-5 flex-wrap">
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.7)]" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_1px_rgba(251,191,36,0.7)]" />
            Reservado
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_1px_rgba(239,68,68,0.7)]" />
            Ocupado
          </span>
        </div>
      </div>
    </div>
  );
}