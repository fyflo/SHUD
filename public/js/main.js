// Глобальный хелпер для кнопки копирования ссылки HUD (используется в onclick="copyHUDUrl(...)"
if (typeof window !== "undefined" && !window.copyHUDUrl) {
  function copyHUDUrl(hudId) {
    try {
      const base = window && window.location ? window.location.origin : "";
      const url = `${base}/hud/${hudId}`;
      const tempInput = document.createElement("input");
      tempInput.style.position = "absolute";
      tempInput.style.left = "-9999px";
      tempInput.value = url;
      document.body.appendChild(tempInput);
      try {
        tempInput.select();
        tempInput.setSelectionRange(0, 99999);
        const ok = document.execCommand("copy");
        if (ok) {
          alert("Ссылка скопирована в буфер обмена!");
        } else {
          throw new Error("execCommand copy returned false");
        }
      } catch (err) {
        console.error("Ошибка при копировании:", err);
        prompt("Пожалуйста, скопируйте ссылку вручную (Ctrl+C):", url);
      } finally {
        document.body.removeChild(tempInput);
      }
    } catch (e) {
      console.error("copyHUDUrl failed:", e);
    }
  }
  window.copyHUDUrl = copyHUDUrl;
}
// Глобальный буфер для GSI данных
let gsiDataBuffer = null;
// Глобальные переменные для информации о сервере
let serverIP = "localhost";
let serverPort = 2626;

// Функция для получения информации о сервере
async function initializeServerInfo() {
  try {
    const response = await fetch("/api/server-info");
    const serverInfo = await response.json();
    serverIP = serverInfo.ip;
    serverPort = serverInfo.port;

    // Сохраняем IP и порт в localStorage для использования в других скриптах
    localStorage.setItem("serverIP", serverIP);
    localStorage.setItem("serverPort", serverPort.toString());

    //console.log(`Сервер обнаружен на http://${serverIP}:${serverPort}`);
  } catch (error) {
    console.error("Ошибка при получении информации о сервере:", error);
  }
}

// Обновляем существующий обработчик DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  // Сначала получаем информацию о сервере
  await initializeServerInfo();

  // Остальной существующий код
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Показываем только секцию матча по умолчанию
  const matchSection = document.getElementById("match-section");
  if (matchSection) {
    matchSection.classList.add("active");
  }

  // Отмечаем соответствующую кнопку в меню как активную
  document.querySelectorAll(".nav-button").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.section === "match-section") {
      btn.classList.add("active");
    }
  });

  // Инициализируем остальные компоненты
  initializeNavigation();
  initializeGSI();
  loadInitialData();
  initFormHandlers();
  initFaceitImport();

  // Метрики PPS/FPS в панели
  try {
    const ppsEl = document.getElementById("metrics-pps");
    const fpsEl = document.getElementById("metrics-fps");
    const radarPlayersEl = document.getElementById("metrics-radar-players");
    const radarGrenadesEl = document.getElementById("metrics-radar-grenades");
    const radarUpdatesEl = document.getElementById("metrics-radar-updates");
    const cpuEl = document.getElementById("metrics-cpu");
    const rssEl = document.getElementById("metrics-rss");
    const heapEl = document.getElementById("metrics-heap");
    if (ppsEl || fpsEl) {
      const setPpsColor = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        if (n <= 30) {
          ppsEl && (ppsEl.style.color = "#2ecc71"); // зелёный
        } else if (n <= 50) {
          ppsEl && (ppsEl.style.color = "#ffd600"); // жёлтый
        } else {
          ppsEl && (ppsEl.style.color = "#ff5252"); // красный
        }
      };
      const setFpsColor = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        if (n <= 15) {
          fpsEl && (fpsEl.style.color = "#ff5252"); // красный
        } else if (n <= 30) {
          fpsEl && (fpsEl.style.color = "#ffd600"); // жёлтый
        } else {
          fpsEl && (fpsEl.style.color = "#2ecc71"); // зелёный
        }
      };
      const setCpuColor = (percent) => {
        const n = Number(percent);
        if (!Number.isFinite(n)) return;
        if (n <= 40) {
          cpuEl && (cpuEl.style.color = "#2ecc71");
        } else if (n <= 75) {
          cpuEl && (cpuEl.style.color = "#ffd600");
        } else {
          cpuEl && (cpuEl.style.color = "#ff5252");
        }
      };

      // 1) Периодический пуллинг PPS с сервера
      const pullPps = async () => {
        try {
          const r = await fetch("/api/metrics");
          if (r.ok) {
            const j = await r.json().catch(() => ({}));
            if (ppsEl && typeof j.pps_current !== "undefined") {
              ppsEl.textContent = String(j.pps_current);
              setPpsColor(j.pps_current);
            }
            if (fpsEl && typeof j.fps_current !== "undefined") {
              // Если данных не было более 2 секунд — считаем источник неактивным
              const fresh =
                typeof j.fps_last_at === "number" &&
                Date.now() - j.fps_last_at <= 2000;
              if (fresh) {
                fpsEl.textContent = String(j.fps_current);
                setFpsColor(j.fps_current);
              } else {
                fpsEl.textContent = "—";
                fpsEl.style.color = "#ccc";
              }
            }
            if (j && j.radar) {
              const fresh =
                typeof j.radar.lastAt === "number" &&
                Date.now() - j.radar.lastAt <= 2000;
              if (!fresh) {
                if (radarPlayersEl) {
                  radarPlayersEl.textContent = "—";
                  radarPlayersEl.style.color = "#ccc";
                }
                if (radarGrenadesEl) {
                  radarGrenadesEl.textContent = "—";
                  radarGrenadesEl.style.color = "#ccc";
                }
                if (radarUpdatesEl) {
                  radarUpdatesEl.textContent = "—";
                  radarUpdatesEl.style.color = "#ccc";
                }
              } else {
                if (radarPlayersEl) {
                  if (typeof j.radar.players_per_sec !== "undefined") {
                    radarPlayersEl.textContent = String(
                      j.radar.players_per_sec
                    );
                  } else {
                    radarPlayersEl.textContent = "—";
                    radarPlayersEl.style.color = "#ccc";
                  }
                }
                if (radarGrenadesEl) {
                  if (typeof j.radar.grenades_per_sec !== "undefined") {
                    radarGrenadesEl.textContent = String(
                      j.radar.grenades_per_sec
                    );
                  } else {
                    radarGrenadesEl.textContent = "—";
                    radarGrenadesEl.style.color = "#ccc";
                  }
                }
                if (radarUpdatesEl) {
                  if (typeof j.radar.radar_updates_per_sec !== "undefined") {
                    radarUpdatesEl.textContent = String(
                      j.radar.radar_updates_per_sec
                    );
                  } else {
                    radarUpdatesEl.textContent = "—";
                    radarUpdatesEl.style.color = "#ccc";
                  }
                }
              }
            }
            if (j && j.cpu) {
              if (cpuEl && typeof j.cpu.percent !== "undefined") {
                cpuEl.textContent = `${j.cpu.percent}%`;
                setCpuColor(j.cpu.percent);
              }
              if (rssEl && typeof j.cpu.rssMB !== "undefined") {
                rssEl.textContent = `${j.cpu.rssMB}MB`;
              }
              if (heapEl && typeof j.cpu.heapMB !== "undefined") {
                heapEl.textContent = `${j.cpu.heapMB}MB`;
              }
            }
          }
        } catch (_) {}
        setTimeout(pullPps, 1000);
      };
      pullPps();

      // 2) Подписка на Socket.IO метрики, если доступно
      if (window.io) {
        const socket = window.__metricsSocket || io();
        window.__metricsSocket = socket;
        socket.on("metrics", (m) => {
          try {
            if (m?.type === "pps" && ppsEl) {
              ppsEl.textContent = String(m.value);
              setPpsColor(m.value);
            }
            if (m?.type === "fps" && fpsEl) {
              fpsEl.textContent = String(m.value);
              setFpsColor(m.value);
            }
            if (m?.type === "cpu") {
              if (cpuEl && typeof m.percent !== "undefined") {
                cpuEl.textContent = `${m.percent}%`;
                setCpuColor(m.percent);
              }
              if (rssEl && typeof m.rssMB !== "undefined") {
                rssEl.textContent = `${m.rssMB}MB`;
              }
              if (heapEl && typeof m.heapMB !== "undefined") {
                heapEl.textContent = `${m.heapMB}MB`;
              }
            }
            if (m?.type === "radar" && m?.name) {
              if (m.name === "players_per_sec" && radarPlayersEl) {
                radarPlayersEl.textContent = String(m.value);
              }
              if (m.name === "grenades_per_sec" && radarGrenadesEl) {
                radarGrenadesEl.textContent = String(m.value);
              }
              if (m.name === "radar_updates_per_sec" && radarUpdatesEl) {
                radarUpdatesEl.textContent = String(m.value);
              }
            }
          } catch (_) {}
        });
      }
    }
  } catch (_) {}
});

// Инициализация навигации
function initializeNavigation() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      // Убираем активный класс у всех кнопок и секций
      document
        .querySelectorAll(".nav-button")
        .forEach((btn) => btn.classList.remove("active"));
      document
        .querySelectorAll(".content-section")
        .forEach((section) => section.classList.remove("active"));

      // Добавляем активный класс нажатой кнопке
      button.classList.add("active");

      // Показываем соответствующую секцию
      const sectionId = button.dataset.section;
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.add("active");
        if (sectionId === "scoreboard-section") {
          updateGameInfo(); // Обновляем скорборд при переключении
        }
        if (sectionId === "faceit-import-section") {
          const input = document.getElementById("faceit-matchroom");
          if (input && !input.value) input.focus();
        }
      }
    });
  });
}

// ============== FACEIT IMPORT ==============
function initFaceitImport() {
  const btn = document.getElementById("faceit-import-btn");
  const input = document.getElementById("faceit-matchroom");
  const resultsEl = document.getElementById("faceit-import-results");
  if (!btn || !input || !resultsEl) return;

  btn.addEventListener("click", async () => {
    const value = (input.value || "").trim();
    if (!value) {
      alert("Введите matchroom URL или ID");
      return;
    }
    resultsEl.textContent = "Загрузка...";
    try {
      const resp = await fetch("/api/faceit/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchroom: value }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        alert(`Ошибка: ${data.error || resp.status}`);
        resultsEl.innerHTML = "";
        return;
      }
      await renderFaceitResults(data, resultsEl);
      // Обновим списки команд/игроков после импорта
      try {
        await loadTeams();
      } catch (_) {}
      try {
        await loadPlayers();
      } catch (_) {}
    } catch (e) {
      alert("Сбой запроса к /api/faceit/import");
      resultsEl.innerHTML = "";
    }
  });

  // Привязка кнопки получения состава команды по URL (index.html)
  const teamBtn = document.getElementById("faceit-team-roster-btn");
  const teamInput = document.getElementById("faceit-team-url");
  const teamOut = document.getElementById("faceit-team-roster-results");
  if (teamBtn && teamInput && teamOut) {
    teamBtn.addEventListener("click", async () => {
      const url = (teamInput.value || "").trim();
      if (!url) {
        alert("Укажите ссылку на команду FACEIT");
        return;
      }
      teamOut.textContent = "Загрузка состава...";
      try {
        const api = new URL("/api/faceit/team/roster", window.location.origin);
        api.searchParams.set("url", url);
        const r = await fetch(api.toString(), { cache: "no-store" });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          teamOut.textContent = data?.error || "Ошибка получения состава";
          return;
        }
        const players = Array.isArray(data?.players) ? data.players : [];
        if (!players.length) {
          teamOut.textContent = "Состав пуст";
          return;
        }
        // Загрузим существующих игроков для проверки статуса
        let existingBySteam = new Set();
        let existingByNick = new Set();
        try {
          const rAll = await fetch("/api/players");
          const pd = await rAll.json().catch(() => ({}));
          const all = Array.isArray(pd) ? pd : pd.players || [];
          existingBySteam = new Set(
            (all || [])
              .map((p) => (p.steam64 != null ? String(p.steam64) : null))
              .filter(Boolean)
          );
          existingByNick = new Set(
            (all || [])
              .map((p) => (p.nickname || p.name || "").toLowerCase())
              .filter(Boolean)
          );
        } catch (_) {}
        const rows = players
          .map((p, i) => {
            const nick = p.nickname || "";
            const s64 = p.steam64 || "";
            const realName = p.realName || "";
            const exists =
              (s64 && existingBySteam.has(String(s64))) ||
              (nick && existingByNick.has(String(nick).toLowerCase()));
            const status = exists ? "exists" : "missing";
            const statusText = exists ? i18n("inDb") : i18n("newStatus");
            const addBtn = exists
              ? ""
              : `<button class=\"button-cs2 roster-add-player\" data-row=\"r-${i}\">${i18n(
                  "add"
                )}</button>`;
            return `
              <tr data-row=\"r-${i}\">\n                <td><input type=\"text\" class=\"roster-nick\" value=\"${nick}\" placeholder=\"${i18n(
              "nickname"
            )}\" /></td>\n                <td><input type=\"text\" class=\"roster-realname\" value=\"${realName}\" placeholder=\"${i18n(
              "playerRealName"
            )}\" /></td>\n                <td><input type=\"text\" class=\"roster-steam64\" value=\"${s64}\" placeholder=\"${i18n(
              "playerSteam64"
            )}\" /></td>\n                <td><span class=\"faceit-status ${status}\">${statusText}</span> <button class=\"btn-mini roster-resolve\" data-nick=\"${nick}\">${i18n(
              "getSteam64"
            )}</button></td>\n                <td><input type=\"file\" class=\"roster-avatar\" accept=\"image/*\" /> ${addBtn}</td>\n              </tr>`;
          })
          .join("");
        teamOut.innerHTML = `
          <div><b>${i18n("teamLabel")}:</b> ${
          data.teamName || data.teamId || ""
        }</div>
          <table class=\"faceit-team-table\" style=\"margin-top:6px; width:100%\">\n            <thead><tr><th>${i18n(
            "nickname"
          )}</th><th>${i18n("playerRealName")}</th><th>${i18n(
          "playerSteam64"
        )}</th><th>${i18n("status") || ""}</th><th>${i18n("avatar")}/${i18n(
          "actions"
        )}</th></tr></thead>\n            <tbody>${rows}</tbody>\n          </table>`;

        // Навесить обработчики: нормализация Steam64
        teamOut.querySelectorAll(".roster-steam64").forEach((inp) => {
          const normalize = () => {
            const m = String(inp.value || "").match(/7656119\d{10}/);
            if (m) inp.value = m[0];
          };
          inp.addEventListener("blur", normalize);
          inp.addEventListener("change", normalize);
          inp.addEventListener("paste", () => setTimeout(normalize, 0));
        });

        // Получить Steam64 по нику
        teamOut.querySelectorAll(".roster-resolve").forEach((b) => {
          b.addEventListener("click", async (ev) => {
            const tr = ev.currentTarget.closest("tr");
            if (!tr) return;
            const nick = (tr.querySelector(".roster-nick")?.value || "").trim();
            const s64Inp = tr.querySelector(".roster-steam64");
            if (!nick || !s64Inp) return;
            const u = new URL(
              "/api/faceit/resolve-steam64",
              window.location.origin
            );
            u.searchParams.set("nickname", nick);
            try {
              const r2 = await fetch(u.toString());
              const j2 = await r2.json().catch(() => ({}));
              if (r2.ok && j2?.steam64) s64Inp.value = j2.steam64;
              const statusCell = tr.querySelector(".faceit-status");
              const addBtn = tr.querySelector(".roster-add-player");
              const existsNow =
                (s64Inp.value && existingBySteam.has(String(s64Inp.value))) ||
                (nick && existingByNick.has(String(nick).toLowerCase()));
              if (statusCell) {
                statusCell.classList.remove("missing", "exists");
                statusCell.classList.add(existsNow ? "exists" : "missing");
                statusCell.textContent = existsNow
                  ? i18n("inDb")
                  : i18n("newStatus");
              }
              if (existsNow && addBtn) addBtn.remove();
            } catch (_) {}
          });
        });

        // Добавить игрока
        teamOut.querySelectorAll(".roster-add-player").forEach((b) => {
          b.addEventListener("click", async (ev) => {
            const tr = ev.currentTarget.closest("tr");
            if (!tr) return;
            const nick = (tr.querySelector(".roster-nick")?.value || "").trim();
            const realName = (
              tr.querySelector(".roster-realname")?.value || ""
            ).trim();
            const s64 = (
              tr.querySelector(".roster-steam64")?.value || ""
            ).trim();
            const file = tr.querySelector(".roster-avatar")?.files?.[0] || null;
            if (!s64) {
              alert("Укажите Steam64");
              return;
            }
            const form = new FormData();
            form.set("nickname", nick);
            if (realName) form.set("realName", realName);
            form.set("steam64", s64);
            if (file) form.append("avatar", file);
            try {
              const r3 = await fetch("/api/players", {
                method: "POST",
                body: form,
              });
              if (!r3.ok) {
                const e = await r3.json().catch(() => ({}));
                throw new Error(e.error || r3.status);
              }
              const statusCell = tr.querySelector(".faceit-status");
              if (statusCell) {
                statusCell.classList.remove("missing");
                statusCell.classList.add("exists");
                statusCell.textContent = i18n("inDb");
              }
              ev.currentTarget.remove();
            } catch (err) {
              alert("Ошибка добавления игрока: " + err.message);
            }
          });
        });

        // Проверка статуса при ручном вводе ник/Steam64
        const updateRosterRowStatus = (tr) => {
          const nick = (tr.querySelector(".roster-nick")?.value || "").trim();
          const s64 = (tr.querySelector(".roster-steam64")?.value || "").trim();
          const statusCell = tr.querySelector(".faceit-status");
          const addBtn = tr.querySelector(".roster-add-player");
          const existsNow =
            (s64 && existingBySteam.has(String(s64))) ||
            (nick && existingByNick.has(String(nick).toLowerCase()));
          if (statusCell) {
            statusCell.classList.remove("missing", "exists");
            statusCell.classList.add(existsNow ? "exists" : "missing");
            statusCell.textContent = existsNow
              ? i18n("inDb")
              : i18n("newStatus");
          }
          if (existsNow && addBtn) addBtn.remove();
        };
        teamOut
          .querySelectorAll(".roster-steam64, .roster-nick")
          .forEach((inp) => {
            inp.addEventListener("blur", (e) => {
              const tr = e.currentTarget.closest("tr");
              if (tr) updateRosterRowStatus(tr);
            });
            inp.addEventListener("change", (e) => {
              const tr = e.currentTarget.closest("tr");
              if (tr) updateRosterRowStatus(tr);
            });
            inp.addEventListener("keyup", (e) => {
              const tr = e.currentTarget.closest("tr");
              if (tr) updateRosterRowStatus(tr);
            });
          });
      } catch (e) {
        teamOut.textContent = "Ошибка запроса";
      }
    });
  }
}

// Привязка импорта мап-вэто в модалке редактирования матча
// Удален раздел ввода Matchroom/вставки вето в модалке
// Применение истории мап-вэто из FACEIT к UI выбора карт
function applyFaceitVetoToUI(veto, teams) {
  return;
}

// Разбор текста вето, пример строк (RU/EN):
// "K27 блокирует: Nuke", "Insilio блокирует: Inferno",
// "Train выбирается фракцией K27", "Ancient выбирается по умолчанию",
// "K27 bans Nuke", "Mirage is picked by Insilio", "Ancient is the decider"
// parseVetoText удалён вместе с формой ввода

