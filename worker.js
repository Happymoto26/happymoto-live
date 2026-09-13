import { DurableObject } from "cloudflare:workers";

const TOUR_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function hashColor(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360} 85% 45%)`;
}

export class TourRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();

    if (request.method === "POST" && url.pathname === "/position") {
      let b;
      try { b = await request.json(); }
      catch { return json({error:"Ungültige Anfrage."}, 400); }

      if (!b || !b.id || !b.initials || !Number.isFinite(+b.lat) || !Number.isFinite(+b.lon)) {
        return json({error:"Teilnehmerdaten unvollständig."}, 400);
      }

      const id = String(b.id).slice(0,128);
      const participant = {
        id,
        initials: String(b.initials).trim().slice(0,3).toUpperCase(),
        lat: +b.lat,
        lon: +b.lon,
        ts: now,
        color: hashColor(id)
      };

      await this.ctx.storage.put("p:" + id, participant);
      return json({ok:true, ts:now});
    }

    if (request.method === "GET" && url.pathname === "/participants") {
      const entries = await this.ctx.storage.list({prefix:"p:"});
      const participants = [];
      const stale = [];

      for (const [key, p] of entries) {
        if (!p || now - (+p.ts || 0) > 30000) {
          stale.push(key);
          continue;
        }
        participants.push(p);
      }

      if (stale.length) {
        await Promise.all(stale.map(key => this.ctx.storage.delete(key)));
      }

      return json({participants, now});
    }

    return json({error:"Not found"}, 404);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/api\/live\/([ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6})$/);
    if (!m) return json({error:"Not found"}, 404);

    const tourId = m[1];
    if (!TOUR_RE.test(tourId)) return json({error:"Ungültige Tour-ID."}, 400);

    const id = env.ROOMS.idFromName(tourId);
    const room = env.ROOMS.get(id);

    if (request.method === "GET") {
      return room.fetch("https://room/participants");
    }

    if (request.method === "POST") {
      return room.fetch("https://room/position", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:await request.text()
      });
    }

    return json({error:"Method not allowed"}, 405);
  }
};
