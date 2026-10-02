[MY DISCORD](https://discord.gg/QDpuyJ4A) — We discuss, propose and try to implement together.

# SHUD - StreamHUD

## 🇷🇺 Русский

SHUD — десктопное приложение для работы с киберспортивными HUD‑ами и оверлеями: команды, игроки, матчи, экраны для площадки, статистика, синхронизация с OBS и управление сценами в один клик.

С версии **2.3.7** приложение работает на **Tauri** (Rust + системный WebView2) вместо Electron — оно стало легче и потребляет заметно меньше оперативной памяти. Устанавливается и запускается через обычный .exe — не нужно отдельно ставить Node.js или запускать скрипты из консоли.

### Возможности

- **Команды и игроки:** создание, редактирование, импорт/экспорт баз (Excel) с логотипами, аватарами и флагами стран.
- **Матчи и HUD‑ы:** настройка матчей (формат, команды, карты, пики/баны), выбор и настройка HUD‑пакетов для разных игр, загрузка своих HUD из .zip.
- **Экраны:** красивый вывод текущего матча на экраны площадки и в OBS — логотипы, счёт серии, карты, live‑счёт раунда. Три вида (Сцена, Versus, Плашка), адаптивно под любое разрешение, вывод на любой монитор в один клик, свой логотип.
- **Статистика CS2 и Dota 2:** автоматическая запись истории матчей, полные таблицы игроков, рейтинги игроков и команд, привязка к базе игроков и команд, экспорт в Excel и красивые картинки 1920×1080 и 1080×1080 для соцсетей. Любую карточку статистики можно вывести на экран или в OBS.
- **Интеграция с OBS:** камеры игроков, управление сценами.
- **Инструменты:** автопролётки, бинды игроков, HLAE и CS2 autodirector‑fix в один клик, тест HUD.
- **Локальное хранение:** все настройки и базы хранятся на компьютере (`%APPDATA%\SHUD`), без облака.
- **Современный интерфейс:** тёмная тема, свой заголовок окна, удобный сайдбар, русский, английский, китайский и португальский языки.

🎮 **Поддерживаемые игры:** Counter-Strike 2, Dota 2, League of Legends (LOL).

🎮 **Поддерживаемые HUDs:** приложение поддерживает HUDs от LHM и от OpenHUD:
[cs2-react-hud](https://github.com/lexogrine/cs2-react-hud) · [OpenHud-React-Hud](https://github.com/JohnTimmermann/OpenHud-React-Hud) · [dota2-react-hud](https://github.com/lexogrine/dota2-react-hud) · [league_of_legends_react_hud](https://github.com/lexogrine/league_of_legends_react_hud)

📦 [Скачиваем в релизах](https://github.com/fyflo/SHUD/releases)

---

## 🇬🇧 English

SHUD is a desktop application for managing esports HUDs and overlays: teams, players, matches, venue screens, statistics, OBS synchronization and one‑click scene management.

Since **2.3.7** the app runs on **Tauri** (Rust + system WebView2) instead of Electron — it is lighter and uses noticeably less RAM. It is installed and launched via a regular .exe — no need to install Node.js or run scripts from the console.

### Features

- **Teams and players:** create, edit, import/export databases (Excel) with logos, avatars and country flags.
- **Matches and HUDs:** match settings (format, teams, maps, picks/bans), select and configure HUD packages for different games, upload your own HUDs from .zip.
- **Screens:** beautiful output of the current match for venue screens and OBS — team logos, series score, maps, live round score. Three layouts (Stage, Versus, Score bar), adaptive to any resolution, one‑click output to any monitor, custom logo.
- **CS2 and Dota 2 statistics:** automatic match history recording, full player scoreboards, player and team leaderboards, linking to your player and team database, Excel export and stylish 1920×1080 and 1080×1080 images for social media. Any stats card can be shown on a screen or in OBS.
- **OBS integration:** player cameras, scene management.
- **Tools:** autofly, player binds, one‑click HLAE and CS2 autodirector‑fix install, HUD test.
- **Local storage:** all settings and databases are stored on your PC (`%APPDATA%\SHUD`), no cloud.
- **Modern UI:** dark theme, custom title bar, handy sidebar, English, Russian, Chinese and Portuguese languages.

🎮 **Supported games:** Counter-Strike 2, Dota 2, League of Legends (LOL).

🎮 **Supported HUDs:** the app supports HUDs from LHM and OpenHUD:
[cs2-react-hud](https://github.com/lexogrine/cs2-react-hud) · [OpenHud-React-Hud](https://github.com/JohnTimmermann/OpenHud-React-Hud) · [dota2-react-hud](https://github.com/lexogrine/dota2-react-hud) · [league_of_legends_react_hud](https://github.com/lexogrine/league_of_legends_react_hud)

📦 [Download in releases](https://github.com/fyflo/SHUD/releases)
