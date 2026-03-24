import { useEffect, useMemo, useState } from "react";

function calcularTiempoRestante(targetDate) {
  const destino = new Date(targetDate).getTime();
  const ahora = Date.now();
  const diferencia = Math.max(destino - ahora, 0);

  const totalSegundos = Math.floor(diferencia / 1000);
  const dias = Math.floor(totalSegundos / (60 * 60 * 24));
  const horas = Math.floor((totalSegundos % (60 * 60 * 24)) / (60 * 60));
  const minutos = Math.floor((totalSegundos % (60 * 60)) / 60);
  const segundos = totalSegundos % 60;

  return {
    dias: String(dias).padStart(2, "0"),
    horas: String(horas).padStart(2, "0"),
    minutos: String(minutos).padStart(2, "0"),
    segundos: String(segundos).padStart(2, "0"),
    finalizado: diferencia === 0,
  };
}

export function useCountdown(targetDate) {
  const fechaObjetivo = useMemo(() => targetDate, [targetDate]);
  const [tiempo, setTiempo] = useState(() => calcularTiempoRestante(fechaObjetivo));

  useEffect(() => {
    setTiempo(calcularTiempoRestante(fechaObjetivo));

    const intervalId = window.setInterval(() => {
      setTiempo(calcularTiempoRestante(fechaObjetivo));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [fechaObjetivo]);

  return tiempo;
}