// Применение к новому редактору карт на основе селектов
function applyVetoToEditor(veto, teams, root) {
  return;
}
async function renderFaceitResults(data, container) {
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  if (!teams.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = "Загрузка...";
  let allTeams = [];
  let allPlayers = [];
  try {
    const [teamsResp, playersResp] = await Promise.all([
      fetch("/api/teams"),
      fetch("/api/players"),
    ]);
    allTeams = (await teamsResp.json().catch(() => [])) || [];
    const playersData = await playersResp.json().catch(() => ({}));
    allPlayers = Array.isArray(playersData)
      ? playersData
      : playersData.players || [];
  } catch (_) {}

  const teamIdToName = new Map(
    (allTeams || []).map((t) => [String(t.id), t.name])
  );
  const teamNameToId = new Map(
    (allTeams || []).map((t) => [
      String((t.name || "").toLowerCase()),
      String(t.id),
    ])
  );
  const existingBySteam = new Set(
    (allPlayers || [])
      .map((p) => (p.steam64 != null ? String(p.steam64) : null))
      .filter(Boolean)
  );
  const existingByNick = new Set(
    (allPlayers || [])
      .map((p) => (p.nickname || p.name || "").toLowerCase())
      .filter(Boolean)
  );

  const cardHtml = teams
    .map((t, idx) => {
      const players = Array.isArray(t.players) ? t.players : [];
      const teamName = String(t.teamName || "");

      const rows = players
        .map((p, pidx) => {
          const nickname = p.nickname || "";
          const steam64 = p.steam64 || "";
          const realName = p.realName || "";
          const playerRowId = `${idx}-${pidx}`;
          const exists =
            (steam64 && existingBySteam.has(String(steam64))) ||
            existingByNick.has(String(nickname).toLowerCase());
          const statusHtml = `<span class=\"faceit-status ${
            exists ? "exists" : "missing"
          }\">${exists ? i18n("inDb") : i18n("newStatus")}</span>`;
          const actionHtml = exists
            ? ""
            : `<button class="button-cs2 faceit-add-player" data-row="${playerRowId}">${i18n(
                "add"
              )}</button>`;
          return `
            <tr data-row="${playerRowId}">
              <td>
                <input type=\"text\" class=\"faceit-nick\" value=\"${nickname}\" placeholder=\"${
            i18n("playerNickname") || i18n("nickname")
          }\" />
              </td>
              <td>
                <input type=\"text\" class=\"faceit-realname\" value=\"${realName}\" placeholder=\"${
            i18n("playerRealName") || i18n("realName")
          }\" />
              </td>
              <td>
                <input type=\"text\" class=\"faceit-steam64\" placeholder=\"${
                  i18n("playerSteam64") || "Steam64"
                }\" value=\"${steam64 || ""}\" />
              </td>
              <td>${statusHtml} <button class=\"btn-mini faceit-auto-resolve\" data-nick=\"${nickname}\">${i18n(
            "getSteam64"
          )}</button></td>
              <td>
                <input type="file" class="faceit-avatar" accept="image/*" />
                ${actionHtml}
              </td>
            </tr>`;
        })
        .join("");
      const viewRows = players
        .map(
          (p) =>
            `<tr><td>${p.nickname || ""}</td><td>${p.steam64 || ""}</td></tr>`
        )
        .join("");
      return `
        <div class="faceit-team-card" data-team-index="${idx}">
          <div class="faceit-team-header">${i18n("teamLabel")}: ${
        teamName || i18n("noTeam") || ""
      }</div>
          <div class="faceit-team-actions" style="margin:6px 0 10px; display:flex; gap:8px; align-items:center;">
            <input type="file" class="faceit-team-logo" accept="image/*" />
            <button class="btn-mini faceit-add-team" data-i18n="addTeam">${i18n(
              "addTeam"
            )}</button>
          </div>
          <table class=\"faceit-team-table faceit-table-edit\">
            <thead>
              <tr><th>${i18n("nickname")}</th><th>${i18n(
        "realName"
      )}</th><th>${i18n("playerSteam64")}</th><th>${
        i18n("status") || ""
      }</th><th>${i18n("avatar")}/${i18n("actions")}</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <table class="faceit-team-table faceit-table-view" style="margin-top:6px; width:100%; display:none">
            <thead><tr><th>${i18n("nickname")}</th><th>${i18n(
        "playerSteam64"
      )}</th></tr></thead>
            <tbody>${viewRows}</tbody>
          </table>
        </div>`;
    })
    .join("");
  container.innerHTML = cardHtml;
  // Переключатель Просмотр/Редактировать
  container.querySelectorAll(".faceit-toggle-view").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".faceit-team-card");
      if (!card) return;
      const editTable = card.querySelector(".faceit-table-edit");
      const viewTable = card.querySelector(".faceit-table-view");
      if (!editTable || !viewTable) return;
      const editing = editTable.style.display !== "none";
      if (editing) {
        editTable.style.display = "none";
        viewTable.style.display = "table";
        e.currentTarget.textContent = "Редактировать";
      } else {
        editTable.style.display = "table";
        viewTable.style.display = "none";
        e.currentTarget.textContent = "Просмотр";
      }
    });
  });

  // Автозаполнение пустых Steam64 по нику (последовательно, чтобы не спамить API)
  (async () => {
    const rows = Array.from(
      container.querySelectorAll(
        ".faceit-team-card .faceit-table-edit tbody tr"
      )
    );
    for (const tr of rows) {
      try {
        const nickInput = tr.querySelector(".faceit-nick");
        const steam64Input = tr.querySelector(".faceit-steam64");
        if (!nickInput || !steam64Input) continue;
        const nickname = String(
          nickInput.value || nickInput.getAttribute("value") || ""
        ).trim();
        const current = String(steam64Input.value || "").trim();
        if (!nickname || current) continue;
        const url = new URL(
          "/api/faceit/resolve-steam64",
          window.location.origin
        );
        url.searchParams.set("nickname", nickname);
        const resp = await fetch(url.toString());
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data?.steam64) {
          const resolved = String(data.steam64);
          steam64Input.value = resolved;
          // Обновить статус наличия в базе
          try {
            const statusCell = tr.querySelector(".faceit-status");
            const addBtn = tr.querySelector(".faceit-add-player");
            const nickLower = String(nickname).toLowerCase();
            const existsNow =
              (resolved && existingBySteam.has(resolved)) ||
              existingByNick.has(nickLower);
            if (statusCell) {
              statusCell.classList.remove("missing", "exists");
              statusCell.classList.add(existsNow ? "exists" : "missing");
              statusCell.textContent = existsNow
                ? i18n("inDb")
                : i18n("newStatus");
            }
            if (existsNow && addBtn) addBtn.remove();
          } catch (_) {}
        }
        await new Promise((r) => setTimeout(r, 200));
      } catch (_) {}
    }
  })();
  // Переключатель Просмотр/Редактировать
  container.querySelectorAll(".faceit-toggle-view").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".faceit-team-card");
      if (!card) return;
      const editTable = card.querySelector(".faceit-table-edit");
      const viewTable = card.querySelector(".faceit-table-view");
      if (!editTable || !viewTable) return;
      const editing = editTable.style.display !== "none";
      if (editing) {
        editTable.style.display = "none";
        viewTable.style.display = "table";
        e.currentTarget.textContent = "Редактировать";
      } else {
        editTable.style.display = "table";
        viewTable.style.display = "none";
        e.currentTarget.textContent = "Просмотр";
      }
    });
  });
  // Нормализатор Steam64: принимает URL/строку и возвращает 17-значный SteamID64
  const extractSteam64 = (raw) => {
    const s = String(raw || "").trim();
    // 1) Ищем 17-значный ID начиная с 7656119
    const m1 = s.match(/7656119\d{10}/);
    if (m1) return m1[0];
    // 2) steamcommunity.com/profiles/<id>
    const m2 = s.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
    if (m2) return m2[1];
    // 3) steamrep.com/search?q=<encoded URL with /profiles/<id>/>
    try {
      const url = new URL(s);
      const q = url.searchParams.get("q");
      if (q) {
        const inner = decodeURIComponent(q);
        const m3 = inner.match(/profiles\/(\d{17})/i);
        if (m3) return m3[1];
        const m4 = inner.match(/7656119\d{10}/);
        if (m4) return m4[0];
      }
    } catch (_) {}
    return "";
  };

  // Навесим обработчики нормализации и моментальной проверки статуса (по нику/Steam64)
  const computeExistsLocal = (nick, steam64) => {
    const bySteam = steam64 ? existingBySteam.has(String(steam64)) : false;
    const byNick = nick
      ? existingByNick.has(String(nick).toLowerCase())
      : false;
    return bySteam || byNick;
  };

  const updateRowStatusLocal = (tr) => {
    const nick = (tr.querySelector(".faceit-nick")?.value || "").trim();
    const s64 = (tr.querySelector(".faceit-steam64")?.value || "").trim();
    const existsNow = computeExistsLocal(nick, s64);
    const statusCell = tr.querySelector(".faceit-status");
    const addBtn = tr.querySelector(".faceit-add-player");
    if (statusCell) {
      statusCell.classList.remove("missing", "exists");
      statusCell.classList.add(existsNow ? "exists" : "missing");
      statusCell.textContent = existsNow ? i18n("inDb") : i18n("newStatus");
    }
    if (existsNow && addBtn) addBtn.remove();
  };

  container.querySelectorAll("input.faceit-steam64").forEach((inp) => {
    const normalize = () => {
      const extracted = extractSteam64(inp.value);
      if (extracted) inp.value = extracted;
      const tr = inp.closest("tr");
      if (tr) updateRowStatusLocal(tr);
    };
    inp.addEventListener("blur", normalize);
    inp.addEventListener("change", normalize);
    inp.addEventListener("paste", () => setTimeout(normalize, 0));
    inp.addEventListener("keyup", () => {
      const tr = inp.closest("tr");
      if (tr) updateRowStatusLocal(tr);
    });
  });

  container.querySelectorAll("input.faceit-nick").forEach((inp) => {
    const onNick = () => {
      const tr = inp.closest("tr");
      if (tr) updateRowStatusLocal(tr);
    };
    inp.addEventListener("blur", onNick);
    inp.addEventListener("change", onNick);
    inp.addEventListener("keyup", onNick);
  });

  // Кнопка Получить Steam64: запросить steam64 по нику на FACEIT
  container.querySelectorAll(".faceit-auto-resolve").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const button = e.currentTarget;
      const tr = button.closest("tr");
      if (!tr) return;
      const nickInput = tr.querySelector(".faceit-nick");
      const nickname = nickInput ? nickInput.value.trim() : "";
      const steam64Input = tr.querySelector(".faceit-steam64");
      if (!nickname) return;
      button.disabled = true;
      const prev = button.textContent;
      button.textContent = "...";
      try {
        const url = new URL(
          "/api/faceit/resolve-steam64",
          window.location.origin
        );
        url.searchParams.set("nickname", nickname);
        const resp = await fetch(url.toString());
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data?.steam64) {
          steam64Input.value = data.steam64;
        } else {
          alert("Не удалось найти Steam64 по нику на FACEIT");
        }
      } catch (_) {
        alert("Ошибка запроса автоопределения Steam64");
      } finally {
        button.textContent = prev;
        button.disabled = false;
      }
    });
  });

  // Кнопка Получить Аватарку (старый способ) отключена
  container.querySelectorAll(".faceit-hltv-avatar").forEach((btn) => {
    btn.addEventListener("click", () => {
      alert("Поиск аватарки на HLTV отключён. Загрузите файл.");
    });
  });

  // (удалено) Кнопка "Найти на HLTV"

  // (удалено) Кнопка "Вставить ссылку HLTV"

  // Кнопка "Импорт из FACEIT команды": получить состав по URL и добавить строки
  container.querySelectorAll(".faceit-fetch-team").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const card = e.currentTarget.closest(".faceit-team-card");
      if (!card) return;
      const tbody = card.querySelector("tbody");
      if (!tbody) return;
      const url = window.prompt(
        "Вставьте ссылку на команду FACEIT",
        "https://www.faceit.com/ru/teams/"
      );
      if (!url) return;
      let data = null;
      try {
        const api = new URL("/api/faceit/team/roster", window.location.origin);
        api.searchParams.set("url", url);
        const r = await fetch(api.toString(), { cache: "no-store" });
        data = await r.json().catch(() => ({}));
        if (!r.ok || !Array.isArray(data?.players) || !data.players.length) {
          alert(data?.error || "Состав команды не найден");
          return;
        }
      } catch (_) {
        alert("Ошибка запроса состава команды");
        return;
      }

      const hasSet = (s) => s && typeof s.has === "function";
      const isExists = (nick, steam64) => {
        try {
          if (
            hasSet(window.existingBySteam) &&
            steam64 &&
            existingBySteam.has(String(steam64))
          )
            return true;
          if (
            hasSet(window.existingByNick) &&
            nick &&
            existingByNick.has(String(nick).toLowerCase())
          )
            return true;
        } catch (_) {}
        return false;
      };

      const attachAutoResolve = (row) => {
        const btnResolve = row.querySelector(".faceit-auto-resolve");
        if (!btnResolve) return;
        btnResolve.addEventListener("click", async () => {
          const nickInput = row.querySelector(".faceit-nick");
          const steam64Input = row.querySelector(".faceit-steam64");
          const nickname = (nickInput?.value || "").trim();
          if (!nickname) return;
          btnResolve.disabled = true;
          const prev = btnResolve.textContent;
          btnResolve.textContent = "...";
          try {
            const u = new URL(
              "/api/faceit/resolve-steam64",
              window.location.origin
            );
            u.searchParams.set("nickname", nickname);
            const resp = await fetch(u.toString());
            const j = await resp.json().catch(() => ({}));
            if (resp.ok && j?.steam64) steam64Input.value = j.steam64;
            else alert("Не удалось найти Steam64 по нику на FACEIT");
          } catch (_) {
            alert("Ошибка запроса автоопределения Steam64");
          } finally {
            btnResolve.textContent = prev;
            btnResolve.disabled = false;
          }
        });
      };

      const attachAddPlayer = (row) => {
        const button = row.querySelector(".faceit-add-player");
        if (!button) return;
        button.addEventListener("click", async () => {
          const tr = button.closest("tr");
          if (!tr) return;
          const steam64Input = tr.querySelector(".faceit-steam64");
          const nickname = (
            tr.querySelector(".faceit-nick")?.value || ""
          ).trim();
          const avatarFile =
            tr.querySelector(".faceit-avatar")?.files?.[0] || null;
          if (!steam64Input?.value) {
            alert("Укажите Steam64");
            return;
          }
          if (
            (hasSet(window.existingBySteam) &&
              existingBySteam.has(String(steam64Input.value))) ||
            (hasSet(window.existingByNick) &&
              existingByNick.has(String(nickname).toLowerCase()))
          ) {
            alert("Игрок уже в базе");
            return;
          }
          try {
            button.disabled = true;
            button.textContent = i18n("saving") || "...";
            const form = new FormData();
            form.set("nickname", nickname);
            form.set("steam64", steam64Input.value);
            if (avatarFile) form.append("avatar", avatarFile);
            const resp = await fetch("/api/players", {
              method: "POST",
              body: form,
            });
            if (!resp.ok) {
              const err = await resp.json().catch(() => ({}));
              throw new Error(err.error || `HTTP ${resp.status}`);
            }
            button.textContent = i18n("added") || "OK";
            try {
              await loadPlayers();
            } catch (_) {}
            const statusCell = tr.querySelector(".faceit-status");
            if (statusCell) {
              statusCell.classList.remove("missing");
              statusCell.classList.add("exists");
              statusCell.textContent = i18n("inDb");
            }
            button.remove();
          } catch (err) {
            alert("Ошибка добавления игрока: " + err.message);
            button.textContent = i18n("add");
            button.disabled = false;
          }
        });
      };

      data.players.forEach((pl, idx) => {
        const nickname = String(pl?.nickname || "").trim();
        const steam64 = String(pl?.steam64 || "").trim();
        if (!nickname) return;
        const rowId = `${Date.now()}-${idx}`;
        const exists = isExists(nickname, steam64);
        const statusHtml = `<span class="faceit-status ${
          exists ? "exists" : "missing"
        }">${exists ? i18n("inDb") : i18n("newStatus")}</span>`;
        const actionHtml = exists
          ? ""
          : `<button class="button-cs2 faceit-add-player" data-row="${rowId}">${i18n(
              "add"
            )}</button>`;
        const html = `
          <tr data-row="${rowId}">
            <td><input type=\"text\" class=\"faceit-nick\" value=\"${nickname}\" placeholder=\"${i18n(
          "nickname"
        )}\" /></td>
            <td><input type=\"text\" class=\"faceit-steam64\" placeholder=\"${i18n(
              "playerSteam64"
            )}\" value=\"${steam64}\" /></td>
            <td>${statusHtml} <button class=\"btn-mini faceit-auto-resolve\" data-nick=\"${nickname}\">${i18n(
          "getSteam64"
        )}</button></td>
            <td><input type=\"file\" class=\"faceit-avatar\" accept=\"image/*\" /> ${actionHtml}</td>
          </tr>`;
        tbody.insertAdjacentHTML("beforeend", html);
        const row = tbody.querySelector(`tr[data-row="${rowId}"]`);
        if (row) {
          attachAutoResolve(row);
          attachAddPlayer(row);
        }
      });

      alert(`Импортировано игроков: ${data.players.length}`);
    });
  });

  container.querySelectorAll(".faceit-add-player").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const button = e.currentTarget;
      const tr = button.closest("tr");
      if (!tr) return;
      const steam64Input = tr.querySelector(".faceit-steam64");
      let steam64 = (steam64Input?.value || "").trim();
      // Нормализуем: поддерживаем вставку URL (steamcommunity / steamrep)
      const extracted = extractSteam64(steam64);
      if (extracted) {
        steam64 = extracted;
        if (steam64Input) steam64Input.value = extracted;
      }
      const nickname = (tr.querySelector(".faceit-nick")?.value || "").trim();
      const realName = (
        tr.querySelector(".faceit-realname")?.value || ""
      ).trim();
      const avatarFile = tr.querySelector(".faceit-avatar")?.files?.[0] || null;
      // Привязка к выбранной команде из ближайшей карточки
      const card = tr.closest(".faceit-team-card");
      const teamId = ""; // без привязки к другой команде

      if (!steam64) {
        alert("Укажите Steam64");
        return;
      }

      if (
        existingBySteam.has(String(steam64)) ||
        existingByNick.has(String(nickname).toLowerCase())
      ) {
        alert("Игрок уже в базе");
        return;
      }

      try {
        button.disabled = true;
        button.textContent = i18n("saving") || "...";
        const form = new FormData();
        form.set("nickname", nickname);
        if (realName) form.set("realName", realName);
        form.set("steam64", steam64);
        if (teamId) form.set("teamId", String(teamId));
        if (avatarFile) form.append("avatar", avatarFile);

        const resp = await fetch("/api/players", {
          method: "POST",
          body: form,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${resp.status}`);
        }
        button.textContent = i18n("added") || "OK";
        try {
          await loadPlayers();
        } catch (_) {}
        const statusCell = tr.querySelector(".faceit-status");
        if (statusCell) {
          statusCell.classList.remove("missing");
          statusCell.classList.add("exists");
          statusCell.textContent = i18n("inDb");
        }
        button.remove();
      } catch (err) {
        console.error("Add player failed", err);
        alert("Ошибка добавления игрока: " + err.message);
        button.textContent = i18n("add");
      } finally {
        button.disabled = false;
      }
    });
  });

  // Добавление команды вручную
  container.querySelectorAll(".faceit-add-team").forEach((btn, idx) => {
    btn.addEventListener("click", async (e) => {
      const card = e.currentTarget.closest(".faceit-team-card");
      if (!card) return;
      const header = card.querySelector(".faceit-team-header");
      const nameText = header
        ? header.textContent
            .replace(new RegExp(`^${i18n("teamLabel")}\:\s*`, "i"), "")
            .trim()
        : "";
      const logoInput = card.querySelector(".faceit-team-logo");
      const sel = null;
      if (!nameText) return;

      // Дедуп по имени
      const existsTeam = (allTeams || []).some(
        (t) => String(t.name || "").toLowerCase() === nameText.toLowerCase()
      );
      if (existsTeam) {
        alert("Команда уже существует");
        return;
      }

      const form = new FormData();
      form.set("name", nameText);
      if (logoInput?.files?.[0]) form.append("logo", logoInput.files[0]);
      let ok = false;
      try {
        const resp = await fetch("/api/teams", { method: "POST", body: form });
        ok = resp.ok;
      } catch (_) {}
      if (ok) {
        try {
          await loadTeams();
        } catch (_) {}
        // Попробуем выбрать только что добавленную команду по имени
        const newId = teamNameToId.get(nameText.toLowerCase());
        if (sel && newId) sel.value = newId;
        alert("Команда добавлена");
      } else {
        alert("Ошибка добавления команды");
      }
    });
  });
}

// Инициализация GSI
function initializeGSI() {
  if (typeof window.gsiManager === "undefined") {
    console.error("GSIManager не инициализирован");
    return;
  }

  window.gsiManager.subscribe((event) => {
    switch (event.type) {
      case "connect":
        console.log("Подключено к серверу GSI");
        break;
      case "disconnect":
        console.log("Отключено от сервера GSI");
        break;
      case "update":
        gsiDataBuffer = event.data;
        updateGameInfo(); // обновляет скорборд
        // Если секция камер активна — обновляем её
        /*const camerasSection = document.getElementById('cameras-section');
                if (camerasSection && camerasSection.classList.contains('active')) {
                    initializeCamerasSection();
                }*/
        break;
    }
  });
}

// Загрузка начальных данных
function loadInitialData() {
  loadTeams();
  loadPlayers();
  loadHUDs();
  loadMatchesList(); // Добавляем загрузку списка матчей

  // Запускаем исправление путей к аватаркам
  setTimeout(fixAvatarPaths, 500);
  setTimeout(fixAvatarPaths, 1500);
}
// Вспомогательная функция для загрузки команд в select
async function loadTeamsForMatchSelect(selectElement, selectedValue = "") {
  try {
    const response = await fetch("/api/teams");
    const teams = await response.json();

    // Сохраняем выбранную опцию
    const selectedOptionValue = selectElement.value;

    // Определяем, какой атрибут data-i18n использовать
    const translationKey =
      selectElement.id === "team1Select" ? "team1_select" : "team2_select";

    // Очищаем селектор и добавляем опцию "Выберите команду"
    selectElement.innerHTML = `<option value="" data-i18n="selectTeam">Выберите команду</option>`;

    // Добавляем команды
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.name;
      selectElement.appendChild(option);
    });

    // Восстанавливаем выбранное значение
    if (selectedValue) {
      selectElement.value = selectedValue;
    } else if (selectedOptionValue) {
      selectElement.value = selectedOptionValue;
    }

    // После заполнения селектора, принудительно вызываем translatePage
    if (typeof translatePage === "function") {
      translatePage();
    }
  } catch (error) {
    console.error("Ошибка при загрузке команд:", error);
  }
}

// Добавляем новую функцию для инициализации кнопок редактирования
function initializeEditButtons() {
  document.querySelectorAll(".edit-match-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const matchId = this.dataset.matchId;
      await loadMatchDetails(matchId);
      modal.style.display = "block";
    });
  });
}

// Заменяем вызов loadTeamsIntoSelects на loadTeamsForSelect
document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    const sectionId = button.dataset.section;
    if (sectionId === "match-section") {
      const team1Select = document.getElementById("team1-select");
      const team2Select = document.getElementById("team2-select");
      if (team1Select && team2Select) {
        loadTeamsForSelect(team1Select);
        loadTeamsForSelect(team2Select);
      }
    }
    if (sectionId === "cameras-section") {
      if (
        !gsiDataBuffer ||
        !gsiDataBuffer.allplayers ||
        Object.keys(gsiDataBuffer.allplayers).length === 0
      ) {
        const list = document.getElementById("camera-players-list");
        if (list) list.innerHTML = "<p>Ожидание данных от сервера...</p>";
      } else {
        initializeCamerasSection();
      }
    }
  });
});
// ... existing code ...

// Заменяем прямое обращение к форме на безопасную проверку
document.addEventListener("DOMContentLoaded", () => {
  const createMatchForm = document.getElementById("createMatchForm");

  if (createMatchForm) {
    createMatchForm.onsubmit = async (e) => {
      e.preventDefault();

      try {
        const team1Id = document.getElementById("team1Select")?.value;
        const team2Id = document.getElementById("team2Select")?.value;
        const formatSelect = document.getElementById("formatSelect")?.value;

        if (!team1Id || !team2Id) {
          alert("Пожалуйста, выберите обе команды");
          return;
        }

        if (team1Id === team2Id) {
          alert("Нельзя выбрать одну и ту же команду");
          return;
        }

        const response = await fetch("/api/matches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            team1_id: team1Id,
            team2_id: team2Id,
            format: formatSelect || "bo1",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Ошибка при создании матча");
        }

        // Безопасно получаем и проверяем модальное окно
        const modal = document.getElementById("createMatchModal");
        if (modal) {
          modal.style.display = "none";
        }

        // Обновляем список матчей
        await loadMatchesList();

        // Очищаем форму
        createMatchForm.reset();
      } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка при создании матча: " + error.message);
      }
    };
  }
});
// Функция для обновления названий команд в зависимости от раунда
function updateTeamNamesBasedOnRound(currentRound) {
  if (!matchTeams) return;

  // Определяем, нужно ли менять стороны
  let shouldSwap = false;

  // Вторая половина (раунды 12–23)
  if (currentRound >= 12 && currentRound <= 23) {
    shouldSwap = true;
  }
  // Овертаймы (каждые 6 раундов, смена после каждых 3 раундов)
  else if (currentRound > 23) {
    const overtimeRound = currentRound - 24; // Нумерация овертаймов с 0
    if (overtimeRound % 3 === 0 && overtimeRound !== 0) {
      shouldSwap = true;
    }
  }

  if (shouldSwap) {
    // Меняем названия команд местами
    const tempName = matchTeams.team1.name;
    matchTeams.team1.name = matchTeams.team2.name;
    matchTeams.team2.name = tempName;

    console.log("Смена названий команд на раунде:", currentRound, {
      new_team1: matchTeams.team1.name,
      new_team2: matchTeams.team2.name,
    });
  }
}

// Функция для обновления данных матча
function updateMatchData(data) {
  if (data.map) {
    const currentRound = data.map.round || 0;
    updateTeamNamesBasedOnRound(currentRound);

    // Обновляем отображение команд
    updateTeamTurn();
    updateMapsOrder(matchFormat);
  }
}

// Глобальные переменные для отслеживания состояния выбора карт
let selectedMaps = [];
let currentTeam = 1; // 1 или 2
let matchFormat = "bo1";
let matchTeams = { team1: null, team2: null };

// Обновляем функцию editMatch
// Добавляем функцию для редактирования матча
// ... existing code ...

// ... existing code ...

// Функция для выбора карты
window.pickMap = function (mapId, matchId) {
  const mapItem = document.querySelector(`[data-map-id="${mapId}"]`);
  const mapName = mapItem.querySelector(".map-name").textContent;

  if (selectedMaps.length >= getRequiredMapsCount()) {
    alert("Все необходимые карты уже выбраны");
    return;
  }

  const mapInfo = {
    id: mapId,
    mapId: mapId,
    name: mapName,
    mapType: "pick",
    pickTeam: `team${currentTeam}`,
    team: currentTeam,
    order: selectedMaps.length + 1,
  };

  selectedMaps.push(mapInfo);
  mapItem.classList.add("picked");
  mapItem.dataset.status = `picked-team${currentTeam}`;

  updateMapStatus(mapItem, `Pick Team ${currentTeam}`);
  updateMapsOrderDisplay();
  switchTeam();
};

// Функция для бана карты
window.banMap = function (mapId, matchId) {
  const mapItem = document.querySelector(`[data-map-id="${mapId}"]`);
  const mapName = mapItem.querySelector(".map-name").textContent;

  const mapInfo = {
    id: mapId,
    mapId: mapId,
    name: mapName,
    mapType: "ban",
    pickTeam: `banned-team${currentTeam}`,
    team: currentTeam,
    order: selectedMaps.length + 1,
  };

  selectedMaps.push(mapInfo);
  mapItem.classList.add("banned");
  mapItem.dataset.status = `banned-team${currentTeam}`;
  updateMapStatus(mapItem, `Ban Team ${currentTeam}`);
  switchTeam();
};

// Вспомогательные функции
function switchTeam() {
  currentTeam = currentTeam === 1 ? 2 : 1;
  updateTeamTurn();
}

function updateTeamTurn() {
  const teamTurnDisplay = document.createElement("div");
  teamTurnDisplay.className = "team-turn";
  teamTurnDisplay.textContent = `Ход команды: ${
    matchTeams[`team${currentTeam}`].name
  }`;

  const existingDisplay = document.querySelector(".team-turn");
  if (existingDisplay) {
    existingDisplay.replaceWith(teamTurnDisplay);
  } else {
    document
      .querySelector(".maps-container")
      .insertBefore(teamTurnDisplay, document.getElementById("mapsPool"));
  }
}

function updateMapStatus(mapItem, status) {
  const statusDiv = mapItem.querySelector(".map-status");
  statusDiv.textContent = status;
}
function getRequiredMapsCount() {
  const counts = { bo1: 1, bo2: 2, bo3: 3, bo5: 5 };
  return counts[matchFormat] || 1;
}

function updateMapsOrderDisplay() {
  const mapsOrder = document.getElementById("mapsOrder");
  const mapsList = mapsOrder.querySelector(".maps-list");

  mapsList.innerHTML = selectedMaps
    .map(
      (map, index) => `
        <div class="map-slot" data-index="${index}">
            <span data-i18n="mapNumber" class="map-number" data-i18n="mapNumberLabel" >Карта ${
              index + 1
            }</span>
            <div data-i18n="mapInfo" class="map-info">
                ${map.name} (Pick: Team ${map.team})
                <div class="side-pick">
                    <button data-i18n="ct" onclick="selectSide(${index}, 'CT', ${
        map.team
      })">CT</button>
                    <button data-i18n="t" onclick="selectSide(${index}, 'T', ${
        map.team
      })">T</button>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function resetMapSelection() {
  selectedMaps = [];
  currentTeam = 1;
  const mapItems = document.querySelectorAll(".map-item");
  mapItems.forEach((item) => {
    item.classList.remove("picked", "banned");
    item.dataset.status = "";
    item.querySelector(".map-status").textContent = "";
  });
  updateMapsOrderDisplay();
}
async function saveMatchSettings(e, matchId) {
  e.preventDefault();

  try {
    // Подготавливаем данные для отправки
    const validMaps = selectedMaps
      .filter((map) => map && map.mapId)
      .map((map) => ({
        mapId: map.mapId,
        pickTeam: map.pickTeam || null,
        startingSide: map.startingSide || null,
        score: {
          team1: map.score?.team1 || 0,
          team2: map.score?.team2 || 0,
        },
      }));

    // Получаем значение времени матча
    const matchTimeInput = document.getElementById("editMatchTime");
    const matchTime = matchTimeInput ? matchTimeInput.value : "";

    // Получаем значение формата из формы редактирования
    const formatInput = document.getElementById("editFormat");
    const format = formatInput ? formatInput.value : "bo1";

    const response = await fetch(`/api/matches/${matchId}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        format: format,
        match_time: matchTime,
        maps: validMaps,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Ошибка при сохранении настроек");
    }

    alert("Настройки матча сохранены");
    document.getElementById("editMatchModal").style.display = "none";
    await loadMatchesList();
  } catch (error) {
    console.error("Ошибка при сохранении:", error);
    alert("Ошибка при сохранении: " + error.message);
  }
}

// Добавляем функцию resetMapPool
function resetMapPool() {
  const mapItems = document.querySelectorAll(".map-item");
  mapItems.forEach((item) => {
    item.classList.remove("picked", "banned");
    item.dataset.status = "";
    const statusDiv = item.querySelector(".map-status");
    if (statusDiv) {
      statusDiv.textContent = "";
    }
  });

  selectedMaps = [];
  currentTeam = 1;
  updateMapsOrderDisplay();
  updateTeamTurn();
}
function updateMapsContainer() {
  const format = elements.format.value;
  const mapCount =
    {
      bo1: 1,
      bo2: 2,
      bo3: 3,
      bo5: 5,
    }[format] || 1;

  // Получаем текущие значения перед обновлением содержимого
  let currentMaps = [];
  try {
    currentMaps = Array.from(
      elements.mapsContainer.querySelectorAll(".map-item")
    ).map((item) => ({
      mapValue: item.querySelector(".map-select")?.value || "",
      pickTeam: item.querySelector(".pick-team-select")?.value || "",
      teamLogoId:
        item.querySelector(".pick-team-select")?.selectedOptions[0]?.dataset
          ?.logoId || "",
    }));
  } catch (error) {
    console.error("Ошибка при получении текущих значений:", error);
    currentMaps = [];
  }

  elements.mapsContainer.innerHTML = `
        <div class="maps-pool edit-match-maps">
            ${Array(mapCount)
              .fill(0)
              .map(
                (_, index) => `
                <div class="map-item">
                    <div class="map-preview">
                        <img src="/images/maps/tba.png" alt="Map preview" class="map-image">
                        <div class="map-overlay">
                            <span class="map-number">Карта ${index + 1}</span>
                            <div class="map-controls">
                                <div class="map-select-container">
                                    <select data-i18n="mapNumber" name="map${
                                      index + 1
                                    }" id="editMap${
                  index + 1
                }" class="map-select">
                                        <option  value="">Выберите карту</option>
                                        <option value="de_dust2" data-image="/images/maps/de_dust2.png">Dust II</option>
                                        <option value="de_mirage" data-image="/images/maps/de_mirage.png">Mirage</option>
                                        <option value="de_inferno" data-image="/images/maps/de_inferno.png">Inferno</option>
                                        <option value="de_nuke" data-image="/images/maps/de_nuke.png">Nuke</option>
                                        <option value="de_overpass" data-image="/images/maps/de_overpass.png">Overpass</option>
                                        <option value="de_ancient" data-image="/images/maps/de_ancient.png">Ancient</option>
                                        <option value="de_anubis" data-image="/images/maps/de_anubis.png">Anubis</option>
                                        <option value="de_vertigo" data-image="/images/maps/de_vertigo.png">Vertigo</option>
                                        <option value="de_cache" data-image="/images/maps/de_cache.png">Cache</option>
                                        <option value="de_train" data-image="/images/maps/de_train.png">Train</option>
                                    </select>
                                </div>
                                <div class="team-select-container">
                                    <select data-i18n="pickTeam" class="pick-team-select" name="pickTeam${
                                      index + 1
                                    }" onchange="updateTeamLogo(this, ${index})">
                                        <option data-i18n="pickTeam" value="">Выберите команду</option>
                                        <option data-i18n="team1" value="team1" data-logo-id="${
                                          elements.team1.value
                                        }">${
                  elements.team1.options[elements.team1.selectedIndex]?.text ||
                  "Команда 1"
                }</option>
                                        <option data-i18n="team2" value="team2" data-logo-id="${
                                          elements.team2.value
                                        }">${
                  elements.team2.options[elements.team2.selectedIndex]?.text ||
                  "Команда 2"
                }</option>
                                    </select>
                                    <img src="/images/default-team-logo.png" alt="Pick Team Logo" class="pick-team-logo">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;

  // Восстанавливаем значения

  // Обновляем контейнер карт при изменении формата
  elements.format.addEventListener("change", updateMapsContainer);

  // Инициализируем контейнер карт
  updateMapsContainer();

  // Добавляем обработчик для кнопки свапа
  if (elements.swapBtn) {
    elements.swapBtn.onclick = () => {
      const team1Value = elements.team1.value;
      const team2Value = elements.team2.value;
      elements.team1.value = team2Value;
      elements.team2.value = team1Value;

      // Анимация кнопки
      elements.swapBtn.style.transform = "rotate(180deg)";
      setTimeout(() => {
        elements.swapBtn.style.transform = "rotate(0deg)";
      }, 300);
    };
  }

  // Обработчик отправки формы
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      // Проверяем выбор одинаковых команд
      if (
        elements.team1.value === elements.team2.value &&
        elements.team1.value !== ""
      ) {
        alert("Нельзя выбрать одну и ту же команду");
        return;
      }

      // Собираем данные о картах
      const maps = Array.from(
        elements.mapsContainer.querySelectorAll(".map-item")
      )
        .map((item) => ({
          mapId: item.querySelector(".map-select").value,
          pickTeam: item.querySelector(".pick-team-select").value,
        }))
        .filter((map) => map.mapId !== "");

      const formData = {
        team1_id: parseInt(elements.team1.value),
        team2_id: parseInt(elements.team2.value),
        format: elements.format.value,
        maps: maps,
      };

      console.log("Отправляемые данные:", formData);

      const updateResponse = await fetch(`/api/matches/${matchId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Ответ сервера:", errorText);
        throw new Error(
          "Ошибка при обновлении матча: " + updateResponse.status
        );
      }

      const result = await updateResponse.json();
      console.log("Результат обновления:", result);

      if (result.success) {
        modal.style.display = "none";
        alert(i18n("matchUpdatedSuccess"));
        await loadMatchesList();
      } else {
        throw new Error(
          result.message || "Неизвестная ошибка при обновлении матча"
        );
      }
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      alert(i18n("matchSaveError"));
    }
  };

  // Обработчики закрытия модального окна
  const closeBtn = modal.querySelector(".close");
  if (closeBtn) {
    closeBtn.onclick = () => (modal.style.display = "none");
  }

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  // Показываем модальное окно
  modal.style.display = "block";
}

// ... rest of the code ...
/*
// Обновляем функцию updateMapsOrder для более детального отображения информации
function updateMapsOrder(format) {
    const mapsOrder = document.getElementById('mapsOrder');
    const mapCount = {
        bo1: 1,
        bo2: 2,
        bo3: 3,
        bo5: 5
    }[format] || 1;

    mapsOrder.innerHTML = `
        <h3>Порядок карт (${format.toUpperCase()})</h3>
        <div class="maps-list">
            ${Array(mapCount).fill(0).map((_, i) => `
                <div class="map-slot" data-index="${i}">
                    <div class="map-header">
                        <span class="map-number">Карта ${i + 1}</span>
                        <span class="map-score">
                            <input type="number" min="0" max="16" value="0" class="score-input team1-score" onchange="updateMapScore(${i}, 1, this.value)">
                            :
                            <input type="number" min="0" max="16" value="0" class="score-input team2-score" onchange="updateMapScore(${i}, 2, this.value)">
                        </span>
                    </div>
                    <div class="map-details">
                        <div class="map-pick-info">
                            <span class="pick-team">Выбор: 
                                <select onchange="updateMapPickTeam(${i}, this.value)">
                                    <option value="">-</option>
                                    <option value="1">${matchTeams.team1?.name || 'Команда 1'}</option>
                                    <option value="2">${matchTeams.team2?.name || 'Команда 2'}</option>
                                </select>
                            </span>
                        </div>
                        <div class="map-name-select">
                            <select class="map-select" onchange="updateMapSelection(${i}, this.value)">
                                <option value="">Выберите карту</option>
                                <option value="de_dust2">Dust II</option>
                                <option value="de_mirage">Mirage</option>
                                <option value="de_inferno">Inferno</option>
                                <option value="de_nuke">Nuke</option>
                                <option value="de_overpass">Overpass</option>
                                <option value="de_ancient">Ancient</option>
                                <option value="de_anubis">Anubis</option>
                                <option value="de_vertigo">Vertigo</option>
                                <option value="de_train">Train</option>
                            </select>
                        </div>
                        <div class="side-selection">
                            <span>Выбор сторон:</span>
                            <div class="side-buttons">
                                <button onclick="selectSide(${i}, 'CT', 1)" class="side-btn ct-btn">CT - ${matchTeams.team1?.name || 'Команда 1'}</button>
                                <button onclick="selectSide(${i}, 'T', 1)" class="side-btn t-btn">T - ${matchTeams.team1?.name || 'Команда 1'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}*/
// Функции для обновления информации о картах
window.updateMapScore = function (mapIndex, team, score) {
  if (!selectedMaps[mapIndex]) {
    selectedMaps[mapIndex] = { score: {} };
  }
  selectedMaps[mapIndex].score = selectedMaps[mapIndex].score || {};
  selectedMaps[mapIndex].score[`team${team}`] = parseInt(score);
};

window.updateMapPickTeam = function (mapIndex, teamNumber) {
  if (!selectedMaps[mapIndex]) {
    selectedMaps[mapIndex] = {};
  }
  selectedMaps[mapIndex].pickTeam = teamNumber;
};

window.updateMapSelection = function (mapIndex, mapId) {
  if (!selectedMaps[mapIndex]) {
    selectedMaps[mapIndex] = {};
  }
  selectedMaps[mapIndex].mapId = mapId;
  selectedMaps[mapIndex].mapName = document.querySelector(
    `option[value="${mapId}"]`
  ).textContent;
};
window.selectSide = function (mapIndex, side, team) {
  if (!selectedMaps[mapIndex]) {
    selectedMaps[mapIndex] = {};
  }
  selectedMaps[mapIndex].startingSide = {
    team: team,
    side: side,
  };

  // Обновляем визуальное отображение выбранной стороны
  const sideButtons = document.querySelectorAll(
    `.map-slot[data-index="${mapIndex}"] .side-btn`
  );
  sideButtons.forEach((btn) => btn.classList.remove("selected"));
  event.target.classList.add("selected");
};

window.pickMap = function (mapId) {
  // Реализация выбора карты
};

window.banMap = function (mapId) {
  // Реализация бана карты
};

function getMapsOrder() {
  // Получение порядка карт
  return [];
}

// Добавляем функцию для смены сторон в матче
window.swapMatchTeams = async function (matchId) {
  try {
    const response = await fetch(`/api/matches/${matchId}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Ответ сервера не в формате JSON");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Ошибка при смене сторон");
    }

    const result = await response.json();
    if (result.success) {
      // Обновляем интерфейс после успешной смены сторон
      const matchElement = document.querySelector(
        `[data-match-id="${matchId}"]`
      );
      if (matchElement) {
        const team1ScoreElement = matchElement.querySelector(".team1-score");
        const team2ScoreElement = matchElement.querySelector(".team2-score");

        // Меняем местами счет команд
        const tempScore = team1ScoreElement.textContent;
        team1ScoreElement.textContent = team2ScoreElement.textContent;
        team2ScoreElement.textContent = tempScore;
      }

      // Перезагружаем список матчей только после того, как сервер подтвердит обновление
      setTimeout(async () => {
        await loadMatchesList();
      }, 500); // Задержка для обеспечения обновления данных на сервере
    } else {
      throw new Error(result.error || "Не удалось поменять команды местами");
    }
  } catch (error) {
    console.error("Ошибка при смене сторон:", error);
    alert("Ошибка при смене сторон: " + error.message);
  }
};

// ... оставляем весь остальной существующий код без изменений ...

// Обновляем обработчик формы создания матча
document.addEventListener("DOMContentLoaded", () => {
  const createMatchForm = document.getElementById("match-form");
  if (createMatchForm) {
    // Загружаем команды при инициализации страницы
    const team1Select = createMatchForm.querySelector('select[name="team1"]');
    const team2Select = createMatchForm.querySelector('select[name="team2"]');

    if (team1Select && team2Select) {
      loadTeamsForSelect(team1Select);
      loadTeamsForSelect(team2Select);

      // Добавляем обработчики для обновления списка команд при фокусе
      team1Select.addEventListener("focus", () => {
        loadTeamsForSelect(team1Select, team1Select.value);
      });

      team2Select.addEventListener("focus", () => {
        loadTeamsForSelect(team2Select, team2Select.value);
      });
    }

    // Остальной код обработчика формы...
  }

  // Проверяем и инициализируем модальное окно создания матча
  const createMatchModal = document.getElementById("createMatchModal");
  if (createMatchModal) {
    const team1Select = document.getElementById("team1Select");
    const team2Select = document.getElementById("team2Select");

    if (team1Select && team2Select) {
      loadTeamsForSelect(team1Select);
      loadTeamsForSelect(team2Select);

      // Добавляем обработчики для обновления списка команд при фокусе
      team1Select.addEventListener("focus", () => {
        loadTeamsForSelect(team1Select, team1Select.value);
      });

      team2Select.addEventListener("focus", () => {
        loadTeamsForSelect(team2Select, team2Select.value);
      });
    }
  }
});
// Обновляем функцию loadMatchesList
async function loadMatchesList() {
  try {
    const matchesContainer = document.getElementById("matches-list");
    if (!matchesContainer) {
      console.error("Контейнер для матчей не найден");
      return;
    }

    // Сначала получаем данные о командах
    const teamsResponse = await fetch("/api/teams");
    const teams = await teamsResponse.json();

    // Создаем мапу для быстрого доступа к данным команд
    const teamsMap = new Map(teams.map((team) => [team.id, team]));

    // Получаем матчи
    const matchesResponse = await fetch("/api/matches");
    if (!matchesResponse.ok) {
      throw new Error(
        `Ошибка при загрузке матчей: ${matchesResponse.status} ${matchesResponse.statusText}`
      );
    }

    const matches = await matchesResponse.json();

    if (!Array.isArray(matches)) {
      console.error("Неверный формат данных матчей:", matches);
      matchesContainer.innerHTML =
        '<p class="error-message">Ошибка формата данных матчей</p>';
      return;
    }

    if (matches.length === 0) {
      matchesContainer.innerHTML =
        '<p class="info-message">Нет доступных матчей</p>';
      return;
    }

    matchesContainer.innerHTML = matches
      .map((match) => {
        // Получаем полные данные команд из мапы
        const team1Data = teamsMap.get(match.team1_id);
        const team2Data = teamsMap.get(match.team2_id);

        const shouldSwap = shouldSwapTeamsBasedOnRound(match.current_round);

        // Получаем данные команд с учетом свапа
        const team1Name = shouldSwap ? match.team2_name : match.team1_name;
        const team2Name = shouldSwap ? match.team1_name : match.team2_name;
        const team1Score = shouldSwap ? match.score_team2 : match.score_team1;
        const team2Score = shouldSwap ? match.score_team1 : match.score_team2;
        const team1Logo = shouldSwap ? team2Data?.logo : team1Data?.logo;
        const team2Logo = shouldSwap ? team1Data?.logo : team2Data?.logo;

        const formatLogoPath = (logo) => {
          if (!logo) return "/images/default-team-logo.png";
          if (logo.startsWith("http") || logo.startsWith("/uploads/"))
            return logo;
          return `/uploads/${logo}`;
        };

        const team1LogoPath = formatLogoPath(team1Logo);
        const team2LogoPath = formatLogoPath(team2Logo);

        return `
                <div class="match-item" data-match-id="${match.id}">
                    <div class="match-header">
                        <span data-i18n="matchId" class="match-map">${
                          match.id
                        }</span>
                        <span class="match-status ${match.status}">${
          match.status
        }</span>
                    </div>
                    <div class="match-teams" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
                        <div class="team team1" style="display:flex; align-items:center; gap:10px; min-width:0;">
                            <img src="${team1LogoPath}" 
                                 alt="${team1Name}" 
                                 class="team-logo" 
                                 onerror="this.onerror=null; this.src='/images/default-team-logo.png';">
                            <div data-i18n="team1Name" class="match-team1" style="max-width:32vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${
                              team1Name || "Команда 1"
                            }</div>
                        </div>
                        <div class="match-score">
                            <div class="score-controls">
                                <button class="score-btn minus" onclick="updateScore(${
                                  match.id
                                }, 1, -1)">-</button>
                                <span class="score team1-score">${
                                  team1Score || 0
                                }</span>
                                <button class="score-btn plus" onclick="updateScore(${
                                  match.id
                                }, 1, 1)">+</button>
                            </div>
                            <span class="score-separator">:</span>
                            <div class="score-controls">
                                <button class="score-btn minus" onclick="updateScore(${
                                  match.id
                                }, 2, -1)">-</button>
                                <span class="score team2-score">${
                                  team2Score || 0
                                }</span>
                                <button class="score-btn plus" onclick="updateScore(${
                                  match.id
                                }, 2, 1)">+</button>
                            </div>
                        </div>
                        <div class="team team2" style="display:flex; align-items:center; gap:10px; min-width:0;">
                            <div data-i18n="team2Name" class="match-team2" style="max-width:32vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${team2Name}</div>
                            <img src="${team2LogoPath}" 
                                 alt="${team2Name}" 
                                 class="team-logo" 
                                 onerror="this.onerror=null; this.src='/images/default-team-logo.png';">
                        </div>
                        <div class="match-actions">
                        ${
                          match.status === "active"
                            ? `<button onclick="stopMatch('${match.id}', this)" class="stop-match-btn">
                                <i class="fas fa-stop"></i> <span data-i18n="stopMatch">Стоп матч</span>
                               </button>`
                            : `<button onclick="startMatch('${match.id}', this)" class="start-match-btn">
                                <i class="fas fa-play"></i> <span data-i18n="startMatch">Старт матча</span>
                               </button>`
                        }
                        <button onclick="editMatch('${
                          match.id
                        }')" class="edit-match-btn">
                            <i class="fas fa-edit"></i> <span data-i18n="mapVeto">MAP VETO</span>
                        </button>
                        <button onclick="swapMatchTeams('${
                          match.id
                        }')" class="swap-teams-btn">
                            <i data-i18n="swapTeams" class="fas fa-exchange-alt"> </i>
                        </button>
                        <button onclick="deleteMatch('${
                          match.id
                        }')" class="delete-match-btn">
                            <i class="fas fa-trash"></i> <span data-i18n="deleteMatch">Удалить матч</span>
                        </button>
                    </div>
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Ошибка при загрузке матчей:", error);
    const matchesContainer = document.getElementById("matches-list");
    if (matchesContainer) {
      matchesContainer.innerHTML =
        '<p class="error-message">Ошибка при загрузке списка матчей</p>';
    }
  }
}

