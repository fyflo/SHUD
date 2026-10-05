<div align="center">

# SHUD — Personal HUD Manager
### Next-Gen Esports Broadcast Engine & Overlay Control Center

[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/QDpuyJ4A)
[![Release](https://img.shields.io/github/v/release/fyflo/SHUD?style=flat-square&color=white)](https://github.com/fyflo/SHUD/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows&logoColor=white)](#)
[![Stack](https://img.shields.io/badge/Tauri%20v2-Rust%20%2B%20Node-black?style=flat-square)](#)

<br/>

<img width="100%" alt="SHUD Interface" src="https://github.com/user-attachments/assets/4974a7a0-891e-4f0b-a687-295896552914" />

<br/>

[English](#-english) • [Русский](#-русский) • [Discord Community](https://discord.gg/QDpuyJ4A)

</div>

---

## 🇷🇺 Русский

**SHUD** — автономный диспетчер киберспортивных HUD, оверлеев и данных матча для турнирных операторов, обсерверов и стримеров. Программа автоматизирует сбор игровой аналитики через GSI, управление сценами OBS, маршрутизацию веб-камер игроков и вывод графики на стадионные экраны.

Начиная с версии **2.3.8**, архитектура построена на **Tauri v2 (Rust)** с изолированным Node.js sidecar бэкендом. Приложение поставляется единым NSIS-установщиком, работает локально без сторонних облаков и не требует предварительной установки окружения Node.js или системных скриптов.

### Ключевой функционал

- **Управление HUD-пакетами**:
  - Каталог с переключением вида (список / сетка) и сохранением состояния.
  - Установка кастомных сборок через Drag-and-Drop `.zip` архивов.
  - Тонкая настройка палитры (CT, T, бомба, градиенты) с инструментом импорта цветов прямо из CSS.
  - Интеграция с HLAE (in-game killfeed), Netcon-режимом, автопилотом обсервера и авто-определением сторон.
  - Вывод прозрачного оверлея поверх игры на выбранный монитор или генерация ссылки для браузерного источника OBS.

- **Интерактивные экраны и Live GSI-радар**:
  - Набор готовых сцен: **Stage**, **Versus**, **Нижняя плашка (Bar)**, **Расписание матчей**.
  - **Живая GSI-карта**: плавное позиционирование игроков с интерполяцией, отображение секторов обзора, запаса HP, брони, инвентаря, утилит (C4, дымы, зажигательные) и поддержка двух уровней высоты (Nuke, Vertigo).
  - Гибкая конфигурация геометрии: Fullscreen, ручные размеры ($W \times H / X / Y$), альфа-канал и кастомные брендинговые логотипы.

- **Студия веб-камер и задержки трансляции**:
  - Поддержка провайдеров **OBS WebSocket**, **VDO.Ninja**, локального **P2P WebRTC** и серверного релея MediaMTX.
  - Буфер задержки видео (до 3600 с) для идеальной синхронизации камер с турнирным делэем GSI/GOTV.
  - Автоматическое открытие сетевых портов через Windows Firewall и UPnP в один клик.

- **Матчи, турниры и быстрый импорт**:
  - Конфигуратор серий (BO1, BO3, BO5) с интерактивным вето карт, шаговым счетчиком и быстрой сменой сторон.
  - Мгновенный импорт составов и лобби из **FACEIT** и **FastCup**, либо добавление игроков в базу «на лету» прямо из текущей сессии.
  - База данных игроков со SteamID64, аватарами, флагами стран и фильтрацией символов.

- **Аналитика и экспорт статистики**:
  - Парсинг GSI-событий CS2 и Dota 2 в реальном времени.
  - Автоматическая линковка неизвестных никнеймов к карточкам базы по SteamID.
  - Экспорт сводок в таблицы Excel и генерация графических инфографик (1920×1080 и 1080×1080) для соцсетей или вывода в OBS.

- **Утилиты обсервера**:
  - Менеджер пролёток камеры (Autofly) и слот-бинды игроков.
  - Встроенный тестовый стенд для прогона оверлеев на записанных GSI-дампах.
  - Установка и автообновление компонентов HLAE и `autodirector-fix`.

### Поддерживаемые дисциплины

| Игра | Метод интеграции |
| :--- | :--- |
| **Counter-Strike 2** | Native GSI + Netcon + HLAE |
| **CS:GO** | Legacy GSI |
| **Dota 2** | GSI + Captain's Draft Pool |
| **League of Legends** | Live Client Data API |
| **Deadlock** | GSI-интеграция |
| **Valorant** | OCR Capture Mode |

Совместимо с открытыми HUD-экосистемами от **LHM** и **OpenHUD** ([cs2-react-hud](https://github.com/lexogrine/cs2-react-hud), [OpenHud-React-Hud](https://github.com/JohnTimmermann/OpenHud-React-Hud), [dota2-react-hud](https://github.com/lexogrine/dota2-react-hud), [league_of_legends_react_hud](https://github.com/lexogrine/league_of_legends_react_hud)).

---

## 🇬🇧 English

**SHUD** is an all-in-one desktop HUD manager, broadcast automation toolkit, and graphics engine designed for esports tournament operators, observers, and streamers. It streamlines live Game State Integration (GSI), OBS studio synchronization, player webcams routing, and venue stadium screens.

Powered by **Tauri v2 (Rust)** alongside a bundled Node.js sidecar service, the application delivers optimal CPU and memory efficiency. It ships as a self-contained Windows NSIS installer that operates entirely offline without external cloud dependencies.

### Features

- **HUD Packages Management**:
  - Switchable view modes (List / Grid) with persistent layout state.
  - One-action custom HUD package installation via Drag-and-Drop (`.zip`).
  - Palette editor (CT, T, Bomb, Gradients) with an eye-dropper CSS color parser.
  - Built-in integrations for HLAE, Netcon killfeed sync, observer auto-pilot, and team side detection.
  - Borderless transparent game overlay mode or direct browser source generation for OBS.

- **Live Venue Screens & Real-Time GSI Radar**:
  - Broadcast-ready templates: **Stage**, **Versus**, **Lower Third Bar**, **Match Schedule**.
  - **Live Tactical Radar**: hardware-accelerated player position interpolation, view cones, loadouts, armor/health tracking, utility triggers (C4, smoke clouds, molotov zones), and multi-level vertical maps (Nuke, Vertigo).
  - Complete canvas control: windowed $W \times H / X / Y$, Fullscreen, transparent alpha channel, and multi-monitor output routing.

- **Webcam Pipelines & Sync Buffering**:
  - Multi-provider support: **OBS WebSocket scenes**, **VDO.Ninja iframes**, **Direct P2P WebRTC**, and MediaMTX stream relays.
  - Granular latency compensation: video frame delay buffer (up to 3600 seconds) matching broadcast GSI/GOTV delay.
  - One-click network setup: automated Windows Firewall rule configuration and router UPnP port mapping.

- **Match Operations & Roster Ingestion**:
  - BO1 / BO3 / BO5 match orchestrator with interactive map veto, stepper scoring, and dynamic half-time swapping.
  - Native match and roster import from **FACEIT** and **FastCup**, plus automated "live-to-database" capture.
  - Local database registry for teams, players, SteamID64 mapping, and custom assets.

- **Automated Stats & Asset Generation**:
  - Automatic performance telemetry logging for CS2 and Dota 2 matches.
  - Auto-association of players by SteamID to persistent team rosters.
  - Instant export to Excel worksheets and automated creation of social media graphics (1920×1080 and 1080×1080) ready for on-air push.

- **Observer Toolkit**:
  - Camera autofly triggers and observer slot keybind routing.
  - Mock GSI playback harness for testing HUD packages without opening the game client.
  - One-click installer and updater for HLAE dependencies and CS2 `autodirector-fix`.

### Supported Titles

| Game | Data Pipeline |
| :--- | :--- |
| **Counter-Strike 2** | Native GSI + Netcon + HLAE |
| **CS:GO** | Legacy GSI Protocol |
| **Dota 2** | Native GSI + Captain's Draft Engine |
| **League of Legends** | Live Client Data API |
| **Deadlock** | GSI Integration |
| **Valorant** | OCR Capture Mode |

Fully compatible with **LHM** and **OpenHUD** frameworks ([cs2-react-hud](https://github.com/lexogrine/cs2-react-hud), [OpenHud-React-Hud](https://github.com/JohnTimmermann/OpenHud-React-Hud), [dota2-react-hud](https://github.com/lexogrine/dota2-react-hud), [league_of_legends_react_hud](https://github.com/lexogrine/league_of_legends_react_hud)).

---

## 🛠 System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   SHUD Host (Tauri v2)                 │
│         Rust Core • Window Lifecycle • Error Safety    │
└───────────────┬────────────────────────▲───────────────┘
                │ IPC                    │ HTTP / WS
┌───────────────▼────────────────────────┴───────────────┐
│               Embedded Node.js Sidecar                 │
│         Express API (1349) • Socket.IO (1351)          │
│            Local Storage Engine (%APPDATA%)            │
└───────┬────────────────────────────────────────┬───────┘
        │                                        │
┌───────▼────────────────────────┐      ┌────────▼───────┐
│         Games & Tools          │      │ Output Display │
│  GSI / HLAE / VDO / WebRTC     │      │ OBS / Overlays │
└────────────────────────────────┘      └────────────────┘
