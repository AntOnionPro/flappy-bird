// =====================================================
//  FLAPPY BIRD - JavaScript puro
//  Gráficos: Canvas 2D  |  Sonido: Web Audio API
// =====================================================

// ---------- Configuración ----------
const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");
const ANCHO = canvas.width;
const ALTO = canvas.height;

const GRAVEDAD = 0.45;        // aceleración hacia abajo
const IMPULSO = -7.5;         // velocidad al aletear
const VELOCIDAD = 2.5;        // velocidad de los tubos
const HUECO = 150;            // espacio vertical entre tubos
const SEPARACION = 200;       // distancia horizontal entre tubos
const ANCHO_TUBO = 60;
const ALTO_SUELO = 80;
const LIMITE_SUELO = ALTO - ALTO_SUELO;
const PIXEL = 3;              // tamaño de cada "pixel" del pixel art

// ---------- Estado del juego ----------
// Estados posibles: "menu", "jugando", "fin"
let estado = "menu";
let puntos = 0;
let mejor = leerRecord();
let tubos = [];
let sueloX = 0;
let tiempo = 0;       // contador de cuadros (para animaciones)
let tiempoFin = 0;    // cuadros transcurridos desde que perdiste

const pajaro = {
  x: 90,
  y: ALTO / 2,
  vel: 0,
  radio: 14,
};

const nubes = [
  { x: 50, y: 80, escala: 1 },
  { x: 220, y: 140, escala: 0.7 },
  { x: 330, y: 60, escala: 0.9 },
];

// =====================================================
//  SONIDO (generado con osciladores, sin archivos)
// =====================================================
let audio = null;
let sonidoActivo = true;
let intervaloMusica = null;

function iniciarAudio() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audio.state === "suspended") audio.resume();
}

// Reproduce un tono que puede deslizarse de una frecuencia a otra
function tono(frecuencia, duracion, tipo = "square", volumen = 0.1, frecuenciaFinal = frecuencia) {
  if (!audio || !sonidoActivo) return;

  const osc = audio.createOscillator();
  const gan = audio.createGain();
  const ahora = audio.currentTime;

  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, ahora);
  osc.frequency.exponentialRampToValueAtTime(frecuenciaFinal, ahora + duracion);

  gan.gain.setValueAtTime(volumen, ahora);
  gan.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);

  osc.connect(gan).connect(audio.destination);
  osc.start(ahora);
  osc.stop(ahora + duracion);
}

const sonidos = {
  aleteo: () => tono(400, 0.1, "square", 0.06, 700),
  punto: () => {
    tono(880, 0.08, "square", 0.06);
    setTimeout(() => tono(1320, 0.12, "square", 0.06), 80);
  },
  golpe: () => tono(220, 0.35, "sawtooth", 0.15, 40),
};

// Música de fondo: una melodía corta que se repite
const MELODIA = [262, 330, 392, 330, 294, 349, 440, 349, 262, 330, 392, 523, 392, 330, 294, 0];

function iniciarMusica() {
  if (intervaloMusica) return;
  let nota = 0;
  intervaloMusica = setInterval(() => {
    const frecuencia = MELODIA[nota % MELODIA.length];
    if (frecuencia > 0) tono(frecuencia, 0.2, "triangle", 0.04);
    nota++;
  }, 220);
}

function alternarSonido() {
  sonidoActivo = !sonidoActivo;
  document.getElementById("btnSonido").textContent = sonidoActivo ? "🔊" : "🔇";
}

// =====================================================
//  RÉCORD (se guarda en el navegador)
// =====================================================
function leerRecord() {
  try {
    return Number(localStorage.getItem("flappyRecord")) || 0;
  } catch {
    return 0;
  }
}

function guardarRecord() {
  try {
    localStorage.setItem("flappyRecord", mejor);
  } catch {
    // Si el navegador no permite guardar, simplemente se ignora
  }
}

// =====================================================
//  LÓGICA
// =====================================================
function reiniciar() {
  pajaro.y = ALTO / 2;
  pajaro.vel = 0;
  tubos = [];
  puntos = 0;
}

function aletear() {
  pajaro.vel = IMPULSO;
  sonidos.aleteo();
}

function crearTubo() {
  const margen = 60;
  const alturaHueco = margen + Math.random() * (LIMITE_SUELO - HUECO - margen * 2);
  tubos.push({ x: ANCHO, hueco: alturaHueco, contado: false });
}

function perder() {
  estado = "fin";
  tiempoFin = 0;
  sonidos.golpe();
  if (puntos > mejor) {
    mejor = puntos;
    guardarRecord();
  }
}

// ¿El pájaro toca este tubo?
function choca(tubo) {
  const r = pajaro.radio - 2; // un poco de tolerancia
  const dentroX = pajaro.x + r > tubo.x && pajaro.x - r < tubo.x + ANCHO_TUBO;
  const fueraHueco = pajaro.y - r < tubo.hueco || pajaro.y + r > tubo.hueco + HUECO;
  return dentroX && fueraHueco;
}