// Добавляем функцию обновления счета
async function updateScore(matchId, teamNumber, change) {
  try {
    // Получаем текущие значения счета перед обновлением
    const matchElement = document.querySelector(`[data-match-id="${matchId}"]`);
    const team1ScoreElement = matchElement.querySelector(".team1-score");
    const team2ScoreElement = matchElement.querySelector(".team2-score");

    const currentTeam1Score = parseInt(team1ScoreElement.textContent) || 0;
    const currentTeam2Score = parseInt(team2ScoreElement.textContent) || 0;

    // Вычисляем новые значения
    let newTeam1Score = currentTeam1Score;
    let newTeam2Score = currentTeam2Score;

    if (teamNumber === 1) {
      newTeam1Score = Math.max(0, currentTeam1Score + change);
    } else {
      newTeam2Score = Math.max(0, currentTeam2Score + change);
    }

    // Отправляем данные на сервер
    const response = await fetch(`/api/matches/${matchId}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        team: teamNumber,
        change: change,
        team1Score: newTeam1Score,
        team2Score: newTeam2Score,
      }),
    });

    if (!response.ok) {
      throw new Error("Ошибка при обновлении счета");
    }

    // После успешного ответа от сервера обновляем DOM
    team1ScoreElement.textContent = newTeam1Score;
    team2ScoreElement.textContent = newTeam2Score;

    // Обновляем GSI данные
    if (gsiDataBuffer && gsiDataBuffer.matches) {
      const gsiMatch = gsiDataBuffer.matches.find((m) => m.id === matchId);
      if (gsiMatch) {
        gsiMatch.team1Score = newTeam1Score;
        gsiMatch.team2Score = newTeam2Score;
      }
    }

    // Отправляем данные напрямую в GSI через WebSocket
    if (window.gsiManager) {
      window.gsiManager.sendToHUD({
        type: "score_update",
        matchId: matchId,
        team1Score: newTeam1Score,
        team2Score: newTeam2Score,
      });
    }

    // Вызываем обновление интерфейса
    updateGameInfo();
  } catch (error) {
    console.error("Ошибка обновления счета:", error);
    alert("Ошибка при обновлении счета");
  }
}

// ... existing code ...

// Функция для определения, нужно ли менять команды местами в зависимости от раунда
function shouldSwapTeamsBasedOnRound(currentRound) {
  if (!currentRound) return false;

  // Вторая половина (раунды 12–23)
  if (currentRound >= 12 && currentRound <= 23) {
    return true;
  }
  // Овертаймы (каждые 6 раундов, смена после каждых 3 раундов)
  else if (currentRound > 23) {
    const overtimeRound = currentRound - 24; // Нумерация овертаймов с 0
    if (overtimeRound % 3 === 0 && overtimeRound !== 0) {
      return true;
    }
  }

  return false;
}
function determineWinnerWithSwaps(match) {
  const shouldSwap = shouldSwapTeamsBasedOnRound(match.current_round);

  const team1Score = shouldSwap ? match.score_team2 : match.score_team1;
  const team2Score = shouldSwap ? match.score_team1 : match.score_team2;

  if (team1Score > team2Score) {
    return shouldSwap ? match.team2_id : match.team1_id;
  } else if (team2Score > team1Score) {
    return shouldSwap ? match.team1_id : match.team2_id;
  }

  return null; // Ничья
}

// Функция для запуска матча
window.startMatch = async function (matchId, btn) {
  if (btn) {
    btn.disabled = true;
    btn.classList.add("is-loading");
  }
  try {
    const response = await fetch(`/api/matches/${matchId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Ошибка при запуске матча");
    }

    // Обновляем список матчей
    await loadMatchesList();
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Ошибка при запуске матча: " + error.message);
  }

  // После обновления DOM, вызываем локализацию
  translatePage();
  if (btn) {
    btn.disabled = false;
    btn.classList.remove("is-loading");
  }
};
// Функция для остановки матча
window.stopMatch = async function (matchId, btn) {
  if (btn) {
    btn.disabled = true;
    btn.classList.add("is-loading");
  }
  try {
    const response = await fetch(`/api/matches/${matchId}/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Ошибка при остановке матча");
    }

    // Обновляем список матчей
    await loadMatchesList();
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Ошибка при остановке матча: " + error.message);
  }

  // После обновления DOM, вызываем локализацию
  translatePage();
  if (btn) {
    btn.disabled = false;
    btn.classList.remove("is-loading");
  }
};

// ... existing code ...

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  // Определяем, на какой странице мы находимся
  const isAdminPage = document.getElementById("admin-panel") !== null;
  const isHudPage = document.querySelector(".hud-container") !== null;

  if (isAdminPage) {
    // Код для страницы админки
    loadMatchesList();
    loadTeamsIntoSelects();

    // Добавляем обработчик формы создания матча
    const createMatchForm = document.getElementById("create-match-form");
    if (createMatchForm) {
      createMatchForm.addEventListener("submit", handleCreateMatch);
    }
  }

  if (isHudPage) {
    // Код для страницы HUD
    console.log("Инициализация HUD...");
    // Здесь может быть специфичный код для HUD
  }
});

// Обновление списка матчей только на странице админки
setInterval(() => {
  if (document.getElementById("admin-panel")) {
    loadMatchesList();
  }
}, 5000);

// Обновляем функцию handleCreateMatch для отправки логотипов команд

// Заметка: функция sendTeamLogosToGSI перемещена вниз файла и расширена

// Обновляем функцию createMatchElement для корректной обработки логотипов
function createMatchElement(match) {
  const matchElement = document.createElement("div");
  matchElement.className = "match-item";
  matchElement.dataset.matchId = match.id;
  console.log(match);
  // Функция для получения корректного пути к логотипу
  const getLogoPath = (logo) => {
    if (!logo) return "/images/default-team-logo.png";
    return logo.startsWith("/uploads/") ? logo : `/uploads/${logo}`;
  };

  matchElement.innerHTML = `
        <div class="match-header">
            <span class="match-name">${
              match.match_name || "Без названия"
            }</span>
            <span class="match-map">${match.map || "-"}</span>
            <span class="match-time">${
              match.match_time && match.match_time.trim()
                ? match.match_time
                : "-"
            }</span>
            <span class="match-status ${match.status}">${match.status}</span>
        </div>
        <div class="match-teams">
            <div class="team team1">
                <img src="${getLogoPath(match.team1_logo)}" 
                     alt="${
                       match.team1_name || i18n("defaultTeam1") || "Команда 1"
                     }" 
                     class="team-logo"
                     onerror="this.src='/images/default-team-logo.png'">
                ${match.team1_name || i18n("defaultTeam1") || "Команда 1"}
            </div>
            <div class="match-score">
                <div class="score-controls">
                    <button class="score-btn minus" onclick="updateMatchScore('${
                      match.id
                    }', 1, -1)">-</button>
                    <span class="score team1-score">${
                      match.score_team1 || 0
                    }</span>
                    <button class="score-btn plus" onclick="updateMatchScore('${
                      match.id
                    }', 1, 1)">+</button>
                </div>
                <span class="score-separator">:</span>
                <div class="score-controls">
                    <button class="score-btn minus" onclick="updateMatchScore('${
                      match.id
                    }', 2, -1)">-</button>
                    <span class="score team2-score">${
                      match.score_team2 || 0
                    }</span>
                    <button class="score-btn plus" onclick="updateMatchScore('${
                      match.id
                    }', 2, 1)">+</button>
                </div>
            </div>
            <div class="team team2">
                <img src="${getLogoPath(match.team2_logo)}" 
                     alt="${
                       match.team2_name || i18n("defaultTeam2") || "Команда 2"
                     }" 
                     class="team-logo"
                     onerror="this.src='/images/default-team-logo.png'">
                <h3>${match.team2_name || i18n("defaultTeam2")}</h3>
            </div>
        </div>
        // ... остальная часть кода ...
    `;

  return matchElement;
}

// Функция обновления счета
window.updateMatchScore = async function (matchId, teamNumber, change) {
  try {
    console.log("Обновление счета:", { matchId, teamNumber, change });

    const response = await fetch(`/api/matches/${matchId}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        team: parseInt(teamNumber),
        change: parseInt(change),
      }),
    });

    const data = await response.json();
    console.log("Ответ сервера:", data);

    if (!response.ok) {
      throw new Error(data.error || "Ошибка при обновлении счета");
    }

    // Обновляем только конкретный матч в DOM
    const matchElement = document.querySelector(`[data-match-id="${matchId}"]`);
    if (matchElement) {
      const scoreElement = matchElement.querySelector(
        teamNumber === 1 ? ".team1-score" : ".team2-score"
      );
      if (scoreElement) {
        const currentScore = parseInt(scoreElement.textContent || "0");
        scoreElement.textContent = Math.max(0, currentScore + change);
      }
    }
  } catch (error) {
    console.error("Ошибка обновления счета:", error);
    alert(`Ошибка при обновлении счета: ${error.message}`);
  }
};
window.deleteMatch = async function (matchId) {
  /*if (!confirm('Вы уверены, что хотите удалить этот матч?')) return;*/

  try {
    const response = await fetch(`/api/matches/${matchId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      loadMatchesList();
    } else {
      throw new Error("Ошибка при удалении матча");
    }
  } catch (error) {
    console.error("Ошибка:", error);
    alert(i18n("matchDeleteError"));
  }
};
// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  initMatchForm();
  loadMatchesList(); // Загружаем список матчей при загрузке страницы
});

// Инициализация обработчиков форм
function initFormHandlers() {
  // Форма команды
  const teamForm = document.getElementById("team-form");
  if (teamForm) {
    teamForm.addEventListener("submit", handleTeamSubmit);
  }

  // Форма игрока
  const playerForm = document.getElementById("player-form");
  if (playerForm) {
    playerForm.addEventListener("submit", handlePlayerSubmit);
  }
}

// Обработчик отправки формы команды
async function handleTeamSubmit(e) {
  e.preventDefault();
  try {
    const formData = new FormData(e.target);
    const response = await fetch("/api/teams", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Ошибка при добавлении команды");
    }

    e.target.reset();

    // Обновляем список команд
    await loadTeams();

    // Инициализируем отображение флагов после добавления команды
    setTimeout(initRegionFlags, 300);

    // Обновляем все селекторы команд на странице
    await updateAllTeamSelects();

    alert("Команда успешно добавлена!");
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Ошибка при добавлении команды: " + error.message);
  }
}

// Обработчик отправки формы игрока
async function handlePlayerSubmit(e) {
  e.preventDefault();
  try {
    const formData = new FormData(e.target);
    const response = await fetch("/api/players", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Ошибка при добавлении игрока");
    }

    e.target.reset();
    loadPlayers();
    alert("Игрок успешно добавлен!");
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Ошибка при добавлении игрока: " + error.message);
  }
}
// ... existing code ...

// Функция загрузки списка команд
async function loadTeamsList() {
  try {
    const response = await fetch("/api/teams");
    const teams = await response.json();

    const teamsList = document.getElementById("teams-list");
    if (teamsList) {
      teamsList.innerHTML = `
                <div class="teams-controls">
                    <input type="text" id="teamSearch" placeholder="Поиск по названию команды" class="search-input">
                </div>
                <div class="teams-grid">
                    ${teams
                      .map(
                        (team) => `
                        <div class="card" data-id="${team.id}">
                            <div class="card-image">
                                <img src="${
                                  team.logo || "/images/default-team-logo.png"
                                }" 
                                     alt="${team.name}"
                                     onerror="this.src='/images/default-team-logo.png'">
                            </div>
                            <div class="card-content">
                                <h3 class="card-title">${team.name}</h3>
                                
                            </div>
                            <div class="card-actions">
                                <button class="edit-btn" onclick="editTeam(${
                                  team.id
                                })" title="Редактировать"><i class="fas fa-edit"></i></button>
                                <button class="delete-btn" onclick="deleteTeam(${
                                  team.id
                                })" title="Удалить"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `;

      // Инициализируем поиск
      const searchInput = document.getElementById("teamSearch");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          const query = e.target.value.toLowerCase();
          document.querySelectorAll(".teams-grid .card").forEach((card) => {
            const teamName = card
              .querySelector(".card-title")
              .textContent.toLowerCase();
            card.style.display = teamName.includes(query) ? "" : "none";
          });
        });
      }
    }
  } catch (error) {
    console.error("Ошибка при загрузке списка команд:", error);
  }
}

// Загружаем список команд при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  // Находим кнопку создания игрока
  const createPlayerBtn = document.getElementById("createPlayerBtn");
  if (createPlayerBtn) {
    createPlayerBtn.addEventListener("click", () => {
      // Загружаем список команд только если он еще не загружен
      const teamSelect = document.getElementById("teamSelect");
      if (!teamSelect || teamSelect.options.length <= 1) {
        loadTeamsList();
      }
    });
  }

  // Загружаем список команд при первой загрузке страницы
  loadTeamsList();
});

// ... existing code ...

// Функция обновления селекторов команд
function updateTeamSelects(teams) {
  // Находим все селекторы команд на странице
  const teamSelects = document.querySelectorAll('select[name="teamId"]');

  // Формируем HTML опций
  const optionsHTML = `
        <option value="" data-i18n="selectTeam">Выберите команду</option>
        ${teams
          .map(
            (team) => `
            <option value="${team.id}">${team.name}</option>
        `
          )
          .join("")}
    `;

  // Обновляем каждый селектор
  teamSelects.forEach((select) => {
    // Сохраняем текущее выбранное значение
    const currentValue = select.value;

    // Обновляем опции
    select.innerHTML = optionsHTML;

    // Восстанавливаем выбранное значение
    if (currentValue) {
      select.value = currentValue;
    }
  });
}

// ... existing code ...

async function loadTeams() {
  try {
    const response = await fetch("/api/teams");
    const teams = await response.json();

    // Отладка: выведем данные о команде с именем 123
    console.log("Все команды из API:", teams);
    teams.forEach((team) => {
      if (team.name === "123") {
        console.log("Команда 123:", team);
        console.log("Регион команды 123:", team.region);
        const regionInfo = getRegionInfo(team.region);
        console.log("Преобразованная информация о регионе:", regionInfo);
      }
    });

    const teamsList = document.getElementById("teams-list");
    if (teamsList) {
      teamsList.innerHTML = `
                <div class="search-bar">
                    <input data-i18n="teamSearchPlaceholder" type="text" id="teamSearch" placeholder="Поиск по названию или региону" class="search-input">
                </div>
                <div class="teams-grid">
                    ${teams
                      .map((team) => {
                        // Проверяем, начинается ли путь уже с /uploads/
                        const logoPath = team.logo
                          ? team.logo.startsWith("/uploads/")
                            ? team.logo
                            : `/uploads/${team.logo}`
                          : "/images/default-team-logo.png";

                        // Получаем информацию о регионе через единую функцию
                        const regionInfo = getRegionInfo(team.region);
                        const regionName = regionInfo.name;
                        const regionFlag = regionInfo.flag;

                        // Форматируем регион с флагом
                        const regionDisplay = `<div class="team-region-with-flag"><span class="region-flag">${regionFlag}</span><span>${regionName}</span></div>`;

                        // Отображаем короткое имя команды, если оно есть
                        const shortNameDisplay = team.short_name
                          ? `<span class="team-short-name">(${team.short_name})</span>`
                          : "";

                        return `
                            <div class="team-card" data-team-id="${team.id}">
                                <div class="team-info">
                                    <img src="${logoPath}" 
                                         class="team-logo" 
                                         alt="${team.name}"
                                         onerror="this.onerror=null; this.src='/images/default-team-logo.png';">
                                    <div class="team-details">
                                        <h3 class="team-name">${team.name} ${shortNameDisplay}</h3>
                                    </div>
                                </div>
                                <div class="team-actions">
                                    <button class="edit-team-btn" onclick="editTeam(${team.id})" title="Редактировать"><i class="fas fa-edit"></i></button>
                                    <button class="delete-team-btn" onclick="deleteTeam(${team.id})" title="Удалить"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
            `;

      initializeTeamSearch();

      // Временно отключаем дополнительную инициализацию флагов
      // setTimeout(initRegionFlags, 100);
    }
  } catch (error) {
    console.error("Ошибка при загрузке команд:", error);
  }
}

// ... existing code ...

// Обновляем функцию searchTeams для использования более современного подхода
function searchTeams(query) {
  const searchQuery = query.toLowerCase();
  const teamCards = document.querySelectorAll(".team-card");

  requestAnimationFrame(() => {
    teamCards.forEach((card) => {
      const nameElement = card.querySelector(".team-name");
      const regionElement = card.querySelector(".team-region");

      if (!nameElement) {
        return;
      }

      // Получаем текст имени
      const name = nameElement.textContent.toLowerCase();

      // Получаем текст региона, учитывая как новый формат с флагом, так и старый
      let region = "";

      // Используем CSS display вместо прямой манипуляции DOM
      card.style.display =
        name.includes(searchQuery) || region.includes(searchQuery)
          ? ""
          : "none";
    });
  });
}
// Обновляем функцию initializeTeamSearch
function initializeTeamSearch() {
  const searchInput = document.getElementById("teamSearch");
  if (!searchInput) return;

  const debouncedSearch = debounce((e) => {
    requestAnimationFrame(() => {
      searchTeams(e.target.value);
    });
  }, 300);

  searchInput.addEventListener("input", debouncedSearch);
}

// ... existing code ...

// Редактирование команды
async function editTeam(teamId) {
  try {
    const response = await fetch(`/api/teams/${teamId}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Ошибка при получении данных команды");
    }

    const team = await response.json();
    const form = document.getElementById("team-form");

    // Заполняем форму данными команды (безопасно, только если поле существует)
    const setIfExists = (fieldName, value) => {
      if (!form) return;
      const input = form.querySelector(`[name="${fieldName}"]`);
      if (input) input.value = value ?? "";
    };

    setIfExists("name", team.name);
    setIfExists("short_name", team.short_name);
    setIfExists("region", team.region);

    // Отмечаем, что это редактирование
    form.dataset.editId = teamId;

    // Меняем кнопку на синий цвет и переводим на updateTeam
    {
      const submitBtn =
        form.querySelector("#add-team-btn") ||
        form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.setAttribute("data-i18n", "updateTeam");
        submitBtn.textContent =
          typeof i18n === "function" ? i18n("updateTeam") : "Обновить команду";
        submitBtn.style.backgroundColor = "#007bff";
        submitBtn.style.borderColor = "#007bff";
        if (typeof translatePage === "function") translatePage();
      }
    }

    // Прокручиваем к форме
    form.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Ошибка:", error);
    alert(error.message);
  }
}

async function deleteTeam(teamId) {
  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Ошибка при удалении команды");
    }

    // Перезагружаем список команд после успешного удаления
    await loadTeams();

    // Показываем уведомление об успешном удалении
    alert("Команда успешно удалена");
  } catch (error) {
    console.error("Ошибка при удалении команды:", error);
    alert("Ошибка при удалении команды");
  }
}

// Обработчик отправки формы команды
async function handleTeamSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const teamId = form.dataset.editId;

  try {
    const url = teamId ? `/api/teams/${teamId}` : "/api/teams";
    const method = teamId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Ошибка при сохранении команды");
    }

    // Сброс формы
    form.reset();
    delete form.dataset.editId;

    // Возвращаем кнопку к исходному состоянию (addTeam)
    {
      const submitBtn =
        form.querySelector("#add-team-btn") ||
        form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.setAttribute("data-i18n", "addTeam");
        submitBtn.textContent = i18n("addTeam");
        submitBtn.style.backgroundColor = "";
        submitBtn.style.borderColor = "";
        if (typeof translatePage === "function") translatePage();
      }
    }

    await loadTeams();
    alert(teamId ? "Команда успешно обновлена!" : "Команда успешно добавлена!");
  } catch (error) {
    console.error("Ошибка:", error);
    alert(error.message);
  }
}
// Инициализация обработчиков
document.addEventListener("DOMContentLoaded", () => {
  const teamForm = document.getElementById("team-form");
  if (teamForm) {
    teamForm.addEventListener("submit", handleTeamSubmit);

    // Мягкая проверка уникальности названия команды (подсказка, без блокировки)
    const nameInput = teamForm.querySelector('input[name="name"]');
    if (nameInput) {
      // создаём индивидуальный хинт и вставляем сразу после инпута
      const existing =
        nameInput.nextElementSibling &&
        nameInput.nextElementSibling.classList &&
        nameInput.nextElementSibling.classList.contains("field-hint")
          ? nameInput.nextElementSibling
          : null;
      const hint = existing || document.createElement("div");
      hint.className = "field-hint";
      hint.style.fontSize = "12px";
      hint.style.color = "#e5c07b";
      hint.style.marginTop = "4px";
      if (!existing) nameInput.insertAdjacentElement("afterend", hint);
      hint.style.display = "none";
      const setTeamHintWidth = () => {
        try {
          hint.style.width = nameInput.offsetWidth + "px";
        } catch {}
      };
      setTeamHintWidth();
      window.addEventListener("resize", setTeamHintWidth);

      const debounced = debounce(async () => {
        // Во время редактирования команды подсказки не показываем
        if (teamForm && teamForm.dataset && teamForm.dataset.editId) {
          hint.textContent = "";
          return;
        }
        const val = (nameInput.value || "").trim();
        if (!val) {
          hint.textContent = "";
          return;
        }
        try {
          const resp = await fetch(
            `/api/teams?name=${encodeURIComponent(val)}`
          );
          if (!resp.ok) {
            hint.textContent = "";
            hint.style.display = "none";
            return;
          }
          const list = await resp.json();
          if (Array.isArray(list) && list.length > 0) {
            const found = list.find(
              (t) => (t.name || "").toLowerCase() === val.toLowerCase()
            );
            hint.textContent = found
              ? `Внимание: команда с таким названием уже есть.`
              : "";
            hint.style.display = hint.textContent ? "block" : "none";
            setTeamHintWidth();
          } else {
            hint.textContent = "";
            hint.style.display = "none";
          }
        } catch {
          hint.textContent = "";
          hint.style.display = "none";
        }
      }, 400);

      nameInput.addEventListener("input", debounced);
      nameInput.addEventListener("blur", debounced);
      // первичная проверка, если уже введено значение
      setTimeout(debounced, 0);
    }
  }

  // Загружаем команды при загрузке страницы
  loadTeams();
});
// Функция загрузки списка команд
async function loadTeamsForSelect(selectElement) {
  try {
    const response = await fetch("/api/teams");
    const teams = await response.json();

    // Сохраняем текущее выбранное значение
    const currentValue = selectElement.value;

    // Очищаем список и добавляем первый пустой option
    selectElement.innerHTML =
      '<option value="" data-i18n="selectTeam">Выберите команду</option>';

    // Добавляем команды в список
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.name;
      // Если это была выбранная команда, отмечаем её
      if (currentValue === team.id.toString()) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Ошибка при загрузке списка команд:", error);
  }
}

// Функция инициализации формы игрока
function initPlayerForm() {
  const teamSelect = document.querySelector('select[name="teamId"]');
  if (teamSelect) {
    // Загружаем команды при загрузке страницы
    loadTeamsForSelect(teamSelect);

    // Обновляем список команд при открытии select
    teamSelect.addEventListener("mousedown", function () {
      loadTeamsForSelect(this);
    });
  }
}
// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  initPlayerForm();

  // Подсказки уникальности для формы игрока (ник и steam64)
  const playerForm = document.getElementById("player-form");
  if (playerForm) {
    const nickInput = playerForm.querySelector('input[name="nickname"]');
    const steamInput = playerForm.querySelector('input[name="steam64"]');

    const ensureHint = (input, color) => {
      if (!input) return null;
      if (input._hint) return input._hint;
      const sibling = input.nextElementSibling;
      let hint =
        sibling && sibling.classList && sibling.classList.contains("field-hint")
          ? sibling
          : null;
      if (!hint) {
        hint = document.createElement("div");
        hint.className = "field-hint";
        hint.style.fontSize = "12px";
        hint.style.color = color;
        hint.style.marginTop = "4px";
        input.insertAdjacentElement("afterend", hint);
      }
      hint.style.display = "block";
      hint.style.flexBasis = "100%";
      hint.style.width = "100%";
      input._hint = hint;
      return hint;
    };

    if (nickInput) {
      const hint = ensureHint(nickInput, "#e5c07b");
      hint.style.display = "none";
      const checkNick = debounce(async () => {
        // Во время редактирования игрока подсказки не показываем
        if (playerForm && playerForm.dataset && playerForm.dataset.editId) {
          hint.textContent = "";
          return;
        }
        const val = (nickInput.value || "").trim();
        if (!val) {
          hint.textContent = "";
          return;
        }
        try {
          const resp = await fetch(
            `/api/players?nickname=${encodeURIComponent(val)}`
          );
          if (!resp.ok) {
            hint.textContent = "";
            hint.style.display = "none";
            return;
          }
          const data = await resp.json();
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data.players)
            ? data.players
            : [];
          if (list.length > 0) {
            const same = list.filter(
              (p) => (p.nickname || "").toLowerCase() === val.toLowerCase()
            );
            hint.textContent = same.length
              ? `Найдено совпадений по нику: ${same.length}`
              : "";
            hint.style.display = hint.textContent ? "block" : "none";
          } else {
            hint.textContent = "";
            hint.style.display = "none";
          }
        } catch {
          hint.textContent = "";
          hint.style.display = "none";
        }
      }, 400);
      nickInput.addEventListener("input", checkNick);
      nickInput.addEventListener("blur", checkNick);
      setTimeout(checkNick, 0);
    }

    if (steamInput) {
      const hint = ensureHint(steamInput, "#d19a66");
      hint.style.display = "none";
      const checkSteam = debounce(async () => {
        // Во время редактирования игрока подсказки не показываем
        if (playerForm && playerForm.dataset && playerForm.dataset.editId) {
          hint.textContent = "";
          return;
        }
        const val = (steamInput.value || "").trim();
        if (!val) {
          hint.textContent = "";
          return;
        }
        try {
          const resp = await fetch(
            `/api/players?steam64=${encodeURIComponent(val)}`
          );
          if (!resp.ok) {
            hint.textContent = "";
            hint.style.display = "none";
            return;
          }
          const data = await resp.json();
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data.players)
            ? data.players
            : [];
          if (list.length > 0) {
            const found = list.find((p) => String(p.steam64 || "") === val);
            hint.textContent = found
              ? `Игрок с таким Steam64 уже существует.`
              : "";
            hint.style.display = hint.textContent ? "block" : "none";
          } else {
            hint.textContent = "";
            hint.style.display = "none";
          }
        } catch {
          hint.textContent = "";
          hint.style.display = "none";
        }
      }, 400);
      steamInput.addEventListener("input", checkSteam);
      steamInput.addEventListener("blur", checkSteam);
      setTimeout(checkSteam, 0);
    }
  }
});

// Обновляем обработчик редактирования игрока
function editPlayer(playerId) {
  fetch(`/api/players/${playerId}`)
    .then((response) => response.json())
    .then((player) => {
      const form = document.getElementById("player-form");
      form.dataset.editId = playerId;
      form.querySelector('input[name="nickname"]').value = player.nickname;
      form.querySelector('input[name="realName"]').value =
        player.realName || "";
      form.querySelector('input[name="steam64"]').value = player.steam64;

      const teamSelect = form.querySelector('select[name="teamId"]');
      // Загружаем команды и устанавливаем выбранную
      loadTeamsForSelect(teamSelect).then(() => {
        if (player.teamId) {
          teamSelect.value = player.teamId;
        }
      });

      // Меняем кнопку на синий цвет и переводим на updatePlayer
      {
        const submitBtn =
          form.querySelector("#add-player-btn") ||
          form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.setAttribute("data-i18n", "updatePlayer");
          submitBtn.textContent =
            typeof i18n === "function"
              ? i18n("updatePlayer")
              : "Обновить игрока";
          submitBtn.style.backgroundColor = "#007bff";
          submitBtn.style.borderColor = "#007bff";
          if (typeof translatePage === "function") translatePage();
        }
      }

      // Прокручиваем к форме
      form.scrollIntoView({ behavior: "smooth" });
    })
    .catch((error) => {
      console.error("Ошибка при загрузке данных игрока:", error);
      alert("Ошибка при загрузке данных игрока");
    });
}

