import { Icon } from "@iconify/react";

export default function HistorialReportes({ onClose }) {
  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50 rounded-none shadow-[0_20px_60px_rgba(15,23,42,0.08)] border border-slate-200/80 w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="flex items-start justify-between gap-4 px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-200/80 min-w-0 bg-white/80 backdrop-blur">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
            <Icon icon="mdi:history" className="text-sm" />
            Control visual
          </div>
          <h2 className="mt-3 text-2xl sm:text-[2rem] font-black tracking-tight text-slate-900 truncate">
            Historial
          </h2>
          <p className="mt-2 text-base sm:text-[16px] text-slate-500">
            Resumen de movimientos recientes con una vista limpia y ejecutiva.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-slate-900 hover:shadow-md"
          >
            <Icon icon="mdi:close" className="text-2xl" />
          </button>
        )}
      </div>

      <div className="overflow-auto px-3 sm:px-8 py-5 sm:py-6 min-w-0 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 shadow-sm">
            <Icon icon="mdi:calendar-range" className="text-sm" />
            Últimos 7 días
          </span>
          <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-500 shadow-sm">
            <Icon icon="mdi:filter-variant" className="text-sm" />
            Todas las categorías
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-md bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 shadow-sm">
            <p className="text-[12px] font-black text-emerald-600 tracking-[0.35em] uppercase">
              Ingresos totales
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              128
            </p>
          </div>
          <div className="rounded-md bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-5 shadow-sm">
            <p className="text-[12px] font-black text-rose-500 tracking-[0.35em] uppercase">
              Egresos totales
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              121
            </p>
          </div>
          <div className="rounded-md bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-5 shadow-sm">
            <p className="text-[12px] font-black text-amber-600 tracking-[0.35em] uppercase">
              Ingresos estimados
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              $186.400
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="overflow-auto">
            <table className="w-full min-w-full table-fixed text-sm">
              <thead className="sticky top-0 bg-white/95 backdrop-blur">
                <tr className="text-left text-slate-400 border-b border-slate-200">
                  <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                    Fecha
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                    Patente
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                    Categoría
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                    Tiempo total
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                    Costo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1 text-[12px] font-semibold tracking-wide text-slate-700">
                      16-07-2026
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900 whitespace-nowrap">
                    GH-YU-87
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                      Normal
                    </span>
                  </td>
                    <td className="px-4 py-4 text-base font-mono text-slate-700 whitespace-nowrap">
                    00:08:12
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">
                      $1.400
                    </span>
                  </td>
                </tr>
                <tr className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-700">
                      16-07-2026
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900 whitespace-nowrap">
                    QW-FT-56
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                      Grande
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-700 whitespace-nowrap">
                    01:07:50
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
                      $3.200
                    </span>
                  </td>
                </tr>
                <tr className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-700">
                      15-07-2026
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900 whitespace-nowrap">
                    WE-DF-45
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                      Grande
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-700 whitespace-nowrap">
                    01:27:19
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
                      $3.200
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pt-1">
          Datos de ejemplo - este panel es solo una maqueta visual
        </p>
      </div>
    </div>
  );
}