// dt = 1 equivale a un cuadro a 60 FPS
function actualizar(dt) {
  tiempo += dt;

  // Las nubes siempre se mueven
  for (const nube of nubes) {
    nube.x -= VELOCIDAD * 0.2 * dt;
    if (nube.x < -80) nube.x = ANCHO + 40;
  }

  if (estado === "menu") {
    pajaro.y = ALTO / 2 + Math.sin(tiempo / 10) * 8; // flota arriba y abajo
    sueloX = (sueloX - VELOCIDAD * dt) % 24;
    return;
  }

  if (estado === "fin") {
    tiempoFin += dt;
    // El pájaro cae hasta el suelo
    if (pajaro.y + pajaro.radio < LIMITE_SUELO) {
      pajaro.vel += GRAVEDAD * dt;
      pajaro.y = Math.min(pajaro.y + pajaro.vel * dt, LIMITE_SUELO - pajaro.radio);
    }
    return;
  }

  // ----- estado "jugando" -----
  pajaro.vel += GRAVEDAD * dt;
  pajaro.y += pajaro.vel * dt;

  // Techo: no puede salir por arriba
  if (pajaro.y < pajaro.radio) {
    pajaro.y = pajaro.radio;
    pajaro.vel = 0;
  }

  // Suelo: pierde
  if (pajaro.y + pajaro.radio >= LIMITE_SUELO) {
    pajaro.y = LIMITE_SUELO - pajaro.radio;
    perder();
    return;
  }

  // Generar tubos nuevos
  const ultimo = tubos[tubos.length - 1];
  if (!ultimo || ultimo.x < ANCHO - SEPARACION) crearTubo();

  // Mover tubos, contar puntos y revisar choques
  for (const tubo of tubos) {
    tubo.x -= VELOCIDAD * dt;

    if (!tubo.contado && tubo.x + ANCHO_TUBO < pajaro.x) {
      tubo.contado = true;
      puntos++;
      sonidos.punto();
    }

    if (choca(tubo)) {
      perder();
      return;
    }
  }

  // Eliminar tubos que ya salieron de la pantalla
  tubos = tubos.filter((tubo) => tubo.x + ANCHO_TUBO > 0);

  sueloX = (sueloX - VELOCIDAD * dt) % 24;
}

// =====================================================
//  DIBUJO (pixel art)
// =====================================================

// Dibuja un rectángulo alineado a una cuadrícula de PIXEL x PIXEL.
// Así todo se ve en "bloques", como en los juegos retro.
function bloque(x, y, ancho, alto, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(x / PIXEL) * PIXEL,
    Math.round(y / PIXEL) * PIXEL,
    Math.ceil(ancho / PIXEL) * PIXEL,
    Math.ceil(alto / PIXEL) * PIXEL
  );
}

// Dibuja un sprite escrito como texto: cada letra es un color y "." es transparente
function sprite(dibujo, colores, x, y, tamano = PIXEL) {
  dibujo.forEach((fila, f) => {
    [...fila].forEach((letra, c) => {
      if (letra !== ".") bloque(x + c * tamano, y + f * tamano, tamano, tamano, colores[letra]);
    });
  });
}

// ---------- Sprites ----------
const COLORES_PAJARO = {
  K: "#3b2a1a", // contorno
  Y: "#f7d02c", // cuerpo
  L: "#fff4b0", // ala
  W: "#ffffff", // ojo
  B: "#000000", // pupila
  O: "#f2701d", // pico
};

const PAJARO_ALA_ARRIBA = [
  "....KKKKK...",
  "..KKYYYKWK..",
  ".KLLKYKWWWK.",
  "KLLLLKKWWBK.",
  "KLLLLKYKWBK.",
  "KYLLKYYYKKKK",
  ".KYYYYYKOOOK",
  "..KKYYYYKOOK",
  "....KKKKKKK.",
];

const PAJARO_ALA_ABAJO = [
  "....KKKKK...",
  "..KKYYYKWK..",
  ".KYYYYKWWWK.",
  "KYYYYYKWWBK.",
  "KKKKKYYKWBK.",
  "KLLLLKYYKKKK",
  "KLLLLKYKOOOK",
  ".KLLKYYYKOOK",
  "..KKKKKKKKK.",
];

const NUBE = [
  "....WWWW......",
  "..WWWWWWWW.WW.",
  ".WWWWWWWWWWWWW",
  "WWWWWWWWWWWWWW",
  ".WWWWWWWWWWWW.",
];

// ---------- Escenario ----------
function dibujarCielo() {
  // En lugar de un degradado suave, franjas de color (estilo retro)
  const franjas = ["#4ec0ca", "#5cc8d1", "#6dd0d8", "#80d8df", "#95e0e6", "#b8e8ee"];
  const altoFranja = LIMITE_SUELO / franjas.length;
  franjas.forEach((color, i) => bloque(0, i * altoFranja, ANCHO, altoFranja + PIXEL, color));
}

function dibujarNubes() {
  for (const nube of nubes) {
    const tamano = Math.max(1, Math.round(nube.escala * 2)) * PIXEL;
    sprite(NUBE, { W: "#ffffff" }, nube.x, nube.y, tamano);
  }
}

