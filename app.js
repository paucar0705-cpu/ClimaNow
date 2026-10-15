const URL_GEOCODIFICACION = "https://geocoding-api.open-meteo.com/v1/search";
const URL_PRONOSTICO = "https://api.open-meteo.com/v1/forecast";

const formulario = document.querySelector("#formulario-busqueda");
const campoCiudad = document.querySelector("#ciudad");
const botonBuscar = formulario.querySelector('button[type="submit"]');
const estadoCarga = document.querySelector("#estado-carga");
const contenedorResultados = document.querySelector("#resultados");
const mensajeError = document.querySelector("#mensaje-error");

let controladorActivo = null;

formulario.addEventListener("submit", buscarClima);
campoCiudad.addEventListener("input", manejarEdicionCiudad);

function manejarEdicionCiudad() {
  mensajeError.textContent = "";

  if (controladorActivo) {
    controladorActivo.abort();
    controladorActivo = null;
    cambiarEstadoCarga(false);
  }
}

async function buscarClima(evento) {
  evento.preventDefault();

  controladorActivo?.abort();
  controladorActivo = null;
  cambiarEstadoCarga(false);

  const ciudad = campoCiudad.value.trim();
  limpiarInterfaz();

  if (ciudad.length < 2) {
    mostrarError("Escribe una ciudad de al menos dos caracteres.");
    campoCiudad.focus();
    return;
  }

  if (!navigator.onLine) {
    mostrarError("No hay conexión a internet. Revisa tu conexión e inténtalo de nuevo.");
    return;
  }

  const controlador = new AbortController();
  controladorActivo = controlador;
  cambiarEstadoCarga(true, "Buscando la ciudad...");

  try {
    const ubicacion = await obtenerUbicacion(ciudad, controlador.signal);
    cambiarEstadoCarga(true, "Consultando el clima actual...");

    const pronostico = await obtenerPronostico(ubicacion, controlador.signal);
    mostrarResultado(ubicacion, pronostico);
  } catch (error) {
    if (error.name !== "AbortError") {
      mostrarError(normalizarMensajeError(error));
    }
  } finally {
    if (controladorActivo === controlador) {
      cambiarEstadoCarga(false);
      controladorActivo = null;
    }
  }
}

async function obtenerUbicacion(ciudad, signal) {
  const parametros = new URLSearchParams({
    name: ciudad,
    count: "1",
    language: "es",
    format: "json",
  });

  const datos = await solicitarJson(
    `${URL_GEOCODIFICACION}?${parametros.toString()}`,
    signal,
  );

  if (!Array.isArray(datos.results) || datos.results.length === 0) {
    throw new Error("No encontramos ninguna ciudad con ese nombre.");
  }

  const ubicacion = datos.results[0];
  if (!esNumeroValido(ubicacion.latitude) || !esNumeroValido(ubicacion.longitude)) {
    throw new Error("La ubicación encontrada no contiene coordenadas válidas.");
  }

  return ubicacion;
}

async function obtenerPronostico(ubicacion, signal) {
  const parametros = new URLSearchParams({
    latitude: String(ubicacion.latitude),
    longitude: String(ubicacion.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "weather_code",
    ].join(","),
    timezone: "auto",
  });

  const datos = await solicitarJson(
    `${URL_PRONOSTICO}?${parametros.toString()}`,
    signal,
  );

  if (!datos.current || typeof datos.current !== "object") {
    throw new Error("El servicio no devolvió datos del clima actual.");
  }

  const campos = [
    datos.current.temperature_2m,
    datos.current.relative_humidity_2m,
    datos.current.wind_speed_10m,
    datos.current.weather_code,
  ];

  if (campos.every((valor) => !esNumeroValido(valor))) {
    throw new Error("Los datos meteorológicos recibidos están incompletos.");
  }

  return datos;
}

