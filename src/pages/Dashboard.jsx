import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 h-screen">

        {/* SIN ESPACIO EN BLANCO */}
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">

          {/* INGRESO */}
          <div
            onClick={() => navigate("/entrada")}
            className="
              cursor-pointer
              bg-green-500
              text-white
              transition-all
              duration-300
              hover:brightness-110
              hover:shadow-2xl
              flex
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <Icon
              icon="mdi:car-arrow-right"
              className="text-7xl mb-6"
            />

            <h2 className="text-5xl font-bold mb-3">
              INGRESO
            </h2>

            <p className="text-lg">
              Registrar entrada de vehículos
            </p>
          </div>

          {/* SALIDA */}
          <div
            onClick={() => navigate("/salida")}
            className="
              cursor-pointer
              bg-red-500
              text-white
              transition-all
              duration-300
              hover:brightness-110
              hover:shadow-2xl
              flex
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <Icon
              icon="mdi:exit-to-app"
              className="text-7xl mb-6"
            />

            <h2 className="text-5xl font-bold mb-3">
              SALIDA
            </h2>

            <p className="text-lg">
              Registrar salida de vehículos
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}