function dibujarTubo(x, y, alto, bocaAbajo) {
  // Cuerpo: contorno, color base, brillo y sombra
  bloque(x, y, ANCHO_TUBO, alto, "#2d5a0e");
  bloque(x + PIXEL, y, ANCHO_TUBO - PIXEL * 2, alto, "#73bf2e");
  bloque(x + PIXEL * 3, y, PIXEL * 3, alto, "#9ce659");
  bloque(x + ANCHO_TUBO - PIXEL * 5, y, PIXEL * 3, alto, "#5a9e1f");

  // Boca del tubo
  const bocaY = bocaAbajo ? y + alto - 24 : y;
  bloque(x - PIXEL, bocaY, ANCHO_TUBO + PIXEL * 2, 24, "#2d5a0e");
  bloque(x, bocaY + PIXEL, ANCHO_TUBO, 24 - PIXEL * 2, "#73bf2e");
  bloque(x + PIXEL * 2, bocaY + PIXEL, PIXEL * 3, 24 - PIXEL * 2, "#9ce659");
  bloque(x + ANCHO_TUBO - PIXEL * 4, bocaY + PIXEL, PIXEL * 3, 24 - PIXEL * 2, "#5a9e1f");
}

function dibujarTubos() {
  for (const tubo of tubos) {
    dibujarTubo(tubo.x, 0, tubo.hueco, true);                       // tubo de arriba
    const yAbajo = tubo.hueco + HUECO;
    dibujarTubo(tubo.x, yAbajo, LIMITE_SUELO - yAbajo, false);      // tubo de abajo
  }
}

function dibujarSuelo() {
  bloque(0, LIMITE_SUELO, ANCHO, ALTO_SUELO, "#ded895");
  bloque(0, LIMITE_SUELO, ANCHO, 15, "#73bf2e");
  // Rayas que se desplazan
  for (let x = sueloX; x < ANCHO; x += 24) {
    bloque(x, LIMITE_SUELO + PIXEL, 12, 12, "#5a9e1f");
  }
  bloque(0, LIMITE_SUELO, ANCHO, PIXEL, "#2d5a0e");
  bloque(0, LIMITE_SUELO + 15, ANCHO, PIXEL, "#c4b968");
}

function dibujarPajaro() {
  // Alterna dos cuadros para animar el aleteo (en "fin" se queda quieto)
  const aleteando = estado !== "fin" && Math.floor(tiempo / 6) % 2 === 0;
  const cuadro = aleteando ? PAJARO_ALA_ABAJO : PAJARO_ALA_ARRIBA;

  const ancho = cuadro[0].length * PIXEL;
  const alto = cuadro.length * PIXEL;
  sprite(cuadro, COLORES_PAJARO, pajaro.x - ancho / 2, pajaro.y - alto / 2);
}

// Texto con fuente pixel y sombra dura, centrado
function texto(contenido, y, tamano) {
  ctx.font = `${tamano}px "Press Start 2P", monospace`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#000";
  ctx.fillText(contenido, ANCHO / 2 + 4, y + 4); // sombra
  ctx.fillStyle = "#fff";
  ctx.fillText(contenido, ANCHO / 2, y);
}

function dibujarInterfaz() {
  if (estado === "menu") {
    texto("FLAPPY BIRD", 160, 32);
    texto("Toca o presiona", 390, 16);
    texto("Espacio", 415, 16);
    if (mejor > 0) texto(`Récord: ${mejor}`, 460, 16);
  }

  if (estado === "jugando") {
    texto(puntos, 80, 40);
  }

  if (estado === "fin") {
    texto("GAME OVER", 180, 32);
    texto(`Puntos: ${puntos}`, 250, 16);
    texto(`Récord: ${mejor}`, 285, 16);
    if (tiempoFin > 40) texto("Toca para reintentar", 360, 16);
  }
}

function dibujar() {
  dibujarCielo();
  dibujarNubes();
  dibujarTubos();
  dibujarSuelo();
  dibujarPajaro();
  dibujarInterfaz();
}

// =====================================================
//  CONTROLES
// =====================================================
function accion() {
  iniciarAudio();
  iniciarMusica();

  if (estado === "menu") {
    reiniciar();
    estado = "jugando";
    aletear();
  } else if (estado === "jugando") {
    aletear();
  } else if (estado === "fin" && tiempoFin > 40) {
    // Pequeña espera para no reiniciar por accidente
    reiniciar();
    estado = "menu";
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    accion();
  }
  if (e.code === "KeyM") alternarSonido();
});

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  accion();
});

document.getElementById("btnSonido").addEventListener("click", alternarSonido);

// =====================================================
//  BUCLE PRINCIPAL
// =====================================================
let ultimoTiempo = performance.now();

function bucle(ahora) {
  // Normaliza a 60 FPS para que el juego vaya igual en monitores de 60, 120 o 144 Hz
  const dt = Math.min((ahora - ultimoTiempo) / (1000 / 60), 3);
  ultimoTiempo = ahora;

  actualizar(dt);
  dibujar();
  requestAnimationFrame(bucle);
}

requestAnimationFrame(bucle);