async function solicitarJson(url, signal) {
  let respuesta;

  try {
    respuesta = await fetch(url, { signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "No fue posible conectar con el servicio meteorológico. Revisa tu conexión.",
    );
  }

  if (!respuesta.ok) {
    if (respuesta.status === 429) {
      throw new Error(
        "Se alcanzó temporalmente el límite de consultas. Espera un momento e inténtalo de nuevo.",
      );
    }

    if (respuesta.status >= 500) {
      throw new Error(
        "El servicio meteorológico no está disponible en este momento. Inténtalo más tarde.",
      );
    }

    throw new Error(`La consulta no pudo completarse (HTTP ${respuesta.status}).`);
  }

  const contenido = await respuesta.text();
  if (!contenido.trim()) {
    throw new Error("El servicio meteorológico devolvió una respuesta vacía.");
  }

  let datos;
  try {
    datos = JSON.parse(contenido);
  } catch {
    throw new Error("El servicio meteorológico devolvió una respuesta no válida.");
  }

  if (!datos || typeof datos !== "object") {
    throw new Error("El servicio meteorológico devolvió datos vacíos.");
  }

  if (datos.error === true) {
    throw new Error(
      typeof datos.reason === "string"
        ? `El servicio rechazó la consulta: ${datos.reason}`
        : "El servicio meteorológico rechazó la consulta.",
    );
  }

  return datos;
}

function mostrarResultado(ubicacion, pronostico) {
  limpiarResultados();

  const actuales = pronostico.current;
  const unidades = pronostico.current_units ?? {};
  const valores = [
    ["Temperatura", actuales.temperature_2m, unidades.temperature_2m],
    ["Humedad relativa", actuales.relative_humidity_2m, unidades.relative_humidity_2m],
    ["Velocidad del viento", actuales.wind_speed_10m, unidades.wind_speed_10m],
  ];

  const titulo = document.createElement("h3");
  titulo.textContent = nombreCompletoUbicacion(ubicacion);

  const descripcion = document.createElement("p");
  descripcion.className = "descripcion-clima";
  descripcion.textContent = describirCodigoMeteorologico(actuales.weather_code);

  const lista = document.createElement("dl");
  lista.className = "clima-detalles";

  for (const [etiqueta, valor, unidad] of valores) {
    const grupo = document.createElement("div");
    const termino = document.createElement("dt");
    const detalle = document.createElement("dd");

    termino.textContent = etiqueta;
    detalle.textContent = formatearMedicion(valor, unidad);
    grupo.append(termino, detalle);
    lista.append(grupo);
  }

  contenedorResultados.append(titulo, descripcion, lista);

  const hayDatosIncompletos = valores.some(([, valor]) => !esNumeroValido(valor));
  if (hayDatosIncompletos || !esNumeroValido(actuales.weather_code)) {
    const aviso = document.createElement("p");
    aviso.className = "aviso-datos";
    aviso.textContent = "Algunos datos no están disponibles para esta ubicación.";
    contenedorResultados.append(aviso);
  }
}

function describirCodigoMeteorologico(codigo) {
  const descripciones = new Map([
    [0, "Cielo despejado"],
    [1, "Mayormente despejado"],
    [2, "Parcialmente nublado"],
    [3, "Cielo nublado"],
    [45, "Niebla"],
    [48, "Niebla con escarcha"],
    [51, "Llovizna ligera"],
    [53, "Llovizna moderada"],
    [55, "Llovizna intensa"],
    [56, "Llovizna helada ligera"],
    [57, "Llovizna helada intensa"],
    [61, "Lluvia ligera"],
    [63, "Lluvia moderada"],
    [65, "Lluvia intensa"],
    [66, "Lluvia helada ligera"],
    [67, "Lluvia helada intensa"],
    [71, "Nevada ligera"],
    [73, "Nevada moderada"],
    [75, "Nevada intensa"],
    [77, "Granos de nieve"],
    [80, "Chubascos ligeros"],
    [81, "Chubascos moderados"],
    [82, "Chubascos intensos"],
    [85, "Chubascos de nieve ligeros"],
    [86, "Chubascos de nieve intensos"],
    [95, "Tormenta eléctrica"],
    [96, "Tormenta con granizo ligero"],
    [99, "Tormenta con granizo intenso"],
  ]);

  if (!esNumeroValido(codigo)) {
    return "Condición meteorológica no disponible";
  }

  return descripciones.get(Number(codigo)) ?? `Condición meteorológica (código ${codigo})`;
}

function nombreCompletoUbicacion(ubicacion) {
  const partes = [ubicacion.name, ubicacion.admin1, ubicacion.country].filter(
    (parte, indice, arreglo) =>
      typeof parte === "string" &&
      parte.trim() !== "" &&
      arreglo.indexOf(parte) === indice,
  );

  return partes.join(", ") || "Ubicación encontrada";
}

function formatearMedicion(valor, unidad) {
  if (!esNumeroValido(valor)) {
    return "No disponible";
  }

  const unidadSegura = typeof unidad === "string" ? unidad : "";
  return `${valor}${unidadSegura ? ` ${unidadSegura}` : ""}`;
}

function esNumeroValido(valor) {
  return valor !== null && valor !== "" && Number.isFinite(Number(valor));
}

function cambiarEstadoCarga(cargando, mensaje = "") {
  estadoCarga.textContent = cargando ? mensaje : "";
  botonBuscar.disabled = cargando;
  formulario.setAttribute("aria-busy", String(cargando));
  contenedorResultados.setAttribute("aria-busy", String(cargando));
}

function limpiarInterfaz() {
  mensajeError.textContent = "";
  limpiarResultados();
}

function limpiarResultados() {
  for (const elemento of [...contenedorResultados.children]) {
    if (elemento.id !== "titulo-resultados") {
      elemento.remove();
    }
  }
}

function mostrarError(mensaje) {
  limpiarResultados();
  mensajeError.textContent = mensaje;
}

function normalizarMensajeError(error) {
  return error instanceof Error && error.message
    ? error.message
    : "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