// Обновляем обработчик отправки формы игрока
async function handlePlayerSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const playerId = form.dataset.editId;

  try {
    const url = playerId ? `/api/players/${playerId}` : "/api/players";
    const method = playerId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Ошибка при сохранении игрока");
    }

    // Очищаем форму и сбрасываем состояние редактирования
    form.reset();
    form.removeAttribute("data-edit-id");

    // Возвращаем кнопку к исходному состоянию (addPlayer)
    {
      const submitBtn =
        form.querySelector("#add-player-btn") ||
        form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.setAttribute("data-i18n", "addPlayer");
        submitBtn.textContent = i18n("addPlayer");
        submitBtn.style.backgroundColor = "";
        submitBtn.style.borderColor = "";
        if (typeof translatePage === "function") translatePage();
      }
    }

    // Обновляем список игроков
    await loadPlayers();
    alert(playerId ? "Игрок успешно обновлен!" : "Игрок успешно добавлен!");
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Ошибка при сохранении игрока: " + error.message);
  }
}

// Функция поиска игроков
function searchPlayers(query) {
  const searchQuery = query.toLowerCase();
  document.querySelectorAll(".card").forEach((card) => {
    const nicknameElement = card.querySelector(".card-title");
    const steam64Element = card.querySelector(".card-info");

    if (!nicknameElement) {
      console.warn("Не найден элемент никнейма для карточки игрока:", card);
      return;
    }

    const nickname = nicknameElement.textContent.toLowerCase();
    const steam64 = steam64Element
      ? steam64Element.textContent.toLowerCase()
      : "";

    // Показываем/скрываем карточку в зависимости от совпадения
    const matches =
      nickname.includes(searchQuery) || steam64.includes(searchQuery);
    card.style.display = matches ? "" : "none";
  });
}

// Обновляем добавление обработчика поиска
function initializeSearch() {
  const searchInput = document.getElementById("playerSearch");
  if (searchInput) {
    // Удаляем старый обработчик, если он есть
    const oldHandler = searchInput.onInput;
    if (oldHandler) {
      searchInput.removeEventListener("input", oldHandler);
    }

    // Добавляем новый обработчик с debounce
    searchInput.addEventListener(
      "input",
      debounce((e) => {
        searchPlayers(e.target.value);
      }, 300)
    );
  }
}

