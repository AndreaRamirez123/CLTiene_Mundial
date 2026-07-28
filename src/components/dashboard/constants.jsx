export const C = {
  naranja: "var(--brand-primary)",
  dorado: "var(--brand-accent)",
  morado: "#822BD2",
  rosa: "#FC3276",
  azul: "#408DFF",
  verde: "#16C784",
  rojo: "var(--brand-secondary)",
  gris: "#999999",
  blanco: "#FFFFFF",
  negro: "#231F20",
};

export const formatearFecha = (fecha) => {
  if (!fecha) return "";
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const [, mes, dia] = fecha.split("-");
  return `${dia} ${meses[parseInt(mes) - 1]}`;
};

export const Bandera = ({ codigo, nombre, size = 36 }) => {
  // flagcdn usa ratio 4:3; tamaños disponibles: 24x18, 32x24, 48x36, 64x48, 96x72, 160x120
  const h = size;
  const w = Math.round(size * 4 / 3);
  const cdnSizes = [
    [18, "24x18"], [24, "32x24"], [36, "48x36"],
    [48, "64x48"], [72, "96x72"], [120, "160x120"],
  ];
  const cdn = cdnSizes.find(([s]) => s >= h)?.[1] ?? "96x72";
  return (
    <img
      src={`https://flagcdn.com/${cdn}/${codigo}.png`}
      alt={nombre}
      title={nombre}
      style={{ width: w, height: h, borderRadius: 4, objectFit: "cover", display: "block" }}
      onError={(e) => { e.target.style.display = "none"; }}
    />
  );
};
