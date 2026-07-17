import { Icon } from "@iconify/react";

export default function Reportes({ onClose }) {
  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50 rounded-[2rem] shadow-[0_20px_60px_rgba(15,23,42,0.08)] border border-slate-200/80 w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="flex items-start justify-between gap-4 px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-200/80 min-w-0 bg-white/80 backdrop-blur">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-600">
            <Icon icon="mdi:chart-box-outline" className="text-sm" />
            Panel analítico
          </div>
          <h2 className="mt-3 text-2xl sm:text-[2rem] font-black tracking-tight text-slate-900 truncate">
            Reportes
          </h2>
          <p className="mt-2 text-base sm:text-[16px] text-slate-500">
            Indicadores visuales con una presentación limpia y de estilo ejecutivo.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-slate-900 hover:shadow-md"
          >
            <Icon icon="mdi:close" className="text-2xl" />
          </button>
        )}
      </div>

      <div className="overflow-auto px-4 sm:px-8 py-5 sm:py-6 min-w-0 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-semibold text-violet-700 shadow-sm">
            <Icon icon="mdi:file-chart-outline" className="text-sm" />
            Reporte mensual
          </span>
          <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-500 shadow-sm">
            <Icon icon="mdi:download-outline" className="text-sm" />
            Exportar PDF
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-violet-50 to-white border border-violet-100 p-5 shadow-sm">
            <p className="text-[12px] font-black text-violet-600 tracking-[0.35em] uppercase">
              Ocupación promedio
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              78%
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-5 shadow-sm">
            <p className="text-[12px] font-black text-amber-600 tracking-[0.35em] uppercase">
              Ingresos del mes
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              $1.240.000
            </p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-10 min-h-[260px] shadow-[0_10px_30px_rgba(15,23,42,0.05)] flex flex-col items-center justify-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            <Icon icon="mdi:chart-bar" className="text-4xl text-slate-300" />
          </div>
          <p className="text-base sm:text-lg text-slate-500 text-center max-w-md">
            Aquí iría el gráfico de ocupación por semana
          </p>
        </div>

        <p className="text-xs text-slate-400 text-center pt-1">
          Datos de ejemplo - este panel es solo una maqueta visual
        </p>
      </div>
    </div>
  );
}