// Функция debounce для оптимизации поиска
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Обновляем функцию loadPlayers
async function loadPlayers() {
  try {
    const response = await fetch("/api/players");
    const players = await response.json();

    const playersList = document.getElementById("players-list");
    if (playersList) {
      playersList.innerHTML = `
                <div class="players-controls">
                    <input type="text" id="playerSearch" placeholder="${i18n(
                      "playerSearchPlaceholder"
                    )}" data-i18n-placeholder="playerSearchPlaceholder" class="search-input">
                </div>
                <div class="players-grid">
                            ${players
                              .map(
                                (player) => `
                        <div class="card" data-id="${player.id}">
                            <div class="card-image">
                                            <img src="${
                                              player.avatar ||
                                              "/images/default-avatar.png"
                                            }" 
                                                 alt="${player.nickname}"
                                                 onerror="this.src='/images/default-avatar.png'">
                                        </div>
                            <div class="card-content">
                                <h3 class="card-title">${player.nickname}</h3>
                                <p class="card-subtitle">${
                                  player.realName || "-"
                                }</p>
                                <p class="card-info"${
                                  player.teamName ? "" : ' data-i18n="noTeam"'
                                }>${player.teamName || i18n("noTeam")}</p>
                            </div>
                            <div class="card-actions">
                                <button class="edit-btn" onclick="editPlayer(${
                                  player.id
                                })" title="Редактировать"><i class="fas fa-edit"></i></button>
                                <button class="delete-btn" onclick="deletePlayer(${
                                  player.id
                                })" title="Удалить"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                            `
                              )
                              .join("")}
                </div>
            `;

      // Инициализируем поиск после загрузки карточек
      initializeSearch();
    }
  } catch (error) {
    console.error("Ошибка загрузки игроков:", error);
  }
}

async function deletePlayer(playerId) {
  try {
    const response = await fetch(`/api/players/${playerId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Ошибка при удалении игрока");
    }

    // Перезагружаем список игроков после успешного удаления
    await loadPlayers();

    // Показываем уведомление об успешном удалении
    alert("Игрок успешно удален");
  } catch (error) {
    console.error("Ошибка при удалении игрока:", error);
    alert("Ошибка при удалении игрока");
  }
}
async function loadHUDs() {
  try {
    const response = await fetch("/api/huds");
    const huds = await response.json();

    const hudsList = document.getElementById("huds-list");
    if (hudsList) {
      hudsList.innerHTML = `
                <div class="players-controls">
                    <input data-i18n="hudSearchPlaceholder" type="text" id="hudSearch" placeholder="Поиск по названию HUD" class="search-input">
                </div>
                <h3 data-i18n="closeOverlayHint">ALT+Q - Закрыть оверлей</h3>
                <h3 data-i18n="toggleOverlayHint">ALT+X - Свернуть/Развернуть оверлей</h3>
                <h3 data-i18n="colorsHLAE">Команда для смены цвета через HLAE: exec shud_color</h3>
                <div class="players-table-container">
                    <table class="players-table">
                        <thead>
                            <tr>
                                <th width="60" data-i18n="preview">Превью</th>
                                <th data-i18n="name">Название</th>
                                <th data-i18n="description">Описание</th>
                                <th width="300" data-i18n="actions">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${huds
                              .map(
                                (hud) => `
                                <tr class="hud-row" data-hud-id="${hud.id}">
                                    <td class="preview-cell">
                                        <div class="preview-container">
                                            <img src="/huds/${
                                              hud.id
                                            }/preview.png" 
                                                class="hud-preview" 
                                                alt="${hud.name}"
                                                onerror="this.src='/images/default-hud.png'">
                                        </div>
                                    </td>
                                    <td>${
                                      hud.name
                                    }<div class="hud-features" id="hud-features-${
                                  hud.id
                                }"></div></td>
                                    <td>${hud.description || "-"}</td>
                                    <td class="hud-actions">
                                        <button class="copy-url-btn" onclick="copyHUDUrl('${
                                          hud.id
                                        }')" data-i18n="copyHUDUrl">
                                            ${i18n("copyHUDUrl")}
                                        </button>
                                        <a href="/hud/${
                                          hud.id
                                        }" target="_blank" class="button" data-i18n="openInBrowser">
                                            ${i18n("openInBrowser")}
                                        </a>
                                        <button class="open-folder-button" data-hud="${
                                          hud.id
                                        }" data-i18n="openHudFolder">${i18n(
                                  "openHudFolder"
                                )}</button>
                                        <button class="overlay-button" data-hud="${
                                          hud.id
                                        }" data-i18n="launchOverlay">
                                            ${i18n("launchOverlay")}
                                        </button>
                                        <button class="colors-button" data-i18n="colors" data-hud="${
                                          hud.id
                                        }">${i18n("colors")}Цвета</button>

                                    </td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            `;

      // Добавляем обработчики для кнопок оверлея
      hudsList.querySelectorAll(".overlay-button").forEach((button) => {
        button.addEventListener("click", () => {
          const hudId = button.dataset.hud;
          if (window.overlayManager) {
            window.overlayManager.startOverlay(hudId);
          }
        });
      });

      // Обработчик открытия папки HUD
      hudsList.querySelectorAll(".open-folder-button").forEach((button) => {
        button.addEventListener("click", async () => {
          const hudId = button.dataset.hud;
          try {
            const resp = await fetch(
              `/api/huds/${encodeURIComponent(hudId)}/open-folder`,
              { method: "POST" }
            );
            if (!resp.ok) {
              const err = await resp.json().catch(() => ({}));
              alert((err && err.error) || `HTTP ${resp.status}`);
            }
          } catch (e) {
            alert("Не удалось открыть папку HUD");
          }
        });
      });

      // Инициализируем поиск, если функция определена
      if (typeof initializeHUDSearch === "function") {
        initializeHUDSearch();
      } else {
        const searchInput = document.getElementById("hudSearch");
        if (searchInput) {
          searchInput.addEventListener("input", () => {
            const q = searchInput.value.trim().toLowerCase();
            document.querySelectorAll(".hud-row").forEach((row) => {
              const name =
                row
                  .querySelector("td:nth-child(2)")
                  ?.textContent?.toLowerCase() || "";
              row.style.display = name.includes(q) ? "" : "none";
            });
          });
        }
      }

      // Признаки поддержки фич берем из объекта HUD (/api/huds уже мержит config.json)
      const renderHudFeatures = (hud) => {
        const container = document.getElementById(`hud-features-${hud.id}`);
        if (!container) return;
        const cfg = hud || {};
        const icons = [];
        if (cfg.radar) {
          icons.push(
            `<i class="fas fa-map feature feature-radar" data-i18n-title="featureRadar" title="${i18n(
              "featureRadar"
            )}"></i>`
          );
        } else if (cfg.radar === false) {
          icons.push(
            `<i class="fas fa-map-slash feature feature-radar-disabled" data-i18n-title="featureRadarDisabled" title="${i18n(
              "featureRadarDisabled"
            )}"></i>`
          );
        }
        if (cfg.killfeed) {
          icons.push(
            `<i class="fas fa-skull feature feature-killfeed" data-i18n-title="featureKillfeed" title="${i18n(
              "featureKillfeed"
            )}"></i>`
          );
        }
        if (cfg.HLAE_killfeed) {
          icons.push(
            `<i class="fas fa-bolt feature feature-hlae" data-i18n-title="featureHlae" title="${i18n(
              "featureHlae"
            )}"></i>`
          );
        }
        if (cfg.HLAE_killfeed_castom) {
          icons.push(
            `<i class="fas fa-tools feature feature-hlae-custom" data-i18n-title="featureHlaeCustom" title="${i18n(
              "featureHlaeCustom"
            )}"></i>`
          );
        }
        container.innerHTML = icons.join(" ");
      };
      Array.isArray(huds) && huds.forEach((h) => renderHudFeatures(h));

      // === Цвета HUD: модальное окно ===
      const modal = document.getElementById("hud-colors-modal");
      const titleEl = document.getElementById("hud-colors-title");
      const formEl = document.getElementById("hud-colors-form");
      const btnSave = document.getElementById("hud-colors-save");
      const btnReset = document.getElementById("hud-colors-reset");
      const btnClose = document.getElementById("hud-colors-close");
      const btnCancel = document.getElementById("hud-colors-cancel");

      function closeColorsModal() {
        if (modal) modal.style.display = "none";
        if (formEl) formEl.innerHTML = "";
      }

      if (btnClose) btnClose.addEventListener("click", closeColorsModal);
      if (btnCancel) btnCancel.addEventListener("click", closeColorsModal);

      // Функция для обновления HLAE конфигов
      async function updateHlaeConfigs(hlaeColors) {
        try {
          // Извлекаем цвета и альфа значения
          const ctColor = hlaeColors.HLAE_CT_COLOR || "rgba(87, 136, 168, 1)";
          const tColor = hlaeColors.HLAE_T_COLOR || "rgba(193, 149, 17, 1)";
          const ctAlpha = hlaeColors.HLAE_CT_ALPHA || "150";
          const tAlpha = hlaeColors.HLAE_T_ALPHA || "150";
          const glowAlpha = hlaeColors.HLAE_GLOW_ALPHA || "50";
          const trailsAlpha = hlaeColors.HLAE_TRAILS_ALPHA || "50";
          const teamidAlpha = hlaeColors.HLAE_TEAMID_ALPHA || "80";

          // Парсим цвета
          const parseRgba = (rgba) => {
            const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
              };
            }
            return { r: 87, g: 136, b: 168 }; // fallback
          };

          const ctRgb = parseRgba(ctColor);
          const tRgb = parseRgba(tColor);

          // Только цвета (для shud_color.cfg)
          const shudColorConfig = `mirv_deathmsg colors ct ${ctRgb.r} ${ctRgb.g} ${ctRgb.b} ${ctAlpha}
mirv_deathmsg colors t ${tRgb.r} ${tRgb.g} ${tRgb.b} ${tAlpha}
mirv_colors glow ct ${ctRgb.r} ${ctRgb.g} ${ctRgb.b} ${glowAlpha}
mirv_colors glow t ${tRgb.r} ${tRgb.g} ${tRgb.b} ${glowAlpha}
mirv_colors trails ct ${ctRgb.r} ${ctRgb.g} ${ctRgb.b} ${trailsAlpha}
mirv_colors trails t ${tRgb.r} ${tRgb.g} ${tRgb.b} ${trailsAlpha}
mirv_colors smokes ct ${ctRgb.r} ${ctRgb.g} ${ctRgb.b}
mirv_colors smokes t ${tRgb.r} ${tRgb.g} ${tRgb.b}
mirv_colors teamid ct ${ctRgb.r} ${ctRgb.g} ${ctRgb.b} ${teamidAlpha}
mirv_colors teamid t ${tRgb.r} ${tRgb.g} ${tRgb.b} ${teamidAlpha}`;

          // Сохраняем только файл цветов (не трогаем остальные cfg)
          await Promise.all([
            fetch("/api/update-hlae-config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                config: "shud_color",
                content: shudColorConfig,
              }),
            }),
          ]);
        } catch (error) {
          console.error("Ошибка обновления HLAE конфигов:", error);
          throw error;
        }
      }

      async function openColorsModal(hudId) {
        if (!modal || !formEl || !titleEl) return;
        titleEl.textContent = hudId;
        modal.style.display = "block";
        formEl.innerHTML = "Загрузка...";
        try {
          // Загружаем текущие значения и исходные дефолты из index.js HUD'a
          const [resp, jsResp] = await Promise.all([
            fetch(`/api/hud-config/${hudId}`),
            fetch(`/huds/${hudId}/index.js`, { cache: "no-store" }).catch(
              () => null
            ),
          ]);
          const data = await resp.json();
          const hudJs = jsResp && jsResp.ok ? await jsResp.text() : "";

          // Собираем оригинальные значения цветов из HUD index.js
          const defaultsMap = {};
          if (hudJs) {
            try {
              const re = /([A-Z][A-Z0-9_]+)\s*=\s*(["'`])([\s\S]*?)\2/g;
              let m;
              while ((m = re.exec(hudJs))) {
                const k = m[1];
                const v = m[3];
                if (
                  /rgba\(|rgb\(|linear-gradient|#([0-9a-f]{3}|[0-9a-f]{6})/i.test(
                    v
                  )
                ) {
                  defaultsMap[k] = v;
                }
              }
            } catch {}
          }

          const values = (data && data.values) || {};
          const fields = Array.from(
            new Set([...Object.keys(defaultsMap), ...Object.keys(values)])
          )
            .filter((k) => !k.startsWith("HLAE_")) // Исключаем HLAE поля из основной формы
            .sort();

          formEl.innerHTML =
            fields
              .map((k) => {
                const v = values[k] || "";
                const orig = defaultsMap[k] || "";
                const initial = v || orig;
                return `
                <div class=\"form-group\" style=\"margin-bottom:8px; display:flex; align-items:center; gap:10px;\">\n                  <label style=\"min-width:220px; display:flex; align-items:center; justify-content:space-between; gap:10px;\">\n                    <span>${k}</span>\n                    <span title=\"Оригинальный цвет из HUD\" style=\"display:inline-flex;align-items:center;gap:6px;\">\n                      <span style=\"display:inline-block;width:14px;height:14px;border-radius:2px;background:${
                  orig || "transparent"
                };border:1px solid #555\"></span>\n                    </span>\n                  </label>\n                  <input type=\"text\" data-key=\"${k}\" value=\"${initial}\" placeholder=\"rgba(r,g,b,a) или CSS-градиент\" style=\"flex:1\" />\n                  <span class=\"swatch-now\" data-key-swatch=\"${k}\" data-default=\"${orig}\" title=\"Текущий цвет\" style=\"display:inline-block;width:14px;height:14px;border-radius:2px;border:1px solid #555;background:${
                  initial || "transparent"
                }\"></span>\n                  \n                  <!-- Переключатель режима -->\n                  <div style=\"display:flex; align-items:center; gap:6px;\">\n                    <label style=\"font-size:12px;opacity:.75\">Режим:</label>\n                    <select data-key-mode=\"${k}\" style=\"font-size:12px; padding:2px;\">\n                      <option value=\"solid\">Цвет</option>\n                      <option value=\"gradient\">Градиент</option>\n                    </select>\n                  </div>\n                  \n                  <!-- Палитра для сплошного цвета -->\n                  <div class=\"color-controls\" data-key-color-controls=\"${k}\" style=\"display:flex; align-items:center; gap:6px;\">\n                    <label style=\"display:flex; align-items:center; gap:6px; cursor:pointer;\">\n                      <input title=\"Палитра\" type=\"color\" data-key-color=\"${k}\" />\n\n                    </label>\n                    <div style=\"display:flex; align-items:center; gap:6px; min-width:150px;\">\n                      <span style=\"font-size:12px;opacity:.75\">A</span>\n                      <input type=\"range\" min=\"0\" max=\"1\" step=\"0.01\" data-key-alpha=\"${k}\" style=\"width:90px\" />\n                      <input type=\"number\" min=\"0\" max=\"1\" step=\"0.01\" data-key-alpha-num=\"${k}\" style=\"width:60px\" />\n                    </div>\n                  </div>\n                  \n                  <!-- Контролы для градиента -->\n                  <div class=\"gradient-controls\" data-key-gradient-controls=\"${k}\" style=\"display:none; flex-direction:column; gap:6px; min-width:200px;\">\n                    <div style=\"display:flex; align-items:center; gap:6px;\">\n                      <span style=\"font-size:12px;opacity:.75\">Угол:</span>\n                      <input type=\"number\" data-key-gradient-angle=\"${k}\" value=\"0\" min=\"0\" max=\"360\" step=\"1\" style=\"width:60px\" />\n                      <span style=\"font-size:12px;opacity:.75\">°</span>\n                    </div>\n                    <div style=\"display:flex; align-items:center; gap:6px;\">\n                      <span style=\"font-size:12px;opacity:.75\">Цвет 1:</span>\n                      <input type=\"color\" data-key-gradient-color1=\"${k}\" value=\"#5788a8\" />\n                      <input type=\"range\" min=\"0\" max=\"1\" step=\"0.01\" data-key-gradient-alpha1=\"${k}\" value=\"1\" style=\"width:60px\" />\n                      <input type=\"number\" min=\"0\" max=\"1\" step=\"0.01\" data-key-gradient-alpha1-num=\"${k}\" value=\"1\" style=\"width:40px\" />\n                    </div>\n                    <div style=\"display:flex; align-items:center; gap:6px;\">\n                      <span style=\"font-size:12px;opacity:.75\">Цвет 2:</span>\n                      <input type=\"color\" data-key-gradient-color2=\"${k}\" value=\"#5788a8\" />\n                      <input type=\"range\" min=\"0\" max=\"1\" step=\"0.01\" data-key-gradient-alpha2=\"${k}\" value=\"0.623\" style=\"width:60px\" />\n                      <input type=\"number\" min=\"0\" max=\"1\" step=\"0.01\" data-key-gradient-alpha2-num=\"${k}\" value=\"0.623\" style=\"width:40px\" />\n                    </div>\n                  </div>\n                </div>
              `;
              })
              .join("") +
            // Добавляем секцию HLAE цветов
            `<div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.1); border-radius: 8px; border-left: 4px solid #ff9800;">
              <h4 style="margin: 0 0 15px 0; color: #ff9800; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-bolt"></i>
                HLAE & CS2 Цвета
              </h4>
              <div style="font-size: 12px; opacity: 0.8; margin-bottom: 15px;">
                Настройки цветов для HLAE killfeed и CS2 tools конфигов.<br>
                <strong>HLAE цвета автоматически синхронизируются с основными цветами HUD (COLOR_NEW_CT/COLOR_NEW_T)</strong>
              </div>
              
              <!-- Настройка пути к CS2 -->
              <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <span style="font-size: 12px; opacity: 0.8;">Путь к CS2:</span>
                  <input type="text" id="cs2-path-input" placeholder="Путь к папке cfg CS2" style="flex: 1; padding: 4px 8px; font-size: 12px;" />
                  <button id="cs2-path-save" style="padding: 4px 8px; font-size: 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Сохранить</button>
                </div>
                <div id="cs2-path-status" style="font-size: 11px; opacity: 0.7;"></div>
              </div>
              <div class="form-group" style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <label style="min-width:220px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <span>HLAE_CT_COLOR</span>
                  <span title="HLAE цвет CT по умолчанию (синхронизирован с COLOR_NEW_CT)" style="display:inline-flex;align-items:center;gap:6px;">
                    <span style="display:inline-block;width:14px;height:14px;border-radius:2px;background:${
                      values.HLAE_CT_COLOR ||
                      values.COLOR_NEW_CT ||
                      "rgba(87, 136, 168, 1)"
                    };border:1px solid #555"></span>
                  </span>
                </label>
                <input type="text" data-key="HLAE_CT_COLOR" value="${
                  values.HLAE_CT_COLOR ||
                  values.COLOR_NEW_CT ||
                  "rgba(87, 136, 168, 1)"
                }" placeholder="${
              values.COLOR_NEW_CT || "rgba(40, 120, 240, 1)"
            }" style="flex:1" />
                <span class="swatch-now" data-key-swatch="HLAE_CT_COLOR" data-default="${
                  values.COLOR_NEW_CT || "rgba(87, 136, 168, 1)"
                }" title="Текущий цвет" style="display:inline-block;width:14px;height:14px;border-radius:2px;border:1px solid #555;background:${
              values.HLAE_CT_COLOR ||
              values.COLOR_NEW_CT ||
              "rgba(87, 136, 168, 1)"
            }"></span>
                
                <div class="color-controls" data-key-color-controls="HLAE_CT_COLOR" style="display:flex; align-items:center; gap:6px;">
                  <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input title="Палитра" type="color" data-key-color="HLAE_CT_COLOR" value="#5788a8" />
                    <span style="font-size:12px;opacity:.75">палитра</span>
                  </label>
                  <div style="display:flex; align-items:center; gap:6px; min-width:150px;">
                    <span style="font-size:12px;opacity:.75">A</span>
                    <input type="range" min="0" max="1" step="0.01" data-key-alpha="HLAE_CT_COLOR" style="width:90px" value="1" />
                    <input type="number" min="0" max="1" step="0.01" data-key-alpha-num="HLAE_CT_COLOR" style="width:60px" value="1" />
                  </div>
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <label style="min-width:220px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <span>HLAE_T_COLOR</span>
                  <span title="HLAE цвет T по умолчанию (синхронизирован с COLOR_NEW_T)" style="display:inline-flex;align-items:center;gap:6px;">
                    <span style="display:inline-block;width:14px;height:14px;border-radius:2px;background:${
                      values.HLAE_T_COLOR ||
                      values.COLOR_NEW_T ||
                      "rgba(193, 149, 17, 1)"
                    };border:1px solid #555"></span>
                  </span>
                </label>
                <input type="text" data-key="HLAE_T_COLOR" value="${
                  values.HLAE_T_COLOR ||
                  values.COLOR_NEW_T ||
                  "rgba(193, 149, 17, 1)"
                }" placeholder="${
              values.COLOR_NEW_T || "rgba(193, 149, 17, 1)"
            }" style="flex:1" />
                <span class="swatch-now" data-key-swatch="HLAE_T_COLOR" data-default="${
                  values.COLOR_NEW_T || "rgba(193, 149, 17, 1)"
                }" title="Текущий цвет" style="display:inline-block;width:14px;height:14px;border-radius:2px;border:1px solid #555;background:${
              values.HLAE_T_COLOR ||
              values.COLOR_NEW_T ||
              "rgba(229, 11, 11, 1)"
            }"></span>
                
                <div class="color-controls" data-key-color-controls="HLAE_T_COLOR" style="display:flex; align-items:center; gap:6px;">
                  <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input title="Палитра" type="color" data-key-color="HLAE_T_COLOR" value="#e50b0b" />
                    <span style="font-size:12px;opacity:.75">палитра</span>
                  </label>
                  <div style="display:flex; align-items:center; gap:6px; min-width:150px;">
                    <span style="font-size:12px;opacity:.75">A</span>
                    <input type="range" min="0" max="1" step="0.01" data-key-alpha="HLAE_T_COLOR" style="width:90px" value="1" />
                    <input type="number" min="0" max="1" step="0.01" data-key-alpha-num="HLAE_T_COLOR" style="width:60px" value="1" />
                  </div>
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <label style="min-width:220px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <span>HLAE_CT_ALPHA</span>
                  <span style="font-size:12px;opacity:.75">Значение: ${
                    values.HLAE_CT_ALPHA || "150"
                  }</span>
                </label>
                <input type="number" data-key="HLAE_CT_ALPHA" value="${
                  values.HLAE_CT_ALPHA || "150"
                }" min="0" max="255" step="1" style="width:80px" />
                <div style="display:flex; align-items:center; gap:6px; min-width:150px;">
                  <span style="font-size:12px;opacity:.75">0-255</span>
                  <input type="range" min="0" max="255" step="1" data-key-alpha-range="HLAE_CT_ALPHA" style="width:90px" value="${
                    values.HLAE_CT_ALPHA || "150"
                  }" />
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <label style="min-width:220px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <span>HLAE_T_ALPHA</span>
                  <span style="font-size:12px;opacity:.75">Значение: ${
                    values.HLAE_T_ALPHA || "150"
                  }</span>
                </label>
                <input type="number" data-key="HLAE_T_ALPHA" value="${
                  values.HLAE_T_ALPHA || "150"
                }" min="0" max="255" step="1" style="width:80px" />
                <div style="display:flex; align-items:center; gap:6px; min-width:150px;">
                  <span style="font-size:12px;opacity:.75">0-255</span>
                  <input type="range" min="0" max="255" step="1" data-key-alpha-range="HLAE_T_ALPHA" style="width:90px" value="${
                    values.HLAE_T_ALPHA || "150"
                  }" />
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <label style="min-width:220px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <span>HLAE_GLOW_ALPHA</span>
                  <span style="font-size:12px;opacity:.75">Значение: ${
                    values.HLAE_GLOW_ALPHA || "50"
                  }</span>
                </label>
                <input type="number" data-key="HLAE_GLOW_ALPHA" value="${
                  values.HLAE_GLOW_ALPHA || "50"
                }" min="0" max="255" step="1" style="width:80px" />
                <div style="display:flex; align-items:center; gap:6px; min-width:150px;">
                  <span style="font-size:12px;opacity:.75">0-255</span>
                  <input type="range" min="0" max="255" step="1" data-key-alpha-range="HLAE_GLOW_ALPHA" style="width:90px" value="${
                    values.HLAE_GLOW_ALPHA || "50"
                  }" />
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <label style="min-width:220px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <span>HLAE_TRAILS_ALPHA</span>
                  <span style="font-size:12px;opacity:.75">Значение: ${
                    values.HLAE_TRAILS_ALPHA || "50"
                  }</span>
                </label>
                <input type="number" data-key="HLAE_TRAILS_ALPHA" value="${
                  values.HLAE_TRAILS_ALPHA || "50"
                }" min="0" max="255" step="1" style="width:80px" />
                <div style="display:flex; align-items:center; gap:6px; min-width:150px;">
                  <span style="font-size:12px;opacity:.75">0-255</span>
                  <input type="range" min="0" max="255" step="1" data-key-alpha-range="HLAE_TRAILS_ALPHA" style="width:90px" value="${
                    values.HLAE_TRAILS_ALPHA || "50"
                  }" />
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <label style="min-width:220px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <span>HLAE_TEAMID_ALPHA</span>
                  <span style="font-size:12px;opacity:.75">Значение: ${
                    values.HLAE_TEAMID_ALPHA || "80"
                  }</span>
                </label>
                <input type="number" data-key="HLAE_TEAMID_ALPHA" value="${
                  values.HLAE_TEAMID_ALPHA || "80"
                }" min="0" max="255" step="1" style="width:80px" />
                <div style="display:flex; align-items:center; gap:6px; min-width:150px;">
                  <span style="font-size:12px;opacity:.75">0-255</span>
                  <input type="range" min="0" max="255" step="1" data-key-alpha-range="HLAE_TEAMID_ALPHA" style="width:90px" value="${
                    values.HLAE_TEAMID_ALPHA || "80"
                  }" />
                </div>
              </div>
            </div>`;
          // Синхронизируем color input c rgba
          formEl.querySelectorAll("input[data-key]")?.forEach((inp) => {
            const key = inp.getAttribute("data-key");
            const color = formEl.querySelector(
              `input[data-key-color="${key}\"]`
            );
            const swatch = formEl.querySelector(`[data-key-swatch="${key}\"]`);
            const alphaRange = formEl.querySelector(
              `input[data-key-alpha="${key}\"]`
            );
            const alphaNum = formEl.querySelector(
              `input[data-key-alpha-num="${key}\"]`
            );
            const toHex = (rgba) => {
              try {
                const m = rgba.match(
                  /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
                );
                if (!m) return null;
                const r = Number(m[1]).toString(16).padStart(2, "0");
                const g = Number(m[2]).toString(16).padStart(2, "0");
                const b = Number(m[3]).toString(16).padStart(2, "0");
                return `#${r}${g}${b}`;
              } catch {
                return null;
              }
            };
            const parseAlpha = (rgba) => {
              const m =
                rgba &&
                rgba.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\s*\)/i);
              const a = m ? parseFloat(m[1]) : NaN;
              return Number.isFinite(a) ? Math.max(0, Math.min(1, a)) : 1;
            };
            const fromHex = (hex, aVal) => {
              if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return null;
              const h = hex.replace("#", "");
              const r = parseInt(h.slice(0, 2), 16);
              const g = parseInt(h.slice(2, 4), 16);
              const b = parseInt(h.slice(4, 6), 16);
              const a = Number.isFinite(aVal) ? aVal : 1;
              return `rgba(${r}, ${g}, ${b}, ${a})`;
            };
            const isColorish = (val) =>
              typeof val === "string" &&
              /rgba\(|rgb\(|linear-gradient|#([0-9a-f]{3}|[0-9a-f]{6})/i.test(
                val
              );
            const applySwatch = () => {
              if (!swatch) return;
              const def = swatch.getAttribute("data-default") || "";
              const bg = isColorish(inp.value)
                ? inp.value
                : isColorish(def)
                ? def
                : "transparent";
              swatch.style.background = bg;
            };
            // init swatch state
            applySwatch();
            // init alpha controls from current value
            const initA =
              parseAlpha(inp.value || swatch.getAttribute("data-default")) || 1;
            if (alphaRange) alphaRange.value = String(initA);
            if (alphaNum) alphaNum.value = String(initA);
            if (color) {
              const hex = toHex(inp.value || "");
              if (hex) color.value = hex;
              color.addEventListener("input", () => {
                const a = alphaNum ? parseFloat(alphaNum.value) : 1;
                const rgba = fromHex(color.value, a);
                if (rgba) {
                  inp.value = rgba;
                  applySwatch();
                }
              });
            }
            // alpha sync
            const applyAlpha = () => {
              const a = alphaNum ? parseFloat(alphaNum.value) : 1;
              if (alphaRange) alphaRange.value = String(a);
              // rebuild rgba using current RGB from text input
              const hex = toHex(inp.value || "");
              if (hex) {
                const rgba = fromHex(hex, a);
                if (rgba) {
                  inp.value = rgba;
                  applySwatch();
                }
              }
            };
            if (alphaRange)
              alphaRange.addEventListener("input", () => {
                if (alphaNum) alphaNum.value = alphaRange.value;
                applyAlpha();
              });
            if (alphaNum) alphaNum.addEventListener("input", applyAlpha);
            inp.addEventListener("input", applySwatch);
          });

          // Автоматическая синхронизация HLAE цветов с основными цветами HUD
          const syncHlaeColors = () => {
            const ctColorInput = formEl.querySelector(
              'input[data-key="HLAE_CT_COLOR"]'
            );
            const tColorInput = formEl.querySelector(
              'input[data-key="HLAE_T_COLOR"]'
            );
            const ctNewColorInput = formEl.querySelector(
              'input[data-key="COLOR_NEW_CT"]'
            );
            const tNewColorInput = formEl.querySelector(
              'input[data-key="COLOR_NEW_T"]'
            );

            if (ctColorInput && ctNewColorInput && !values.HLAE_CT_COLOR) {
              // Если HLAE_CT_COLOR не был изменен пользователем, синхронизируем с COLOR_NEW_CT
              ctColorInput.value = ctNewColorInput.value;
              const swatch = formEl.querySelector(
                '[data-key-swatch="HLAE_CT_COLOR"]'
              );
              if (swatch) swatch.style.background = ctNewColorInput.value;
            }

            if (tColorInput && tNewColorInput && !values.HLAE_T_COLOR) {
              // Если HLAE_T_COLOR не был изменен пользователем, синхронизируем с COLOR_NEW_T
              tColorInput.value = tNewColorInput.value;
              const swatch = formEl.querySelector(
                '[data-key-swatch="HLAE_T_COLOR"]'
              );
              if (swatch) swatch.style.background = tNewColorInput.value;
            }
          };

          // Запускаем синхронизацию после инициализации всех полей
          syncHlaeColors();

          // Добавляем обработчики изменений для автоматической синхронизации HLAE цветов
          const ctNewColorInput = formEl.querySelector(
            'input[data-key="COLOR_NEW_CT"]'
          );
          const tNewColorInput = formEl.querySelector(
            'input[data-key="COLOR_NEW_T"]'
          );

          if (ctNewColorInput) {
            ctNewColorInput.addEventListener("input", () => {
              if (!values.HLAE_CT_COLOR) {
                // Только если пользователь не изменял HLAE цвет
                const hlaeCtInput = formEl.querySelector(
                  'input[data-key="HLAE_CT_COLOR"]'
                );
                const swatch = formEl.querySelector(
                  '[data-key-swatch="HLAE_CT_COLOR"]'
                );
                if (hlaeCtInput && swatch) {
                  hlaeCtInput.value = ctNewColorInput.value;
                  swatch.style.background = ctNewColorInput.value;
                }
              }
            });
          }

          if (tNewColorInput) {
            tNewColorInput.addEventListener("input", () => {
              if (!values.HLAE_T_COLOR) {
                // Только если пользователь не изменял HLAE цвет
                const hlaeTInput = formEl.querySelector(
                  'input[data-key="HLAE_T_COLOR"]'
                );
                const swatch = formEl.querySelector(
                  '[data-key-swatch="HLAE_T_COLOR"]'
                );
                if (hlaeTInput && swatch) {
                  hlaeTInput.value = tNewColorInput.value;
                  swatch.style.background = tNewColorInput.value;
                }
              }
            });
          }

          // Добавляем обработчики для HLAE цветов, чтобы их swatch'и обновлялись
          const hlaeCtInput = formEl.querySelector(
            'input[data-key="HLAE_CT_COLOR"]'
          );
          const hlaeTInput = formEl.querySelector(
            'input[data-key="HLAE_T_COLOR"]'
          );

          if (hlaeCtInput) {
            hlaeCtInput.addEventListener("input", () => {
              const swatch = formEl.querySelector(
                '[data-key-swatch="HLAE_CT_COLOR"]'
              );
              if (swatch) {
                swatch.style.background = hlaeCtInput.value;
              }
            });
          }

          if (hlaeTInput) {
            hlaeTInput.addEventListener("input", () => {
              const swatch = formEl.querySelector(
                '[data-key-swatch="HLAE_T_COLOR"]'
              );
              if (swatch) {
                swatch.style.background = hlaeTInput.value;
              }
            });
          }
          // Инициализация переключателей режима и контролов градиента
          formEl
            .querySelectorAll("select[data-key-mode]")
            ?.forEach((modeSelect) => {
              const key = modeSelect.getAttribute("data-key-mode");
              const colorControls = formEl.querySelector(
                `[data-key-color-controls="${key}"]`
              );
              const gradientControls = formEl.querySelector(
                `[data-key-gradient-controls="${key}"]`
              );
              const textInput = formEl.querySelector(
                `input[data-key="${key}"]`
              );

              // Функция для генерации градиента
              const generateGradient = () => {
                const angle =
                  formEl.querySelector(`[data-key-gradient-angle="${key}"]`)
                    ?.value || 0;
                const color1 =
                  formEl.querySelector(`[data-key-gradient-color1="${key}"]`)
                    ?.value || "#5788a8";
                const alpha1 =
                  formEl.querySelector(
                    `[data-key-gradient-alpha1-num="${key}"]`
                  )?.value || 1;
                const color2 =
                  formEl.querySelector(`[data-key-gradient-color2="${key}"]`)
                    ?.value || "#5788a8";
                const alpha2 =
                  formEl.querySelector(
                    `[data-key-gradient-alpha2-num="${key}"]`
                  )?.value || 0.623;

                // Конвертируем hex в rgba
                const hexToRgba = (hex, alpha) => {
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                };

                const rgba1 = hexToRgba(color1, alpha1);
                const rgba2 = hexToRgba(color2, alpha2);

                return `linear-gradient(${angle}deg, ${rgba1} 0%, ${rgba2} 100%)`;
              };

              // Функция для обновления текстового поля
              const updateTextInput = () => {
                if (modeSelect.value === "gradient") {
                  textInput.value = generateGradient();
                }
              };

              // Обработчик переключения режима
              modeSelect.addEventListener("change", () => {
                if (modeSelect.value === "solid") {
                  colorControls.style.display = "flex";
                  gradientControls.style.display = "none";
                } else {
                  colorControls.style.display = "none";
                  gradientControls.style.display = "flex";
                  updateTextInput();
                }
              });

              // Обработчики для контролов градиента
              gradientControls.querySelectorAll("input").forEach((input) => {
                input.addEventListener("input", updateTextInput);
              });

              // Синхронизация альфа-слайдеров с числовыми полями для градиента
              const alpha1Range = formEl.querySelector(
                `[data-key-gradient-alpha1="${key}"]`
              );
              const alpha1Num = formEl.querySelector(
                `[data-key-gradient-alpha1-num="${key}"]`
              );
              const alpha2Range = formEl.querySelector(
                `[data-key-gradient-alpha2="${key}"]`
              );
              const alpha2Num = formEl.querySelector(
                `[data-key-gradient-alpha2-num="${key}"]`
              );

              if (alpha1Range && alpha1Num) {
                alpha1Range.addEventListener("input", () => {
                  alpha1Num.value = alpha1Range.value;
                  updateTextInput();
                });
                alpha1Num.addEventListener("input", () => {
                  alpha1Range.value = alpha1Num.value;
                  updateTextInput();
                });
              }

              if (alpha2Range && alpha2Num) {
                alpha2Range.addEventListener("input", () => {
                  alpha2Num.value = alpha2Range.value;
                  updateTextInput();
                });
                alpha2Num.addEventListener("input", () => {
                  alpha2Range.value = alpha2Num.value;
                  updateTextInput();
                });
              }

              // Определяем начальный режим
              const isGradient = textInput.value.includes("linear-gradient");
              if (isGradient) {
                modeSelect.value = "gradient";
                colorControls.style.display = "none";
                gradientControls.style.display = "flex";

                // Парсим существующий градиент
                const gradientMatch = textInput.value.match(
                  /linear-gradient\((\d+)deg,\s*rgba\(([^)]+)\)\s*0%,\s*rgba\(([^)]+)\)\s*100%\)/
                );
                if (gradientMatch) {
                  const angle = gradientMatch[1];
                  const rgba1 = gradientMatch[2];
                  const rgba2 = gradientMatch[3];

                  // Устанавливаем значения в контролы
                  const angleInput = formEl.querySelector(
                    `[data-key-gradient-angle="${key}"]`
                  );
                  if (angleInput) angleInput.value = angle;

                  // Парсим rgba и устанавливаем цвета
                  const parseRgba = (rgba) => {
                    const match = rgba.match(
                      /(\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)/
                    );
                    if (match) {
                      const [_, r, g, b, a] = match;
                      const hex = `#${Number(r)
                        .toString(16)
                        .padStart(2, "0")}${Number(g)
                        .toString(16)
                        .padStart(2, "0")}${Number(b)
                        .toString(16)
                        .padStart(2, "0")}`;
                      return { hex, alpha: parseFloat(a) };
                    }
                    return { hex: "#5788a8", alpha: 1 };
                  };

                  const color1Data = parseRgba(rgba1);
                  const color2Data = parseRgba(rgba2);

                  const color1Input = formEl.querySelector(
                    `[data-key-gradient-color1="${key}"]`
                  );
                  const alpha1Input = formEl.querySelector(
                    `[data-key-gradient-alpha1-num="${key}"]`
                  );
                  const color2Input = formEl.querySelector(
                    `[data-key-gradient-color2="${key}"]`
                  );
                  const alpha2Input = formEl.querySelector(
                    `[data-key-gradient-alpha2-num="${key}"]`
                  );

                  if (color1Input) color1Input.value = color1Data.hex;
                  if (alpha1Input) alpha1Input.value = color1Data.alpha;
                  if (color2Input) color2Input.value = color2Data.hex;
                  if (alpha2Input) alpha2Input.value = color2Data.alpha;
                }
              }
            });
          // Инициализация HLAE полей
          formEl
            .querySelectorAll("input[data-key-alpha-range]")
            ?.forEach((rangeInput) => {
              const key = rangeInput.getAttribute("data-key-alpha-range");
              const numberInput = formEl.querySelector(
                `input[data-key="${key}"]`
              );

              if (numberInput) {
                // Синхронизация слайдера с числовым полем
                rangeInput.addEventListener("input", () => {
                  numberInput.value = rangeInput.value;
                });

                numberInput.addEventListener("input", () => {
                  const value = parseInt(numberInput.value) || 0;
                  const clampedValue = Math.max(0, Math.min(255, value));
                  rangeInput.value = clampedValue;
                  numberInput.value = clampedValue;
                });
              }
            });

          // Загружаем текущий путь к CS2
          try {
            const cs2PathResp = await fetch("/api/cs2-path");
            if (cs2PathResp.ok) {
              const cs2PathData = await cs2PathResp.json();
              const cs2PathInput = document.getElementById("cs2-path-input");
              const cs2PathStatus = document.getElementById("cs2-path-status");

              if (cs2PathInput && cs2PathStatus) {
                cs2PathInput.value = cs2PathData.path;
                cs2PathStatus.textContent = cs2PathData.autoDetected
                  ? "✓ Автоопределен"
                  : "⚠ Ручная настройка";
                cs2PathStatus.style.color = cs2PathData.autoDetected
                  ? "#4CAF50"
                  : "#FF9800";
              }
            }
          } catch (error) {
            console.warn("Failed to load CS2 path:", error);
          }

          // Инициализация HLAE цветовых полей
          formEl
            .querySelectorAll("input[data-key-color]")
            ?.forEach((colorInput) => {
              const key = colorInput.getAttribute("data-key-color");
              const textInput = formEl.querySelector(
                `input[data-key="${key}"]`
              );
              const alphaRange = formEl.querySelector(
                `input[data-key-alpha="${key}"]`
              );
              const alphaNum = formEl.querySelector(
                `input[data-key-alpha-num="${key}"]`
              );

              if (textInput && alphaRange && alphaNum) {
                colorInput.addEventListener("input", () => {
                  const hex = colorInput.value;
                  const alpha = parseFloat(alphaNum.value) || 1;

                  // Конвертируем hex в rgba
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);

                  textInput.value = `rgba(${r}, ${g}, ${b}, ${alpha})`;

                  // Обновляем swatch
                  const swatch = formEl.querySelector(
                    `[data-key-swatch="${key}"]`
                  );
                  if (swatch) {
                    swatch.style.background = textInput.value;
                  }
                });

                // Синхронизация альфа-слайдеров
                alphaRange.addEventListener("input", () => {
                  alphaNum.value = alphaRange.value;
                  updateHlaeColor(textInput, colorInput, alphaRange.value);
                });

                alphaNum.addEventListener("input", () => {
                  const value = parseFloat(alphaNum.value) || 1;
                  const clampedValue = Math.max(0, Math.min(1, value));
                  alphaRange.value = clampedValue;
                  alphaNum.value = clampedValue;
                  updateHlaeColor(textInput, colorInput, clampedValue);
                });
              }
            });
          // Обработчик для сохранения пути к CS2
          const cs2PathSaveBtn = document.getElementById("cs2-path-save");
          if (cs2PathSaveBtn) {
            cs2PathSaveBtn.addEventListener("click", async () => {
              const cs2PathInput = document.getElementById("cs2-path-input");
              const cs2PathStatus = document.getElementById("cs2-path-status");

              if (!cs2PathInput || !cs2PathStatus) return;

              const newPath = cs2PathInput.value.trim();
              if (!newPath) {
                alert("Введите путь к папке cfg CS2");
                return;
              }

              try {
                const resp = await fetch("/api/cs2-path", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ path: newPath }),
                });

                const result = await resp.json();
                if (resp.ok && result.ok) {
                  cs2PathStatus.textContent = "✓ Путь обновлен";
                  cs2PathStatus.style.color = "#4CAF50";
                  alert(`Путь к CS2 обновлен: ${newPath}`);
                } else {
                  throw new Error(result.error || "Unknown error");
                }
              } catch (error) {
                console.error("Failed to save CS2 path:", error);
                cs2PathStatus.textContent = "✗ Ошибка: " + error.message;
                cs2PathStatus.style.color = "#f44336";
                alert("Ошибка при сохранении пути к CS2: " + error.message);
              }
            });
          }
          // Функция для обновления HLAE цвета
          function updateHlaeColor(textInput, colorInput, alpha) {
            const hex = colorInput.value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);

            textInput.value = `rgba(${r}, ${g}, ${b}, ${alpha})`;

            // Обновляем swatch
            const key = textInput.getAttribute("data-key");
            const swatch = formEl.querySelector(`[data-key-swatch="${key}"]`);
            if (swatch) {
              swatch.style.background = textInput.value;
            }
          }
          // Функция для обновления цветовых полей после сохранения
          function updateFormColorsAfterSave(savedColors) {
            Object.entries(savedColors).forEach(([key, value]) => {
              // Обновляем текстовое поле
              const textInput = formEl.querySelector(
                `input[data-key="${key}"]`
              );
              if (textInput) {
                textInput.value = value;
              }

              // Обновляем swatch
              const swatch = formEl.querySelector(`[data-key-swatch="${key}"]`);
              if (swatch) {
                swatch.style.background = value;
                console.log(`Swatch updated for ${key}: ${value}`);
              } else if (!key.includes("_ALPHA")) {
                // Предупреждаем только для не-альфа полей, так как у альфа-значений нет swatch'ей
                console.warn(`Swatch not found for ${key}`);
              }

              // Для HLAE цветов обновляем специальные поля
              if (key.startsWith("HLAE_")) {
                // Дополнительно обновляем swatch для HLAE цветов (на случай, если основной не нашелся)
                const hlaeSwatch = formEl.querySelector(
                  `[data-key-swatch="${key}"]`
                );
                if (hlaeSwatch) {
                  hlaeSwatch.style.background = value;
                  console.log(`HLAE swatch updated for ${key}: ${value}`);
                } else if (!key.includes("_ALPHA")) {
                  // Предупреждаем только для не-альфа полей
                  console.warn(`HLAE swatch not found for ${key}`);
                }

                // Принудительно обновляем все swatch'и для HLAE цветов
                const allHlaeSwatches = formEl.querySelectorAll(
                  `[data-key-swatch="${key}"]`
                );
                allHlaeSwatches.forEach((swatch, index) => {
                  swatch.style.background = value;
                  console.log(
                    `HLAE swatch ${index + 1} updated for ${key}: ${value}`
                  );
                });
                // Обновляем цветовой picker для HLAE цветов
                const colorInput = formEl.querySelector(
                  `input[data-key-color="${key}"]`
                );
                if (colorInput && value.startsWith("rgba(")) {
                  // Парсим rgba и конвертируем в hex
                  const rgbaMatch = value.match(
                    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
                  );
                  if (rgbaMatch) {
                    const r = parseInt(rgbaMatch[1]);
                    const g = parseInt(rgbaMatch[2]);
                    const b = parseInt(rgbaMatch[3]);
                    const hex = `#${r.toString(16).padStart(2, "0")}${g
                      .toString(16)
                      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
                    colorInput.value = hex;
                  }
                }

                // Обновляем альфа-слайдеры для HLAE цветов (0-1)
                const alphaRange = formEl.querySelector(
                  `input[data-key-alpha="${key}"]`
                );
                const alphaNum = formEl.querySelector(
                  `input[data-key-alpha-num="${key}"]`
                );
                if (alphaRange && alphaNum && value.startsWith("rgba(")) {
                  const rgbaMatch = value.match(
                    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
                  );
                  if (rgbaMatch && rgbaMatch[4]) {
                    const alpha = parseFloat(rgbaMatch[4]);
                    alphaRange.value = alpha;
                    alphaNum.value = alpha;
                  }
                }

                // Обновляем альфа-слайдеры для HLAE альфа значений (0-255)
                const alphaRange255 = formEl.querySelector(
                  `input[data-key-alpha-range="${key}"]`
                );
                if (alphaRange255 && !isNaN(value) && key.includes("_ALPHA")) {
                  alphaRange255.value = value;
                }
              } else {
                // Для обычных цветов обновляем стандартные поля
                const colorInput = formEl.querySelector(
                  `input[data-key-color="${key}"]`
                );
                if (colorInput && value.startsWith("rgba(")) {
                  // Парсим rgba и конвертируем в hex
                  const rgbaMatch = value.match(
                    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
                  );
                  if (rgbaMatch) {
                    const r = parseInt(rgbaMatch[1]);
                    const g = parseInt(rgbaMatch[2]);
                    const b = parseInt(rgbaMatch[3]);
                    const hex = `#${r.toString(16).padStart(2, "0")}${g
                      .toString(16)
                      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
                    colorInput.value = hex;
                  }
                }

                // Обновляем альфа-слайдеры для обычных цветов (0-1)
                const alphaRange = formEl.querySelector(
                  `input[data-key-alpha="${key}"]`
                );
                const alphaNum = formEl.querySelector(
                  `input[data-key-alpha-num="${key}"]`
                );
                if (alphaRange && alphaNum && value.startsWith("rgba(")) {
                  const rgbaMatch = value.match(
                    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
                  );
                  if (rgbaMatch && rgbaMatch[4]) {
                    const alpha = parseFloat(rgbaMatch[4]);
                    alphaRange.value = alpha;
                    alphaNum.value = alpha;
                  }
                }
              }
            });
          }

          if (btnSave) {
            btnSave.onclick = async () => {
              const payload = {};
              formEl.querySelectorAll("input[data-key]")?.forEach((inp) => {
                const k = inp.getAttribute("data-key");
                const v = (inp.value || "").trim();
                if (v) payload[k] = v;
              });

              try {
                // Сохраняем конфиг HUD
                const resp = await fetch(`/api/hud-config/${hudId}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const j = await resp.json().catch(() => ({}));

                if (resp.ok && j.ok) {
                  // Обновляем HLAE конфиги если есть HLAE цвета
                  if (
                    payload.HLAE_CT_COLOR ||
                    payload.HLAE_T_COLOR ||
                    payload.HLAE_CT_ALPHA ||
                    payload.HLAE_T_ALPHA ||
                    payload.HLAE_GLOW_ALPHA ||
                    payload.HLAE_TRAILS_ALPHA ||
                    payload.HLAE_TEAMID_ALPHA
                  ) {
                    try {
                      await updateHlaeConfigs(payload);
                    } catch (hlaeError) {
                      console.warn(
                        "Ошибка обновления HLAE конфигов:",
                        hlaeError
                      );
                    }
                  }

                  // Обновляем все цветовые поля в форме после сохранения
                  console.log("Updating form colors with payload:", payload);
                  updateFormColorsAfterSave(payload);

                  // Дополнительная проверка HLAE swatch'ей после обновления (синхронно)
                  if (payload.HLAE_CT_COLOR || payload.HLAE_T_COLOR) {
                    console.log(
                      "Additional HLAE swatch update check (sync)..."
                    );
                    if (payload.HLAE_CT_COLOR) {
                      const ctSwatches = formEl.querySelectorAll(
                        `[data-key-swatch="HLAE_CT_COLOR"]`
                      );
                      console.log(`Found ${ctSwatches.length} CT swatches`);
                      ctSwatches.forEach((swatch, index) => {
                        swatch.style.background = payload.HLAE_CT_COLOR;
                        console.log(
                          `Additional CT swatch ${index + 1} update: ${
                            payload.HLAE_CT_COLOR
                          }`
                        );
                      });
                    }
                    if (payload.HLAE_T_COLOR) {
                      const tSwatches = formEl.querySelectorAll(
                        `[data-key-swatch="HLAE_T_COLOR"]`
                      );
                      console.log(`Found ${tSwatches.length} T swatches`);
                      tSwatches.forEach((swatch, index) => {
                        swatch.style.background = payload.HLAE_T_COLOR;
                        console.log(
                          `Additional T swatch ${index + 1} update: ${
                            payload.HLAE_T_COLOR
                          }`
                        );
                      });
                    }
                    console.log("Additional HLAE swatch update completed");
                  }

                  // Показываем информацию о том, где сохранены HLAE конфиги
                  if (
                    payload.HLAE_CT_COLOR ||
                    payload.HLAE_T_COLOR ||
                    payload.HLAE_CT_ALPHA ||
                    payload.HLAE_T_ALPHA ||
                    payload.HLAE_GLOW_ALPHA ||
                    payload.HLAE_TRAILS_ALPHA ||
                    payload.HLAE_TEAMID_ALPHA
                  ) {
                    try {
                      const cs2PathResp = await fetch("/api/cs2-path");
                      if (cs2PathResp.ok) {
                        const cs2PathData = await cs2PathResp.json();
                        alert(
                          `Сохранено!\n\nHLAE конфиги обновлены в:\n${cs2PathData.path}`
                        );
                      } else {
                        alert("Сохранено!\n\nHLAE конфиги обновлены.");
                      }
                    } catch (error) {
                      alert("Сохранено!\n\nHLAE конфиги обновлены.");
                    }
                  } else {
                    alert("Сохранено");
                  }

                  // Не закрываем модалку автоматически
                } else {
                  alert("Ошибка сохранения");
                }
              } catch {
                alert("Ошибка запроса");
              }
            };
          }
          // Сброс к оригиналу: очищаем файл конфига
          if (btnReset) {
            btnReset.onclick = async () => {
              if (!confirm("Сбросить все цвета к оригиналу?")) return;
              try {
                const resp = await fetch(`/api/hud-config/${hudId}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({}),
                });
                await resp.json().catch(() => ({}));
                // После сброса — перегенерация shud_color.cfg из оригинальных значений
                try {
                  const hudJsResp = await fetch(`/huds/${hudId}/index.js`, {
                    cache: "no-store",
                  }).catch(() => null);
                  const hudJs =
                    hudJsResp && hudJsResp.ok ? await hudJsResp.text() : "";
                  const defaultsMap = {};
                  if (hudJs) {
                    try {
                      const re = /([A-Z][A-Z0-9_]+)\s*=\s*(["'`])([\s\S]*?)\2/g;
                      let m;
                      while ((m = re.exec(hudJs))) {
                        const k = m[1];
                        const v = m[3];
                        if (
                          /rgba\(|rgb\(|linear-gradient|#([0-9a-f]{3}|[0-9a-f]{6})/i.test(
                            v
                          )
                        ) {
                          defaultsMap[k] = v;
                        }
                      }
                    } catch {}
                  }
                  const parse = (rgba) => {
                    const m = String(rgba).match(
                      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
                    );
                    if (!m) return { r: 40, g: 120, b: 240, a: 1 };
                    return {
                      r: +m[1],
                      g: +m[2],
                      b: +m[3],
                      a: m[4] ? +m[4] : 1,
                    };
                  };
                  const ct = parse(
                    defaultsMap["COLOR_NEW_CT"] || "rgba(40,120,240,1)"
                  );
                  const t = parse(
                    defaultsMap["COLOR_NEW_T"] || "rgba(229,11,11,1)"
                  );
                  const a255 = (a) =>
                    Math.round((typeof a === "number" ? a : 1) * 255);
                  const shudColorConfig = `mirv_deathmsg colors ct ${ct.r} ${
                    ct.g
                  } ${ct.b} ${a255(ct.a)}\nmirv_deathmsg colors t ${t.r} ${
                    t.g
                  } ${t.b} ${a255(t.a)}\nmirv_colors glow ct ${ct.r} ${ct.g} ${
                    ct.b
                  } 50\nmirv_colors glow t ${t.r} ${t.g} ${
                    t.b
                  } 50\nmirv_colors trails ct ${ct.r} ${ct.g} ${
                    ct.b
                  } 50\nmirv_colors trails t ${t.r} ${t.g} ${
                    t.b
                  } 50\nmirv_colors smokes ct ${ct.r} ${ct.g} ${
                    ct.b
                  }\nmirv_colors smokes t ${t.r} ${t.g} ${
                    t.b
                  }\nmirv_colors teamid ct ${ct.r} ${ct.g} ${
                    ct.b
                  } 80\nmirv_colors teamid t ${t.r} ${t.g} ${t.b} 80`;
                  await fetch("/api/update-hlae-config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      config: "shud_color",
                      content: shudColorConfig,
                    }),
                  });
                  // Обновляем отображение значков (swatch) и полей ввода к дефолту
                  // Заполняем все input[data-key] дефолтами, если есть
                  if (formEl) {
                    formEl
                      .querySelectorAll("input[data-key]")
                      ?.forEach((inp) => {
                        const k = inp.getAttribute("data-key");
                        if (
                          k &&
                          Object.prototype.hasOwnProperty.call(defaultsMap, k)
                        ) {
                          inp.value = defaultsMap[k];
                        } else if (k) {
                          // Для отсутствующих дефолтов очищаем
                          inp.value = "";
                        }
                      });
                    // Обновляем swatch для ключевых HLAE цветов (и любых других, если есть дефолт)
                    Object.keys(defaultsMap).forEach((k) => {
                      const sw = formEl.querySelector(
                        `[data-key-swatch="${k}"]`
                      );
                      if (sw) {
                        sw.style.background = defaultsMap[k] || "transparent";
                      }
                    });
                    // Явно обновляем HLAE_CT_COLOR и HLAE_T_COLOR из дефолтов
                    const ctColorStr =
                      defaultsMap["HLAE_CT_COLOR"] ||
                      defaultsMap["COLOR_NEW_CT"] ||
                      "rgba(87, 136, 168, 1)";
                    const tColorStr =
                      defaultsMap["HLAE_T_COLOR"] ||
                      defaultsMap["COLOR_NEW_T"] ||
                      "rgba(193, 149, 17, 1)";

                    const rgbaToHex = (r, g, b) =>
                      "#" +
                      [r, g, b]
                        .map((n) => {
                          const s = Number(n).toString(16).padStart(2, "0");
                          return s.length > 2 ? s.slice(0, 2) : s;
                        })
                        .join("");
                    const parse = (rgba) => {
                      const m = String(rgba).match(
                        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
                      );
                      if (!m) return { r: 40, g: 120, b: 240, a: 1 };
                      return {
                        r: +m[1],
                        g: +m[2],
                        b: +m[3],
                        a: m[4] ? +m[4] : 1,
                      };
                    };
                    const ctParsed = parse(ctColorStr);
                    const tParsed = parse(tColorStr);

                    const hlaeCtInput = formEl.querySelector(
                      'input[data-key="HLAE_CT_COLOR"]'
                    );
                    const hlaeTInput = formEl.querySelector(
                      'input[data-key="HLAE_T_COLOR"]'
                    );
                    if (hlaeCtInput) hlaeCtInput.value = ctColorStr;
                    if (hlaeTInput) hlaeTInput.value = tColorStr;

                    const hlaeCtSw = formEl.querySelector(
                      '[data-key-swatch="HLAE_CT_COLOR"]'
                    );
                    const hlaeTSw = formEl.querySelector(
                      '[data-key-swatch="HLAE_T_COLOR"]'
                    );
                    if (hlaeCtSw) hlaeCtSw.style.background = ctColorStr;
                    if (hlaeTSw) hlaeTSw.style.background = tColorStr;

                    // Обновим color picker и альфы рядом с полем
                    const setColorControls = (key, parsed) => {
                      const picker = formEl.querySelector(
                        `input[data-key-color="${key}"]`
                      );
                      const alphaRange = formEl.querySelector(
                        `input[data-key-alpha="${key}"]`
                      );
                      const alphaNum = formEl.querySelector(
                        `input[data-key-alpha-num="${key}"]`
                      );
                      if (picker)
                        picker.value = rgbaToHex(parsed.r, parsed.g, parsed.b);
                      if (alphaRange) alphaRange.value = String(parsed.a);
                      if (alphaNum) alphaNum.value = String(parsed.a);
                    };
                    setColorControls("HLAE_CT_COLOR", ctParsed);
                    setColorControls("HLAE_T_COLOR", tParsed);

                    // Вернём числовые альфы (0-255) в inputs и range
                    const setNum = (key, val) => {
                      const el = formEl.querySelector(
                        `input[data-key="${key}"]`
                      );
                      if (el) el.value = String(val);
                    };
                    const setRangeAlpha255 = (key, val) => {
                      const el = formEl.querySelector(
                        `input[data-key-alpha-range="${key}"]`
                      );
                      if (el) el.value = String(val);
                    };
                    setNum("HLAE_CT_ALPHA", 150);
                    setNum("HLAE_T_ALPHA", 150);
                    setNum("HLAE_GLOW_ALPHA", 50);
                    setNum("HLAE_TRAILS_ALPHA", 50);
                    setNum("HLAE_TEAMID_ALPHA", 80);
                    setRangeAlpha255("HLAE_CT_ALPHA", 150);
                    setRangeAlpha255("HLAE_T_ALPHA", 150);
                    setRangeAlpha255("HLAE_GLOW_ALPHA", 50);
                    setRangeAlpha255("HLAE_TRAILS_ALPHA", 50);
                    setRangeAlpha255("HLAE_TEAMID_ALPHA", 80);
                  }
                } catch {}
                alert("Сброшено. Используются оригинальные цвета HUD.");
              } catch {
                alert("Ошибка запроса");
              }
            };
          }
        } catch (e) {
          formEl.innerHTML = "Ошибка загрузки конфига";
        }
      }

      hudsList.querySelectorAll(".colors-button").forEach((btn) => {
        btn.addEventListener("click", () => openColorsModal(btn.dataset.hud));
      });
    }
  } catch (error) {
    console.error("Ошибка загрузки HUD:", error);
  }
}
// ... existing code ...
// Обновляем функцию updateGameInfo для использования данных из текущего матча
// Кэш последнего HTML скорборда, чтобы избежать лишних обновлений
let lastTableHTML = "";
async function updateGameInfo() {
  const scoreboardSection = document.getElementById("scoreboard-section");
  if (!scoreboardSection?.classList.contains("active") || !gsiDataBuffer) {
    return;
  }

  try {
    const data = gsiDataBuffer;

    // Определяем тип игры по provider.name
    const gameType = data.provider?.name;
    const isCS2 = gameType === "Counter-Strike: Global Offensive";
    const isDota2 = gameType === "Dota 2";

    console.log("Game type detected:", gameType, { isCS2, isDota2 });

    // Если это не CS2 и не Dota 2, не обновляем скорборд
    if (!isCS2 && !isDota2) {
      console.log("Unknown game type, skipping scoreboard update");
      return;
    }

    // Получаем данные текущего матча
    const currentMatch = await getCurrentMatch();
    //console.log("Текущий матч:", currentMatch); // Отладочное логирование

    // Получаем названия команд и лого
    const ctName = data.map?.team_ct?.name || currentMatch.team1_name;
    const tName = data.map?.team_t?.name || currentMatch.team2_name;

    // Проверяем наличие и корректность логотипов в консоли
    //console.log("Логотипы команд:", {
    //team1_logo_original: currentMatch.team1_logo,
    //team2_logo_original: currentMatch.team2_logo,
    //});

    // Добавляем проверку на null/undefined и использование URL логотипа
    const ctLogo =
      currentMatch.team1_logo &&
      currentMatch.team1_logo !== "null" &&
      currentMatch.team1_logo !== "undefined"
        ? currentMatch.team1_logo.startsWith("http")
          ? currentMatch.team1_logo
          : currentMatch.team1_logo.startsWith("/uploads/")
          ? currentMatch.team1_logo
          : currentMatch.team1_logo.startsWith("/images/")
          ? currentMatch.team1_logo
          : `/uploads/${currentMatch.team1_logo}`
        : "/images/default-team-logo.png";

    const tLogo =
      currentMatch.team2_logo &&
      currentMatch.team2_logo !== "null" &&
      currentMatch.team2_logo !== "undefined"
        ? currentMatch.team2_logo.startsWith("http")
          ? currentMatch.team2_logo
          : currentMatch.team2_logo.startsWith("/uploads/")
          ? currentMatch.team2_logo
          : currentMatch.team2_logo.startsWith("/images/")
          ? currentMatch.team2_logo
          : `/uploads/${currentMatch.team2_logo}`
        : "/images/default-team-logo.png";

    // Логируем итоговые пути к логотипам
    //console.log("Итоговые пути к логотипам:", {
    //ctLogo,
    // tLogo,
    // });

    // Обновляем счет команд
    const ctScore = data.map?.team_ct?.score || "0";
    const tScore = data.map?.team_t?.score || "0";

    // Для Dota 2 используем другой скорборд
    if (isDota2) {
      updateDota2Scoreboard(data, currentMatch);
      return;
    }

    // Обновляем таблицу только если нет паузы
    const statsTable = document.querySelector(
      "#scoreboard-section .player-stats-table"
    );
    if (!statsTable) return;

    const paused =
      typeof window !== "undefined" && typeof window.pauseUpdates === "boolean"
        ? window.pauseUpdates
        : false;

    if (!paused) {
      // Сортируем игроков по командам - сначала CT, потом T
      let ctPlayers = [];
      let tPlayers = [];

      if (data.allplayers) {
        Object.entries(data.allplayers).forEach(([steamid, player]) => {
          player.steamid = steamid; // добавим steamid прямо в объект игрока
          if (player.team && player.team.toUpperCase() === "CT")
            ctPlayers.push(player);
          else if (player.team && player.team.toUpperCase() === "T")
            tPlayers.push(player);
        });
      }

      // Формируем HTML для строк таблицы
      let playerRows = "";

      // Добавляем игроков CT
      ctPlayers.forEach((player) => {
        const kd =
          player.match_stats?.deaths > 0
            ? (player.match_stats.kills / player.match_stats.deaths).toFixed(2)
            : player.match_stats?.kills > 0
            ? player.match_stats.kills.toFixed(2)
            : "0.00";

        try {
          const ths = Number(player.state?.total_hs ?? 0);
          const rhs = Number(player.state?.round_killhs ?? 0);
          const kills = Number(player.match_stats?.kills ?? 0);
          console.debug(
            `[UI HS] CT steamid=${player.steamid} name=${player.name} total_hs=${ths} round_killhs=${rhs} kills=${kills}`
          );
        } catch (_e) {}
        playerRows += `
                    <tr class="player-row ${player.team.toLowerCase()}">
                        <td>${ctName}</td>
                        <td style="white-space:nowrap">
                          ${player.steamid}
                          <span class="copy-btn" data-copy-text="${encodeURIComponent(
                            String(player.steamid || "")
                          )}" title="Скопировать" style="margin-left:6px;cursor:pointer;font-size:12px;line-height:1;vertical-align:middle;display:inline">📋</span>
                        </td>
                        <td>
                          ${player.name}
                          <span class="copy-btn" data-copy-text="${encodeURIComponent(
                            String(player.name || "")
                          )}" title="Скопировать" style="margin-left:6px;cursor:pointer;font-size:12px;line-height:1;vertical-align:middle;display:inline">📋</span>
                        </td>
                        <td>${player.match_stats?.kills || 0}</td>
                        <td>${player.state.kill_hs || 0}</td>
                        <td>${player.match_stats?.deaths || 0}</td>
                        <td>${kd || 0}</td>
                        <td>${player.match_stats?.assists || 0}</td>
                        <td>${player.match_stats?.mvps || 0}</td>
                        <td>${player.match_stats?.score || 0}</td>
                        <td>${player.state.hs || 0}</td>
                        <td>${player.state.adr || 0}</td>
                    </tr>
                `;
      });

      // Добавляем игроков T
      tPlayers.forEach((player) => {
        const kd =
          player.match_stats?.deaths > 0
            ? (player.match_stats.kills / player.match_stats.deaths).toFixed(2)
            : player.match_stats?.kills > 0
            ? player.match_stats.kills.toFixed(2)
            : "0.00";

        try {
          const ths = Number(player.state?.total_hs ?? 0);
          const rhs = Number(player.state?.round_killhs ?? 0);
          const kills = Number(player.match_stats?.kills ?? 0);
          console.debug(
            `[UI HS] T steamid=${player.steamid} name=${player.name} total_hs=${ths} round_killhs=${rhs} kills=${kills}`
          );
        } catch (_e) {}
        playerRows += `
                    <tr class="player-row ${player.team.toLowerCase()}">
                        <td>${tName}</td>
                        <td style="white-space:nowrap">
                          ${player.steamid}
                          <span class="copy-btn" data-copy-text="${encodeURIComponent(
                            String(player.steamid || "")
                          )}" title="Скопировать" style="margin-left:6px;cursor:pointer;font-size:12px;line-height:1;vertical-align:middle;display:inline">📋</span>
                        </td>
                        <td>
                          ${player.name}
                          <span class="copy-btn" data-copy-text="${encodeURIComponent(
                            String(player.name || "")
                          )}" title="Скопировать" style="margin-left:6px;cursor:pointer;font-size:12px;line-height:1;vertical-align:middle;display:inline">📋</span>
                        </td>
                        <td>${player.match_stats?.kills || 0}</td>
                        <td>${player.state.kill_hs || 0}</td>
                        <td>${player.match_stats?.deaths || 0}</td>
                        <td>${kd || 0}</td>
                        <td>${player.match_stats?.assists || 0}</td>
                        <td>${player.match_stats?.mvps || 0}</td>
                        <td>${player.match_stats?.score || 0}</td>
                        <td>${player.state.hs || 0}</td>
                        <td>${player.state.adr || 0}</td>
                    </tr>
                `;
      });

      // Теперь используем готовую переменную playerRows в формировании HTML
      const newTableHTML = `
                <div class="scoreboard-header">
                    <div class="team-info2">
                        <img src="${ctLogo}" alt="${ctName}" class="team-logo2" onerror="this.src='/images/default-team-logo.png'">
                        <span class="team-name">${ctName}</span>
                    </div>
                    <div class="team-score ct">
                        <span class="score">${ctScore}</span>
                    </div>
                    <div class="score-divider">:</div>
                    <div class="team-score t">
                        <span class="score">${tScore}</span>
                    </div>
                    <div class="team-info2">
                        <span class="team-name">${tName}</span>
                        <img src="${tLogo}" alt="${tName}" class="team-logo2" onerror="this.src='/images/default-team-logo.png'">
                    </div>
                </div>
                <table class="players-table">
                    <thead>
                        <tr>
                            <th>Команда</th>
                            <th style="width:210px;white-space:nowrap">Steam64</th>
                            <th>Игрок</th>
                            <th>Убийства</th>
                            <th>УБ. в голову</th>
                            <th>Смерти</th>
                            <th>K/D</th>
                            <th>Помощь</th>
                            <th>MVP</th>
                            <th>Счёт</th>
                            <th>HS%</th>
                            <th>ADR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${playerRows}
                    </tbody>
                </table>
            `;

      if (newTableHTML !== lastTableHTML) {
        statsTable.innerHTML = newTableHTML;
        lastTableHTML = newTableHTML;
        ensureScoreboardCopyListener();
      }
    }
  } catch (error) {
    console.error("Ошибка обновления данных:", error);
  }
}
// Функция для получения текущего матча
async function getCurrentMatch() {
  try {
    // Получаем список матчей
    const response = await fetch("/api/matches");
    if (!response.ok) {
      throw new Error("Ошибка при получении списка матчей");
    }

    const matches = await response.json();

    // Ищем активный матч
    const currentMatch = matches.find((match) => match.status === "active");

    if (currentMatch) {
      // Загрузим подробные данные о командах
      let team1Data = null;
      let team2Data = null;

      if (currentMatch.team1_id) {
        const team1Response = await fetch(
          `/api/teams/${currentMatch.team1_id}`
        );
        if (team1Response.ok) {
          team1Data = await team1Response.json();
        }
      }

      if (currentMatch.team2_id) {
        const team2Response = await fetch(
          `/api/teams/${currentMatch.team2_id}`
        );
        if (team2Response.ok) {
          team2Data = await team2Response.json();
        }
      }

      // Используем логотипы из данных команд или из матча
      const team1Logo =
        team1Data?.logo ||
        currentMatch.team1_logo ||
        "/images/default-team-logo.png";
      const team2Logo =
        team2Data?.logo ||
        currentMatch.team2_logo ||
        "/images/default-team-logo.png";

      console.log("Загруженные данные команд:", {
        team1: team1Data,
        team2: team2Data,
        team1Logo,
        team2Logo,
      });

      return {
        team1_logo: team1Logo,
        team2_logo: team2Logo,
        team1_name: currentMatch.team1_name || "Команда 1",
        team2_name: currentMatch.team2_name || "Команда 2",
        format: currentMatch.format || "bo1",
        maps: currentMatch.maps || [],
      };
    } else {
      // Если активного матча нет, возвращаем значения по умолчанию
      return {
        team1_logo: "/images/default-team-logo.png",
        team2_logo: "/images/default-team-logo.png",
        team1_name: "Команда 1",
        team2_name: "Команда 2",
        format: "bo1",
        maps: [],
      };
    }
  } catch (error) {
    console.error("Ошибка при получении текущего матча:", error);
    // Возвращаем значения по умолчанию в случае ошибки
    return {
      team1_logo: "/images/default-team-logo.png",
      team2_logo: "/images/default-team-logo.png",
      team1_name: "Команда 1",
      team2_name: "Команда 2",
      format: "bo1",
      maps: [],
    };
  }
}

