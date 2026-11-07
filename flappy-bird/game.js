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
//  DIBUJO
// =====================================================
function dibujarCielo() {
  const degradado = ctx.createLinearGradient(0, 0, 0, ALTO);
  degradado.addColorStop(0, "#4ec0ca");
  degradado.addColorStop(1, "#b8e8ee");
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, ANCHO, ALTO);
}

function dibujarNubes() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  for (const nube of nubes) {
    const e = nube.escala;
    ctx.beginPath();
    ctx.arc(nube.x, nube.y, 20 * e, 0, Math.PI * 2);
    ctx.arc(nube.x + 25 * e, nube.y - 10 * e, 25 * e, 0, Math.PI * 2);
    ctx.arc(nube.x + 50 * e, nube.y, 20 * e, 0, Math.PI * 2);
    ctx.fill();
  }
}

function dibujarTubo(x, y, alto, bocaAbajo) {
  // Cuerpo
  ctx.fillStyle = "#73bf2e";
  ctx.fillRect(x, y, ANCHO_TUBO, alto);
  // Brillo
  ctx.fillStyle = "#9ce659";
  ctx.fillRect(x + 6, y, 8, alto);
  // Boca del tubo
  const bocaY = bocaAbajo ? y + alto - 24 : y;
  ctx.fillStyle = "#5a9e1f";
  ctx.fillRect(x - 4, bocaY, ANCHO_TUBO + 8, 24);
  // Contorno
  ctx.strokeStyle = "#2d5a0e";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, ANCHO_TUBO, alto);
  ctx.strokeRect(x - 4, bocaY, ANCHO_TUBO + 8, 24);
}

function dibujarTubos() {
  for (const tubo of tubos) {
    dibujarTubo(tubo.x, 0, tubo.hueco, true);                       // tubo de arriba
    const yAbajo = tubo.hueco + HUECO;
    dibujarTubo(tubo.x, yAbajo, LIMITE_SUELO - yAbajo, false);      // tubo de abajo
  }
}

function dibujarSuelo() {
  ctx.fillStyle = "#ded895";
  ctx.fillRect(0, LIMITE_SUELO, ANCHO, ALTO_SUELO);

  // Franja con rayas que se desplazan
  ctx.fillStyle = "#73bf2e";
  ctx.fillRect(0, LIMITE_SUELO, ANCHO, 14);
  ctx.fillStyle = "#5a9e1f";
  for (let x = sueloX; x < ANCHO; x += 24) {
    ctx.fillRect(x, LIMITE_SUELO, 12, 14);
  }
  ctx.fillStyle = "#2d5a0e";
  ctx.fillRect(0, LIMITE_SUELO, ANCHO, 2);
}

function dibujarPajaro() {
  ctx.save();
  ctx.translate(pajaro.x, pajaro.y);

  // Inclinación según la velocidad (sube = nariz arriba, cae = nariz abajo)
  const angulo = estado === "menu" ? 0 : Math.max(-0.5, Math.min(pajaro.vel / 10, 1.2));
  ctx.rotate(angulo);

  // Cuerpo
  ctx.fillStyle = "#f7d02c";
  ctx.strokeStyle = "#5a3e00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, pajaro.radio, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ala (se mueve con el tiempo para simular aleteo)
  const ala = Math.sin(tiempo / 3) * 4;
  ctx.fillStyle = "#fff4b0";
  ctx.beginPath();
  ctx.ellipse(-5, 2 + ala, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ojo
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(6, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(8, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Pico
  ctx.fillStyle = "#f2701d";
  ctx.beginPath();
  ctx.moveTo(10, 1);
  ctx.lineTo(22, 4);
  ctx.lineTo(10, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Texto blanco con borde negro, centrado
function texto(contenido, y, tamano) {
  ctx.font = `bold ${tamano}px monospace`;
  ctx.textAlign = "center";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#fff";
  ctx.strokeText(contenido, ANCHO / 2, y);
  ctx.fillText(contenido, ANCHO / 2, y);
}

function dibujarInterfaz() {
  if (estado === "menu") {
    texto("FLAPPY BIRD", 150, 42);
    texto("Toca o presiona Espacio", 400, 18);
    if (mejor > 0) texto(`Récord: ${mejor}`, 440, 18);
  }

  if (estado === "jugando") {
    texto(puntos, 70, 48);
  }

  if (estado === "fin") {
    texto("GAME OVER", 180, 44);
    texto(`Puntos: ${puntos}`, 250, 24);
    texto(`Récord: ${mejor}`, 285, 24);
    if (tiempoFin > 40) texto("Toca para reintentar", 360, 18);
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
