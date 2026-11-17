# Main Bareng · Soforia

[Indonesia](../../README.md) · [English](README.en.md) · [Español](README.es.md) · [Português](README.pt.md) · [日本語](README.ja.md) · **简体中文**

游戏库支持十字方向键、搜索、保存在笔记本上的共享收藏、名称排序，以及每页八款游戏。进入游戏后仍使用模拟摇杆控制角色。

这是供两人一起游玩的本地游戏主机。笔记本电脑运行权威服务器并显示共享画面，两部手机通过同一局域网中的浏览器充当控制器。构建完成后，游玩无需互联网或云端账号。

## 本地运行

需要 Node.js **20.19+**、npm，以及支持 WebGL 的电脑浏览器。启动器主要面向 Linux。

```sh
npm ci
npm run check
npm test
npm run build
./play.sh
```

打开终端打印的电脑操作端地址，用两部手机扫描二维码。不要在手机上使用电脑的 localhost 地址。两名玩家都可以选择游戏并开始。只启动服务器时使用 `npm start`。请参阅[离线说明](../../RUN-OFFLINE.md)；旧发行包不会自动包含最新源码。

Orbit 是共同收集光点的冒险；Garden 需要分工种植和收获；Seirama 在双方准备公开前保护私人答案；City 是地产对战。Glass 包含60组关卡挑战、交替出现的6种环境、物理障碍、运动机械、本地音乐与音效。玩家需要协调抬高、降低、翻转与跳跃。没有强制角度或无接触破碎规则，到达最终检查点会立即进入下一关。

玩家1的 **♫** 控制共享游戏音频；电脑上的 **M** 切换本地静音。Glass 键盘测试：在玩家槽为空的菜单按 **F2**，用 **Enter** 查看教程并开始，按 **F3** 退出。[完整操作说明](../18-kaca-keyboard.md)。

## 按模块协作

先阅读 [AGENTS](../../AGENTS.md)、[AI路径指南](../architecture/AI-START.md)和[协作指南](../../collaboration_guide.md)。每个PR只处理一个scope。单个游戏只能修改 `src/games/<id>/`；菜单只能修改 `src/dashboard/`。不要为局部改动顺便修改其他游戏或共享API。

```sh
npm run game:new -- --id comet --title "双人彗星"
npm run change:new -- --scope game:comet --summary "添加彗星游戏"
npm test -- --scope game:comet
npm run check
npm run build
npm run check:scope -- --working
```

系统通过 manifest 自动发现游戏，无需修改中央列表。每个游戏拥有独立的服务端规则、显示模块、手机控制器、HUD、CSS、素材、测试和状态文件。[添加游戏](../architecture/ADD-GAME.md)说明了接口要求。仓库文件无法保证所有AI都会读取并遵守指令；自动检查和所有者审核用于约束可检验的边界。GitHub分支保护仍需所有者启用。

代码、原创音频与几何使用 [MIT](../../LICENSE)；第三方模型遵循[各自许可证](../../public/assets/ATTRIBUTION.md)。不要上传有效二维码、会话密钥或私人答案。请遵守[行为准则](../../CODE_OF_CONDUCT.md)。自动化测试不能证明双手机实机验收、趣味性、FPS或输入到画面的延迟；当前状态见[路线图](../09-roadmap.md)。[自愿支持](https://trakteer.id/oskhar)不是使用或贡献的前提。


## Tailscale 模式与电视镜像

普通局域网启动：`npm run start:normal`（别名 `npm start`）。可选 tailnet 模式：`npm run start:tailscale`；停止：`npm run stop:tailscale`。在两块屏幕打开终端显示的 HTTPS `/tv` 链接；电视仅显示同一局游戏，二维码使用 Tailscale 地址供两部手机加入。屏幕和手机均需能够访问 tailnet。如果电视不支持 Tailscale/WebGL，请用运行 Tailscale 的笔记本通过 HDMI 连接。专用 HTTPS 端口默认为 12443，保留其他服务，不设置开机自启。

[命令、连接条件和限制（印度尼西亚语）](../24-tailscale-dan-tv.md).