// Обработка ошибок
window.addEventListener("error", (event) => {
  console.error("Глобальная ошибка:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Необработанное отклонение промиса:", event.reason);
});

// ... existing code ...

// Удалите или закомментируйте этот код
/*
document.querySelector('.main-content').innerHTML += `
    <button id="openCreateMatch" class="primary-btn">Создать матч</button>
`;
*/

// Вместо этого, добавим обработчики для существующих элементов
document.addEventListener("DOMContentLoaded", () => {
  // Находим существующую кнопку
  const openBtn = document.getElementById("openCreateMatch");
  const closeBtn = document.getElementById("closeMatchModal");
  const modal = document.getElementById("createMatchModal");
  const matchSection = document.getElementById("match-section");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => {
      // Скрываем секцию создания матча
      if (matchSection) {
        matchSection.style.display = "none";
      }
      // Показываем модальное окно
      modal.style.display = "block";
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      // Показываем секцию создания матча
      if (matchSection) {
        matchSection.style.display = "block";
      }
    });
  }

  // Закрытие по клику вне модального окна
  if (modal) {
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        // Показываем секцию создания матча
        if (matchSection) {
          matchSection.style.display = "block";
        }
      }
    });
  }
});

// Инициализация создателя матчей только если все необходимые элементы существуют
if (document.getElementById("createMatchModal")) {
}

// Объединенная функция для загрузки команд в селекты
async function loadTeamsForSelect(selectElement, selectedValue = "") {
  try {
    const response = await fetch("/api/teams");
    const teams = await response.json();

    selectElement.innerHTML =
      '<option data-i18n="selectTeam" value="">Выберите команду</option>';

    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.name;
      if (selectedValue && selectedValue.toString() === team.id.toString()) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Ошибка при загрузке списка команд:", error);
    selectElement.innerHTML =
      '<option data-i18n="selectTeamError" value="">Ошибка загрузки команд</option>';
  }
}
// Объединенная функция инициализации формы матча
function initMatchForm() {
  const matchForm = document.getElementById("match-form");
  const team1Select = document.querySelector('select[name="team1"]');
  const team2Select = document.querySelector('select[name="team2"]');
  const swapTeamsBtn = document.getElementById("swapTeamsBtn");

  // Добавляем обработчик для кнопки смены сторон
  if (swapTeamsBtn) {
    swapTeamsBtn.addEventListener("click", () => {
      // Сохраняем текущие значения
      const team1Value = team1Select.value;
      const team2Value = team2Select.value;

      // Меняем значения местами
      team1Select.value = team2Value;
      team2Select.value = team1Value;

      // Добавляем анимацию вращения кнопки
      swapTeamsBtn.style.transform = "rotate(180deg)";
      setTimeout(() => {
        swapTeamsBtn.style.transform = "rotate(0deg)";
      }, 300);
    });
  }

  // Загружаем команды при загрузке страницы
  if (team1Select && team2Select) {
    loadTeamsForSelect(team1Select);
    loadTeamsForSelect(team2Select);

    // Обновляем списки при открытии
    team1Select.addEventListener("mousedown", () =>
      loadTeamsForSelect(team1Select, team1Select.value)
    );
    team2Select.addEventListener("mousedown", () =>
      loadTeamsForSelect(team2Select, team2Select.value)
    );
  }

  // Обработка отправки формы
  if (matchForm) {
    matchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Форма отправляется..."); // Отладочный вывод

      // Проверка на выбор одинаковых команд
      if (team1Select.value === team2Select.value && team1Select.value !== "") {
        alert("Нельзя выбрать одну и ту же команду");
        return;
      }

      // Сохраняем текущие значения
      const currentValues = {
        team1: team1Select.value,
        team2: team2Select.value,
        matchName: matchForm.querySelector('input[name="matchName"]').value,
        map: matchForm.querySelector('select[name="map"]').value,
        format: matchForm.querySelector('select[name="format"]').value,
      };

      // Собираем все данные формы
      const matchData = {
        team1_id: currentValues.team1,
        team2_id: currentValues.team2,
        match_name: currentValues.matchName,
        map: currentValues.map,
        format: currentValues.format || "bo1",
      };

      console.log("Отправляемые данные:", matchData);

      try {
        const response = await fetch("/api/matches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(matchData),
        });

        console.log("Статус ответа:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ошибка при создании матча");
        }

        const result = await response.json();
        console.log("Результат:", result);

        alert(i18n("matchCreatedSuccess"));

        // Обновляем списки команд, сохраняя выбранные значения
        if (team1Select && team2Select) {
          await loadTeamsForSelect(team1Select, currentValues.team1);
          await loadTeamsForSelect(team2Select, currentValues.team2);
        }

        // Восстанавливаем значения в форме
        team1Select.value = currentValues.team1;
        team2Select.value = currentValues.team2;
        matchForm.querySelector('input[name="matchName"]').value =
          currentValues.matchName;
        matchForm.querySelector('select[name="map"]').value = currentValues.map;
        matchForm.querySelector('select[name="format"]').value =
          currentValues.format;

        // Обновляем список матчей
        await loadMatchesList();
      } catch (error) {
        console.error("Ошибка:", error);
        alert(error.message || "Ошибка при создании матча");
      }
    });
  }

  // Обработчик для модального окна создания матча
  const createMatchForm = document.getElementById("createMatchForm");
  if (createMatchForm) {
    createMatchForm.onsubmit = async (e) => {
      e.preventDefault();

      try {
        const team1Id = document.getElementById("team1Select")?.value;
        const team2Id = document.getElementById("team2Select")?.value;

        if (!team1Id || !team2Id) {
          alert(i18n("pleaseSelectBothTeams"));
          return;
        }

        const response = await fetch("/api/matches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            team1_id: team1Id,
            team2_id: team2Id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Ошибка при создании матча");
        }

        // Безопасно получаем и проверяем модальное окно
        const modal = document.getElementById("createMatchModal");
        if (modal) {
          modal.style.display = "none";
        }

        // Обновляем список матчей
        await loadMatchesList();

        // Очищаем форму
        createMatchForm.reset();
      } catch (error) {
        console.error("Ошибка:", error);
        alert(i18n("matchCreateError"));
      }
    };
  }
}
// Обновляем функцию редактирования матча для сохранения выбранных карт
window.editMatch = async function (matchId) {
  try {
    // Получаем данные матча вместе с его картами
    const response = await fetch(`/api/matches/${matchId}`);
    if (!response.ok) throw new Error("Ошибка при загрузке данных матча");
    const match = await response.json();

    console.log(`Загружены данные матча ${matchId}:`, match);

    // Находим модальное окно и его элементы
    const modal = document.getElementById("editMatchModal");
    if (!modal) {
      console.error("Модальное окно редактирования не найдено");
      return;
    }

    // Находим форму и элементы формы
    const form = document.getElementById("editMatchForm");
    if (!form) {
      console.error("Форма редактирования не найдена");
      return;
    }

    // Важно! Полностью удаляем все существующие контейнеры карт
    document.querySelectorAll(".maps-container").forEach((container) => {
      container.remove();
    });

    // Создаем новый контейнер для карт текущего матча
    const mapsContainer = document.createElement("div");
    mapsContainer.id = `maps-container-${matchId}`;
    mapsContainer.className = "maps-container";
    form.appendChild(mapsContainer);

    // Находим все необходимые элементы формы
    const elements = {
      team1: document.getElementById("editTeam1"),
      team2: document.getElementById("editTeam2"),
      format: document.getElementById("editFormat"),
      mapsContainer: mapsContainer,
      swapBtn: document.getElementById("editSwapTeamsBtn"),
    };

    // Проверяем наличие всех необходимых элементов
    for (const [key, element] of Object.entries(elements)) {
      if (!element) {
        console.error(`Элемент ${key} не найден в форме редактирования`);
        return;
      }
    }

    // Загружаем команды в селекты
    await Promise.all([
      loadTeamsForSelect(elements.team1, match.team1_id),
      loadTeamsForSelect(elements.team2, match.team2_id),
    ]);

    // Устанавливаем значения формы
    elements.team1.value = match.team1_id;
    elements.team2.value = match.team2_id;
    elements.format.value = match.format || "bo1";
    // Устанавливаем время матча, если есть
    const matchTimeInput = document.getElementById("editMatchTime");
    if (matchTimeInput) {
      matchTimeInput.value =
        match.match_time && match.match_time.trim() ? match.match_time : "";
    }

    // Обновляем названия команд в селекторах выбора
    const team1Name =
      elements.team1.options[elements.team1.selectedIndex]?.text || "Команда 1";
    const team2Name =
      elements.team2.options[elements.team2.selectedIndex]?.text || "Команда 2";

    // Сохраняем ID текущего матча в форме
    form.dataset.currentMatchId = matchId;

    // Обновляем контейнер карт
    updateMapsContainerWithElements(elements, team1Name, team2Name, matchId);

    // Теперь заполняем карты из данных матча
    if (match.maps && match.maps.length > 0) {
      console.log(`Загружаем карты матча ${matchId}:`, match.maps);

      // Находим контейнеры для пикнутых и забаненных карт
      const pickedItems = mapsContainer.querySelectorAll(
        '.maps-editor-item[data-map-type="pick"]'
      );
      const bannedItems = mapsContainer.querySelectorAll(
        '.maps-editor-item[data-map-type="ban"]'
      );

      // Проверяем, является ли match.maps строкой (результат GROUP_CONCAT в SQL)
      let mapsList = [];
      if (typeof match.maps === "string") {
        // Если это строка, разбиваем ее на массив
        mapsList = match.maps
          .split(",")
          .map((mapName) => ({ map_name: mapName.trim() }));
        console.log("Преобразованные карты из строки:", mapsList);
      } else if (Array.isArray(match.maps)) {
        mapsList = match.maps;
      }

      // Разделяем карты на пикнутые и забаненные
      const pickedMaps = mapsList.filter(
        (map) => !map.map_type || map.map_type === "pick"
      );
      const bannedMaps = mapsList.filter((map) => map.map_type === "ban");

      // Заполняем пикнутые карты
      pickedMaps.forEach((map, index) => {
        if (index < pickedItems.length) {
          const mapItem = pickedItems[index];
          const mapSelect = mapItem.querySelector(".map-select");
          const pickTeamSelect = mapItem.querySelector(".pick-team-select");

          if (mapSelect) mapSelect.value = map.map_name || "";
          if (pickTeamSelect) {
            if (map.pick_team === "team1" || map.pick_team === "team2") {
              pickTeamSelect.value = map.pick_team;
            } else if (map.pick_team === "DECIDER") {
              pickTeamSelect.value = "DECIDER";
            }
          }
        }
      });

      // Заполняем забаненные карты
      bannedMaps.forEach((map, index) => {
        if (index < bannedItems.length) {
          const mapItem = bannedItems[index];
          const mapSelect = mapItem.querySelector(".map-select");
          const pickTeamSelect = mapItem.querySelector(".pick-team-select");

          if (mapSelect) mapSelect.value = map.map_name || "";
          if (pickTeamSelect) {
            if (map.pick_team === "team1" || map.pick_team === "team2") {
              pickTeamSelect.value = map.pick_team;
            }
          }
        }
      });
    }

    // Обновляем контейнер карт при изменении формата
    elements.format.addEventListener("change", () => {
      updateMapsContainerWithElements(elements, team1Name, team2Name, matchId);
    });

    // Добавляем обработчик для кнопки свапа
    if (elements.swapBtn) {
      elements.swapBtn.onclick = () => {
        const team1Value = elements.team1.value;
        const team2Value = elements.team2.value;
        elements.team1.value = team2Value;
        elements.team2.value = team1Value;

        // Анимация кнопки
        elements.swapBtn.style.transform = "rotate(180deg)";
        setTimeout(() => {
          elements.swapBtn.style.transform = "rotate(0deg)";
        }, 300);

        // Обновляем названия команд в селекторах после свапа
        const newTeam1Name =
          elements.team1.options[elements.team1.selectedIndex]?.text ||
          "Команда 1";
        const newTeam2Name =
          elements.team2.options[elements.team2.selectedIndex]?.text ||
          "Команда 2";
        updateMapsContainerWithElements(
          elements,
          newTeam1Name,
          newTeam2Name,
          matchId
        );
      };
    }

    // Обработчик отправки формы
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        // Проверяем выбор одинаковых команд
        if (
          elements.team1.value === elements.team2.value &&
          elements.team1.value !== ""
        ) {
          alert("Нельзя выбрать одну и ту же команду");
          return;
        }

        // Собираем данные о картах для текущего матча
        const currentMatchId = form.dataset.currentMatchId;
        if (currentMatchId !== matchId) {
          console.error(
            `Несоответствие ID матча: форма=${currentMatchId}, ожидается=${matchId}`
          );
        }

        const maps = Array.from(
          elements.mapsContainer.querySelectorAll(".maps-editor-item")
        )
          .map((item) => ({
            mapId: item.querySelector(".map-select").value,
            pickTeam: item.querySelector(".pick-team-select").value,
            mapType: item.dataset.mapType || "pick",
          }))
          .filter((map) => map.mapId !== "");

        const formData = {
          team1_id: parseInt(elements.team1.value),
          team2_id: parseInt(elements.team2.value),
          format: elements.format.value,
          maps: maps,
        };

        console.log(`Отправляемые данные для матча ${matchId}:`, formData);

        const updateResponse = await fetch(`/api/matches/${matchId}/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error("Ответ сервера:", errorText);
          throw new Error(
            "Ошибка при обновлении матча: " + updateResponse.status
          );
        }

        const result = await updateResponse.json();
        console.log("Результат обновления:", result);

        /* if (result.success) {
          modal.style.display = "none";
          alert("Матч успешно обновлен");
          await loadMatchesList();
        } else {
          throw new Error(
            result.message || "Неизвестная ошибка при обновлении матча"
          );
        }*/
      } catch (error) {
        console.error("Ошибка при сохранении:", error);
        alert("Ошибка при сохранении матча");
      }
    };

    // Обработчики закрытия модального окна
    const closeBtn = modal.querySelector(".close");
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = "none";
        // Удаляем ID текущего матча при закрытии
        delete form.dataset.currentMatchId;
      };
    }

    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    };

    // Показываем модальное окно
    modal.style.display = "block";
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Ошибка при загрузке данных матча: " + error.message);
  }
};

// Функция для проверки статуса конфигов CS2
async function checkCS2Configs(customPath) {
  try {
    let url = "/api/check-cs2-configs";
    if (customPath) {
      url += `?path=${encodeURIComponent(customPath)}`;
    }
    // Добавляем cache-busting параметр
    url += (url.includes("?") ? "&" : "?") + `_=${Date.now()}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      return data;
    } else {
      console.error("Ошибка при проверке конфигов:", data.message);
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
    return null;
  }
}
// Функция для установки конфигов CS2
async function installCS2Configs() {
  try {
    const customPathInput = document.getElementById("cs2-custom-path");
    let url = "/api/install-cs2-configs";

    if (customPathInput && customPathInput.value) {
      url += `?path=${encodeURIComponent(customPathInput.value)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      alert("Конфиги CS2 успешно установлены!");
      updateConfigsStatus();
    } else {
      if (
        data.installed &&
        (data.installed.gsi ||
          data.installed.observer ||
          data.installed.observer2 ||
          data.installed.observer_off)
      ) {
        let message = "Частичная установка конфигов: ";
        if (data.installed.gsi) message += "GSI установлен. ";
        if (data.installed.observer) message += "Observer установлен. ";
        if (data.installed.observer2) message += "Observer2 установлен. ";
        if (data.installed.observer_off) message += "Observer_off установлен. ";
        message += "\nОшибка: " + data.message;
        alert(message);
      } else {
        alert("Ошибка при установке конфигов: " + data.message);
      }
      updateConfigsStatus();
    }
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
    alert("Ошибка при установке конфигов");
  }
}
// Обновление статуса конфигов в интерфейсе
async function updateConfigsStatus() {
  const gsiStatusElement = document.getElementById("cs2-gsi-status");
  const observerStatusElement = document.getElementById("cs2-observer-status");
  const observer2StatusElement = document.getElementById(
    "cs2-observer2-status"
  );
  const observer_offStatusElement = document.getElementById(
    "cs2-observer_off-status"
  );
  const observerHlaeKillStatusElement = document.getElementById(
    "cs2-observer_hlae_kill-status"
  );
  const observerToolsStatusElement = document.getElementById(
    "cs2-observer_tools-status"
  );
  const shudColorStatusElement = document.getElementById(
    "cs2-shud_color-status"
  );
  const customPathInput = document.getElementById("cs2-custom-path");

  // Проверяем только обязательные элементы
  if (
    !gsiStatusElement ||
    !observerStatusElement ||
    !observer2StatusElement ||
    !observer_offStatusElement
  )
    return;

  // Устанавливаем начальные значения статусов
  gsiStatusElement.innerHTML =
    '<span class="status-dot gray"></span>Проверка статуса GSI конфига...';
  observerStatusElement.innerHTML =
    '<span class="status-dot gray"></span>Проверка статуса Observer конфига...';
  observer2StatusElement.innerHTML =
    '<span class="status-dot gray"></span>Проверка статуса Observer2 конфига...';
  observer_offStatusElement.innerHTML =
    '<span class="status-dot gray"></span>Проверка статуса Observer_off конфига...';
  if (observerToolsStatusElement) {
    observerToolsStatusElement.innerHTML =
      '<span class="status-dot gray"></span>Проверка статуса observer_cs2_tools_killfeed...';
  }
  if (observerHlaeKillStatusElement) {
    observerHlaeKillStatusElement.innerHTML =
      '<span class="status-dot gray"></span>Проверка статуса observer_HLAE_kill.cfg...';
  }
  if (shudColorStatusElement) {
    shudColorStatusElement.innerHTML =
      '<span class="status-dot gray"></span>Проверка статуса shud_color.cfg...';
  }

  const data = await checkCS2Configs(
    customPathInput ? customPathInput.value : null
  );

  if (data && data.success) {
    if (data.gsiInstalled) {
      gsiStatusElement.innerHTML =
        '<span class="status-dot green"></span>GSI cfg status</span>';
    } else {
      gsiStatusElement.innerHTML =
        '<span class="status-dot red"></span>GSI cfg status</span>';
    }

    if (data.observerInstalled) {
      observerStatusElement.innerHTML =
        '<span class="status-dot green"></span>Observer cfg status</span>';
    } else {
      if (data.sourceObserverExists === false) {
        observerStatusElement.innerHTML =
          '<span class="status-dot gray"></span>Observer cfg: file not found in cfg folder for installation';
      } else {
        observerStatusElement.innerHTML =
          '<span class="status-dot red"></span>Observer cfg status';
      }
    }

    if (data.observer2Installed) {
      observer2StatusElement.innerHTML =
        '<span class="status-dot green"></span>Observer2 cfg status</span>';
    } else {
      if (data.sourceObserver2Exists === false) {
        observer2StatusElement.innerHTML =
          '<span class="status-dot gray"></span>Observer2 cfg: file not found in cfg folder for installation';
      } else {
        observer2StatusElement.innerHTML =
          '<span class="status-dot red"></span>Observer2 cfg status';
      }
    }

    if (data.observer_offInstalled) {
      observer_offStatusElement.innerHTML =
        '<span class="status-dot green"></span>Observer_off cfg status</span>';
    } else {
      if (data.sourceObserverOffExists === false) {
        observer_offStatusElement.innerHTML =
          '<span class="status-dot gray"></span>Observer_off cfg: file not found in cfg folder for installation';
      } else {
        observer_offStatusElement.innerHTML =
          '<span class="status-dot red"></span>Observer_off cfg status';
      }
    }

    if (observerToolsStatusElement) {
      if (data.observerToolsInstalled) {
        observerToolsStatusElement.innerHTML =
          '<span class="status-dot green"></span>observer_cs2_tools_killfeed cfg status</span>';
      } else {
        if (data.sourceObserverToolsExists === false) {
          observerToolsStatusElement.innerHTML =
            '<span class="status-dot gray"></span>observer_cs2_tools_killfeed cfg: file not found in cfg folder for installation';
        } else {
          observerToolsStatusElement.innerHTML =
            '<span class="status-dot red"></span>observer_cs2_tools_killfeed cfg status';
        }
      }
    }
    if (observerHlaeKillStatusElement) {
      if (data.observerHlaeKillInstalled) {
        observerHlaeKillStatusElement.innerHTML =
          '<span class="status-dot green"></span>observer_HLAE_kill.cfg cfg status</span>';
      } else {
        observerHlaeKillStatusElement.innerHTML =
          '<span class="status-dot red"></span>observer_HLAE_kill.cfg cfg status';
      }
    }
    if (shudColorStatusElement) {
      if (data.shudColorInstalled) {
        shudColorStatusElement.innerHTML =
          '<span class="status-dot green"></span>SHUD color cfg status</span>';
      } else {
        if (data.sourceShudColorExists === false) {
          shudColorStatusElement.innerHTML =
            '<span class="status-dot gray"></span>SHUD color cfg: file not found in cfg folder for installation';
        } else {
          shudColorStatusElement.innerHTML =
            '<span class="status-dot red"></span>SHUD color cfg status</span>';
        }
      }
    }

    const pathElement = document.getElementById("cs2-path");
    if (pathElement) {
      pathElement.textContent =
        data.configPath || `${data.path}\\game\\csgo\\cfg`;

      if (customPathInput && !customPathInput.value) {
        customPathInput.value = data.path;
      }
    }
  } else {
    gsiStatusElement.innerHTML =
      '<span class="status-dot red"></span>GSI cfg status</span>';
    observerStatusElement.innerHTML =
      '<span class="status-dot red"></span>Observer cfg status</span>';
    observer2StatusElement.innerHTML =
      '<span class="status-dot red"></span>Observer2 cfg status</span>';
    observer_offStatusElement.innerHTML =
      '<span class="status-dot red"></span>Observer_off cfg status</span>';
    if (observerToolsStatusElement) {
      observerToolsStatusElement.innerHTML =
        '<span class="status-dot red"></span>observer_cs2_tools_killfeed cfg status</span>';
    }
    if (observerHlaeKillStatusElement) {
      observerHlaeKillStatusElement.innerHTML =
        '<span class="status-dot red"></span>observer_HLAE_kill.cfg cfg status</span>';
    }
    if (shudColorStatusElement) {
      shudColorStatusElement.innerHTML =
        '<span class="status-dot red"></span>SHUD color cfg status</span>';
    }

    const pathElement = document.getElementById("cs2-path");
    if (pathElement) {
      pathElement.textContent = data ? data.message : "Error finding CS2";
    }
  }
}

// Инициализация интерфейса для CS2
function initializeCS2Tools() {
  // Добавляем обработчики событий для кнопок
  const installBtn = document.getElementById("install-cs2-configs");
  if (installBtn) {
    installBtn.addEventListener("click", installCS2Configs);
  }

  const checkBtn = document.getElementById("check-cs2-path");
  if (checkBtn) {
    checkBtn.addEventListener("click", updateConfigsStatus);
  }

  // Обновляем статус конфигов при загрузке
  updateConfigsStatus();
}

// Добавляем вызов инициализации
window.addEventListener("DOMContentLoaded", () => {
  // ... existing code ...
  initializeCS2Tools();
});

// Глобальные переменные для локализации
let currentLanguage = "ru";
let translations = {};

// Функция для загрузки переводов
async function loadTranslations(lang) {
  try {
    // Используем параметр запроса вместо cookies
    const response = await fetch(`/api/get-translations?lang=${lang || "ru"}`);
    const data = await response.json();

    currentLanguage = data.language;
    translations = data.translations;

    // Сохраняем выбранный язык в localStorage
    localStorage.setItem("preferredLanguage", currentLanguage);

    // Обновляем интерфейс с новыми переводами
    updateUI();
    return translations;
  } catch (error) {
    console.error("Error loading translations:", error);
    return {};
  }
}

// Функция для изменения языка
async function changeLanguage(lang) {
  try {
    await loadLanguage(lang);

    // Обновляем весь UI
    translatePage();

    // Перезагружаем динамически созданные элементы
    if (document.querySelector("#matches-list")) {
      await loadMatchesList();
    }

    if (document.querySelector("#teams-list")) {
      await loadTeamsList();
    }

    if (document.querySelector("#players-list")) {
      await loadPlayers();
    }

    if (document.querySelector("#huds-list")) {
      await loadHUDs();
    }

    // Обновляем CS2 статус если он открыт
    if (document.querySelector("#cs2-path")) {
      updateConfigsStatus();
    }
  } catch (error) {
    console.error("Error changing language:", error);
  }
}

async function loadLanguage(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load language ${lang}`);
    }

    i18nTranslations = await response.json();
    i18nCurrentLang = lang;
    localStorage.setItem("i18nPreferredLanguage", lang);

    // Обновляем все элементы с data-i18n
    translatePage();

    console.log(`Language changed to ${lang}`);
    return true;
  } catch (error) {
    console.error("Error loading language:", error);
    // Если загрузка не удалась, попробуем загрузить русский язык как резервный
    if (lang !== "ru") {
      return loadLanguage("ru");
    }
    return false;
  }
}

