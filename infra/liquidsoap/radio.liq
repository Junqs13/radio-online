# Auto-DJ da rádio.
# A cada faixa, pergunta à API qual é a próxima (grade, pedidos, vinhetas e rotação ficam lá).
# Se a API não responder, toca a pasta /storage em ordem aleatória, e a rádio não sai do ar.

settings.init.allow_root.set(true)
settings.log.stdout.set(true)
settings.log.level.set(3)

icecast_host     = environment.get(default="icecast", "ICECAST_HOST")
icecast_port     = int_of_string(environment.get(default="8000", "ICECAST_PORT"))
icecast_password = environment.get("ICECAST_SOURCE_PASSWORD")
icecast_mount    = environment.get(default="/live.mp3", "ICECAST_MOUNT")
api_url          = environment.get(default="http://backend:3001/api", "AUTODJ_API_URL")
api_token        = environment.get("AUTODJ_TOKEN")
media_dir        = environment.get(default="/storage", "MEDIA_DIR")
station_url      = environment.get(default="http://localhost:3000", "STATION_URL")

auth = [("Authorization", "Bearer #{api_token}")]

# --- Fonte principal: a API escolhe ---
def next_track() =
  resp = http.get(headers=auth, timeout=5., "#{api_url}/autodj/next")
  if resp.status_code == 200 and string.length(resp) > 0 then
    request.create(resp)
  else
    log.important("API sem faixa (HTTP #{resp.status_code}). Usando a reserva.")
    null()
  end
end
autodj = request.dynamic(retry_delay=10., next_track)

# --- Reserva: a pasta inteira embaralhada, relida a cada 5 minutos ---
reserva = playlist(mode="randomize", reload=300, reload_mode="seconds", media_dir)

radio = fallback(track_sensitive=true, [autodj, reserva])

# --- Avisa a API quando uma faixa começa, para o histórico e a rotação ---
# Fica antes do crossfade: depois dele o Liquidsoap 2.2 só sinaliza o início da primeira faixa.
# Por isso o aviso chega alguns segundos antes da faixa entrar de fato no ar.
def report(m) =
  data = json()
  data.add("media_id", m["media_id"])
  data.add("source", m["source"])
  data.add("request_id", m["request_id"])
  data.add("program_id", m["program_id"])
  data.add("title", m["title"])
  data.add("artist", m["artist"])
  body = json.stringify(data)
  thread.run(fun () -> begin
    resp = http.post(
      headers=[("Content-Type", "application/json"), ...auth],
      data=body, timeout=5., "#{api_url}/autodj/played"
    )
    if resp.status_code != 200 then
      log.important("Não consegui registrar a faixa na API (HTTP #{resp.status_code}).")
    end
  end)
end
radio = source.on_track(radio, report)

# Iguala o volume entre faixas usando a tag REPLAYGAIN_TRACK_GAIN de cada arquivo
radio = replaygain(radio)

# Transição entre faixas. A API ajusta a duração por faixa (liq_cross_duration)
# conforme o tipo escolhido no bloco da grade: crossfade, fade-in ou corte seco.
radio = crossfade(duration=5., fade_in=3., fade_out=3., radio)

# Se tudo falhar, transmite silêncio em vez de derrubar o stream
radio = mksafe(radio)

output.icecast(
  %mp3(bitrate=128, samplerate=44100, stereo=true),
  host=icecast_host,
  port=icecast_port,
  password=icecast_password,
  mount=icecast_mount,
  name="Antena Rock",
  description="Radio online de rock 24 horas",
  genre="Rock",
  url=station_url,
  encoding="UTF-8",
  radio
)
