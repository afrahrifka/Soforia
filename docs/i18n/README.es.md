# Main Bareng · Soforia

[Indonesia](../../README.md) · [English](README.en.md) · **Español** · [Português](README.pt.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md)

La biblioteca usa una cruceta de cuatro direcciones, búsqueda, favoritos compartidos guardados en el portátil, orden alfabético y ocho juegos por página. El control analógico sigue disponible dentro de los juegos.

Una consola local para dos personas. El portátil ejecuta el servidor autoritativo y la pantalla compartida; dos navegadores de móvil funcionan como mandos en la misma LAN. Después de compilar, no se necesita internet ni una cuenta en la nube.

## Empezar

Requisitos: Node.js **20.19+**, npm y un navegador con WebGL en el portátil. Linux es la plataforma principal del lanzador.

```sh
npm ci
npm run check
npm test
npm run build
./play.sh
```

Abre la dirección del operador que imprime el lanzador y escanea el QR con ambos móviles. La dirección localhost del portátil no sirve desde el móvil. Ambos jugadores pueden elegir e iniciar un juego. Para ejecutar solo el servidor, usa `npm start`. Consulta las [instrucciones sin conexión](../../RUN-OFFLINE.md); los paquetes antiguos no incluyen automáticamente el código actual.

Orbit propone recoger luz juntos; Garden reparte tareas de cultivo; Seirama mantiene las respuestas privadas hasta revelarlas; City ofrece un duelo de propiedades. Glass contiene 60 secuencias diseñadas, seis biomas alternos, obstáculos físicos, máquinas móviles y música/efectos locales. Hay que elevar, bajar, rodar y saltar en equipo. No existen ángulos obligatorios ni roturas abstractas; el último checkpoint cambia de fase inmediatamente.

**♫** del jugador 1 controla el audio compartido; **M** silencia localmente el portátil. Para probar Glass con teclado: **F2** en el menú con plazas vacías, **Enter** para tutorial/inicio y **F3** para salir. [Controles completos](../18-kaca-keyboard.md).

## Colaborar por módulos

Lee [AGENTS](../../AGENTS.md), el [mapa para IA](../architecture/AI-START.md) y la [guía de colaboración](../../collaboration_guide.md). Una PR tiene un solo ámbito: `src/games/<id>/` para un juego o `src/dashboard/` para el menú. No modifiques otro juego ni las API compartidas para un cambio local.

```sh
npm run game:new -- --id cometa --title "Cometa en Pareja"
npm run change:new -- --scope game:cometa --summary "Añadir Cometa"
npm test -- --scope game:cometa
npm run check
npm run build
npm run check:scope -- --working
```

El manifiesto registra el juego automáticamente, sin listas centrales. Cada juego posee servidor, consola, mando, HUD, CSS, pruebas, recursos y estado propios. [Contrato de ampliación](../architecture/ADD-GAME.md). Las instrucciones no pueden garantizar que toda IA las lea; las comprobaciones automáticas y la revisión del propietario aportan control. El propietario debe activar la protección de rama.

Código y audio/geometría originales: [MIT](../../LICENSE). Modelos externos: [licencias documentadas](../../public/assets/ATTRIBUTION.md). No publiques QR activos, secretos de sesión ni respuestas privadas. Respeta el [Código de Conducta](../../CODE_OF_CONDUCT.md). Las pruebas automáticas no demuestran diversión, dos móviles físicos, FPS ni latencia de entrada a imagen; consulta la [hoja de ruta](../09-roadmap.md). [Apoyo voluntario](https://trakteer.id/oskhar), nunca obligatorio.