// Функция для перевода текста
function __(key) {
  return translations[key] || key;
}

// Обновление интерфейса с учетом выбранного языка
function updateUI() {
  // Обновляем тексты в CS2 секции
  const elements = {
    "cs2-integration-title": "cs2Integration",
    "cs2-configs-status": "cs2ConfigsStatus",
    "cs2-config-path-label": "cs2ConfigPath",
    "check-cs2-path": "cs2CheckPath",
    "install-cs2-configs": "cs2InstallConfigs",
  };

  // Обновляем текст для всех элементов
  for (const [id, key] of Object.entries(elements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = __(key);
    }
  }

  // Обновляем placeholder для пути к CS2
  const customPathInput = document.getElementById("cs2-custom-path");
  if (customPathInput) {
    customPathInput.placeholder = __("cs2CustomPath");
  }
}

// Инициализация выбора языка
function initializeLanguageSelector() {
  const languageSelector = document.getElementById("language-selector");
  if (languageSelector) {
    // Устанавливаем текущий язык из localStorage или по умолчанию
    const savedLang = localStorage.getItem("preferredLanguage") || "ru";
    languageSelector.value = savedLang;

    // Загружаем сохраненный язык
    loadTranslations(savedLang);

    // Добавляем обработчик изменения
    languageSelector.addEventListener("change", (e) => {
      changeLanguage(e.target.value);
    });
  }
}

// Обновляем инициализацию страницы
window.addEventListener("DOMContentLoaded", () => {
  // Инициализируем выбор языка
  initializeLanguageSelector();

  // Здесь могут быть вызовы других функций инициализации
  initializeCS2Tools();
});

// В функции смены языка
function changeLanguage(lang) {
  i18nCurrentLang = lang;
  localStorage.setItem("i18nPreferredLanguage", lang);
  // Остальной код...
}

// Добавить в конце каждой функции, которая обновляет содержимое
loadMatchesList().then(() => {
  translatePage(); // Локализуем обновленный контент
});

// Удаление конфигов CS2
async function removeCS2Configs() {
  const customPathInput = document.getElementById("cs2-custom-path");
  const customPath = customPathInput ? customPathInput.value : null;

  try {
    const response = await fetch(
      `/api/remove-cs2-configs${
        customPath ? `?path=${encodeURIComponent(customPath)}` : ""
      }`
    );
    const data = await response.json();

    if (data.success) {
      alert("Configs successfully removed");
      // Обновляем статус конфигов после удаления
      await updateConfigsStatus();
    } else {
      alert(data.message || "Error removing configs");
    }
  } catch (error) {
    console.error("Error removing configs:", error);
    alert("Error removing configs");
  }
}

// Добавляем обработчик для кнопки удаления в функцию initializeCS2Tools
function initializeCS2Tools() {
  const installButton = document.getElementById("install-cs2-configs");
  const checkPathButton = document.getElementById("check-cs2-path");
  const removeButton = document.getElementById("remove-cs2-configs");

  if (installButton) {
    installButton.addEventListener("click", installCS2Configs);
  }

  if (checkPathButton) {
    checkPathButton.addEventListener("click", () => {
      const customPathInput = document.getElementById("cs2-custom-path");
      if (customPathInput) {
        updateConfigsStatus(customPathInput.value);
      }
    });
  }

  if (removeButton) {
    removeButton.addEventListener("click", removeCS2Configs);
  }

  // Проверяем статус конфигов при загрузке страницы
  updateConfigsStatus();
}
// Функция для сохранения данных матча
async function saveMatch(matchId) {
  const mapsContainer = document.querySelector(".maps-container");
  if (!mapsContainer) return;

  // Получаем данные о картах процесса вето (пикнутые и забаненные)
  const allMapsData = [];

  // Собираем пикнутые карты
  const pickedMaps = Array.from(
    mapsContainer.querySelectorAll('.map-item[data-map-type="pick"]')
  )
    .map((item, index) => {
      return {
        mapId: item.querySelector(".map-select").value,
        pickTeam: item.querySelector(".pick-team-select").value,
        mapType: "pick",
        order_number: index + 1,
        match_time: " ",
      };
    })
    .filter((map) => map.mapId); // Фильтруем только карты с выбранным значением

  // Собираем забаненные карты
  const bannedMaps = Array.from(
    mapsContainer.querySelectorAll('.map-item[data-map-type="ban"]')
  )
    .map((item, index) => {
      return {
        mapId: item.querySelector(".map-select").value,
        pickTeam: item.querySelector(".pick-team-select").value,
        mapType: "ban",
        order_number: pickedMaps.length + index + 1,
      };
    })
    .filter((map) => map.mapId); // Фильтруем только карты с выбранным значением

  // Объединяем все карты
  allMapsData.push(...pickedMaps, ...bannedMaps);

  console.log("Сохраняемые данные карт:", allMapsData);

  // Формируем данные для отправки на сервер
  const formatSelect = document.getElementById("editFormat");
  const team1Select = document.getElementById("editTeam1");
  const team2Select = document.getElementById("editTeam2");
  const matchTimeInput = document.getElementById("editMatchTime");

  const data = {
    format: formatSelect ? formatSelect.value : "bo1",
    team1_id: team1Select ? parseInt(team1Select.value) : undefined,
    team2_id: team2Select ? parseInt(team2Select.value) : undefined,
    match_time: matchTimeInput ? matchTimeInput.value : "",
    maps: allMapsData,
  };

  console.log("Отправляемые данные на сервер:", data);

  try {
    // Отправляем данные на сервер
    const response = await fetch(`/api/matches/${matchId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Ошибка при сохранении данных");

    const result = await response.json();
    console.log("Результат сохранения:", result);
    alert("Данные матча успешно сохранены");

    // Обновляем список матчей, если функция существует
    if (typeof loadMatchesList === "function") {
      loadMatchesList();
    }

    // Закрываем модальное окно, если оно открыто
    const modal = document.getElementById("editMatchModal");
    if (modal) {
      modal.style.display = "none";
    }
  } catch (error) {
    console.error("Ошибка при сохранении матча:", error);
    alert(`Ошибка: ${error.message}`);
  }
}
function updateMapsContainerWithElements(
  elements,
  team1Name,
  team2Name,
  matchId
) {
  const formatSelect = elements.format;
  const mapsContainer = elements.mapsContainer;

  if (!formatSelect || !mapsContainer) {
    console.error("Не найдены необходимые элементы для обновления карт");
    return;
  }

  const format = formatSelect.value;
  let pickedMapCount = 1; // По умолчанию одна карта
  let bannedMapCount = 0; // По умолчанию нет забаненных карт

  // Определяем количество карт в зависимости от формата
  if (format === "bo1") {
    pickedMapCount = 1;
    bannedMapCount = 6; // Для BO1: 6 банов (по 3 от каждой команды)
  } else if (format === "bo2") {
    pickedMapCount = 2;
    bannedMapCount = 5; // Для BO2: 5 банов
  } else if (format === "bo3") {
    pickedMapCount = 3;
    bannedMapCount = 4; // Для BO3: 4 бана
  } else if (format === "bo5") {
    pickedMapCount = 5;
    bannedMapCount = 2; // Для BO5: 2 бана
  }

  // Сохраняем текущие выбранные карты
  const currentPickedMaps = Array.from(
    mapsContainer.querySelectorAll('.maps-editor-item[data-map-type="pick"]')
  ).map((item) => ({
    mapId: item.querySelector(".map-select")?.value || "",
    pickTeam: item.querySelector(".pick-team-select")?.value || "",
    mapType: "pick",
  }));

  const currentBannedMaps = Array.from(
    mapsContainer.querySelectorAll('.maps-editor-item[data-map-type="ban"]')
  ).map((item) => ({
    mapId: item.querySelector(".map-select")?.value || "",
    pickTeam: item.querySelector(".pick-team-select")?.value || "",
    mapType: "ban",
  }));

  console.log("Текущие пикнутые карты:", currentPickedMaps);
  console.log("Текущие забаненные карты:", currentBannedMaps);

  // Очищаем контейнер
  mapsContainer.innerHTML = "";

  // Добавляем общие стили
  const styleElement = document.createElement("style");
  styleElement.textContent = `
        /* Сброс для предотвращения конфликтов */
        #maps-editor-unique-id * {
            box-sizing: border-box;
        }
        
        #maps-editor-unique-id {
            font-family: 'Segoe UI', Arial, sans-serif !important;
            position: relative;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        #maps-content-unique-id {
            max-height: 65vh !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            scrollbar-width: thin;
        }
        
        /* Стилизация скроллбара */
        #maps-content-unique-id::-webkit-scrollbar {
            width: 8px !important;
        }
        
        #maps-content-unique-id::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2) !important;
            border-radius: 4px !important;
        }
        
        #maps-content-unique-id::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3) !important;
            border-radius: 4px !important;
        }
        
        #maps-content-unique-id::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4) !important;
        }
        
        .maps-editor-section {
            background-color: #2a2a2a !important;
            border-radius: 8px !important;
            padding: 12px !important;
            margin-bottom: 15px !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
        }
        
        .maps-editor-section.banned {
            background-color: rgba(80, 0, 0, 0.2) !important;
            border-left: 3px solid rgba(255, 80, 80, 0.7) !important;
        }
        
        .maps-editor-header {
            color: #fff !important;
            font-size: 16px !important;
            font-weight: bold !important;
            margin: 0 0 12px 0 !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid #444 !important;
        }
        
        .maps-editor-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
        }
        
        .maps-editor-item {
            display: grid !important;
            grid-template-columns: 80px 1fr 1fr auto !important;
            align-items: center !important;
            gap: 10px !important;
            padding: 10px !important;
            background-color: #333 !important;
            border-radius: 6px !important;
            transition: all 0.2s ease !important;
        }
        
        @media (max-width: 992px) {
            .maps-editor-item {
                grid-template-columns: 60px 1fr 1fr auto !important;
                gap: 8px !important;
            }
        }
        
        @media (max-width: 768px) {
            .maps-editor-item {
                grid-template-columns: 60px 1fr 1fr !important;
            }
            
            .maps-editor-score-btn {
                grid-column: 1 / -1 !important;
                margin-top: 8px !important;
            }
        }
        
        @media (max-width: 576px) {
            .maps-editor-item {
                grid-template-columns: 1fr !important;
                gap: 8px !important;
            }
            
            .maps-editor-number {
                text-align: left !important;
                margin-bottom: 5px !important;
            }
        }
        
        .maps-editor-item:hover {
            background-color: #3a3a3a !important;
        }
        
        .maps-editor-ban-item {
            background-color: #382a2a !important;
        }
        
        .maps-editor-ban-item:hover {
            background-color: #403030 !important;
        }
    `;
  mapsContainer.appendChild(styleElement);

  // Создаем контейнер для редактора карт
  const mapsEditor = document.createElement("div");
  mapsEditor.id = "maps-editor-unique-id";
  mapsContainer.appendChild(mapsEditor);

  // Создаем контейнер для содержимого
  const mapsContent = document.createElement("div");
  mapsContent.id = "maps-content-unique-id";
  mapsEditor.appendChild(mapsContent);

  // Создаем секцию для пикнутых карт
  if (pickedMapCount > 0) {
    const pickedSection = document.createElement("div");
    pickedSection.className = "maps-editor-section";
    pickedSection.innerHTML = `<div class="maps-editor-header" data-i18n="pickedMapsHeader">Пикнутые карты (будут играться)</div>`;
    mapsContent.appendChild(pickedSection);

    // Создаем грид для карт
    const pickedGrid = document.createElement("div");
    pickedGrid.className = "maps-editor-grid";
    pickedSection.appendChild(pickedGrid);

    // Добавляем элементы для пикнутых карт
    for (let i = 0; i < pickedMapCount; i++) {
      const mapItem = document.createElement("div");
      mapItem.className = "maps-editor-item";
      mapItem.dataset.mapType = "pick";

      // Получаем сохраненные данные для этой карты, если они есть
      const savedMapData = currentPickedMaps[i] || {};

      // Создаем содержимое для элемента карты
      mapItem.innerHTML = `
                <div class="maps-editor-number">${i18n(
                  "mapNumberLabel"
                ).replace("{0}", i + 1)}</div>
                <select class="map-select">
                    <option value="" data-i18n="selectMap">Выберите карту</option>
                    <option value="de_dust2">Dust II</option>
                    <option value="de_mirage">Mirage</option>
                    <option value="de_inferno">Inferno</option>
                    <option value="de_nuke">Nuke</option>
                    <option value="de_overpass">Overpass</option>
                    <option value="de_ancient">Ancient</option>
                    <option value="de_anubis">Anubis</option>
                    <option value="de_vertigo">Vertigo</option>
                    <option value="de_train">Train</option>
                    <option value="de_cobblestone">Cobblestone</option>
                    <option value="de_cache">Cache</option>
                </select>
                <select class="pick-team-select">
                    <option value="" data-i18n="selectTeam">Выберите команду</option>
                    <option value="team1">${team1Name}</option>
                    <option value="team2">${team2Name}</option>
                    <option value="DECIDER">DECIDER</option>
                </select>
                <button class="maps-editor-score-btn" data-i18n="editScoreButton">Редактировать счет</button>
            `;

      // Устанавливаем сохраненные значения, если они есть
      if (savedMapData.mapId) {
        const mapSelect = mapItem.querySelector(".map-select");
        mapSelect.value = savedMapData.mapId;
      }

      if (savedMapData.pickTeam) {
        const pickTeamSelect = mapItem.querySelector(".pick-team-select");
        pickTeamSelect.value = savedMapData.pickTeam;
      }

      pickedGrid.appendChild(mapItem);
    }
  }

  // Создаем секцию для забаненных карт
  if (bannedMapCount > 0) {
    const bannedSection = document.createElement("div");
    bannedSection.className = "maps-editor-section banned";
    bannedSection.innerHTML = `<div class="maps-editor-header" data-i18n="bannedMapsHeader">Забаненные карты (не будут играться)</div>`;
    mapsContent.appendChild(bannedSection);

    // Создаем грид для карт
    const bannedGrid = document.createElement("div");
    bannedGrid.className = "maps-editor-grid";
    bannedSection.appendChild(bannedGrid);

    // Добавляем элементы для забаненных карт
    for (let i = 0; i < bannedMapCount; i++) {
      const mapItem = document.createElement("div");
      mapItem.className = "maps-editor-item maps-editor-ban-item";
      mapItem.dataset.mapType = "ban";

      // Получаем сохраненные данные для этой карты, если они есть
      const savedMapData = currentBannedMaps[i] || {};

      // Создаем содержимое для элемента карты
      mapItem.innerHTML = `
                <div class="maps-editor-number">${i18n(
                  "banNumberLabel"
                ).replace("{0}", i + 1)}</div>
                <select class="map-select">
                    <option value="" data-i18n="selectMap">Выберите карту</option>
                    <option value="de_dust2">Dust II</option>
                    <option value="de_mirage">Mirage</option>
                    <option value="de_inferno">Inferno</option>
                    <option value="de_nuke">Nuke</option>
                    <option value="de_overpass">Overpass</option>
                    <option value="de_ancient">Ancient</option>
                    <option value="de_anubis">Anubis</option>
                    <option value="de_vertigo">Vertigo</option>
                    <option value="de_train">Train</option>
                    <option value="de_cobblestone">Cobblestone</option>
                    <option value="de_cache">Cache</option>
                </select>
                <select class="pick-team-select">
                    <option value="" data-i18n="selectTeam">Выберите команду</option>
                    <option value="team1">${team1Name}</option>
                    <option value="team2">${team2Name}</option>
                </select>
                <div></div>
            `;

      // Устанавливаем сохраненные значения, если они есть
      if (savedMapData.mapId) {
        const mapSelect = mapItem.querySelector(".map-select");
        mapSelect.value = savedMapData.mapId;
      }

      if (savedMapData.pickTeam) {
        const pickTeamSelect = mapItem.querySelector(".pick-team-select");
        pickTeamSelect.value = savedMapData.pickTeam;
      }

      bannedGrid.appendChild(mapItem);
    }
  }

  // Добавляем обработчики событий для кнопок редактирования счета
  mapsContainer
    .querySelectorAll(".maps-editor-score-btn")
    .forEach((button, index) => {
      button.addEventListener("click", function (event) {
        // Предотвращаем всплытие события, чтобы не срабатывали другие обработчики
        event.stopPropagation();
        event.preventDefault();

        // Получаем информацию о карте
        const mapItem = this.closest(".maps-editor-item");
        const mapSelect = mapItem.querySelector(".map-select");
        const mapId = mapSelect.value;
        const mapName = mapSelect.options[mapSelect.selectedIndex].text;

        // Вызываем функцию открытия модального окна редактирования счета
        openScoreEditModal(matchId, index, mapName);
      });
    });

  // Добавляем кнопку для сохранения изменений
  const saveButton = document.createElement("button");
  saveButton.className = "save-maps-btn";
  saveButton.textContent = i18n("saveChanges");
  saveButton.style.cssText = `
        display: block;
        width: 100%;
        padding: 12px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 20px;
        transition: background-color 0.2s;
    `;
  saveButton.addEventListener("mouseover", () => {
    saveButton.style.backgroundColor = "#45a049";
  });
  saveButton.addEventListener("mouseout", () => {
    saveButton.style.backgroundColor = "#4CAF50";
  });
  saveButton.addEventListener("click", () => {
    saveMatch(matchId);
  });
  mapsContainer.appendChild(saveButton);

  // Обновляем названия команд в селекторах
  updateTeamNamesInSelects(team1Name, team2Name);
}

// Улучшаем функцию загрузки команд
async function loadTeamsForSelect(selectElement, selectedValue = "") {
  try {
    console.log(`Загрузка команд для селекта ${selectElement.id || "без ID"}`);

    const response = await fetch("/api/teams");

    if (!response.ok) {
      throw new Error(`HTTP ошибка: ${response.status}`);
    }

    const teams = await response.json();
    console.log(`Загружено ${teams.length} команд`);

    // Сохраняем текущее выбранное значение
    const currentValue = selectedValue || selectElement.value;

    // Очищаем список и добавляем первый пустой option
    selectElement.innerHTML =
      '<option value="" data-i18n="selectTeam">Выберите команду</option>';

    // Добавляем команды в список
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.name;

      // Если это была выбранная команда, отмечаем её
      if (currentValue && currentValue.toString() === team.id.toString()) {
        option.selected = true;
      }

      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Ошибка при загрузке списка команд:", error);
    // Устанавливаем сообщение об ошибке, но сохраняем первый option
    selectElement.innerHTML =
      '<option value="" data-i18n="errorLoadingTeams">Ошибка загрузки команд</option>';
  }
}
// Отдельная функция для инициализации всех селектов команд на странице
function initializeAllTeamSelects() {
  console.log("Инициализация всех селектов команд");

  // Находим все селекты команд на странице
  const teamSelects = [
    document.getElementById("team1Select"),
    document.getElementById("team2Select"),
    document.getElementById("editTeam1"),
    document.getElementById("editTeam2"),
    // Добавьте здесь другие селекты, если они есть
  ].filter((select) => select !== null);

  console.log(`Найдено ${teamSelects.length} селектов команд`);

  // Загружаем команды для каждого селекта
  teamSelects.forEach((select) => {
    loadTeamsForSelect(select);

    // Добавляем обработчик события для обновления при фокусе
    select.addEventListener("focus", () => {
      loadTeamsForSelect(select, select.value);
    });
  });
}

// Обновляем обработчик DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded событие - инициализация страницы");

  // Инициализируем селекты команд сразу
  initializeAllTeamSelects();

  // Инициализация для модальных окон создания и редактирования матча
  const createMatchBtn = document.getElementById("openCreateMatch");
  if (createMatchBtn) {
    createMatchBtn.addEventListener("click", () => {
      console.log("Открытие модального окна создания матча");
      // Принудительно обновляем селекты при открытии модального окна
      const team1Select = document.getElementById("team1Select");
      const team2Select = document.getElementById("team2Select");

      if (team1Select) loadTeamsForSelect(team1Select);
      if (team2Select) loadTeamsForSelect(team2Select);
    });
  }

  // Проверяем и инициализируем модальное окно создания матча
  const createMatchForm = document.getElementById("createMatchForm");
  if (createMatchForm) {
    console.log("Инициализация формы создания матча");

    // Явно инициализируем селекты для создания матча
    const team1Select = document.getElementById("team1Select");
    const team2Select = document.getElementById("team2Select");

    if (team1Select) loadTeamsForSelect(team1Select);
    if (team2Select) loadTeamsForSelect(team2Select);

    // Обработчик отправки формы создания матча
    createMatchForm.onsubmit = async (e) => {
      e.preventDefault();

      try {
        const team1Id = document.getElementById("team1Select")?.value;
        const team2Id = document.getElementById("team2Select")?.value;

        if (!team1Id || !team2Id) {
          alert("Пожалуйста, выберите обе команды");
          return;
        }

        if (team1Id === team2Id) {
          alert("Нельзя выбрать одну и ту же команду");
          return;
        }

        const response = await fetch("/api/matches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            team1_id: team1Id,
            team2_id: team2Id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Ошибка при создании матча");
        }

        // Безопасно получаем и проверяем модальное окно
        const modal = document.getElementById("createMatchModal");
        if (modal) {
          modal.style.display = "none";
        }

        // Обновляем список матчей
        await loadMatchesList();

        // Очищаем форму
        createMatchForm.reset();
        alert("Match successfully created");
      } catch (error) {
        console.error("Error:", error);
        alert("Error creating match: " + error.message);
      }
    };
  }
});

// Обновляем функцию форматирования путей к логотипам
function formatLogoPath(logo) {
  if (!logo) return "/images/default-team-logo.png";
  if (logo.startsWith("http") || logo.startsWith("/uploads/")) return logo;
  return `/uploads/${logo}`;
}

// Обновленная функция получения логотипа, которая поддерживает все возможные источники логотипов
function getTeamLogo(match, teamNumber) {
  // Проверяем прямое поле logo
  const logoField = teamNumber === 1 ? match.team1_logo : match.team2_logo;
  if (logoField) {
    return formatLogoPath(logoField);
  }

  // Проверяем наличие объекта teams
  if (match.teams) {
    const teamKey = teamNumber === 1 ? "team1" : "team2";
    if (match.teams[teamKey] && match.teams[teamKey].logo) {
      return formatLogoPath(match.teams[teamKey].logo);
    }
  }

  // Возвращаем логотип по умолчанию, если ничего не найдено
  return "/images/default-team-logo.png";
}

// Функция для отправки логотипов команд в GSI
// Заметка: функция sendTeamLogosToGSI перемещена вниз файла и расширена

// Функция для обновления логотипов в HUD
function updateHUDLogos(team1Logo, team2Logo) {
  // Логирование для отладки
  console.log("Updating HUD logos:", {
    team1Logo,
    team2Logo,
  });

  // Находим элементы логотипов в верхней панели
  const leftTeamLogoElement =
    document.querySelector(".team-left .team-logo") ||
    document.querySelector(".team-ct .team-logo");
  const rightTeamLogoElement =
    document.querySelector(".team-right .team-logo") ||
    document.querySelector(".team-t .team-logo");

  // Обновляем логотипы, если нашли элементы
  if (leftTeamLogoElement) {
    leftTeamLogoElement.src = team1Logo;
    leftTeamLogoElement.onerror = function () {
      console.log("Error loading team1 logo:", this.src);
      this.src = "/images/default-team-logo.png";
    };
  }

  if (rightTeamLogoElement) {
    rightTeamLogoElement.src = team2Logo;
    rightTeamLogoElement.onerror = function () {
      console.log("Error loading team2 logo:", this.src);
      this.src = "/images/default-team-logo.png";
    };
  }
}

// Модифицируем обработчик GSI данных для правильной передачи логотипов команд
window.gsiManager.subscribe(function (event) {
  if (event.type !== "update") return;

  // Получаем данные из события
  const data = event.data;

  // Обрабатываем данные текущего матча
  if (data.matchupis && data.map) {
    // Получаем данные команд
    const ctTeam = data.map.team_ct || {};
    const tTeam = data.map.team_t || {};

    // Получаем данные о матче
    const currentMatch = data.all_matches
      ? data.all_matches.find((m) => m.status === "active")
      : null;

    // Если есть данные о матче, добавляем логотипы команд
    if (currentMatch) {
      // Получаем логотипы с использованием новой функции
      const team1Logo = getTeamLogo(currentMatch, 1);
      const team2Logo = getTeamLogo(currentMatch, 2);

      console.log("Team logos for HUD:", {
        team1: team1Logo,
        team2: team2Logo,
        match: currentMatch,
      });

      // Получаем имена и короткие имена команд
      const team1Name = currentMatch.team1_name || "";
      const team2Name = currentMatch.team2_name || "";
      const team1ShortName = currentMatch.team1_short_name || "";
      const team2ShortName = currentMatch.team2_short_name || "";

      // Отправляем логотипы в HUD
      updateHUDLogos(team1Logo, team2Logo);

      // Отправляем данные команд в GSI
      sendTeamLogosToGSI(
        team1Logo,
        team2Logo,
        team1Name,
        team1ShortName,
        team2Name,
        team2ShortName
      );
    }
  }
});
// Пример кода обработчика формы на клиенте
document.addEventListener("DOMContentLoaded", function () {
  const createMatchForm = document.getElementById("createMatchForm");
  if (createMatchForm) {
    createMatchForm.onsubmit = async function (e) {
      e.preventDefault();

      const team1Id = document.getElementById("team1Select")?.value;
      const team2Id = document.getElementById("team2Select")?.value;

      // По умолчанию используем формат bo1
      const format = "bo1";

      // Проверка наличия выбранных команд
      if (!team1Id || !team2Id) {
        alert("Please select both teams");
        return;
      }

      try {
        const response = await fetch("/api/matches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            team1_id: team1Id,
            team2_id: team2Id,
            format: format,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ошибка при создании матча");
        }

        const data = await response.json();
        // Обработка успешного ответа
        alert("Матч успешно создан!");

        // Закрываем модальное окно (если оно есть)
        const modal = document.getElementById("createMatchModal");
        if (modal) {
          modal.style.display = "none";
        }

        // Обновляем список матчей на текущей странице
        await loadMatchesList();

        // Очищаем форму создания матча
        createMatchForm.reset();
      } catch (error) {
        console.error("Ошибка:", error);
        alert(`Ошибка: ${error.message}`);
      }
    };
  }
});
// Функция для открытия модального окна редактирования счета
function openScoreEditModal(matchId, mapIndex, mapName) {
  // Получаем данные о матче и его картах
  fetch(`/api/matches/${matchId}`)
    .then((response) => {
      if (!response.ok) throw new Error("Ошибка при загрузке данных матча");
      return response.json();
    })
    .then((matchData) => {
      console.log("Данные матча:", matchData);

      // Получаем данные о матче и картах
      const match = matchData;
      const maps = matchData.maps || [];

      const team1Name = match.team1_name || "Команда 1";
      const team2Name = match.team2_name || "Команда 2";

      // Получаем данные о текущей карте
      const currentMap = maps[mapIndex] || {};
      const team1Score = currentMap.score_team1 || 0;
      const team2Score = currentMap.score_team2 || 0;

      // Определяем текущего победителя
      let currentWinner = "";
      if (currentMap.winner_team === team1Name) {
        currentWinner = "team1";
      } else if (currentMap.winner_team === team2Name) {
        currentWinner = "team2";
      }

      // Проверяем, существует ли уже модальное окно
      let scoreModal = document.getElementById("scoreEditModal");

      // Если модального окна нет, создаем его
      if (!scoreModal) {
        scoreModal = document.createElement("div");
        scoreModal.id = "scoreEditModal";
        scoreModal.className = "modal";

        // Создаем содержимое модального окна
        scoreModal.innerHTML = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2 data-i18n="editScore3">Редактирование счета</h2>
                        <div id="scoreEditContent"></div>
                    </div>
                `;

        // Добавляем модальное окно в DOM
        document.body.appendChild(scoreModal);

        // Добавляем обработчик для закрытия модального окна
        const closeBtn = scoreModal.querySelector(".close");
        closeBtn.onclick = () => {
          scoreModal.style.display = "none";
        };

        // Закрытие по клику вне модального окна
        window.addEventListener("click", (e) => {
          if (e.target === scoreModal) {
            scoreModal.style.display = "none";
          }
        });
      }

      // Получаем содержимое модального окна
      const scoreEditContent = document.getElementById("scoreEditContent");

      // Заполняем содержимое модального окна
      scoreEditContent.innerHTML = `
                <form id="scoreEditForm" data-match-id="${matchId}" data-map-index="${mapIndex}">
                    <div class="map-info">
                        <h3 data-i18n="mapName">${mapName}</h3>
                        <p data-i18n="mapStatus">Статус: ${
                          currentMap.status || "pending"
                        }</p>
                    </div>
                    <div class="score-edit-container">
                        <div class="team-score-edit">
                            <input type="number" id="team1Score" name="team1Score" min="0" max="99" value="${team1Score}">
                        </div>
                        <div class="team-score-edit">
                            <input type="number" id="team2Score" name="team2Score" min="0" max="99" value="${team2Score}">
                        </div>
                    </div>
                    <div class="winner-select-container">
                        <label for="winnerSelect" data-i18n="winnerSelect">Победитель карты:</label>
                        <select id="winnerSelect" name="winnerSelect">
                            <option data-i18n="winnerSelect" value="">Не выбрано</option>
                            <option value="team1" ${
                              currentWinner === "team1" ? "selected" : ""
                            }>${team1Name}</option>
                            <option value="team2" ${
                              currentWinner === "team2" ? "selected" : ""
                            }>${team2Name}</option>
                        </select>
                    </div>
                    <button type="submit" data-i18n="saveScore">Сохранить счет</button>
                </form>
            `;

      // Добавляем обработчик отправки формы
      const scoreEditForm = document.getElementById("scoreEditForm");
      scoreEditForm.onsubmit = async (e) => {
        e.preventDefault();

        const matchId = scoreEditForm.dataset.matchId;
        const mapIndex = scoreEditForm.dataset.mapIndex;
        const team1Score = document.getElementById("team1Score").value;
        const team2Score = document.getElementById("team2Score").value;
        const winner = document.getElementById("winnerSelect").value;

        try {
          // Отправляем данные на сервер
          const response = await fetch(`/api/matches/${matchId}/map-score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mapIndex: parseInt(mapIndex),
              team1Score: parseInt(team1Score),
              team2Score: parseInt(team2Score),
              winner: winner,
              team1Name: team1Name,
              team2Name: team2Name,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Ошибка при обновлении счета");
          }

          const result = await response.json();

          if (result.success) {
            // Закрываем модальное окно
            scoreModal.style.display = "none";

            // Показываем сообщение об успешном обновлении
            alert("Счет успешно обновлен!");

            // Обновляем список матчей
            await loadMatchesList();
          } else {
            throw new Error(
              result.message || "Неизвестная ошибка при обновлении счета"
            );
          }
        } catch (error) {
          console.error("Ошибка при сохранении счета:", error);
          alert("Ошибка при сохранении счета: " + error.message);
        }
      };

      // Показываем модальное окно
      scoreModal.style.display = "block";
    })
    .catch((error) => {
      console.error("Ошибка при загрузке данных матча:", error);
      alert("Ошибка при загрузке данных матча: " + error.message);
    });
}

// Функция для обновления всех селекторов команд на странице
async function updateAllTeamSelects() {
  try {
    console.log("Обновление всех селекторов команд");

    // Получаем данные о командах
    const response = await fetch("/api/teams");
    const teams = await response.json();

    // Находим все селекторы команд на странице
    const teamSelects = document.querySelectorAll(
      'select#team1Select, select#team2Select, select#editTeam1, select#editTeam2, select[name="teamId"]'
    );

    teamSelects.forEach((select) => {
      if (!select) return;

      // Сохраняем текущее выбранное значение
      const currentValue = select.value;

      // Очищаем список и добавляем первый пустой option
      select.innerHTML =
        '<option value="" data-i18n="selectTeam">Выберите команду</option>';

      // Добавляем команды в список
      teams.forEach((team) => {
        const option = document.createElement("option");
        option.value = team.id;
        option.textContent = team.name;

        // Если это была выбранная команда, отмечаем её
        if (currentValue && currentValue.toString() === team.id.toString()) {
          option.selected = true;
        }

        select.appendChild(option);
      });
    });

    console.log(`Обновлено ${teamSelects.length} селекторов команд`);
  } catch (error) {
    console.error("Ошибка при обновлении селекторов команд:", error);
  }
}
// Инициализация формы импорта LHM
function initImportLHMForm() {
  const importForm = document.getElementById("import-lhm-form");
  const importTeamSelect = document.getElementById("import-team-select");

  if (importForm) {
    // Загружаем команды в выпадающий список
    loadTeamsForSelect(importTeamSelect);

    // Обработчик отправки формы
    importForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const teamId = importTeamSelect.value;

      if (!teamId) {
        alert("Пожалуйста, выберите команду для импорта");
        return;
      }

      const fileInput = document.getElementById("lhm-file");
      if (!fileInput.files[0]) {
        alert("Пожалуйста, выберите XLSX файл");
        return;
      }

      // Создаем FormData вручную
      const formData = new FormData();
      formData.append("lhmFile", fileInput.files[0]);
      formData.append("importTeamId", teamId);

      // Добавляем логирование
      console.log(
        "Отправка файла:",
        fileInput.files[0].name,
        "размер:",
        fileInput.files[0].size
      );
      console.log("Команда ID:", teamId);

      // Используем XMLHttpRequest вместо fetch
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/players/import-lhm", true);

      // Добавляем индикатор загрузки
      const loadingIndicator = document.createElement("div");
      loadingIndicator.textContent = "Загрузка...";
      loadingIndicator.style.marginTop = "10px";
      importForm.appendChild(loadingIndicator);

      // Обработка прогресса загрузки
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          loadingIndicator.textContent = `Загрузка: ${Math.round(
            percentComplete
          )}%`;
        }
      };

      // Обработка завершения запроса
      xhr.onload = function () {
        // Удаляем индикатор загрузки
        importForm.removeChild(loadingIndicator);

        console.log("Статус ответа:", xhr.status);
        console.log("Текст ответа:", xhr.responseText);

        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.success) {
              alert(
                `Импорт завершен! Импортировано: ${result.importedCount}, Пропущено: ${result.skippedCount}`
              );
              // Обновляем список игроков после импорта
              loadPlayers();
            } else {
              alert(`Ошибка при импорте: ${result.error}`);
            }
          } catch (error) {
            console.error("Ошибка при разборе ответа:", error);
            alert("Ошибка при обработке ответа сервера");
          }
        } else {
          console.error("Ошибка при импорте:", xhr.statusText);
          alert("Произошла ошибка при импорте игроков");
        }
      };

      // Обработка ошибок сети
      xhr.onerror = function () {
        // Удаляем индикатор загрузки
        importForm.removeChild(loadingIndicator);
        console.error("Сетевая ошибка при импорте");
        alert("Сетевая ошибка при импорте игроков");
      };

      // Отправляем запрос
      xhr.send(formData);
    });
  }
}

// Только один раз инициализируем форму при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  // Инициализируем форму импорта LHM
  initImportLHMForm();
});

// ... existing code ...

// Функция для инициализации обработчика загрузки файла
function initFileInputs() {
  const teamLogoInput = document.getElementById("team-logo");
  const fileNameDisplay = document.getElementById("file-name-display");
  const logoInputContainer = document.getElementById("logo-input-container");

  if (teamLogoInput && fileNameDisplay) {
    teamLogoInput.addEventListener("change", function () {
      if (this.files && this.files.length > 0) {
        const fileName = this.files[0].name;
        fileNameDisplay.textContent = fileName;
        logoInputContainer.classList.add("has-file");
      } else {
        fileNameDisplay.textContent = "";
        logoInputContainer.classList.remove("has-file");
      }
    });
  }
}

// Вызываем инициализацию при загрузке страницы и при переключении вкладок
document.addEventListener("DOMContentLoaded", function () {
  // Другие обработчики, которые могут быть в этом блоке

  initFileInputs();

  // Обработчик переключения вкладок для инициализации выбора файла на нужной вкладке
  const navButtons = document.querySelectorAll(".nav-button");
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      setTimeout(initFileInputs, 100); // Небольшая задержка для уверенности что DOM обновлен
    });
  });
});

// ... existing code ...

// Функция для обработки отображения флагов регионов
function initRegionFlags() {
  console.log("Вызвана initRegionFlags()");

  // Обработка отображения флагов в карточках команд
  const teamRegions = document.querySelectorAll(".team-region");
  console.log("Найдено элементов .team-region:", teamRegions.length);

  teamRegions.forEach((region) => {
    // Проверяем, не содержит ли уже регион HTML-структуру с флагом
    if (region.querySelector(".team-region-with-flag")) {
      console.log(
        "Пропускаем регион с уже добавленным флагом:",
        region.innerHTML
      );
      return; // Уже обработано
    }

    // Если регион содержит div или другие элементы, пропускаем его
    if (region.children.length > 0) {
      console.log(
        "Пропускаем регион с структурированным HTML:",
        region.innerHTML
      );
      return;
    }

    // Получаем ID команды для отладки
    const teamCard = region.closest(".team-card");
    //const teamId = teamCard
    //? teamCard.getAttribute("data-team-id")
    //: "неизвестно";
    //console.log(
    //`Обрабатываем регион для команды ID ${teamId}:`,
    //region.innerHTML
    //);

    const regionText = region.textContent.trim();
    let flagEmoji = "🌎"; // Флаг по умолчанию

    // Проверка на "Регион не указан"
    if (regionText.includes("не указан")) {
      // Создаем обертку с флагом
      const wrapper = document.createElement("div");
      wrapper.className = "team-region-with-flag";

      const flagSpan = document.createElement("span");
      flagSpan.className = "region-flag";
      flagSpan.textContent = "❓";

      // Перемещаем текст в новый span
      const textSpan = document.createElement("span");
      textSpan.textContent = regionText;

      // Собираем DOM
      wrapper.appendChild(flagSpan);
      wrapper.appendChild(textSpan);

      // Заменяем содержимое
      region.textContent = "";
      region.appendChild(wrapper);
      return;
    }

    // Определение флага по названию региона
    if (regionText.includes("Россия")) flagEmoji = "🇷🇺";
    else if (regionText.includes("Украина")) flagEmoji = "🇺🇦";
    else if (regionText.includes("Беларусь")) flagEmoji = "🇧🇾";
    else if (regionText.includes("Казахстан")) flagEmoji = "🇰🇿";
    else if (regionText.includes("Европа")) flagEmoji = "🇪🇺";
    else if (regionText.includes("США")) flagEmoji = "🇺🇸";
    else if (regionText.includes("Канада")) flagEmoji = "🇨🇦";
    else if (regionText.includes("Китай")) flagEmoji = "🇨🇳";
    else if (regionText.includes("Бразилия")) flagEmoji = "🇧🇷";

    // Если регион не пустой, добавляем флаг
    if (regionText) {
      // Создаем обертку с флагом
      const wrapper = document.createElement("div");
      wrapper.className = "team-region-with-flag";

      const flagSpan = document.createElement("span");
      flagSpan.className = "region-flag";
      flagSpan.textContent = flagEmoji;

      // Перемещаем текст в новый span
      const textSpan = document.createElement("span");
      textSpan.textContent = regionText;

      // Собираем DOM
      wrapper.appendChild(flagSpan);
      wrapper.appendChild(textSpan);

      // Заменяем содержимое
      region.textContent = "";
      region.appendChild(wrapper);
    }
  });

  // Обработка селекта регионов при создании/редактировании команды
  const regionSelect = document.getElementById("team-region");
  if (regionSelect) {
    // При изменении региона сохраняем полное название с флагом
    regionSelect.addEventListener("change", function () {
      const selectedOption = this.options[this.selectedIndex];
      const flag = selectedOption.getAttribute("data-flag");
      const regionName = selectedOption.textContent.replace(flag, "").trim();

      // Сохраняем полное название региона для отображения
      this.setAttribute("data-region-display", flag + " " + regionName);
    });
  }
}

// Вызываем инициализацию флагов регионов после загрузки данных
document.addEventListener("DOMContentLoaded", function () {
  // Другие обработчики, которые могут быть в этом блоке

  // Инициализация флагов
  initRegionFlags();

  // Обработчик переключения вкладок
  const navButtons = document.querySelectorAll(".nav-button");
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Небольшая задержка для обновления DOM
      setTimeout(initRegionFlags, 300);
    });
  });
});

// Модифицируем функцию loadTeams для правильного отображения регионов с флагами
async function loadTeams() {
  try {
    const response = await fetch("/api/teams");
    const teams = await response.json();

    const teamsList = document.getElementById("teams-list");
    if (teamsList) {
      teamsList.innerHTML = `
                <div class="search-bar">
                    <input data-i18n="teamSearchPlaceholder" type="text" id="teamSearch" placeholder="Поиск по названию или региону" class="search-input">
                </div>
                <div class="teams-grid">
                    ${teams
                      .map((team) => {
                        // Проверяем, начинается ли путь уже с /uploads/
                        const logoPath = team.logo
                          ? team.logo.startsWith("/uploads/")
                            ? team.logo
                            : `/uploads/${team.logo}`
                          : "/images/default-team-logo.png";

                        // Получаем информацию о регионе через единую функцию
                        const regionInfo = getRegionInfo(team.region);
                        const regionName = regionInfo.name;
                        const regionFlag = regionInfo.flag;

                        // Форматируем регион с флагом
                        const regionDisplay = `<div class="team-region-with-flag"><span class="region-flag">${regionFlag}</span><span>${regionName}</span></div>`;

                        return `
                            <div class="team-card" data-team-id="${team.id}">
                                <div class="team-info">
                                    <img src="${logoPath}" 
                                         class="team-logo" 
                                         alt="${team.name}"
                                         onerror="this.onerror=null; this.src='/images/default-team-logo.png';">
                                    <div class="team-details">
                                        <h3 class="team-name">${team.name}</h3>
                                    </div>
                                </div>
                                <div class="team-actions">
                                    <button class="edit-team-btn" onclick="editTeam(${team.id})" title="Редактировать"><i class="fas fa-edit"></i></button>
                                    <button class="delete-team-btn" onclick="deleteTeam(${team.id})" title="Удалить"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
            `;

      initializeTeamSearch();

      // Временно отключаем дополнительную инициализацию флагов
      // setTimeout(initRegionFlags, 100);
    }
  } catch (error) {
    console.error("Ошибка при загрузке команд:", error);
  }
}

// ... existing code ...

// Функция для преобразования кода региона в его локализованное название и флаг
function getRegionInfo(regionCode) {
  // Если регион не указан, возвращаем соответствующие значения
  if (!regionCode) {
    return {
      name: "Регион не указан",
      flag: "❓",
    };
  }

  // Таблица соответствия кодов регионов и их названий/флагов
  const regionMap = {
    russia: { name: "Россия", flag: "🇷🇺" },
    ukraine: { name: "Украина", flag: "🇺🇦" },
    belarus: { name: "Беларусь", flag: "🇧🇾" },
    kazakhstan: { name: "Казахстан", flag: "🇰🇿" },
    europe: { name: "Европа", flag: "🇪🇺" },
    usa: { name: "США", flag: "🇺🇸" },
    canada: { name: "Канада", flag: "🇨🇦" },
    china: { name: "Китай", flag: "🇨🇳" },
    brazil: { name: "Бразилия", flag: "🇧🇷" },
    other: { name: "Другой регион", flag: "🌎" },
  };

  // Если регион есть в списке, возвращаем его данные, иначе - сам регион и глобус
  return regionMap[regionCode] || { name: regionCode, flag: "🌎" };
}
// Функция для отправки данных команд в GSI
function sendTeamLogosToGSI(
  team1Logo,
  team2Logo,
  team1Name,
  team1ShortName,
  team2Name,
  team2ShortName
) {
  if (window.gsiManager) {
    // Исправляем путь к логотипам, добавляя полный URL сервера
    const baseUrl = window.location.origin;

    // Преобразуем относительные пути в абсолютные
    const fixLogoPath = (logo) => {
      if (!logo) return `${baseUrl}/images/default-team-logo.png`;
      if (logo.startsWith("http")) return logo; // Уже абсолютный URL
      if (logo.startsWith("/")) return `${baseUrl}${logo}`; // Абсолютный от корня
      // Иначе это имя файла из uploads
      return `${baseUrl}/uploads/${logo}`;
    };

    // Используем sendToHUD вместо send
    window.gsiManager.sendToHUD({
      type: "team_logos",
      data: {
        team1_logo: fixLogoPath(team1Logo),
        team2_logo: fixLogoPath(team2Logo),
        team1_name: team1Name || "",
        team1_short_name: team1ShortName || "",
        team2_name: team2Name || "",
        team2_short_name: team2ShortName || "",
      },
    });
  }
}

// Функция для добавления атрибута локализации к первым опциям селекторов
function fixSelectOptions() {
  // Находим все select элементы
  const selects = document.querySelectorAll("select");

  selects.forEach((select) => {
    // Проверяем, есть ли у селекта опции
    if (select.options.length > 0) {
      // Для первой опции (обычно это "Выберите команду") добавляем атрибут data-i18n
      const firstOption = select.options[0];
      if (firstOption.value === "" && !firstOption.hasAttribute("data-i18n")) {
        firstOption.setAttribute("data-i18n", "selectTeam");

        // Если содержимое похоже на "Выберите команду", устанавливаем этот атрибут
        if (
          firstOption.textContent.includes("Выбер") ||
          firstOption.textContent.includes("Select") ||
          firstOption.textContent.includes("选择")
        ) {
          console.log("Установлен атрибут data-i18n для", select.id);
        }
      }
    }
  });

  // Применяем переводы
  if (typeof translatePage === "function") {
    translatePage();
  }
}

// Вызываем функцию после загрузки страницы
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(fixSelectOptions, 500); // с небольшой задержкой для уверенности
});

// Устанавливаем MutationObserver для отслеживания изменений в DOM
const observer = new MutationObserver(function (mutations) {
  for (const mutation of mutations) {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      setTimeout(fixSelectOptions, 100);
      break;
    }
  }
});

