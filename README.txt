Happymoto Live – Durable Object v1

Worker-Name:
happymoto-live

Enthalten:
- worker.js
- wrangler.jsonc
- SQLite-backed Durable Object TourRoom
- Binding ROOMS -> TourRoom

Wichtig:
Neue Durable Objects müssen mit der Konfiguration aus wrangler.jsonc bereitgestellt werden.
Die Datei legt den SQLite-Durable-Object-Namespace an.

Gespeichert werden ausschließlich:
- Teilnehmer-ID
- Initialen
- Farbe
- Latitude / Longitude
- Zeitstempel

Es wird KEINE Geschwindigkeit übertragen.

Danach in happymoto-einstieg eine Service Binding anlegen:
Name exakt: LIVE_SERVICE
Service: happymoto-live
