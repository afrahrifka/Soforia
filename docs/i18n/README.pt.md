# Main Bareng · Soforia

[Indonesia](../../README.md) · [English](README.en.md) · [Español](README.es.md) · **Português** · [日本語](README.ja.md) · [简体中文](README.zh-CN.md)

Um console local para duas pessoas. O notebook executa o servidor autoritativo e a tela compartilhada; dois navegadores de celular viram controles na mesma LAN. Depois da compilação, o jogo não precisa de internet nem de conta na nuvem.

## Executar

Use Node.js **20.19+**, npm e um navegador com WebGL no notebook. Linux é a plataforma principal do inicializador.

```sh
npm ci
npm run check
npm test
npm run build
./play.sh
```

Abra o endereço do operador impresso no terminal e escaneie o QR nos dois celulares. Não use o localhost do notebook no celular. Ambos os jogadores podem escolher e iniciar o jogo. Use `npm start` para executar apenas o servidor. Leia o [guia offline](../../RUN-OFFLINE.md); um pacote antigo não recebe automaticamente as mudanças do código atual.

Orbit envolve coletar luz em dupla; Garden divide tarefas de plantio e colheita; Seirama mantém respostas privadas até a revelação; City é um duelo de propriedades. Glass tem 60 sequências, seis biomas alternados, obstáculos físicos, máquinas em movimento e música/efeitos locais. Levantar, baixar, rolar e pular exigem coordenação. Não há ângulo obrigatório nem quebra abstrata; o checkpoint final muda de fase imediatamente.

**♫** do jogador 1 controla o áudio compartilhado; **M** silencia localmente o notebook. Teste de Glass com teclado: **F2** no menu com vagas vazias, **Enter** para tutorial/início, **F3** para sair. [Controles completos](../18-kaca-keyboard.md).

## Contribuição com escopo

Comece por [AGENTS](../../AGENTS.md), pelo [mapa para IA](../architecture/AI-START.md) e pelo [guia de colaboração](../../collaboration_guide.md). Uma PR tem um escopo. Mudanças de um jogo ficam em `src/games/<id>/`; mudanças do menu, em `src/dashboard/`. Não altere outro jogo ou API compartilhada para corrigir um módulo local.

```sh
npm run game:new -- --id cometa --title "Cometa em Dupla"
npm run change:new -- --scope game:cometa --summary "Adicionar Cometa"
npm test -- --scope game:cometa
npm run check
npm run build
npm run check:scope -- --working
```

O manifesto registra o módulo automaticamente, sem editar listas centrais. Servidor, console, controle, HUD, CSS, recursos, testes e status pertencem ao jogo. [Como adicionar jogos](../architecture/ADD-GAME.md). Arquivos de instrução não garantem obediência de toda IA; verificações e revisão do proprietário reforçam as fronteiras. A proteção da branch ainda precisa ser ativada pelo proprietário.

Código e áudio/geometria originais: [MIT](../../LICENSE); modelos externos mantêm suas [licenças](../../public/assets/ATTRIBUTION.md). Não publique QR ativo, segredo de sessão ou resposta privada. Siga o [Código de Conduta](../../CODE_OF_CONDUCT.md). Testes automatizados não comprovam diversão, dois celulares físicos, FPS ou latência de entrada à imagem. Veja o [roadmap](../09-roadmap.md). [Apoio voluntário](https://trakteer.id/oskhar), nunca obrigatório.
