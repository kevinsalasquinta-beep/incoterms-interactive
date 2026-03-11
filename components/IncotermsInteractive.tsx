"use client";
import { useEffect, useMemo, useState } from "react";
// ✅ Reemplazo simple: componentes UI inline (sin shadcn)
function Card({ className = "", children }: any) {
  return <div className={`rounded-2xl border bg-white ${className}`}>{children}</div>;
}

function CardContent({ className = "", children }: any) {
  return <div className={`${className}`}>{children}</div>;
}

function Button({
  className = "",
  variant = "default",
  size = "default",
  ...props
}: any) {
  const base =
    "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition";
  const variants: Record<string, string> = {
    default: "bg-black text-white border-black hover:bg-black/90",
    outline: "bg-white text-black border-neutral-300 hover:bg-neutral-50",
  };
  const sizes: Record<string, string> = {
    default: "",
    sm: "px-3 py-1.5 text-sm",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.default} ${sizes[size] || ""} ${className}`}
      {...props}
    />
  );
}

/**
 * Incoterms® 2020 (ICC) – resumen interactivo interno.
 * Nota: esto NO reemplaza el texto oficial ICC ni asesoría legal/compliance.
 */

const STEPS_EXPORT = [
  { key: "origen", label: "Origen / Planta" },
  { key: "precarriage", label: "Transporte interno" },
  { key: "export", label: "Aduana export" },
  { key: "main", label: "Transporte principal" },
  { key: "import", label: "Aduana import" },
  { key: "oncarriage", label: "Entrega final" },
];

// Misma línea, pero con etiquetas pensadas para “importación / inbound” (lo que ve la operación).
const STEPS_IMPORT = [
  { key: "origen", label: "Proveedor / Origen" },
  { key: "precarriage", label: "Recogida / Inland" },
  { key: "export", label: "Salida (export)" },
  { key: "main", label: "Flete principal" },
  { key: "import", label: "Ingreso (import)" },
  { key: "oncarriage", label: "Entrega a operación" },
];

// Helpers visuales
const pill = (base: string) =>
  `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${base}`;

const badge = (base: string) =>
  `inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${base}`;

const sectionTitle = "text-sm font-semibold";

const cargoTypes = [
  { key: "All", label: "Sin filtro", emoji: "🧩" },
  { key: "Container", label: "Contenedor", emoji: "🚢" },
  { key: "BreakBulk", label: "Carga suelta", emoji: "🏗️" },
  { key: "Air", label: "Aéreo/Courier", emoji: "✈️" },
];

const objectives = [
  { key: "None", label: "Sin objetivo", emoji: "🎯" },
  { key: "ControlFreight", label: "Controlar flete", emoji: "🧾" },
  { key: "SimplifyDestination", label: "Simplificar destino", emoji: "✅" },
  { key: "MinimizeRisk", label: "Minimizar riesgo", emoji: "🛡️" },
];

/**
 * Lógica interna recomendada (no contractual).
 */
const cargoGuidance = {
  All: {
    title: "Sin filtro por tipo de carga",
    subtitle: "Selecciona un tipo de carga para ver recomendaciones y alertas.",
    recommended: [],
    avoid: [],
    notes: [
      "Usa el selector de ‘Lente’ para narrar exportación vs importación.",
      "Define siempre el lugar exacto en el contrato (ej. ‘FCA Bogotá – Terminal X’).",
    ],
  },
  Container: {
    title: "Contenedor (FCL/LCL)",
    subtitle: "Recomendación práctica para carga contenerizada.",
    recommended: ["FCA", "CPT", "CIP", "DAP", "DDP"],
    avoid: ["FOB"],
    notes: [
      "Para contenedor, suele preferirse FCA sobre FOB.",
      "Si quieres controlar el flete: CPT/CIP. Si quieres simplicidad en destino: DAP/DDP.",
    ],
  },
  BreakBulk: {
    title: "Carga suelta / Proyecto (Break bulk)",
    subtitle: "El punto de izaje/estiba define el riesgo.",
    recommended: ["FAS", "FOB", "CFR", "CIF", "DAP", "DPU"],
    avoid: [],
    notes: [
      "Asegura en contrato quién asume izaje, estiba y amarres.",
      "Seguro altamente recomendado por manipulación en puerto.",
    ],
  },
  Air: {
    title: "Aéreo / Courier",
    subtitle: "Velocidad y simplicidad operativa.",
    recommended: ["FCA", "CPT", "CIP", "DAP", "DDP"],
    avoid: ["FOB", "CFR", "CIF", "FAS"],
    notes: [
      "En courier, DAP/DDP es frecuente (verifica quién puede nacionalizar).",
      "Si quieres controlar el flete: CPT/CIP. Si es urgencia: DAP/DDP.",
    ],
  },
};

/**
 * Objetivo de decisión: agrega una capa de recomendación.
 * - Controlar flete: prioriza incoterms donde el vendedor paga el transporte principal (CPT/CIP/CFR/CIF) o entrega completa (DAP/DPU/DDP).
 * - Simplificar destino: prioriza DAP/DPU/DDP.
 * - Minimizar riesgo: (heurístico) prioriza términos donde el vendedor mantiene control mayor del trayecto (CIP/CIF/DAP/DPU/DDP) y evita EXW.
 */
const objectiveGuidance = {
  None: {
    title: "Sin objetivo",
    subtitle: "Activa un objetivo para refinar recomendaciones.",
    recommended: [],
    avoid: [],
    notes: ["El objetivo es una guía interna; el contrato manda."],
  },
  ControlFreight: {
    title: "Controlar flete",
    subtitle: "Mantener control/negociación del transporte principal.",
    recommended: ["CPT", "CIP", "CFR", "CIF", "DAP", "DPU", "DDP"],
    avoid: [],
    notes: [
      "CPT/CIP: controlas el flete, pero el riesgo se transfiere al primer transportista.",
      "CFR/CIF: solo marítimo; riesgo se transfiere al embarcar.",
    ],
  },
  SimplifyDestination: {
    title: "Simplificar destino",
    subtitle: "Reducir tareas del comprador en llegada.",
    recommended: ["DAP", "DPU", "DDP"],
    avoid: [],
    notes: [
      "DAP: entregas listo para descargar.",
      "DPU: entregas descargado.",
      "DDP: incluye importación e impuestos (validar compliance).",
    ],
  },
  MinimizeRisk: {
    title: "Minimizar riesgo",
    subtitle: "Heurístico: mayor control del vendedor en trayecto.",
    recommended: ["CIP", "CIF", "DAP", "DPU", "DDP"],
    avoid: ["EXW"],
    notes: [
      "CIP/CIF incluyen seguro (coberturas por defecto difieren).",
      "EXW transfiere responsabilidad muy temprano (ojo si no controlas cargue/export).",
    ],
  },
};

type CargoType = (typeof cargoTypes)[number];
const cargoTypesMeta = cargoTypes.reduce<Record<string, CargoType>>((acc, c) => {
  acc[c.key] = c;
  return acc;
}, {});

type ObjectiveType = (typeof objectives)[number];
const objectivesMeta = objectives.reduce<Record<string, ObjectiveType>>((acc, o) => {
  acc[o.key] = o;
  return acc;
}, {});

const incoterms = [
  // Cualquier modo de transporte
  {
    code: "EXW",
    name: "Ex Works",
    mode: "Any",
    sellerTasks: ["Empaque (según contrato)", "Poner mercancía a disposición en planta"],
    buyerTasks: [
      "Carga en origen",
      "Transporte interno",
      "Aduana export",
      "Transporte principal",
      "Aduana import",
      "Entrega final",
      "Seguro (si aplica)",
    ],
    riskPoint: "En origen: cuando la mercancía está disponible en la planta del vendedor.",
    paysMainCarriage: "Comprador",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "buyer",
      export: "buyer",
      main: "buyer",
      import: "buyer",
      oncarriage: "buyer",
    },
    riskStep: "origen",
  },
  {
    code: "FCA",
    name: "Free Carrier",
    mode: "Any",
    sellerTasks: ["Empaque", "Aduana export", "Entrega al transportista (lugar acordado)"],
    buyerTasks: ["Transporte principal", "Aduana import", "Entrega final", "Seguro (si aplica)"],
    riskPoint: "Al entregar la mercancía al transportista/otra persona designada por el comprador.",
    paysMainCarriage: "Comprador",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "buyer",
      import: "buyer",
      oncarriage: "buyer",
    },
    riskStep: "export",
  },
  {
    code: "CPT",
    name: "Carriage Paid To",
    mode: "Any",
    sellerTasks: ["Empaque", "Aduana export", "Pagar transporte principal hasta lugar acordado"],
    buyerTasks: ["Aduana import", "Entrega final", "Seguro (si aplica)"],
    riskPoint:
      "Cuando el vendedor entrega la mercancía al primer transportista (el riesgo se transfiere antes de llegar al destino).",
    paysMainCarriage: "Vendedor",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "seller",
      import: "buyer",
      oncarriage: "buyer",
    },
    riskStep: "export",
  },
  {
    code: "CIP",
    name: "Carriage and Insurance Paid To",
    mode: "Any",
    sellerTasks: [
      "Empaque",
      "Aduana export",
      "Pagar transporte principal hasta lugar acordado",
      "Contratar seguro (cobertura amplia por defecto, salvo acuerdo)",
    ],
    buyerTasks: ["Aduana import", "Entrega final"],
    riskPoint: "Cuando se entrega al primer transportista (igual que CPT).",
    paysMainCarriage: "Vendedor",
    insurance: "Vendedor (amplia por defecto)",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "seller",
      import: "buyer",
      oncarriage: "buyer",
    },
    riskStep: "export",
  },
  {
    code: "DAP",
    name: "Delivered At Place",
    mode: "Any",
    sellerTasks: [
      "Empaque",
      "Aduana export",
      "Transporte total hasta lugar de destino (sin descargar)",
    ],
    buyerTasks: ["Aduana import", "Descarga (si aplica)", "Seguro (si aplica)"],
    riskPoint: "En destino, cuando la mercancía está lista para descargar en el lugar acordado.",
    paysMainCarriage: "Vendedor",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "seller",
      import: "buyer",
      oncarriage: "seller",
    },
    riskStep: "oncarriage",
  },
  {
    code: "DPU",
    name: "Delivered at Place Unloaded",
    mode: "Any",
    sellerTasks: [
      "Empaque",
      "Aduana export",
      "Transporte total hasta destino",
      "Descarga en destino",
    ],
    buyerTasks: ["Aduana import", "Seguro (si aplica)"],
    riskPoint: "En destino, después de descargar la mercancía en el lugar acordado.",
    paysMainCarriage: "Vendedor",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "seller",
      import: "buyer",
      oncarriage: "seller",
    },
    riskStep: "oncarriage",
  },
  {
    code: "DDP",
    name: "Delivered Duty Paid",
    mode: "Any",
    sellerTasks: [
      "Empaque",
      "Aduana export",
      "Transporte total hasta destino",
      "Aduana import (incl. impuestos/aranceles)",
      "Entrega final",
    ],
    buyerTasks: ["Descarga (si aplica)", "Seguro (si aplica)"],
    riskPoint: "En destino final, cuando se entrega la mercancía al comprador (lista para descargar).",
    paysMainCarriage: "Vendedor",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "seller",
      import: "seller",
      oncarriage: "seller",
    },
    riskStep: "oncarriage",
  },

  // Solo marítimo / vías navegables interiores
  {
    code: "FAS",
    name: "Free Alongside Ship",
    mode: "Sea",
    sellerTasks: ["Empaque", "Aduana export", "Entregar al costado del buque (puerto acordado)"],
    buyerTasks: ["Carga a bordo", "Flete marítimo", "Seguro", "Aduana import", "Entrega final"],
    riskPoint: "Cuando la mercancía se coloca al costado del buque en el puerto de embarque.",
    paysMainCarriage: "Comprador",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "buyer",
      import: "buyer",
      oncarriage: "buyer",
    },
    riskStep: "export",
  },
  {
    code: "FOB",
    name: "Free On Board",
    mode: "Sea",
    sellerTasks: ["Empaque", "Aduana export", "Cargar a bordo del buque (puerto acordado)"],
    buyerTasks: ["Flete marítimo", "Seguro", "Aduana import", "Entrega final"],
    riskPoint: "Cuando la mercancía está a bordo del buque en el puerto de embarque.",
    paysMainCarriage: "Comprador",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "buyer",
      import: "buyer",
      oncarriage: "buyer",
    },
    riskStep: "main",
  },
  {
    code: "CFR",
    name: "Cost and Freight",
    mode: "Sea",
    sellerTasks: ["Empaque", "Aduana export", "Pagar flete marítimo hasta puerto destino"],
    buyerTasks: ["Seguro", "Aduana import", "Entrega final"],
    riskPoint:
      "Cuando la mercancía está a bordo del buque en el puerto de embarque (aunque el vendedor pague el flete).",
    paysMainCarriage: "Vendedor",
    insurance: "No obligatorio",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "seller",
      import: "buyer",
      oncarriage: "buyer",
    },
    riskStep: "main",
  },
  {
    code: "CIF",
    name: "Cost, Insurance and Freight",
    mode: "Sea",
    sellerTasks: [
      "Empaque",
      "Aduana export",
      "Pagar flete marítimo hasta puerto destino",
      "Contratar seguro (cobertura mínima por defecto)",
    ],
    buyerTasks: ["Aduana import", "Entrega final"],
    riskPoint: "Cuando la mercancía está a bordo del buque en el puerto de embarque (igual que CFR).",
    paysMainCarriage: "Vendedor",
    insurance: "Vendedor (mínima por defecto)",
    stepOwner: {
      origen: "seller",
      precarriage: "seller",
      export: "seller",
      main: "seller",
      import: "buyer",
      oncarriage: "buyer",
    },
    riskStep: "main",
  },
];

function Timeline({ term, steps }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Responsabilidad de costos</span>
        <span>
          <span className={pill("bg-blue-100 text-blue-800")}>Vendedor</span>
          <span className="mx-2" />
          <span className={pill("bg-amber-100 text-amber-800")}>Comprador</span>
        </span>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {steps.map((s) => {
          const owner = term.stepOwner[s.key];
          const isRisk = term.riskStep === s.key;
          const base =
            owner === "seller"
              ? "bg-blue-600/15 border-blue-600/30"
              : "bg-amber-600/15 border-amber-600/30";
          return (
            <div
              key={s.key}
              className={`relative rounded-xl border px-2 py-3 ${base}`}
              title={s.label}
            >
              <div className="text-[11px] font-semibold leading-tight">{s.label}</div>
              {isRisk && (
                <div className="absolute -top-2 right-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                  RIESGO
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-sm">
        <span className="font-semibold">Transferencia de riesgo: </span>
        <span className="text-muted-foreground">{term.riskPoint}</span>
      </div>
    </div>
  );
}

function GuidanceBar({
  cargoKey,
  objectiveKey,
  lens,
  mode,
  setShowOnlyRecommended,
  showOnlyRecommended,
  recommendedCodes,
  avoidCodes,
}) {
  const cargoG = cargoGuidance[cargoKey];
  const objG = objectiveGuidance[objectiveKey];
  const showChips = cargoKey !== "All" || objectiveKey !== "None";

  return (
    <div className="rounded-2xl border bg-neutral-50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Contexto</div>
          <div className="text-lg font-semibold">
            {cargoKey === "All" ? "Sin filtro" : cargoG.title}
            {objectiveKey !== "None" && (
              <span className="text-muted-foreground font-normal"> · Objetivo: {objG.title}</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {objectiveKey !== "None" ? objG.subtitle : cargoG.subtitle}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pill("bg-neutral-100 text-neutral-800")}>
            Lente: {lens === "Export" ? "Exportación" : "Importación"}
          </span>
          <span className={pill("bg-neutral-100 text-neutral-800")}>
            Modo: {mode === "All" ? "Todos" : mode === "Any" ? "Cualquier modo" : "Marítimo"}
          </span>

          {showChips && (
            <Button
              size="sm"
              variant={showOnlyRecommended ? "default" : "outline"}
              onClick={() => setShowOnlyRecommended((v) => !v)}
              title="Filtra el listado para mostrar solo Incoterms recomendados para este contexto"
            >
              {showOnlyRecommended ? "Mostrando: Recomendados" : "Ver solo recomendados"}
            </Button>
          )}
        </div>
      </div>

      {showChips && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs font-semibold text-neutral-700">Recomendados (contexto)</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {recommendedCodes.length ? (
                recommendedCodes.map((c) => (
                  <span key={c} className={badge("bg-emerald-100 text-emerald-800")}>
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs font-semibold text-neutral-700">Evitar / Ojo</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {avoidCodes.length ? (
                avoidCodes.map((c) => (
                  <span key={c} className={badge("bg-red-100 text-red-800")}>
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs font-semibold text-neutral-700">Notas rápidas</div>
            <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground">
              {(objectiveKey !== "None" ? objG.notes : cargoG.notes).map((n, idx) => (
                <li key={idx}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function TermPanel({ title, term, steps, chips }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <h2 className="text-2xl font-bold">
            {term.code} – {term.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">{chips}</div>
      </div>

      <Timeline term={term} steps={steps} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold text-lg">Responsabilidades del vendedor</h3>
          <ul className="mt-2 list-disc list-inside text-sm">
            {term.sellerTasks.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold text-lg">Responsabilidades del comprador</h3>
          {term.buyerTasks.length ? (
            <ul className="mt-2 list-disc list-inside text-sm">
              {term.buyerTasks.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              El vendedor asume todas las responsabilidades principales.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IncotermsInteractive() {
  const [mode, setMode] = useState("All"); // All | Any | Sea
  const [lens, setLens] = useState("Export"); // Export | Import

  // NUEVO: tipo de carga + objetivo
  const [cargo, setCargo] = useState("All"); // All | Container | BreakBulk | Air
  const [objective, setObjective] = useState("None"); // None | ControlFreight | SimplifyDestination | MinimizeRisk
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);

  // NUEVO: comparación
  const [compareOn, setCompareOn] = useState(false);
const [autoSuggest, setAutoSuggest] = useState(true);
``  

  const steps = lens === "Export" ? STEPS_EXPORT : STEPS_IMPORT;

  const cargoG = cargoGuidance[cargo];
  const objG = objectiveGuidance[objective];

  const recommendedCodes = useMemo(() => {
    // Si ambos activos, usamos intersección para ser más estrictos.
    const cargoSet = new Set(cargoG.recommended);
    const objSet = new Set(objG.recommended);

    if (cargo === "All" && objective === "None") return [];
    if (cargo === "All") return [...objSet];
    if (objective === "None") return [...cargoSet];

    // intersección
    return [...cargoSet].filter((c) => objSet.has(c));
  }, [cargo, objective, cargoG.recommended, objG.recommended]);

  const avoidCodes = useMemo(() => {
    const cargoSet = new Set(cargoG.avoid);
    const objSet = new Set(objG.avoid);
    return Array.from(new Set([...cargoSet, ...objSet]));
  }, [cargoG.avoid, objG.avoid]);

  const recommendedSet = useMemo(() => new Set(recommendedCodes), [recommendedCodes]);
  const avoidSet = useMemo(() => new Set(avoidCodes), [avoidCodes]);

  const filtered = useMemo(() => {
    // 1) Modo
    let list = mode === "All" ? incoterms : incoterms.filter((t) => t.mode === mode);

    // 2) Tipo de carga + objetivo (solo si el usuario activa "solo recomendados")
    if ((cargo !== "All" || objective !== "None") && showOnlyRecommended) {
      const set = new Set(recommendedCodes);
      // Si no hay recomendados (p.ej. intersección vacía) no filtramos a vacío:
      if (set.size) list = list.filter((t) => set.has(t.code));
    }

    return list;
  }, [mode, cargo, objective, showOnlyRecommended, recommendedCodes]);

  const [selectedCode, setSelectedCode] = useState("EXW");
  const [compareCode, setCompareCode] = useState("FCA");

  // Ajusta selección si se sale de filtros.
  useEffect(() => {
    if (filtered.length && !filtered.some((t) => t.code === selectedCode)) {
      setSelectedCode(filtered[0].code);
    }
  }, [filtered, selectedCode]);

  useEffect(() => {
    if (compareOn && filtered.length && !filtered.some((t) => t.code === compareCode)) {
      // intenta asignar uno distinto al seleccionado
      const alt = filtered.find((t) => t.code !== selectedCode) || filtered[0];
      setCompareCode(alt.code);
    }
  }, [compareOn, filtered, compareCode, selectedCode]);

  // Si vuelve a "sin contexto", apaga el filtro de solo recomendados.
  useEffect(() => {
    if (cargo === "All" && objective === "None") setShowOnlyRecommended(false);
  }, [cargo, objective]);

  // Si activas comparación y ambos códigos son iguales, asigna un alterno.
  useEffect(() => {
    if (compareOn && compareCode === selectedCode) {
      const alt = filtered.find((t) => t.code !== selectedCode) || incoterms.find((t) => t.code !== selectedCode);
      if (alt) setCompareCode(alt.code);
    }
  }, [compareOn, compareCode, selectedCode, filtered]);

  const selected = useMemo(
    () => filtered.find((t) => t.code === selectedCode) || filtered[0] || incoterms[0],
    [filtered, selectedCode]
  );

  const compare = useMemo(
    () => filtered.find((t) => t.code === compareCode) || incoterms.find((t) => t.code === compareCode) || selected,
    [filtered, compareCode, selected]
  );

  const contextChip = (
    <>
      <span className={pill("bg-neutral-100 text-neutral-800")}>Lente: {lens === "Export" ? "Exportación" : "Importación"}</span>
      <span className={pill("bg-neutral-100 text-neutral-800")}>
        Modo: {selected.mode === "Sea" ? "Marítimo" : "Cualquier modo"}
      </span>
      <span className={pill("bg-emerald-100 text-emerald-800")}>Flete principal: {selected.paysMainCarriage}</span>
      <span className={pill("bg-orange-100 text-orange-800")}>Seguro: {selected.insurance}</span>
      {(cargo !== "All" || objective !== "None") && recommendedSet.has(selected.code) && (
        <span className={pill("bg-emerald-50 text-emerald-800")}>OK (contexto)</span>
      )}
      {(cargo !== "All" || objective !== "None") && avoidSet.has(selected.code) && (
        <span className={pill("bg-red-50 text-red-800")}>OJO (contexto)</span>
      )}
    </>
  );

  const compareChip = (
    <>
      <span className={pill("bg-neutral-100 text-neutral-800")}>Lente: {lens === "Export" ? "Exportación" : "Importación"}</span>
      <span className={pill("bg-neutral-100 text-neutral-800")}>
        Modo: {compare.mode === "Sea" ? "Marítimo" : "Cualquier modo"}
      </span>
      <span className={pill("bg-emerald-100 text-emerald-800")}>Flete principal: {compare.paysMainCarriage}</span>
      <span className={pill("bg-orange-100 text-orange-800")}>Seguro: {compare.insurance}</span>
      {(cargo !== "All" || objective !== "None") && recommendedSet.has(compare.code) && (
        <span className={pill("bg-emerald-50 text-emerald-800")}>OK (contexto)</span>
      )}
      {(cargo !== "All" || objective !== "None") && avoidSet.has(compare.code) && (
        <span className={pill("bg-red-50 text-red-800")}>OJO (contexto)</span>
      )}
    </>
  );

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Panel Izquierdo */}
      <Card className="lg:col-span-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Incoterms® 2020</h2>
            <span className={pill("bg-neutral-100 text-neutral-800")}>Uso interno</span>
          </div>

          {/* Tipo de carga */}
          <div>
            <div className={sectionTitle}>Tipo de carga</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {cargoTypes.map((c) => (
                <Button
                  key={c.key}
                  size="sm"
                  variant={cargo === c.key ? "default" : "outline"}
                  onClick={() => setCargo(c.key)}
                >
                  <span className="mr-2">{c.emoji}</span>
                  <span className="truncate">{c.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div>
            <div className={sectionTitle}>Objetivo</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {objectives.map((o) => (
                <Button
                  key={o.key}
                  size="sm"
                  variant={objective === o.key ? "default" : "outline"}
                  onClick={() => setObjective(o.key)}
                >
                  <span className="mr-2">{o.emoji}</span>
                  <span className="truncate">{o.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Lente */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={lens === "Export" ? "default" : "outline"}
              onClick={() => setLens("Export")}
              title="Vista típica de exportación (outbound)"
            >
              Lente: Exportación
            </Button>
            <Button
              size="sm"
              variant={lens === "Import" ? "default" : "outline"}
              onClick={() => setLens("Import")}
              title="Vista típica de importación / inbound (lo que ve la operación)"
            >
              Lente: Importación
            </Button>
          </div>

          {/* Modo */}
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "All" ? "default" : "outline"} onClick={() => setMode("All")}>Todos (11)</Button>
            <Button
              size="sm"
              variant={mode === "Any" ? "default" : "outline"}
              onClick={() => setMode("Any")}
              title="Aplican a cualquier modo de transporte"
            >
              Cualquier modo (7)
            </Button>
            <Button
              size="sm"
              variant={mode === "Sea" ? "default" : "outline"}
              onClick={() => setMode("Sea")}
              title="Solo marítimo / vías navegables interiores"
            >
              Marítimos (4)
            </Button>
          </div>

          {/* Comparación */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={compareOn ? "default" : "outline"}
              onClick={() => setCompareOn((v) => !v)}
              title="Activa comparación lado a lado"
            >
              {compareOn ? "Comparación: ON" : "Comparación: OFF"}
            </Button>
            {compareOn && (
              <span className={pill("bg-neutral-100 text-neutral-800")}>
                Selecciona el 2º Incoterm con <b>Alt + clic</b>
              </span>
            )}
          </div>

          {/* Listado */}
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((i) => {
              const isRecommended = (cargo !== "All" || objective !== "None") && recommendedSet.has(i.code);
              const isAvoid = (cargo !== "All" || objective !== "None") && avoidSet.has(i.code);
              const isSelected = selected?.code === i.code;
              const isCompare = compareOn && compare?.code === i.code;

              return (
                <Button
                  key={i.code}
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full justify-start ${isCompare ? "ring-2 ring-indigo-400" : ""}`}
                  onClick={(e) => {
                    // Alt + clic => asigna comparación
                    if (compareOn && (e.altKey || e.metaKey)) {
                      setCompareCode(i.code);
                      return;
                    }
                    setSelectedCode(i.code);
                  }}
                  title={compareOn ? "Clic = principal · Alt/Cmd = comparación" : "Seleccionar"}
                >
                  <span className="font-bold mr-2">{i.code}</span>
                  <span className="truncate">{i.name}</span>
                  <span className="ml-auto flex items-center gap-1">
                    {isRecommended && <span className={badge("bg-emerald-100 text-emerald-800")}>OK</span>}
                    {isAvoid && <span className={badge("bg-red-100 text-red-800")}>OJO</span>}
                    {isCompare && <span className={badge("bg-indigo-100 text-indigo-800")}>VS</span>}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="rounded-2xl border bg-neutral-50 p-3 text-sm text-muted-foreground">
            <div className="font-semibold text-neutral-900">Cómo leer esta vista</div>
            <ul className="list-disc list-inside">
              <li>Bloques azules = costos/gestión del <b>vendedor</b>.</li>
              <li>Bloques ámbar = costos/gestión del <b>comprador</b>.</li>
              <li>Etiqueta roja = <b>transferencia de riesgo</b>.</li>
              <li><b>Tipo de carga</b> + <b>Objetivo</b> agregan recomendaciones internas (no contractual).</li>
              <li><b>Comparación</b>: clic para principal y <b>Alt/Cmd + clic</b> para el segundo.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Panel Derecho */}
      <Card className="lg:col-span-8">
        <CardContent className="space-y-4 pt-6">
          <GuidanceBar
            cargoKey={cargo}
            objectiveKey={objective}
            lens={lens}
            mode={mode}
            showOnlyRecommended={showOnlyRecommended}
            setShowOnlyRecommended={setShowOnlyRecommended}
            recommendedCodes={recommendedCodes}
            avoidCodes={avoidCodes}
          />

          {/* Vista principal / comparación */}
          {!compareOn ? (
            <TermPanel
              title="Incoterm seleccionado"
              term={selected}
              steps={steps}
              chips={contextChip}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4">
                <TermPanel title="Principal" term={selected} steps={steps} chips={contextChip} />
              </div>
              <div className="rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">Comparación</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // swap
                      setSelectedCode(compare.code);
                      setCompareCode(selected.code);
                    }}
                    title="Intercambiar principal y comparación"
                  >
                    Swap
                  </Button>
                </div>
                <TermPanel title="Comparación" term={compare} steps={steps} chips={compareChip} />
              </div>
            </div>
          )}

          <div className="rounded-2xl border bg-neutral-50 p-4 text-sm">
            <div className="font-semibold">Nota interna</div>
            <p className="text-muted-foreground">
              Los Incoterms definen responsabilidades de costos/riesgo y ciertos trámites, pero no sustituyen el contrato de
              compraventa. Aclara siempre: lugar exacto (p.ej. “FCA Bogotá – Terminal X”), moneda, quién descarga, y
              condiciones de seguro. Este tablero incluye heurísticas internas por tipo de carga/objetivo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


