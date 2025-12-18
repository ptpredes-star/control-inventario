import React, { useState } from "react";
import {
  Download,
  Send,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

/* ===============================
   Utilidades
================================ */

// Fix emojis WhatsApp
const encodeUTF8 = (text) =>
  encodeURIComponent(unescape(encodeURIComponent(text)));

const calcularPorcentaje = (real, meta) => {
  if (typeof real === "string" || typeof meta === "string") {
    return real === meta ? 100 : 0;
  }
  if (meta === 0) return real === 0 ? 100 : 0;
  return Math.min(Math.round((real / meta) * 100), 100);
};

const getSemaforo = (porcentaje) => {
  if (porcentaje >= 90) return { texto: "VERDE", emoji: "🟢", color: "bg-green-600" };
  if (porcentaje >= 60) return { texto: "AMARILLO", emoji: "🟡", color: "bg-yellow-500" };
  return { texto: "ROJO", emoji: "🔴", color: "bg-red-600" };
};

/* ===============================
   App
================================ */

export default function InventoryControlSystem() {
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [encargado, setEncargado] = useState("");

  const [taquilleros, setTaquilleros] = useState({
    casillas: { meta: 20, real: 0 },
    pintado: { meta: 15, real: 0 },
    errores: { meta: 0, real: 0 },
    apoyos: { meta: 4, real: 0 },
    observaciones: "",
  });

  const [almacenChico, setAlmacenChico] = useState({
    casillas: { meta: 15, real: 0 },
    clasificado: { meta: 12, real: 0 },
    senaletica: { meta: 8, real: 0 },
    apoyos: { meta: 3, real: 0 },
    observaciones: "",
  });

  const [zonaIIV, setZonaIIV] = useState({
    estantes: { meta: 10, real: 0 },
    pintado: { meta: 8, real: 0 },
    retazos: { meta: "Sí", real: "No" },
    observaciones: "",
  });

  const [zonaIIIV, setZonaIIIV] = useState({
    clasificado: { meta: 12, real: 0 },
    senaletica: { meta: 6, real: 0 },
    apoyo: { meta: "Sí", real: "No" },
    observaciones: "",
  });

  const promedioZona = (zona) => {
    const keys = Object.keys(zona).filter((k) => k !== "observaciones");
    const total = keys.reduce(
      (sum, k) => sum + calcularPorcentaje(zona[k].real, zona[k].meta),
      0
    );
    return Math.round(total / keys.length);
  };

  /* ===============================
     WhatsApp
  ================================ */

  const enviarWhatsApp = () => {
    const pT = promedioZona(taquilleros);
    const pA = promedioZona(almacenChico);
    const pI = promedioZona(zonaIIV);
    const pZ = promedioZona(zonaIIIV);
    const general = Math.round((pT + pA + pI + pZ) / 4);

    const alertas = [];
    if (general < 60) alertas.push("⚠️ Avance general bajo");
    if (taquilleros.errores.real > 2)
      alertas.push("⚠️ Errores en Taquilleros");
    if (zonaIIV.retazos.real === "No")
      alertas.push("⚠️ Retazos sin separar Zona I/IV");

    const msg = `
📊 REPORTE DIARIO DE INVENTARIO
📅 Fecha: ${fecha}
👤 Encargado: ${encargado || "No indicado"}

━━━━━━━━━━━━━━
🎯 AVANCE GENERAL: ${general}% ${getSemaforo(general).emoji}
━━━━━━━━━━━━━━

🟦 TAQUILLEROS: ${pT}% ${getSemaforo(pT).emoji}
🟩 ALMACÉN CHICO: ${pA}% ${getSemaforo(pA).emoji}
🟨 ZONA I-IV: ${pI}% ${getSemaforo(pI).emoji}
🟧 ZONA III-V: ${pZ}% ${getSemaforo(pZ).emoji}

📌 ALERTAS:
${alertas.length ? alertas.join("\n") : "✅ Sin alertas críticas"}
`;

    const telefono = "51984717428";
    const url = `https://wa.me/${telefono}?text=${encodeUTF8(msg)}`;
    window.open(url, "_blank");
  };

  /* ===============================
     Exportar CSV (sin bloqueo)
  ================================ */

  const exportarCSV = () => {
    const rows = [
      ["Fecha", "Zona", "Indicador", "Meta", "Real", "Porcentaje"],
      [fecha, "Taquilleros", "Casillas", taquilleros.casillas.meta, taquilleros.casillas.real, calcularPorcentaje(taquilleros.casillas.real, taquilleros.casillas.meta)],
      [fecha, "Taquilleros", "Pintado", taquilleros.pintado.meta, taquilleros.pintado.real, calcularPorcentaje(taquilleros.pintado.real, taquilleros.pintado.meta)],
      [fecha, "Almacén Chico", "Clasificado", almacenChico.clasificado.meta, almacenChico.clasificado.real, calcularPorcentaje(almacenChico.clasificado.real, almacenChico.clasificado.meta)],
      [fecha, "Zona I-IV", "Retazos", zonaIIV.retazos.meta, zonaIIV.retazos.real, calcularPorcentaje(zonaIIV.retazos.real, zonaIIV.retazos.meta)],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const uri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

    const a = document.createElement("a");
    a.href = uri;
    a.download = `control_inventario_${fecha}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              Control Diario de Inventario
            </h1>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Encargado"
              value={encargado}
              onChange={(e) => setEncargado(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-4">Acciones</h2>
          <div className="flex gap-3">
            <button
              onClick={enviarWhatsApp}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Send size={18} /> Enviar WhatsApp
            </button>

            <button
              onClick={exportarCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Download size={18} /> Exportar CSV
            </button>
          </div>

          <div className="mt-4 bg-yellow-50 p-3 border-l-4 border-yellow-500 flex gap-2">
            <AlertCircle className="text-yellow-600" />
            <p className="text-sm">
              Completa los datos antes de enviar el reporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
