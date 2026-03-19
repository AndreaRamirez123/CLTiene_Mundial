export const C = {
  naranja: "#FD7751",
  dorado: "#ECA82D",
  morado: "#822BD2",
  rosa: "#FC3276",
  azul: "#408DFF",
  verde: "#16C784",
  rojo: "#ED1E28",
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

export const Bandera = ({ codigo, nombre, size = 36 }) => (
  <img
    src={`https://flagcdn.com/${size === 36 ? "48x36" : "32x24"}/${codigo}.png`}
    alt={nombre}
    style={{
      width: size === 36 ? 48 : 32,
      height: size,
      borderRadius: 4,
      objectFit: "cover",
    }}
    onError={(e) => {
      e.target.style.display = "none";
    }}
  />
);
