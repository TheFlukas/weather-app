const myIcons = {
  "clear-day":           "./icons/animated/day.svg",
  "clear-night":         "./icons/animated/night.svg",
  "partly-cloudy-day":   "./icons/animated/cloudy-day-2.svg",
  "partly-cloudy-night": "./icons/animated/cloudy-night-2.svg",
  "cloudy":              "./icons/animated/cloudy.svg",
  "rain":                "./icons/animated/rainy-4.svg",
  "sleet":               "./icons/animated/rainy-7.svg",
  "snow":                "./icons/animated/snowy-4.svg",
  "wind":                "./icons/animated/cloudy-day-3.svg",
  "fog":                 "./icons/animated/cloudy-night-1.svg",
}

/* ── Weather sounds (Web Audio API) ── */
function playWeatherSound(icon) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const duration = 2.5

  const master = ctx.createGain()
  master.gain.setValueAtTime(0, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.15)
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
  master.connect(ctx.destination)

  if (icon === "rain" || icon === "sleet") {
    // Rain: filtered white noise
    const bufSize = ctx.sampleRate * duration
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf

    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = icon === "sleet" ? 1800 : 1200
    filter.Q.value = 0.6

    noise.connect(filter)
    filter.connect(master)
    noise.start()

  } else if (icon === "wind" || icon === "cloudy" || icon === "fog") {
    // Wind: low-pass noise with slow LFO
    const bufSize = ctx.sampleRate * duration
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf

    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = icon === "wind" ? 600 : 300

    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = icon === "wind" ? 0.8 : 0.3
    lfoGain.gain.value = 150
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    noise.connect(filter)
    filter.connect(master)
    noise.start()

  } else if (icon === "snow") {
    // Snow: very soft high filtered noise + gentle chime
    const bufSize = ctx.sampleRate * duration
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf

    const filter = ctx.createBiquadFilter()
    filter.type = "highpass"
    filter.frequency.value = 3000

    const snowGain = ctx.createGain()
    snowGain.gain.value = 0.15
    noise.connect(filter)
    filter.connect(snowGain)
    snowGain.connect(master)
    noise.start()

    // Soft chime
    ;[0, 0.6, 1.2].forEach((delay, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.frequency.value = [880, 1100, 660][i]
      osc.type = "sine"
      g.gain.setValueAtTime(0, ctx.currentTime + delay)
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.05)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.8)
      osc.connect(g)
      g.connect(master)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + 0.8)
    })

  } else if (icon === "clear-day") {
    // Clear day: bright rising chime
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.frequency.value = freq
      osc.type = "sine"
      const t = ctx.currentTime + i * 0.18
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.22, t + 0.06)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
      osc.connect(g)
      g.connect(master)
      osc.start(t)
      osc.stop(t + 0.9)
    })

  } else if (icon === "clear-night") {
    // Clear night: soft descending tones
    const notes = [660, 550, 440, 330]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.frequency.value = freq
      osc.type = "sine"
      const t = ctx.currentTime + i * 0.25
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.16, t + 0.08)
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
      osc.connect(g)
      g.connect(master)
      osc.start(t)
      osc.stop(t + 1.1)
    })

  } else {
    // Default: neutral soft chime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.value = 520
    osc.type = "sine"
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
    osc.connect(g)
    g.connect(master)
    osc.start()
    osc.stop(ctx.currentTime + 1.2)
  }

  setTimeout(() => ctx.close(), (duration + 0.5) * 1000)
}

/* ── DOM refs ── */
const setupScreen = document.getElementById("setupScreen")
const appScreen   = document.getElementById("appScreen")
const inputOW     = document.getElementById("inputOW")
const inputPW     = document.getElementById("inputPW")
const setupBtn    = document.getElementById("setupBtn")
const setupError  = document.getElementById("setupError")
const resetBtn    = document.getElementById("resetKeysBtn")

const searchForm  = document.getElementById("searchForm")
const cityInput   = document.getElementById("cityInput")
const searchError = document.getElementById("searchError")
const citiesList  = document.getElementById("citiesList")
const clearBtn    = document.getElementById("clearBtn")

/* ── Keys management ── */
function getKeys() {
  return {
    ow: localStorage.getItem("owKey"),
    pw: localStorage.getItem("pwKey"),
  }
}

function showApp() {
  setupScreen.style.display = "none"
  appScreen.style.display   = "block"
}

function showSetup() {
  appScreen.style.display   = "none"
  setupScreen.style.display = "flex"
}

/* On load — check if keys already exist */
const savedKeys = getKeys()
if (savedKeys.ow && savedKeys.pw) {
  showApp()
}

setupBtn.addEventListener("click", () => {
  const ow = inputOW.value.trim()
  const pw = inputPW.value.trim()

  if (!ow && !pw) {
    setupError.textContent = "Введите оба ключа"
    return
  }
  if (!ow) {
    setupError.textContent = "Введите OpenWeather API key"
    return
  }
  if (!pw) {
    setupError.textContent = "Введите PirateWeather API key"
    return
  }

  setupError.textContent = ""
  localStorage.setItem("owKey", ow)
  localStorage.setItem("pwKey", pw)
  showApp()
  setTimeout(() => cityInput.focus(), 100)
})

resetBtn.addEventListener("click", () => {
  localStorage.removeItem("owKey")
  localStorage.removeItem("pwKey")
  citiesList.innerHTML = ""
  clearBtn.style.display = "none"
  showSetup()
})

/* ── Weather fetch ── */
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  const city = cityInput.value.trim()
  if (!city) return

  const { ow, pw } = getKeys()
  searchError.textContent = ""

  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${ow}`
    )
    const geoData = await geoRes.json()

    if (!geoData.length) {
      searchError.textContent = "Город не найден"
      return
    }

    const { lat, lon, name, country } = geoData[0]

    const weatherRes = await fetch(
      `https://api.pirateweather.net/forecast/${pw}/${lat},${lon}?units=si`
    )
    const data = await weatherRes.json()

    const temp        = Math.round(data.currently.temperature)
    const icon        = data.currently.icon
    const iconUrl     = myIcons[icon] || "./icons/animated/cloudy.svg"
    const description = data.currently.summary

    const li = document.createElement("li")
    li.classList.add("city-card")
    li.style.animationDelay = `${citiesList.children.length * 0.08}s`
    li.innerHTML = `
      <button class="city-remove" title="Удалить">✕</button>
      <h2 class="city-name">${name}<sup class="city-country">${country}</sup></h2>
      <div class="city-temp">${temp}<sup>°C</sup></div>
      <figure>
        <img class="city-icon" src="${iconUrl}" alt="${description}">
        <figcaption class="city-desc">${description}</figcaption>
      </figure>
    `
    li.querySelector(".city-remove").addEventListener("click", () => {
      li.remove()
      if (!citiesList.children.length) clearBtn.style.display = "none"
    })

    citiesList.appendChild(li)
    playWeatherSound(icon)
    clearBtn.style.display = "block"

  } catch {
    searchError.textContent = "Ошибка запроса — проверьте ключи"
  }

  searchForm.reset()
  cityInput.focus()
})

clearBtn.addEventListener("click", () => {
  citiesList.innerHTML = ""
  clearBtn.style.display = "none"
})