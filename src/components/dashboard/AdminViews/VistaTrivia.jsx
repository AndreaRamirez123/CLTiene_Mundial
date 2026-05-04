import { useEffect, useMemo, useState } from "react";
import { C } from "../constants";

const nuevaPreguntaLote = () => ({
  id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
  pregunta: "",
  opciones: ["", "", "", ""],
  correcta: 0,
  tipo: "empresa",
  alcance: "empresa",
});

const inputBase = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--card-border)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--texto)",
  outline: "none",
  fontSize: 13,
  boxSizing: "border-box",
};

export default function VistaTrivia({ client, usuario, embedded = false, empresaIdFijo = null }) {
  const esSuperadmin = usuario?.rol === "superadmin";
  const [preguntas, setPreguntas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(empresaIdFijo || usuario?.empresa_id || "");
  const [lotePreguntas, setLotePreguntas] = useState([nuevaPreguntaLote()]);
  const [textoCargaRapida, setTextoCargaRapida] = useState("");
  const [tipoCargaRapida, setTipoCargaRapida] = useState("empresa");
  const [alcanceCargaRapida, setAlcanceCargaRapida] = useState("empresa");
  const [filtro, setFiltro] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [generando, setGenerando] = useState(false);

  const empresaObjetivo = empresaIdFijo || (esSuperadmin ? empresaSeleccionada : usuario?.empresa_id);

  const cargar = async () => {
    setCargando(true);
    try {
      const [preguntasRes, empresasRes] = await Promise.all([
        client.get("/preguntas"),
        esSuperadmin && !embedded ? client.get("/admin/empresas") : Promise.resolve({ data: [] }),
      ]);
      const preguntasOrdenadas = (preguntasRes.data || []).slice().sort((a, b) => Number(a.id) - Number(b.id));
      setPreguntas(preguntasOrdenadas);
      const listaEmpresas = empresasRes.data || [];
      setEmpresas(listaEmpresas);
      if (esSuperadmin && !empresaSeleccionada && listaEmpresas.length > 0) {
        setEmpresaSeleccionada(listaEmpresas[0].id);
      }
    } catch (err) {
      alert(err.response?.data?.message || "No se pudieron cargar las preguntas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (empresaIdFijo) setEmpresaSeleccionada(empresaIdFijo);
  }, [empresaIdFijo]);

  const preguntasVisibles = useMemo(() => {
    if (!embedded || !empresaObjetivo) return preguntas;
    return preguntas.filter((p) => !p.empresa_id || Number(p.empresa_id) === Number(empresaObjetivo));
  }, [preguntas, embedded, empresaObjetivo]);

  const resumen = useMemo(() => {
    const activas = preguntasVisibles.filter((p) => p.activa === 1).length;
    const mundial = preguntasVisibles.filter((p) => p.tipo === "mundial").length;
    const empresa = preguntasVisibles.filter((p) => p.tipo === "empresa").length;
    return { activas, mundial, empresa };
  }, [preguntasVisibles]);

  const preguntasFiltradas = useMemo(() => {
    return preguntasVisibles.filter((p) => {
      if (filtro === "todas") return true;
      if (filtro === "activas") return p.activa === 1;
      return p.tipo === filtro;
    });
  }, [preguntasVisibles, filtro]);

  const payloadPregunta = (pregunta) => {
    const tipo = pregunta.tipo || "empresa";
    const alcance = pregunta.alcance || "empresa";
    const rawEmpresaId =
      esSuperadmin && alcance === "global" && tipo === "mundial"
        ? undefined
        : empresaObjetivo;
    const empresaId = rawEmpresaId ? Number(rawEmpresaId) : undefined;

    return {
      pregunta: pregunta.pregunta?.trim(),
      opciones: pregunta.opciones?.map((op) => String(op).trim()),
      correcta: Number(pregunta.correcta),
      tipo,
      ...(empresaId ? { empresa_id: empresaId } : {}),
    };
  };

  const validarPayload = (payload) => {
    if (!payload.pregunta) return "Falta la pregunta";
    if (!payload.opciones || payload.opciones.length === 0 || payload.opciones.some((op) => !op)) {
      return "Cada pregunta debe tener opciones válidas";
    }

    if (payload.opciones.length === 2) {
      const normales = payload.opciones.map(normalizar);
      const esVF = normales.includes("verdadero") && normales.includes("falso");
      if (!esVF) {
        return "Las preguntas de 2 opciones deben ser Verdadero/Falso";
      }
    } else if (payload.opciones.length !== 4) {
      return "Cada pregunta debe tener 4 opciones";
    }

    if (payload.correcta < 0 || payload.correcta >= payload.opciones.length || Number.isNaN(payload.correcta)) {
      return "La respuesta correcta debe ser válida";
    }
    if (payload.tipo === "empresa" && !payload.empresa_id) {
      return "Las preguntas de empresa necesitan una empresa seleccionada";
    }
    return null;
  };

  const actualizarPreguntaLote = (id, key, value) => {
    setLotePreguntas((actual) =>
      actual.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const actualizarOpcionLote = (id, idx, value) => {
    setLotePreguntas((actual) =>
      actual.map((item) =>
        item.id === id
          ? {
              ...item,
              opciones: item.opciones.map((op, i) => (i === idx ? value : op)),
            }
          : item,
      ),
    );
  };

  const agregarPreguntaLote = () => {
    setLotePreguntas((actual) => [...actual, nuevaPreguntaLote()]);
  };

  const quitarPreguntaLote = (id) => {
    setLotePreguntas((actual) =>
      actual.length === 1 ? [nuevaPreguntaLote()] : actual.filter((item) => item.id !== id),
    );
  };

  const normalizar = (valor) =>
    String(valor || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const limpiarCelda = (valor) => String(valor || "").trim().replace(/^"|"$/g, "");

  const quitarNumeroPregunta = (linea) => String(linea || "").trim().replace(/^[0-9]+[\.)]?\s*/g, "");

  const dividirFila = (linea) => {
    const separador = linea.includes("\t") ? "\t" : linea.includes(";") ? ";" : ",";
    return linea.split(separador).map(limpiarCelda);
  };

  const limpiarRespuesta = (valor) =>
    String(valor || '')
      .trim()
      .replace(/^✅\s*/g, '')
      .replace(/^correcta[:\s]*/i, '')
      .replace(/^respuesta[:\s]*/i, '')
      .replace(/^[A-Da-d][\.\)\s]*/g, '')
      .replace(/^[1-4][\.\)\s]*/g, '')
      .replace(/[\.\)\s]+$/g, '')
      .trim();

  const esVerdaderoFalso = (linea) => {
    const limpia = normalizar(limpiarRespuesta(linea));
    return (
      ['verdadero', 'falso', 'v', 'f'].includes(limpia) ||
      /^[✅❌]/.test(String(linea || '')) ||
      /^(verdadero|falso)\b/i.test(String(linea || ''))
    );
  };

  const resolverCorrecta = (valor, opciones) => {
    const limpia = normalizar(limpiarRespuesta(valor));
    if (/^[1-4]$/.test(limpia)) return Number(limpia) - 1;
    if (/^[a-d]$/.test(limpia)) return limpia.charCodeAt(0) - 97;
    if (['verdadero', 'v'].includes(limpia)) return opciones.findIndex((op) => normalizar(op) === 'verdadero');
    if (['falso', 'f'].includes(limpia)) return opciones.findIndex((op) => normalizar(op) === 'falso');
    const porTexto = opciones.findIndex((opcion) => normalizar(opcion) === limpia);
    return porTexto >= 0 ? porTexto : null;
  };

  const limpiarOpcion = (linea) =>
    limpiarCelda(
      String(linea || '')
        .replace(/^[A-Da-d][\.\)]?\s*/g, '')
        .replace(/^[1-4][\.\)]?\s*/g, ''),
    );

  const esLineaRespuesta = (linea) => {
    const limpia = normalizar(limpiarRespuesta(linea));
    return (
      /^[1-4]$/.test(limpia) ||
      /^[a-d]$/.test(limpia) ||
      ['verdadero', 'falso', 'v', 'f'].includes(limpia) ||
      /^[✅❌]/.test(String(linea || ''))
    );
  };

  const parsearCargaRapida = () => {
    const bloques = textoCargaRapida
      .split(/\r?\n\s*\r?\n/)
      .map((bloque) =>
        bloque
          .split(/\r?\n/)
          .map((linea) => linea.trim())
          .map(quitarNumeroPregunta)
          .filter(Boolean),
      )
      .filter((bloque) => bloque.length > 0);

    const preguntasParseadas = [];
    const errores = [];

    const buscarSeparador = (linea) => {
      if (linea.includes('\t')) return '\t';
      if (linea.includes(';')) return ';';
      return null;
    };

    const parsearLineaFila = (linea, idxBloque, filaIdx) => {
      const separador = buscarSeparador(linea);
      if (!separador) {
        errores.push(`Bloque ${idxBloque + 1}, fila ${filaIdx + 1}: separador faltante`);
        return;
      }
      const celdas = linea.split(separador).map(limpiarCelda);
      const esEncabezado =
        filaIdx === 0 &&
        normalizar(celdas[0]).includes('pregunta') &&
        normalizar(celdas.join(' ')).includes('opcion');

      if (esEncabezado) return;
      if (celdas.length < 6) {
        errores.push(`Bloque ${idxBloque + 1}, fila ${filaIdx + 1}: faltan columnas`);
        return;
      }

      const [pregunta, op1, op2, op3, op4, correctaTexto] = celdas;
      const opciones = [op1, op2, op3, op4].map(limpiarOpcion);
      const correcta = resolverCorrecta(correctaTexto, opciones);

      if (!pregunta || opciones.some((opcion) => !opcion) || correcta === null) {
        errores.push(`Bloque ${idxBloque + 1}, fila ${filaIdx + 1}: pregunta incompleta o respuesta correcta invalida`);
        return;
      }

      preguntasParseadas.push({
        id: `${Date.now()}-${idxBloque}-${filaIdx}-${Math.round(Math.random() * 100000)}`,
        pregunta,
        opciones,
        correcta,
        tipo: tipoCargaRapida,
        alcance: alcanceCargaRapida,
      });
    };

    const parsearBloqueMultilinea = (lineas, idxBloque) => {
      let i = 0;
      while (i < lineas.length) {
        const pregunta = quitarNumeroPregunta(lineas[i]);
        if (!pregunta) {
          i += 1;
          continue;
        }

        const opciones = [];
        let j = i + 1;
        while (j < lineas.length && opciones.length < 4 && !esLineaRespuesta(lineas[j])) {
          opciones.push(limpiarOpcion(lineas[j]));
          j += 1;
        }

        if (opciones.length === 4) {
          let correcta = null;
          if (j < lineas.length && esLineaRespuesta(lineas[j])) {
            correcta = resolverCorrecta(lineas[j], opciones);
            j += 1;
          }

          if (correcta === null) {
            for (let k = 0; k < 4; k += 1) {
              const opcionOriginal = lineas[i + 1 + k] || '';
              if (/✅/.test(opcionOriginal) || /correcta/i.test(opcionOriginal)) {
                correcta = k;
                break;
              }
            }
          }

          if (!pregunta || opciones.some((opcion) => !opcion) || correcta === null) {
            errores.push(`Bloque ${idxBloque + 1}, pregunta ${Math.floor(i / 6) + 1}: pregunta incompleta o respuesta correcta invalida`);
            i = Math.max(i + 1, j);
            continue;
          }

          preguntasParseadas.push({
            id: `${Date.now()}-${idxBloque}-${i}-${Math.round(Math.random() * 100000)}`,
            pregunta,
            opciones,
            correcta,
            tipo: tipoCargaRapida,
            alcance: alcanceCargaRapida,
          });
          i = j;
          continue;
        }

        if (j === i + 1 && esLineaRespuesta(lineas[j])) {
          const opcionesVF = ['Verdadero', 'Falso'];
          const correctaVF = resolverCorrecta(lineas[j], opcionesVF);

          if (correctaVF !== null) {
            preguntasParseadas.push({
              id: `${Date.now()}-${idxBloque}-${i}-${Math.round(Math.random() * 100000)}`,
              pregunta,
              opciones: opcionesVF,
              correcta: correctaVF,
              tipo: tipoCargaRapida,
              alcance: alcanceCargaRapida,
            });
            i = j + 1;
            if (i < lineas.length && !esLineaRespuesta(lineas[i]) && !/^[0-9]+[\.)]?\s*/.test(lineas[i])) {
              i += 1;
            }
            continue;
          }
        }

        errores.push(`Bloque ${idxBloque + 1}, pregunta ${Math.floor(i / 6) + 1}: no se encontraron 4 opciones o formato de verdadero/falso valido`);
        i = Math.max(i + 1, j);
      }
    };

    bloques.forEach((bloque, idxBloque) => {
      const tieneFilas = bloque.every((linea) => buscarSeparador(linea));
      if (tieneFilas) {
        bloque.forEach((linea, filaIdx) => parsearLineaFila(linea, idxBloque, filaIdx));
      } else {
        parsearBloqueMultilinea(bloque, idxBloque);
      }
    });

    return { preguntasParseadas, errores };
  };

  const contarTiposPreguntas = (preguntas) => {
    const resumen = { total: preguntas.length, multiple: 0, vf: 0 };
    preguntas.forEach((pregunta) => {
      if (pregunta.opciones?.length === 2) resumen.vf += 1;
      else resumen.multiple += 1;
    });
    return resumen;
  };

  const cargarFilasAlFormulario = () => {
    const { preguntasParseadas, errores } = parsearCargaRapida();
    if (preguntasParseadas.length === 0) {
      return alert(errores[0] || "No se encontraron preguntas validas");
    }
    setLotePreguntas(preguntasParseadas);
    const total = preguntasParseadas.length + errores.length;
    const resumenTipos = contarTiposPreguntas(preguntasParseadas);
    alert(
      `${resumenTipos.total} preguntas cargadas al formulario de ${total} total` +
        ` (${resumenTipos.multiple} múltiple, ${resumenTipos.vf} V/F)` +
        `${errores.length ? ` - ${errores.length} omitidas` : ''}`,
    );
  };

  const guardarCargaRapida = async () => {
    const { preguntasParseadas, errores } = parsearCargaRapida();
    if (preguntasParseadas.length === 0) {
      return alert(errores[0] || "No se encontraron preguntas validas");
    }

    const payloads = preguntasParseadas.map(payloadPregunta);
    const validPayloads = [];
    const invalidReasons = [];

    payloads.forEach((payload) => {
      const error = validarPayload(payload);
      if (error) {
        invalidReasons.push(error);
      } else {
        validPayloads.push(payload);
      }
    });

    if (validPayloads.length === 0) {
      return alert(
        `No hay preguntas completas para guardar.${
          invalidReasons.length ? ` Primer error: ${invalidReasons[0]}` : ''
        }`,
      );
    }

    setGuardando(true);
    try {
      const res = await client.post("/preguntas/bulk", { preguntas: payloads });
      setTextoCargaRapida("");
      await cargar();
      const omitidas = errores.length + (res.data?.errores?.length || 0);
      const total = preguntasParseadas.length + errores.length;
      const resumenTipos = contarTiposPreguntas(preguntasParseadas);
      alert(
        `${res.data?.guardadas || payloads.length} preguntas guardadas de ${total} total` +
          ` (${resumenTipos.multiple} múltiple, ${resumenTipos.vf} V/F)` +
          `${omitidas ? ` (${omitidas} omitidas)` : ''}`,
      );
    } catch (err) {
      alert(err.response?.data?.message || "No se pudieron guardar las preguntas");
    } finally {
      setGuardando(false);
    }
  };

  const importarPreguntas = async () => {
    const completas = lotePreguntas.filter((item) => {
      const payload = payloadPregunta(item);
      return !validarPayload(payload);
    });

    if (completas.length === 0) {
      return alert("Agrega al menos una pregunta completa con sus 4 opciones");
    }

    setGuardando(true);
    try {
      const payloads = completas.map(payloadPregunta).filter((payload) => !validarPayload(payload));
      const res = await client.post("/preguntas/bulk", { preguntas: payloads });
      setLotePreguntas([nuevaPreguntaLote()]);
      await cargar();
      alert(`${res.data?.guardadas || payloads.length} preguntas guardadas`);
    } catch (err) {
      alert(err.response?.data?.message || "No se pudieron guardar las preguntas");
    } finally {
      setGuardando(false);
    }
  };

  const togglePregunta = async (id) => {
    await client.post(`/preguntas/${id}/toggle`);
    await cargar();
  };

  const eliminarPregunta = async (id) => {
    if (!confirm("Eliminar esta pregunta?")) return;
    await client.delete(`/preguntas/${id}`);
    await cargar();
  };

  const eliminarTodasPreguntas = async () => {
    const preguntasAEliminar = preguntasFiltradas.filter(p => puedeEditar(p));
    if (preguntasAEliminar.length === 0) {
      return alert("No hay preguntas que puedas eliminar");
    }
    if (!confirm(`¿Eliminar ${preguntasAEliminar.length} preguntas? Esta acción no se puede deshacer.`)) return;
    
    setGuardando(true);
    try {
      const eliminaciones = preguntasAEliminar.map(p => client.delete(`/preguntas/${p.id}`));
      await Promise.all(eliminaciones);
      await cargar();
      alert(`${preguntasAEliminar.length} preguntas eliminadas`);
    } catch (err) {
      alert("Error eliminando algunas preguntas");
    } finally {
      setGuardando(false);
    }
  };

  const puedeEditar = (pregunta) =>
    esSuperadmin || Number(pregunta.empresa_id) === Number(usuario?.empresa_id);

  const generarMundial = async () => {
    if (!empresaObjetivo) return alert("Selecciona una empresa");
    setGenerando(true);
    try {
      const res = await client.post(`/preguntas/generar/${empresaObjetivo}`, { cantidad: 12 });
      await cargar();
      alert(res.data?.mensaje || "Preguntas generadas");
    } catch (err) {
      alert(err.response?.data?.message || "No se pudieron generar preguntas con IA");
    } finally {
      setGenerando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: C.naranja }}>
        Cargando preguntas...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: embedded ? "100%" : 1120, margin: embedded ? "24px 0 0" : "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ color: "var(--texto)", fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>
            Trivia de marca
          </h2>
          <p style={{ color: "var(--texto-sec)", fontSize: 13, margin: 0 }}>
            Agrega preguntas de la empresa; se mezclan cada dia con 3 preguntas del Mundial generadas para el banco.
          </p>
        </div>
        <button
          type="button"
          onClick={generarMundial}
          disabled={generando}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: generando ? "rgba(255,255,255,0.08)" : "rgba(64,141,255,0.18)",
            color: generando ? "var(--texto-ter)" : "#408DFF",
            fontWeight: 800,
            cursor: generando ? "wait" : "pointer",
          }}
        >
          {generando ? "Generando..." : "Generar Mundial con IA"}
        </button>
      </div>

      {esSuperadmin && !embedded && empresas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: "block", color: "var(--texto-sec)", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Empresa para preguntas de marca e IA
          </span>
          <select
            value={empresaSeleccionada}
            onChange={(e) => setEmpresaSeleccionada(e.target.value)}
            style={inputBase}
          >
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id} style={{ background: "#1a1a2e", color: "#fff" }}>
                {empresa.nombre} ({empresa.slug})
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
        <Dato label="Total preguntas" valor={embedded ? preguntasVisibles.length : preguntas.length} />
        <Dato label="Activas" valor={resumen.activas} />
        <Dato label="Mundial" valor={resumen.mundial} />
        <Dato label="Empresa" valor={resumen.empresa} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: embedded ? "1fr" : "minmax(280px, 380px) 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 14, padding: 16 }}>
          <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid var(--card-border)" }}>
            <h3 style={{ color: "var(--texto)", margin: "0 0 10px", fontSize: 15 }}>Carga rapida</h3>
            <label style={labelStyle}>
              Tipo para esta carga
              <select
                value={tipoCargaRapida}
                onChange={(e) => setTipoCargaRapida(e.target.value)}
                style={inputBase}
              >
                <option value="empresa" style={{ background: "#1a1a2e", color: "#fff" }}>Empresa</option>
                <option value="mundial" style={{ background: "#1a1a2e", color: "#fff" }}>Mundial</option>
              </select>
            </label>

            {esSuperadmin && tipoCargaRapida === "mundial" && (
              <label style={labelStyle}>
                Alcance
                <select
                  value={alcanceCargaRapida}
                  onChange={(e) => setAlcanceCargaRapida(e.target.value)}
                  style={inputBase}
                >
                  <option value="empresa" style={{ background: "#1a1a2e", color: "#fff" }}>Solo empresa seleccionada</option>
                  <option value="global" style={{ background: "#1a1a2e", color: "#fff" }}>Global para todas</option>
                </select>
              </label>
            )}

            <textarea
              value={textoCargaRapida}
              onChange={(e) => setTextoCargaRapida(e.target.value)}
              rows={9}
              style={{ ...inputBase, resize: "vertical", fontFamily: "inherit", lineHeight: 1.45 }}
              placeholder={
                "Pregunta\nA. Opcion 1\nB. Opcion 2\nC. Opcion 3\nD. Opcion 4\n✅ B\n\nVerdadero/falso:\nPregunta\n✅ Verdadero\n\nO bien en una sola linea separada por tabuladores o punto y coma:\nPregunta\tOpcion1\tOpcion2\tOpcion3\tOpcion4\tCorrecta"
              }
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <button type="button" onClick={cargarFilasAlFormulario} disabled={guardando} style={botonSecundario}>
                Revisar filas
              </button>
              <button type="button" onClick={guardarCargaRapida} disabled={guardando} style={botonPrimario}>
                {guardando ? "Guardando..." : "Guardar filas"}
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ color: "var(--texto)", margin: 0, fontSize: 15 }}>Agregar varias preguntas</h3>
              <button type="button" onClick={agregarPreguntaLote} style={{ ...botonMini, color: "#16C784" }}>
                + Agregar otra
              </button>
            </div>

            <div style={{ display: "grid", gap: 12, maxHeight: 640, overflowY: "auto", paddingRight: 4 }}>
              {lotePreguntas.map((item, preguntaIdx) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: 12,
                    padding: 12,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <div style={{ color: "var(--texto)", fontWeight: 900, fontSize: 13 }}>
                      Pregunta {preguntaIdx + 1}
                    </div>
                    <button type="button" onClick={() => quitarPreguntaLote(item.id)} style={{ ...botonMini, color: "#ED1E28" }}>
                      Quitar
                    </button>
                  </div>

                  <label style={labelStyle}>
                    Tipo
                    <select
                      value={item.tipo}
                      onChange={(e) => actualizarPreguntaLote(item.id, "tipo", e.target.value)}
                      style={inputBase}
                    >
                      <option value="empresa" style={{ background: "#1a1a2e", color: "#fff" }}>Empresa</option>
                      <option value="mundial" style={{ background: "#1a1a2e", color: "#fff" }}>Mundial</option>
                    </select>
                  </label>

                  <label style={labelStyle}>
                    Pregunta
                    <textarea
                      value={item.pregunta}
                      onChange={(e) => actualizarPreguntaLote(item.id, "pregunta", e.target.value)}
                      rows={2}
                      style={{ ...inputBase, resize: "vertical", fontFamily: "inherit" }}
                      placeholder="Escribe la pregunta..."
                    />
                  </label>

                  {item.opciones.map((opcion, idx) => (
                    <label key={idx} style={labelStyle}>
                      Opcion {idx + 1}
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={opcion}
                          onChange={(e) => actualizarOpcionLote(item.id, idx, e.target.value)}
                          style={inputBase}
                          placeholder={`Opcion ${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => actualizarPreguntaLote(item.id, "correcta", idx)}
                          style={{
                            width: 42,
                            borderRadius: 10,
                            border: "none",
                            background: item.correcta === idx ? "rgba(22,199,132,0.22)" : "rgba(255,255,255,0.08)",
                            color: item.correcta === idx ? "#16C784" : "var(--texto-sec)",
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                          title="Respuesta correcta"
                        >
                          OK
                        </button>
                      </div>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <button type="button" onClick={importarPreguntas} disabled={guardando} style={{ ...botonPrimario, marginTop: 10 }}>
              {guardando ? "Guardando..." : "Guardar varias preguntas"}
            </button>
          </div>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <h3 style={{ color: "var(--texto)", margin: 0, fontSize: 16 }}>Banco de preguntas</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ ...inputBase, width: 180 }}>
                <option value="todas" style={{ background: "#1a1a2e", color: "#fff" }}>Todas</option>
                <option value="activas" style={{ background: "#1a1a2e", color: "#fff" }}>Activas</option>
                <option value="mundial" style={{ background: "#1a1a2e", color: "#fff" }}>Mundial</option>
                <option value="empresa" style={{ background: "#1a1a2e", color: "#fff" }}>Empresa</option>
              </select>
              <button 
                type="button" 
                onClick={eliminarTodasPreguntas} 
                disabled={guardando || preguntasFiltradas.filter(p => puedeEditar(p)).length === 0}
                style={{ 
                  ...botonMini, 
                  color: "#ED1E28",
                  opacity: guardando || preguntasFiltradas.filter(p => puedeEditar(p)).length === 0 ? 0.5 : 1,
                  cursor: guardando || preguntasFiltradas.filter(p => puedeEditar(p)).length === 0 ? "not-allowed" : "pointer"
                }}
                title="Eliminar todas las preguntas visibles"
              >
                {guardando ? "Eliminando..." : "Eliminar todas"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, maxHeight: 720, overflowY: "auto", paddingRight: 4 }}>
            {preguntasFiltradas.map((p) => (
              <div key={p.id} style={{ border: "1px solid var(--card-border)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={chip(p.tipo === "mundial" ? "#408DFF" : C.naranja)}>
                        {p.tipo === "mundial" ? "Mundial" : "Empresa"}
                      </span>
                      <span style={chip(p.empresa_id ? "#16C784" : "#ECA82D")}>
                        {p.empresa_id ? `Empresa ${p.empresa_id}` : "Global"}
                      </span>
                      <span style={chip(p.activa === 1 ? "#16C784" : "#ED1E28")}>
                        {p.activa === 1 ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <div style={{ color: "var(--texto)", fontWeight: 800, fontSize: 13, lineHeight: 1.35 }}>
                      {p.pregunta}
                    </div>
                    <div style={{ color: "var(--texto-ter)", fontSize: 11, marginTop: 6 }}>
                      Usada {p.veces_usada || 0} veces {p.ultima_usada ? `- ultima: ${p.ultima_usada}` : ""}
                    </div>
                  </div>
                  {puedeEditar(p) && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button type="button" onClick={() => togglePregunta(p.id)} style={botonMini}>
                        {p.activa === 1 ? "Pausar" : "Activar"}
                      </button>
                      <button type="button" onClick={() => eliminarPregunta(p.id)} style={{ ...botonMini, color: "#ED1E28" }}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 6, marginTop: 10 }}>
                  {(p.opciones || []).map((op, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "7px 8px",
                        borderRadius: 8,
                        fontSize: 11,
                        color: idx === p.correcta ? "#16C784" : "var(--texto-sec)",
                        background: idx === p.correcta ? "rgba(22,199,132,0.12)" : "rgba(255,255,255,0.04)",
                        border: idx === p.correcta ? "1px solid rgba(22,199,132,0.25)" : "1px solid transparent",
                      }}
                    >
                      {idx + 1}. {op}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {preguntasFiltradas.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--texto-ter)", padding: 30 }}>
                No hay preguntas para este filtro.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  color: "var(--texto-sec)",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 12,
};

const botonPrimario = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, #FD7751, #FF9066)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const botonSecundario = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid var(--card-border)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--texto-sec)",
  fontWeight: 900,
  cursor: "pointer",
};

const botonMini = {
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid var(--card-border)",
  background: "rgba(255,255,255,0.05)",
  color: "var(--texto-sec)",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

function chip(color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 7px",
    borderRadius: 999,
    background: `${color}18`,
    color,
    fontSize: 10,
    fontWeight: 900,
  };
}

function Dato({ label, valor }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 14 }}>
      <div style={{ color: "var(--texto-sec)", fontSize: 11, fontWeight: 700 }}>{label}</div>
      <div style={{ color: C.naranja, fontSize: 24, fontWeight: 900 }}>{valor}</div>
    </div>
  );
}