// Запускаем наблюдение за изменениями в DOM
observer.observe(document.body, { childList: true, subtree: true });

function countryCodeToFlagEmoji(code) {
  if (!code) return "❓";
  // Преобразуем "RU" -> 🇷🇺
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
}

function getFlagByRegion(regionValue) {
  const select = document.getElementById("team-region");
  if (!select) return "❓";
  const option = select.querySelector('option[value="' + regionValue + '"]');
  return option ? option.getAttribute("data-flag") : "❓";
}
// Пример использования (закомментирован, т.к. вызывает ошибку):
// const flag = getFlagByRegion(team.region);
// document.querySelector('.region-flag').textContent = flag;
// ... existing code ...
// Функция для инициализации секции камер
function initializeCamerasSection() {
  console.log("Вызвана initializeCamerasSection", gsiDataBuffer);
  const list = document.getElementById("camera-players-list");
  list.innerHTML = "";

  // ОТЛАДКА
  console.log("allplayers:", gsiDataBuffer && gsiDataBuffer.allplayers);
  console.log(
    "allplayers keys:",
    gsiDataBuffer &&
      gsiDataBuffer.allplayers &&
      Object.keys(gsiDataBuffer.allplayers)
  );

  if (
    !gsiDataBuffer ||
    !gsiDataBuffer.allplayers ||
    Object.keys(gsiDataBuffer.allplayers).length === 0
  ) {
    list.innerHTML = "<p>" + i18n("waitingForServerData") + "</p>";
    return;
  }

  // Группируем игроков по командам (безопасно по регистру)
  const ctPlayers = [];
  const tPlayers = [];
  Object.entries(gsiDataBuffer.allplayers).forEach(([steamid, player]) => {
    player.steamid = steamid; // добавим steamid прямо в объект игрока
    if (player.team && player.team.toUpperCase() === "CT")
      ctPlayers.push(player);
    else if (player.team && player.team.toUpperCase() === "T")
      tPlayers.push(player);
  });

  // ОТЛАДКА
  console.log("CT:", ctPlayers);
  console.log("T:", tPlayers);

  function renderTeamBlock(teamName, players) {
    if (players.length === 0) return "";
    let html = `<h3>${teamName}</h3><div class="camera-team-list">`;
    players.forEach((player) => {
      html += `
                <div class="camera-player-row" style="margin-bottom:8px;">
                    <span class="camera-player-name" style="display:inline-block;width:120px;">${
                      player.name
                    }</span>
                    <input type="text" class="camera-link-input" 
                        data-steamid="${player.steamid}" 
                        placeholder="Ссылка/текст для камеры" style="width:220px;">
                    <button class="camera-save-btn" data-steamid="${
                      player.steamid
                    }">${i18n("save")}</button>
                </div>
            `;
    });
    html += "</div>";
    return html;
  }

  list.innerHTML =
    renderTeamBlock(i18n("teamCT"), ctPlayers) +
    renderTeamBlock(i18n("teamT"), tPlayers);

  // ОТЛАДКА
  console.log("HTML:", list.innerHTML);

  // Вешаем обработчики на кнопки "Сохранить"
  list.querySelectorAll(".camera-save-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const steamid = this.dataset.steamid;
      const input = list.querySelector(
        `.camera-link-input[data-steamid="${steamid}"]`
      );
      const link = input.value;
      try {
        // 1. Отправляем на сервер
        await fetch("/api/cameras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            steamid: steamid,
            camera_link: link,
          }),
        });

        // 2. (опционально) Можно убрать sendToHUD, если не нужно мгновенное обновление HUD
        // window.gsiManager.sendToHUD({ type: 'camera_link', steamid, link });

        input.style.background = "#cfc";
        setTimeout(() => (input.style.background = ""), 1000);
      } catch (e) {
        input.style.background = "#fcc";
        setTimeout(() => (input.style.background = ""), 1000);
        alert("Ошибка отправки: " + e.message);
      }
    });
  });

  // 1. Сохраняем значения инпутов
  const prevInputs = {};
  document.querySelectorAll(".camera-link-input").forEach((input) => {
    prevInputs[input.dataset.steamid] = input.value;
  });

  // 2. Восстанавливаем значения инпутов
  Object.keys(prevInputs).forEach((steamid) => {
    const input = list.querySelector(
      `.camera-link-input[data-steamid="${steamid}"]`
    );
    if (input) input.value = prevInputs[steamid];
  });
}
// ... existing code ...

document.getElementById("refresh-cameras-btn").addEventListener("click", () => {
  initializeCamerasSection();
});

// ... existing code ...

// Функция для форматирования пути к аватарке
function formatAvatarPath(avatar) {
  if (!avatar) return "/images/default-avatar.png";

  // Если путь уже содержит /uploads/, возвращаем как есть
  if (avatar.startsWith("/uploads/")) {
    return avatar;
  }

  // Иначе добавляем префикс /uploads/
  return `/uploads/${avatar}`;
}

// Функция для исправления путей к аватаркам на странице
function fixAvatarPaths() {
  // Ищем все изображения аватарок
  const avatarImages = document.querySelectorAll(
    ".player-avatar img, .avatar-image, .player-card img"
  );

  avatarImages.forEach((img) => {
    const src = img.getAttribute("src");
    if (
      src &&
      !src.includes("/uploads/") &&
      !src.includes("default-avatar.png")
    ) {
      // Получаем имя файла из пути
      const filename = src.split("/").pop();

      // Устанавливаем новый путь с префиксом /uploads/
      const newSrc = `/uploads/${filename}`;
      img.setAttribute("src", newSrc);
      console.log("Исправлен путь к аватарке:", newSrc);
    }
  });
}

// Модифицированная функция загрузки игроков
async function loadPlayers() {
  try {
    const response = await fetch("/api/players");
    const players = await response.json();

    const playersList = document.getElementById("players-list");
    if (!playersList) return;

    playersList.innerHTML = `
            <div class="search-bar">
                <input type="text" id="playerSearch" placeholder="${i18n(
                  "playerSearchPlaceholder"
                )}" data-i18n-placeholder="playerSearchPlaceholder" class="search-input">
            </div>
            <div class="players-grid">
                ${players
                  .map((player) => {
                    // Используем функцию форматирования пути к аватарке
                    const avatarUrl = formatAvatarPath(player.avatar);

                    return `
                        <div class="player-card" data-id="${
                          player.id
                        }" data-nickname="${player.nickname}" data-steam64="${
                      player.steam64 || ""
                    }">
                            <div class="player-info">
                                <img src="${avatarUrl}" 
                                     class="player-avatar-img" 
                                     alt="${player.nickname}"
                                     onerror="this.src='/images/default-avatar.png'">
                                <div class="player-details">
                                    <h3 class="player-name">${
                                      player.nickname
                                    }</h3>
                                    <p class="player-team"${
                                      player.teamName
                                        ? ""
                                        : ' data-i18n="noTeam"'
                                    }>${player.teamName || i18n("noTeam")}</p>
                                </div>
                            </div>
                            <div class="player-actions">
                                <button class="edit-player-btn" data-id="${
                                  player.id
                                }" title="${i18n(
                      "edit"
                    )}"><i class="fas fa-edit"></i></button>
                                <button class="delete-player-btn" data-id="${
                                  player.id
                                }" title="${i18n(
                      "delete"
                    )}"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                  })
                  .join("")}
            </div>
        `;

    // Добавляем обработчики событий для кнопок редактирования и удаления
    document.querySelectorAll(".edit-player-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const playerId = this.getAttribute("data-id");
        editPlayer(playerId);
      });
    });

    document.querySelectorAll(".delete-player-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const playerId = this.getAttribute("data-id");
        deletePlayer(playerId);
      });
    });

    // Запускаем исправление путей к аватаркам
    setTimeout(fixAvatarPaths, 100);

    // Инициализируем поиск
    initializePlayerSearch();
  } catch (error) {
    console.error(i18n("loadPlayersError") + ":", error);
  }
}

// Запускаем функцию исправления путей после загрузки страницы
document.addEventListener("DOMContentLoaded", function () {
  // Запускаем сразу после загрузки DOM
  setTimeout(fixAvatarPaths, 500);

  // Запускаем повторно через 1 секунду для динамически загруженного контента
  setTimeout(fixAvatarPaths, 1500);

  // Запускаем еще раз через 3 секунды для контента, загруженного с задержкой
  setTimeout(fixAvatarPaths, 3000);
});

// ... existing code ...

// Функция для поиска игроков
function searchPlayers(query) {
  const searchQuery = query.toLowerCase();
  const playerCards = document.querySelectorAll(".player-card");

  requestAnimationFrame(() => {
    playerCards.forEach((card) => {
      const nameElement = card.querySelector(".player-name");
      const teamElement = card.querySelector(".player-team");
      const steamId = card.getAttribute("data-steam64");

      if (!nameElement) return;

      const name = nameElement.textContent.toLowerCase();
      const team = teamElement ? teamElement.textContent.toLowerCase() : "";
      const steam = steamId ? steamId.toLowerCase() : "";

      // Показываем или скрываем карточку в зависимости от результата поиска
      card.style.display =
        name.includes(searchQuery) ||
        team.includes(searchQuery) ||
        steam.includes(searchQuery)
          ? ""
          : "none";
    });
  });
}

// Инициализация поиска игроков (аналогично инициализации поиска команд)
function initializePlayerSearch() {
  const searchInput = document.getElementById("playerSearch");
  if (!searchInput) return;

  const debouncedSearch = debounce((e) => {
    requestAnimationFrame(() => {
      searchPlayers(e.target.value);
    });
  }, 300);

  searchInput.addEventListener("input", debouncedSearch);
}

// Функция для обновления названий команд в селекторах
function updateTeamNamesInSelects(team1Name, team2Name) {
  // Обновляем все селекторы команд на странице
  document.querySelectorAll(".pick-team-select").forEach((select) => {
    const team1Option = select.querySelector('option[value="team1"]');
    const team2Option = select.querySelector('option[value="team2"]');

    if (team1Option) team1Option.textContent = team1Name || i18n("team1");
    if (team2Option) team2Option.textContent = team2Name || i18n("team2");
  });
}

// ... existing code ...
// Запуск HLAE
const launchHlaeBtn = document.getElementById("launch-hlae");
if (launchHlaeBtn) {
  launchHlaeBtn.addEventListener("click", async function () {
    try {
      const resp = await fetch("/api/launch-hlae", { method: "POST" });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        alert(i18n("hlaeStarting"));
      } else {
        alert(`${i18n("hlaeError")}: ${data.error || i18n("unknownError")}`);
      }
    } catch (e) {
      alert(i18n("hlaeRequestError"));
    }
  });
}

// Запуск CS2 HLAE с -insecure
const launchCs2HlaeInsecureBtn = document.getElementById(
  "launch-cs2-hlae-insecure"
);
if (launchCs2HlaeInsecureBtn) {
  launchCs2HlaeInsecureBtn.addEventListener("click", async function () {
    try {
      const resp = await fetch("/api/launch-cs2-hlae-insecure", {
        method: "POST",
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        // success: no UI notification
      } else {
        alert(
          `${i18n("cs2HlaeInsecureError")}: ${
            data.error || i18n("unknownError")
          }`
        );
      }
    } catch (e) {
      alert(i18n("cs2HlaeInsecureRequestError"));
    }
  });
}
// ... existing code ...
// Функция для обновления Dota 2 скорборда
function updateDota2Scoreboard(data, currentMatch) {
  const statsTable = document.querySelector(
    "#scoreboard-section .player-stats-table"
  );
  if (!statsTable) return;

  try {
    // Получаем названия команд из Dota 2 данных
    const radiantName = data.dota?.radiant_team?.name || "Radiant";
    const direName = data.dota?.dire_team?.name || "Dire";

    // Получаем логотипы команд
    const radiantLogo = data.dota?.radiant_team?.logo
      ? `/uploads/${data.dota.radiant_team.logo}`
      : "/images/default-team-logo.png";
    const direLogo = data.dota?.dire_team?.logo
      ? `/uploads/${data.dota.dire_team.logo}`
      : "/images/default-team-logo.png";

    // Получаем счет команд (если доступен)
    const radiantScore = data.dota?.radiant_team?.score || "0";
    const direScore = data.dota?.dire_team?.score || "0";

    // Собираем данные игроков
    let radiantPlayers = [];
    let direPlayers = [];

    if (data.player) {
      // Команда Radiant (team2)
      if (data.player.team2) {
        for (let i = 0; i < 5; i++) {
          const player = data.player.team2[`player${i}`];
          if (player && player.hero) {
            radiantPlayers.push({
              steamid: player.steamid || `Player ${i + 1}`,
              name: player.name || `Player ${i + 1}`,
              hero:
                player.hero.name?.replace("npc_dota_hero_", "") || "Unknown",
              kills: player.kills || 0,
              deaths: player.deaths || 0,
              assists: player.assists || 0,
              netWorth: player.net_worth || 0,
              gpm: player.gpm || 0,
              xpm: player.xpm || 0,
              lastHits: player.last_hits || 0,
              denies: player.denies || 0,
            });
          }
        }
      }

      // Команда Dire (team3)
      if (data.player.team3) {
        for (let i = 5; i < 10; i++) {
          const player = data.player.team3[`player${i}`];
          if (player && player.hero) {
            direPlayers.push({
              steamid: player.steamid || `Player ${i + 1}`,
              name: player.name || `Player ${i + 1}`,
              hero:
                player.hero.name?.replace("npc_dota_hero_", "") || "Unknown",
              kills: player.kills || 0,
              deaths: player.deaths || 0,
              assists: player.assists || 0,
              netWorth: player.net_worth || 0,
              gpm: player.gpm || 0,
              xpm: player.xpm || 0,
              lastHits: player.last_hits || 0,
              denies: player.denies || 0,
            });
          }
        }
      }
    }

    // Формируем HTML для Dota 2 скорборда
    let playerRows = "";

    // Добавляем игроков Radiant
    radiantPlayers.forEach((player) => {
      const kda =
        player.deaths > 0
          ? `${player.kills}/${player.deaths}/${player.assists}`
          : `${player.kills}/0/${player.assists}`;

      playerRows += `
        <tr class="player-row radiant">
          <td>${radiantName}</td>
          <td class="selectable" title="Выделите текст для копирования">${
            player.steamid
          }
            <span class="copy-btn" data-copy-text="${encodeURIComponent(
              String(player.steamid || "")
            )}" title="Скопировать" style="margin-left:6px;cursor:pointer;font-size:12px;line-height:1;vertical-align:middle;display:inline">📋</span>
          </td>
          <td class="selectable" title="Выделите текст для копирования">${
            player.name
          }
            <span class="copy-btn" data-copy-text="${encodeURIComponent(
              String(player.name || "")
            )}" title="Скопировать" style="margin-left:6px;cursor:pointer;font-size:12px;line-height:1;vertical-align:middle;display:inline">📋</span>
          </td>
          <td>${player.hero}</td>
          <td>${player.kills}</td>
          <td>${player.deaths}</td>
          <td>${player.assists}</td>
          <td>${kda}</td>
          <td>${player.netWorth}</td>
          <td>${player.gpm}</td>
          <td>${player.xpm}</td>
          <td>${player.lastHits}</td>
          <td>${player.denies}</td>
        </tr>
      `;
    });

    // Добавляем игроков Dire
    direPlayers.forEach((player) => {
      const kda =
        player.deaths > 0
          ? `${player.kills}/${player.deaths}/${player.assists}`
          : `${player.kills}/0/${player.assists}`;

      playerRows += `
        <tr class="player-row dire">
          <td>${direName}</td>
          <td class="selectable" title="Выделите текст для копирования">${
            player.steamid
          }
            <span class="copy-btn" data-copy-text="${encodeURIComponent(
              String(player.steamid || "")
            )}" title="Скопировать" style="margin-left:6px;cursor:pointer;font-size:12px;line-height:1;vertical-align:middle;display:inline">📋</span>
          </td>
          <td class="selectable" title="Выделите текст для копирования">${
            player.name
          }
            <span class="copy-btn" data-copy-text="${encodeURIComponent(
              String(player.name || "")
            )}" title="Скопировать" style="margin-left:6px;cursor:pointer;font-size:12px;line-height:1;vertical-align:middle;display:inline">📋</span>
          </td>
          <td>${player.hero}</td>
          <td>${player.kills}</td>
          <td>${player.deaths}</td>
          <td>${player.assists}</td>
          <td>${kda}</td>
          <td>${player.netWorth}</td>
          <td>${player.gpm}</td>
          <td>${player.xpm}</td>
          <td>${player.lastHits}</td>
          <td>${player.denies}</td>
        </tr>
      `;
    });

    // Формируем полный HTML для Dota 2 скорборда
    const newTableHTML = `
      <div class="scoreboard-header">
        <div class="team-info2">
          <img src="${radiantLogo}" alt="${radiantName}" class="team-logo2" onerror="this.src='/images/default-team-logo.png'">
          <span class="team-name">${radiantName}</span>
        </div>
        <div class="team-score radiant">
          <span class="score">${radiantScore}</span>
        </div>
        <div class="score-divider">:</div>
        <div class="team-score dire">
          <span class="score">${direScore}</span>
        </div>
        <div class="team-info2">
          <span class="team-name">${direName}</span>
          <img src="${direLogo}" alt="${direName}" class="team-logo2" onerror="this.src='/images/default-team-logo.png'">
        </div>
      </div>
      <table class="players-table">
        <thead>
          <tr>
            <th>Команда</th>
            <th>Steam64</th>
            <th>Игрок</th>
            <th>Герой</th>
            <th>Убийства</th>
            <th>Смерти</th>
            <th>Помощь</th>
            <th>K/D/A</th>
            <th>Net Worth</th>
            <th>GPM</th>
            <th>XPM</th>
            <th>Last Hits</th>
            <th>Denies</th>
          </tr>
        </thead>
        <tbody>
          ${playerRows}
        </tbody>
      </table>
    `;

    // Обновляем таблицу
    statsTable.innerHTML = newTableHTML;
    ensureScoreboardCopyListener();
  } catch (error) {
    console.error("Ошибка обновления Dota 2 скорборда:", error);
  }
}
