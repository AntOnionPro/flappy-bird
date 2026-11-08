# 🐤 Flappy Bird — Pixel Art en JavaScript puro

Juego web indie, minimalista, inspirado en el clásico *Flappy Bird*. Está hecho solo con **HTML, CSS y JavaScript**, sin librerías ni imágenes ni archivos de audio: todo se dibuja y se genera con código.

### 🎮 [Jugar en línea](https://antonionpro.github.io/flappy-bird/)

---

## 👤 Datos del proyecto

| | |
|---|---|
| **Alumno** | Antonio Zamorano |
| **GitHub** | [@AntOnionPro](https://github.com/AntOnionPro) |
| **Universidad** | Universidad Tecnológica de Hermosillo |
| **Carrera** | Ingeniería en Desarrollo de Software Multiplataforma |
| **Grupo** | 10-2 |
| **Materia** | _(nombre de la materia)_ |
| **Profesor** | _(nombre del profesor)_ |

---

## 📋 Propuesta del juego

### Nombre
**Flappy Bird — Pixel Art Edition**

### Concepto
Un pájaro vuela entre tubos que se acercan sin parar. Con cada toque, el pájaro aletea y sube; si no haces nada, la gravedad lo hace caer. Gana un punto por cada par de tubos que logra cruzar. Si choca con un tubo o con el suelo, el juego termina.

### Género y público
- **Género:** arcade / *endless runner* de un solo botón.
- **Público:** cualquier persona; las partidas duran segundos y se aprende a jugar sin instrucciones.

### Justificación
Elegí Flappy Bird porque su mecánica cabe en una sola acción (aletear) y aun así es retador. Eso lo hace ideal para un juego **básico y minimalista**: permite enfocarse en los fundamentos de un videojuego (bucle principal, física, colisiones, estados, entrada del usuario y sonido) sin depender de motores ni frameworks.

### Objetivo del jugador
Cruzar la mayor cantidad posible de tubos y superar su propio récord.

### Mecánicas
- **Gravedad:** el pájaro acelera hacia abajo en cada cuadro.
- **Aleteo:** cada toque le da un impulso hacia arriba.
- **Tubos:** aparecen a la derecha con un hueco a una altura aleatoria y avanzan hacia la izquierda.
- **Puntuación:** +1 por cada tubo que el pájaro deja atrás.
- **Colisiones:** chocar con un tubo o con el suelo termina la partida.
- **Récord:** la mejor puntuación se guarda en el navegador (`localStorage`).

### Controles
| Acción | Teclado | Mouse / Móvil |
|---|---|---|
| Aletear / empezar | `Espacio` o `↑` | Clic / toque |
| Reintentar | `Espacio` o `↑` | Clic / toque |
| Silenciar sonido | `M` | Botón 🔊 |

### Estilo visual
**Pixel art** generado por código. Los sprites (pájaro y nubes) están escritos como texto, donde cada letra representa un color, y se dibujan bloque por bloque en un `canvas` sobre una cuadrícula fija. El cielo usa franjas de color en lugar de degradado y el texto usa la fuente pixel *Press Start 2P*.

### Audio
Sonido **sencillo, generado en tiempo real** con la Web Audio API (osciladores), sin archivos externos:
- **Aleteo:** tono corto que sube.
- **Punto:** dos notas agudas.
- **Golpe:** tono grave que cae.
- **Música de fondo:** una melodía corta en bucle.

### Tecnologías
- **HTML5:** estructura y `<canvas>`.
- **CSS3:** diseño de la página y escalado nítido (`image-rendering: pixelated`).
- **JavaScript (ES6):** lógica, dibujo y sonido.
- **Canvas 2D API**, **Web Audio API**, **localStorage**.
- **GitHub Pages:** publicación en línea.

### Alcance
**Incluye:** menú de inicio, partida, pantalla de *game over*, puntuación y récord, efectos de sonido y música, controles de teclado, mouse y pantalla táctil, y diseño adaptable al tamaño de la pantalla.

**No incluye (posibles mejoras):** niveles de dificultad, tabla de récords en línea, otros personajes o escenarios, y modo noche.

---

## 🕹️ Cómo jugar

1. Abre el [juego en línea](https://antonionpro.github.io/flappy-bird/).
2. Presiona `Espacio`, haz clic o toca la pantalla para empezar.
3. Sigue aleteando para mantenerte en el aire y pasa entre los tubos.
4. Si pierdes, espera un momento y toca para volver a intentarlo.

---

## 📁 Estructura del proyecto

```
flappy-bird/
├── index.html   → página y canvas del juego
├── style.css    → estilos de la página (estilo retro)
├── game.js      → todo el juego: lógica, dibujo, sonido y controles
├── README.md    → este documento
└── LICENSE      → licencia MIT
```

---

## ⚙️ Cómo funciona el código

`game.js` está dividido en secciones:

| Sección | Qué hace |
|---|---|
| **Configuración** | Constantes del juego: gravedad, impulso, velocidad, tamaño del hueco, etc. |
| **Estado del juego** | Variables del juego: estado actual (`menu`, `jugando`, `fin`), puntos, tubos y pájaro. |
| **Sonido** | `tono()` crea un oscilador con frecuencia, duración y volumen; con él se arman los efectos y la música. |
| **Récord** | Lee y guarda la mejor puntuación en `localStorage`. |
| **Lógica** | `actualizar(dt)` aplica la gravedad, mueve los tubos, suma puntos y detecta colisiones. |
| **Dibujo** | `bloque()` dibuja rectángulos alineados a la cuadrícula; `sprite()` dibuja figuras a partir de texto; `dibujar()` pinta cada cuadro. |
| **Controles** | Teclado, clic y toque llaman a `accion()`, que cambia según el estado del juego. |
| **Bucle principal** | `requestAnimationFrame` llama a `actualizar()` y `dibujar()` unas 60 veces por segundo. |

**Detalles importantes:**
- **Tiempo normalizado (`dt`):** el movimiento se multiplica por `dt` para que el juego vaya a la misma velocidad en monitores de 60, 120 o 144 Hz.
- **Colisión:** se compara la posición del pájaro, con un pequeño margen de tolerancia, contra el rectángulo de cada tubo y el hueco entre ellos.
- **Máquina de estados:** el juego solo puede estar en `menu`, `jugando` o `fin`, y cada estado decide qué se actualiza y qué se muestra.

---

## 💻 Ejecutar localmente

No necesita instalación. Clona el repositorio y abre `index.html` en el navegador:

```bash
git clone https://github.com/AntOnionPro/flappy-bird.git
cd flappy-bird
```

---

## 🎥 Video explicativo

📺 _(enlace al video)_

---

## 📜 Licencia

Este proyecto es **software libre** bajo la [licencia MIT](LICENSE): puedes usarlo, copiarlo, modificarlo y distribuirlo libremente.

## 🙏 Créditos

- Inspirado en *Flappy Bird* (Dong Nguyen, 2013). Este es un proyecto educativo sin fines de lucro y no está afiliado al juego original.
- Gráficos y sonidos generados por código, sin recursos externos.
- Fuente [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) de CodeMan38 (SIL Open Font License).
