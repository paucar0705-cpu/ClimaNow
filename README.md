# ClimaNow

ClimaNow es una aplicación web desarrollada con HTML, CSS y JavaScript sin
frameworks. Permite escribir el nombre de una ciudad, localizarla y consultar
su clima actual.

## Funcionalidad

- Validación del campo de ciudad.
- Consulta de ciudades mediante geocodificación.
- Consulta de temperatura, humedad relativa, velocidad del viento y condición
  meteorológica actual.
- Estados accesibles de carga, resultados y error.
- Manejo de ciudades sin coincidencias, falta de conexión, respuestas HTTP no
  satisfactorias, límite `429`, respuestas vacías y datos incompletos.
- Diseño adaptable a celular y computadora.
- Cancelación de solicitudes anteriores cuando cambia la búsqueda.
- Inserción de datos externos mediante `textContent`, sin usar `innerHTML`.

## Tecnologías

- HTML5 semántico.
- CSS3.
- JavaScript moderno: `fetch`, `async`/`await`, `AbortController` y APIs del DOM.
- [Open-Meteo](https://open-meteo.com/) para geocodificación y clima.

No se usan dependencias, frameworks ni claves de API.

## Requisitos de ejecución

- Un navegador moderno con soporte para JavaScript, `fetch` y CSS `:has()`.
- Conexión a internet para consultar Open-Meteo.
- Opcionalmente, Python 3 u otro servidor HTTP local.

## Cómo ejecutar el proyecto

La opción recomendada es servir la carpeta mediante HTTP. Desde la raíz del
proyecto ejecuta:

```powershell
python -m http.server 8000
```

Después visita [http://localhost:8000](http://localhost:8000).

También se puede abrir `index.html` directamente, aunque un servidor local
representa mejor la forma en que se publica una aplicación web.

## APIs utilizadas

### Geocodificación

Endpoint:

```text
https://geocoding-api.open-meteo.com/v1/search
```

La aplicación envía el nombre de la ciudad y solicita una coincidencia en
español. De la respuesta utiliza el nombre, país, región, latitud y longitud.

Parámetros utilizados:

- `name`: texto escrito por la persona usuaria.
- `count=1`: una coincidencia.
- `language=es`: nombres localizados al español cuando estén disponibles.
- `format=json`: respuesta JSON.

Documentación: [Geocoding API](https://open-meteo.com/en/docs/geocoding-api).

### Pronóstico y condiciones actuales

Endpoint:

```text
https://api.open-meteo.com/v1/forecast
```

La latitud y longitud obtenidas en la primera consulta se usan para solicitar:

- `temperature_2m`.
- `relative_humidity_2m`.
- `wind_speed_10m`.
- `weather_code`.
- `timezone=auto`.

Las unidades se leen de `current_units` en lugar de escribirlas de forma fija.
El código meteorológico se transforma en una descripción sencilla basada en
los códigos WMO que devuelve Open-Meteo.

Documentación: [Weather Forecast API](https://open-meteo.com/en/docs).

### Claves y datos enviados

La versión actual usa los endpoints públicos de Open-Meteo y **no utiliza una
clave de API**. No hay contraseñas, tokens ni archivos `.env` requeridos.

Las búsquedas envían a Open-Meteo el texto de la ciudad y, en la segunda
consulta, las coordenadas devueltas por su servicio de geocodificación.

## Flujo de la aplicación

1. Se valida y normaliza el texto del formulario.
2. Se consulta la API de geocodificación.
3. Si existe una coincidencia con coordenadas válidas, se consulta el clima.
4. Se validan la respuesta HTTP, el cuerpo JSON y los campos meteorológicos.
5. Se crean nodos DOM seguros para mostrar los resultados.
6. Si ocurre un problema, se muestra un mensaje específico y accesible.

## Verificaciones técnicas realizadas por Codex

Última revisión técnica: **14 de octubre de 2026**.

- `node --check app.js`: sintaxis JavaScript válida.
- `git diff --check`: sin errores de espacios en los archivos rastreados.
- Revisión de seguridad: no se encontraron usos de `innerHTML`, claves o
  secretos en los archivos de la aplicación.
- Pruebas controladas con respuestas simuladas: 7 de 7 escenarios completados.
- Prueba de contrato real limitada a una geocodificación y un pronóstico: la
  respuesta incluyó coordenadas, los cuatro campos actuales y sus unidades.
- El estado `429` se simuló localmente; no se intentó provocar el límite real
  del servicio.

Estas verificaciones fueron ejecutadas por Codex mediante revisión del código,
comandos no destructivos y respuestas controladas. No sustituyen las pruebas
visuales realizadas por la persona autora.

Las pruebas simuladas verificaron: ciudad válida, ciudad inexistente y limpieza
del error al editar, entrada vacía, falta de conexión, HTTP `429`, cuerpo HTTP
vacío y datos meteorológicos parciales o completamente ausentes.

## Comprobaciones manuales realizadas por la persona autora

Las casillas marcadas corresponden únicamente a las comprobaciones que la
persona autora indicó haber realizado en el navegador. Las demás permanecen
pendientes y no deben considerarse verificadas.

- [x] **Ciudad válida:** se comprobaron búsquedas como `Mérida` y `Madrid`, con
  ubicación, descripción, temperatura, humedad y viento.
- [x] **Ciudad inexistente:** se comprobó que una búsqueda sin coincidencias
  mostrara un error y no conservara resultados anteriores.
- [x] **Campo vacío:** se comprobó la validación del campo. También se verificó
  que, al editar después de un error, el mensaje rojo anterior desapareciera.
- [x] **Sin conexión:** se comprobó el estado sin conexión desde las
  herramientas de desarrollo y la aparición del mensaje correspondiente.
- [x] **HTTP 429 simulado:** se sustituyó temporalmente `fetch` para devolver
  `429`, sin enviar consultas repetidas ni intentar limitar el servicio real.
- [x] **Respuesta HTTP 200 vacía:** se simuló una respuesta satisfactoria sin
  cuerpo y se comprobó el mensaje de error.
- [x] **Celular:** se revisó visualmente la interfaz en modo adaptable y se
  comprobó que el contenido se ajustara a una pantalla móvil.
- [ ] **Datos meteorológicos incompletos:** simular campos individuales ausentes
  y comprobar los valores `No disponible` y el aviso correspondiente.
- [ ] **Solicitudes consecutivas:** realizar dos búsquedas rápidamente; solo la
  búsqueda más reciente debe actualizar la interfaz.
- [ ] **Teclado:** recorrer campo y botón con `Tab`; el foco debe ser visible.
- [ ] **Computadora a 1280 px o más:** confirmar que el contenido conserve una
  anchura legible.

Resultados esperados de referencia para repetir las pruebas:

- **Ciudad válida:** debe aparecer ubicación,
  descripción, temperatura, humedad y viento con sus unidades.
- **Ciudad inexistente:** buscar `CiudadInventadaXYZ`; debe mostrarse un
  mensaje sin conservar resultados anteriores.
- **Campo vacío:** borrar el contenido e intentar enviar; el navegador debe
  aplicar `required`. Al editar después de un error, el mensaje rojo anterior
  debe desaparecer.
- **Sin conexión:** en las herramientas de desarrollo, abrir **Network**,
  seleccionar **Offline** y buscar una ciudad; debe aparecer el mensaje de
  conexión. Restaurar **Online** al terminar.
- **Celular:** un tamaño de referencia posible es `375 × 667` px; el formulario
  y las tarjetas no deben desbordarse.

### Simular HTTP 429 sin bombardear Open-Meteo

En la consola del navegador ejecuta:

```js
window.fetch = async () => new Response("", { status: 429 });
```

Realiza una búsqueda. Debe aparecer el mensaje de límite temporal. Recarga la
página al terminar para restaurar `fetch`.

### Simular una respuesta HTTP 200 vacía

En la consola ejecuta:

```js
window.fetch = async () => new Response("", { status: 200 });
```

Realiza una búsqueda. Debe aparecer el mensaje de respuesta vacía. Recarga la
página al terminar.

### Simular datos meteorológicos incompletos

Recarga primero la página. Después ejecuta este código en la consola:

```js
const fetchReal = window.fetch.bind(window);

window.fetch = async (recurso, opciones) => {
  if (String(recurso).includes("api.open-meteo.com/v1/forecast")) {
    return new Response(
      JSON.stringify({
        current: { temperature_2m: 25 },
        current_units: { temperature_2m: "°C" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return fetchReal(recurso, opciones);
};
```

Busca una ciudad válida. La temperatura debe mostrarse; humedad y viento deben
indicar `No disponible`, acompañados por un aviso de datos incompletos. Recarga
la página para eliminar la simulación.

## Estructura

```text
.
├── index.html
├── styles.css
├── app.js
├── README.md
└── .gitignore
```

## Declaración de uso de Codex y ChatGPT

- **Herramientas utilizadas:** Codex y ChatGPT.
- **Uso de Codex:** se utilizó para planificar la estructura del proyecto,
  generar código HTML, CSS y JavaScript, integrar las APIs de Open-Meteo,
  depurar el comportamiento del formulario, realizar verificaciones técnicas y
  crear la documentación.
- **Uso de ChatGPT como tutor:** se utilizó para organizar los prompts, revisar
  resultados, planificar las pruebas y preparar las evidencias del proceso.
- **Indicaciones proporcionadas:** se solicitaron avances por etapas,
  validaciones antes de publicar, manejo específico de errores, pruebas no
  destructivas y conservación de evidencia real en Git y GitHub.
- **Sugerencias incorporadas:** estructura HTML semántica, diseño adaptable,
  integración de Open-Meteo, manejo de estados y errores, corrección del aviso
  persistente y documentación de ejecución y pruebas.
- **Sugerencias rechazadas o modificadas:** no se declara ninguna porque no se
  cuenta con evidencia suficiente para describirla con precisión.
- **Método de verificación:** Codex ejecutó comprobaciones técnicas de sintaxis,
  formato, respuestas simuladas y contrato de la API. La persona autora realizó
  por separado las comprobaciones manuales declaradas en la sección anterior.
- **Periodo de uso documentado:** durante el desarrollo de ClimaNow, hasta el
  14 de octubre de 2026.

Declaración de la persona autora:

> Utilicé Codex para apoyar la planificación, generación, integración,
> depuración, verificación técnica y documentación de ClimaNow. También utilicé
> ChatGPT como tutor para estructurar mis solicitudes, revisar los resultados,
> organizar las pruebas y preparar las evidencias. Supervisé los avances y
> comprobé manualmente los comportamientos que se declaran en este documento.

## Trabajo realizado personalmente

- **Selección, análisis y supervisión:** seleccioné el proyecto ClimaNow,
  definí su alcance y supervisé cada etapa y resultado generado con asistencia
  de IA.
- **Entorno de trabajo:** configuré y utilicé la carpeta local del proyecto, el
  navegador y el repositorio de GitHub para revisar los avances.
- **HTML:** definí los requisitos y revisé la estructura generada con Codex. No
  declaro haber programado manualmente el HTML generado por la herramienta.
- **CSS:** indiqué los objetivos visuales y revisé el resultado en el navegador,
  incluida su adaptación móvil. No declaro haber escrito manualmente el CSS
  generado por la herramienta.
- **JavaScript:** definí los comportamientos esperados, supervisé la integración
  y probé sus resultados. No declaro haber programado manualmente el JavaScript
  generado por la herramienta.
- **Pruebas manuales:** comprobé búsquedas de ciudades válidas e inexistentes,
  validación del campo vacío, falta de conexión, HTTP `429` simulado, respuesta
  HTTP `200` vacía y visualización móvil.
- **Identificación de errores:** detecté que el mensaje de error permanecía
  visible al editar el campo después de una búsqueda fallida, solicité su
  corrección y verifiqué el comportamiento posterior.
- **Evidencias y publicación:** revisé los avances publicados en GitHub y
  supervisé que los commits correspondieran a las etapas desarrolladas.
- **Decisiones finales:** revisé los resultados, decidí cuándo avanzar a la
  siguiente etapa y validé qué pruebas y evidencias debían documentarse.

Nombre: Paola Cardeña
Fecha de actualización de esta declaración: `14 de octubre de 2026`
