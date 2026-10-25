/* ============ net.js — conexión entre los jugadores de una sala ============
 * Topología en estrella: el ANFITRIÓN habla con cada invitado; los invitados
 * sólo hablan con el anfitrión (él reenvía lo que haga falta).
 *
 * Dos caminos, a la vez:
 *   directo  WebRTC (canal de datos entre navegadores). La negociación
 *            (señalización) va por la base de datos, con el STUN gratuito de
 *            Google. Sin TURN, algunas redes (datos móviles, CGNAT) no pueden
 *            conectar directamente y esa pareja no juega junta.
 *   relé     (APAGADO) los mensajes irían por la Realtime Database:
 *            rooms/{sala}/q/{destinatario}/{id}, a 1 $ el GB.
 *
 * Se envía por el canal directo si está abierto; si no, por el relé. El que
 * recibe escucha los dos, así que no hace falta ponerse de acuerdo.
 *
 * API:  open(roomId, isHost, hostUid) · close() · send(to, msg) · toHost(msg)
 *       broadcast(msg) · on(fn(from, msg)) · onPeer(fn(uid, state))
 *       peers() · mode(uid) -> 'connecting' | 'direct' | 'relay' | 'closed'
 *       rtt(uid) · ping() -> ms de ida y vuelta (el peor de la sala) o null
 */
G.Net = (() => {
  const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const DIRECT_TIMEOUT = 15000;    // ms para conseguir canal
  // Relé por la Realtime Database APAGADO (12-10-2026): a 1 $ el GB era lo que más
  // costaba del cooperativo. Sin conexión directa, esa pareja no puede jugar
  // junta ('failed') y el anfitrión lo reintenta cada RETRY_MS. Por la base de datos
  // sólo pasa la señalización (unos pocos mensajes pequeños para conectarse).
  const ALLOW_RELAY = false, RETRY_MS = 15000;
  // Ping: lo mide el propio navegador en la conexión WebRTC (getStats), así que no
  // manda ni un byte más por la red. Se lee como mucho cada PING_MS y sólo si alguien
  // lo pide (el HUD, con "Mostrar ping" activado).
  const PING_MS = 2000;


  // Diagnóstico de la red (para la sala): con una conexión de prueba contra varios STUN
  // de Google se mira qué puerto ve cada uno. Si cada servidor ve uno distinto, la red
  // es «estricta» (NAT simétrica: datos móviles, CGNAT, empresas) y sin un servidor de
  // puente no se puede conectar con nadie que esté fuera. No manda nada a los demás
  // jugadores salvo el resultado, por la señalización.
  //   open  el aparato tiene IP pública · nat  router normal · sym  estricta
  //   block no llega a los STUN (cortafuegos o red que corta UDP)
  const NAT_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }];
  const NAT_MS = 5000, NAT_KINDS = ['open', 'nat', 'sym', 'block'];


  let rtdb = null, uid = null, roomId = null, isHost = false, hostUid = null;
  let qref = null, pingAt = 0;
  let natMine = null, natAsk = null;
  const natOf = new Map();         // uid -> tipo de red que nos ha contado
  const peers = new Map();         // uid -> { pc, dc, mode, timer }
  const handlers = new Set(), peerHandlers = new Set(), natHandlers = new Set();
  const stats = { sent: 0, recv: 0, relaySent: 0,
    // Sólo los datos de la partida que se han mandado bien (sin ICE/SCTP/DTLS).
    sentBytes: 0, jsonBytes: 0, recvBytes: 0, binarySent: 0, binaryRecv: 0, invalidBinary: 0 };

  function emitPeer(u) {
    const p = peers.get(u);
    peerHandlers.forEach(fn => { try { fn(u, p ? p.mode : 'closed'); } catch (e) { console.warn(e); } });
  }

  // ---------------- diagnóstico de la red ----------------

  /** Tipo de red a partir de los candidatos ({type, address, port, protocol}). */
  function natKind(cands) {
    const udp = cands.filter(c => c && c.protocol === 'udp');
    const hosts = udp.filter(c => c.type === 'host'), srflx = udp.filter(c => c.type === 'srflx');
    if (!srflx.length) return 'block';
    if (srflx.some(s => hosts.some(h => h.address === s.address))) return 'open';
    // Un puerto por interfaz es lo normal; más puertos que interfaces para la misma IP
    // pública es que cada servidor ha visto uno distinto.
    const ports = new Map();
    for (const s of srflx) { if (!ports.has(s.address)) ports.set(s.address, new Set()); ports.get(s.address).add(s.port); }
    const ifaces = Math.max(1, hosts.length);
    return [...ports.values()].some(set => set.size > ifaces) ? 'sym' : 'nat';
  }

  /**
   * Mide la red propia una vez por sesión; al acabar se la cuenta a la sala.
   * «Bloqueada» puede ser sólo un STUN que ha tardado: se repite una vez al momento
   * y no se da por buena para siempre (se vuelve a medir al abrir otra vez la sala).
   */
  function probeNat() {
    if (natMine && natMine !== 'block') return Promise.resolve(natMine);
    if (natAsk) return natAsk;
    natAsk = probeOnce().then(kind => kind === 'block' ? probeOnce() : kind).then(kind => {
      natAsk = null;
      if (kind) { natMine = kind; for (const u of peers.keys()) tellNat(u); emitNat(); }
      return kind;
    });
    return natAsk;
  }

  function probeOnce() {
    return new Promise(done => {
      let pc;
      try { pc = new RTCPeerConnection({ iceServers: NAT_ICE }); } catch (e) { done(null); return; }
      const cands = [];
      let over = false;
      const finish = () => {
        if (over) return;
        over = true; clearTimeout(stop);
        try { pc.close(); } catch (e) { /* nada */ }
        done(natKind(cands));
      };
      const stop = setTimeout(finish, NAT_MS);
      pc.onicecandidate = e => {
        if (!e.candidate) { finish(); return; }
        const c = e.candidate;
        if (c.type) cands.push({ type: c.type, address: c.address, port: c.port, protocol: c.protocol });
      };
      pc.createDataChannel('nat');
      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(finish);
    });
  }

  function tellNat(u) { if (natMine && roomId && u !== uid) signal(u, { nat: natMine }); }
  // Aparte de onPeer: el cooperativo no tiene que enterarse de esto.
  function emitNat() { natHandlers.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } }); }

  // ---------------- apertura ----------------

  function open(id, host, hostId) {
    if (roomId === id) return;
    close();
    const fb = G.DB.fb;
    rtdb = fb.rtdb; uid = fb.uid;
    roomId = id; isHost = host; hostUid = hostId;
    qref = rtdb.ref('rooms/' + id + '/q/' + uid);
    qref.on('child_added', s => {
      const raw = s.val();
      s.ref.remove().catch(() => {});
      let m;
      try { m = JSON.parse(raw); } catch (e) { return; }
      if (!m || !m.f) return;
      if (m.sig) onSignal(m.f, m.sig);
      else deliver(m.f, m.d);
    });
    // Invitado: hueco para el anfitrión desde ya (se sustituye al llegar su
    // oferta). Así, si no llega nunca, se sigue por el relé y se sabe cuándo se va.
    if (!isHost) {
      const p = { pc: null, dc: null, mode: 'connecting', timer: 0 };
      p.timer = setTimeout(() => { if (p.mode === 'connecting') { p.mode = ALLOW_RELAY ? 'relay' : 'failed'; emitPeer(hostId); } }, DIRECT_TIMEOUT + 3000);
      peers.set(hostId, p);
    }
  }

  function close() {
    for (const u of [...peers.keys()]) drop(u);
    if (qref) { qref.off(); qref = null; }
    roomId = null; isHost = false; hostUid = null;
    natOf.clear();
  }

  /** El anfitrión llama a esto cuando cambian los miembros de la sala. */
  function syncMembers(uids) {
    if (!roomId) return;
    if (isHost) {
      for (const u of uids) if (u !== uid && !peers.has(u)) connect(u);
      for (const u of [...peers.keys()]) if (!uids.includes(u)) drop(u);
    } else if (!uids.includes(hostUid)) {
      drop(hostUid);
    }
  }

  // ---------------- WebRTC ----------------

  function newPeer(u) {
    const p = { pc: null, dc: null, mode: 'connecting', timer: 0 };
    peers.set(u, p);
    // Sin WebRTC (navegador antiguo o bloqueado): directamente por el relé.
    let pc;
    try { pc = p.pc = new RTCPeerConnection({ iceServers: ICE }); }
    catch (e) { p.mode = 'relay'; emitPeer(u); return p; }
    pc.onicecandidate = e => { if (e.candidate) signal(u, { c: e.candidate.toJSON() }); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' && p.mode !== 'closed') useRelay(u);
    };
    // Si en unos segundos no hay canal directo, se sigue por el relé.
    p.timer = setTimeout(() => { if (p.mode === 'connecting') useRelay(u); }, DIRECT_TIMEOUT);
    emitPeer(u);
    return p;
  }

  function wireChannel(u, p, dc) {
    p.dc = dc;
    p.binaryVersion = 0;
    dc.binaryType = 'arraybuffer';
    dc.onopen = () => {
      clearTimeout(p.timer); p.mode = 'direct';
      // Aviso de que entendemos binario (las versiones viejas lo ignoran); hasta que el otro
      // mande el suyo, se le habla en JSON.
      try { dc.send(JSON.stringify({ k: 'net-cap', binary: G.NetCodec.version })); } catch (e) { /* el JSON sigue valiendo */ }
      emitPeer(u);
    };
    dc.onclose = () => { if (p.mode === 'direct') { p.mode = 'connecting'; useRelay(u); } };
    dc.onmessage = e => {
      let m;
      if (typeof e.data === 'string') {
        try { m = JSON.parse(e.data); } catch (err) { return; }
        if (m && m.k === 'net-cap') {
          p.binaryVersion = m.binary === G.NetCodec.version ? m.binary : 0;
          return;
        }
        stats.recvBytes += G.NetCodec.size(e.data);
      } else {
        try {
          if (p.binaryVersion !== G.NetCodec.version) throw Error('unnegotiated binary');
          m = G.NetCodec.decode(e.data);
          if (!m || m.k !== 'f') throw Error('not a frame');
        } catch (err) { stats.invalidBinary++; return; }
        stats.recvBytes += e.data.byteLength; stats.binaryRecv++;
      }
      deliver(u, m);
    };
  }

  function useRelay(u) {
    const p = peers.get(u);
    if (!p || p.mode === 'direct' || p.mode === 'closed' || p.mode === 'failed') return;
    if (ALLOW_RELAY) { p.mode = 'relay'; emitPeer(u); return; }
    // Sin relé: no se puede jugar con esa persona por ahora. El anfitrión reintenta.
    clearTimeout(p.timer);
    p.mode = 'failed';
    try { if (p.pc) p.pc.close(); } catch (e) { /* nada */ }
    emitPeer(u);
    if (isHost) p.timer = setTimeout(() => { if (peers.get(u) === p && p.mode === 'failed' && roomId) { drop(u, true); connect(u); } }, RETRY_MS);
  }

  /** Anfitrión: abre conexión con un invitado. */
  async function connect(u) {
    if (!roomId || peers.has(u)) return;
    const p = newPeer(u);
    if (!p.pc) return;
    wireChannel(u, p, p.pc.createDataChannel('g', { ordered: true }));
    try {
      const offer = await p.pc.createOffer();
      await p.pc.setLocalDescription(offer);
      signal(u, { sdp: p.pc.localDescription.toJSON() });
      tellNat(u);
    } catch (e) { useRelay(u); }
  }

  // Candidatos que llegan antes de que esté puesta la descripción del otro. Ojo:
  // remoteDescription sigue vacía mientras setRemoteDescription no ha acabado, y los
  // candidatos llegan justo detrás de la oferta o la respuesta, así que pasa casi
  // siempre. Antes, los del invitado que llegaban así al anfitrión se perdían: en la
  // misma red se conectaba igual, pero desde casas distintas (cada uno tras su
  // router) el anfitrión no llegaba a probar el camino y no conectaba nunca.
  const pendingIce = new Map();

  async function flushIce(from, p) {
    const list = pendingIce.get(from) || [];
    pendingIce.delete(from);
    for (const c of list) await p.pc.addIceCandidate(c).catch(() => {});
  }

  async function onSignal(from, sig) {
    if (sig.nat) {                  // su tipo de red (las versiones viejas no lo mandan)
      if (NAT_KINDS.includes(sig.nat) && natOf.get(from) !== sig.nat) { natOf.set(from, sig.nat); emitNat(); }
      return;
    }
    let p = peers.get(from);
    try {
      if (sig.sdp && sig.sdp.type === 'offer') {
        if (isHost) return;
        if (p) drop(from, true);
        p = newPeer(from);
        if (!p.pc) return;
        p.pc.ondatachannel = e => wireChannel(from, p, e.channel);
        await p.pc.setRemoteDescription(sig.sdp);
        const ans = await p.pc.createAnswer();
        await p.pc.setLocalDescription(ans);
        signal(from, { sdp: p.pc.localDescription.toJSON() });
        tellNat(from);
        await flushIce(from, p);
      } else if (sig.sdp && sig.sdp.type === 'answer') {
        if (p && p.pc) { await p.pc.setRemoteDescription(sig.sdp); await flushIce(from, p); }
      } else if (sig.c) {
        if (p && p.pc && p.pc.remoteDescription) await p.pc.addIceCandidate(sig.c).catch(() => {});
        else { if (!pendingIce.has(from)) pendingIce.set(from, []); pendingIce.get(from).push(sig.c); }
      }
    } catch (e) {
      console.warn('[Net] señalización:', e.message);
      useRelay(from);
    }
  }

  /** Lee el tiempo de ida y vuelta del par de candidatos en uso de cada conexión directa. */
  function measurePing() {
    for (const p of peers.values()) {
      if (p.mode !== 'direct' || !p.pc || !p.pc.getStats) { p.rtt = null; continue; }
      p.pc.getStats().then(rep => {
        let ms = null;
        rep.forEach(r => {
          if (r.type === 'candidate-pair' && r.state === 'succeeded' && (r.nominated || r.selected)
              && typeof r.currentRoundTripTime === 'number') ms = r.currentRoundTripTime * 1000;
        });
        p.rtt = ms == null ? null : Math.round(ms);
      }).catch(() => { p.rtt = null; });
    }
  }

  /** Ping con un jugador en ms (null si no hay conexión directa o aún no se ha medido). */
  function rtt(u) { const p = peers.get(u); return p && p.mode === 'direct' && p.rtt != null ? p.rtt : null; }

  function signal(to, sig) { relayPush(to, { f: uid, sig }); }

  function drop(u, silent) {
    const p = peers.get(u);
    if (!p) return;
    clearTimeout(p.timer);
    pendingIce.delete(u);           // eran de este intento; el siguiente trae los suyos
    p.mode = 'closed';
    try { if (p.dc) p.dc.close(); } catch (e) { /* nada */ }
    try { if (p.pc) p.pc.close(); } catch (e) { /* nada */ }
    peers.delete(u);
    if (!silent) emitPeer(u);
  }

  // ---------------- envío / recepción ----------------

  /*
   * Cada remitente tiene 100 huecos por destinatario (tuUid_00 ... tuUid_99) y
   * los va usando en orden; quien recibe borra cada mensaje al leerlo. Antes cada
   * mensaje era nuevo (push) y sin tope de tamaño, y el 23-10-2026 se llenó la
   * base de datos de basura (ver social.js, createRoom). Las reglas
   * (database.rules.json) sólo admiten estos huecos y mensajes de hasta 16.000.
   */
  let slot = 0;
  function relayPush(to, env) {
    if (!rtdb || !roomId) return;
    const key = uid + '_' + String(slot++ % 100).padStart(2, '0');
    rtdb.ref('rooms/' + roomId + '/q/' + to + '/' + key).set(JSON.stringify(env)).catch(e => console.warn('[Net] relé:', e.code || e.message));
  }

  function send(to, msg) {
    if (!roomId) return;
    const p = peers.get(to);
    stats.sent++;
    if (p && p.dc && p.dc.readyState === 'open') {
      try {
        const json = JSON.stringify(msg), jsonBytes = G.NetCodec.size(json);
        const packed = p.binaryVersion === G.NetCodec.version && msg && msg.k === 'f'
          ? G.NetCodec.encode(msg) : null;
        const binary = packed && packed.byteLength < jsonBytes;
        p.dc.send(binary ? packed : json);
        stats.sentBytes += binary ? packed.byteLength : jsonBytes;
        stats.jsonBytes += jsonBytes;
        if (binary) stats.binarySent++;
        return;
      } catch (e) { /* cae al relé */ }
    }
    // Sin relé, los datos de la partida no van por la base de datos (se pierden: esa
    // pareja no está conectada). Sólo pasa el aviso de empezar.
    if (!ALLOW_RELAY && !(msg && msg.k === 'start')) return;
    stats.relaySent++;
    relayPush(to, { f: uid, d: msg });
  }

  function toHost(msg) { if (!isHost && hostUid) send(hostUid, msg); }
  function broadcast(msg, except) { for (const u of peers.keys()) if (u !== except) send(u, msg); }

  function deliver(from, msg) {
    stats.recv++;
    handlers.forEach(fn => { try { fn(from, msg); } catch (e) { console.error('[Net] mensaje:', e); } });
  }

  return {
    open, close, syncMembers, send, toHost, broadcast,
    on(fn) { handlers.add(fn); }, off(fn) { handlers.delete(fn); },
    onPeer(fn) { peerHandlers.add(fn); },
    /** Diagnóstico: probeNat() mide la red propia; nat(uid) -> 'open'|'nat'|'sym'|'block'|null. */
    probeNat, natKind, onNat(fn) { natHandlers.add(fn); },
    nat(u) { return u === uid ? natMine : natOf.get(u) || null; },
    mode(u) { const p = peers.get(u); return p ? p.mode : 'closed'; },
    /** ¿Va por el relé (o no hay conexión)? Entonces se manda menos a menudo. */
    slow(u) { const p = peers.get(u); return !p || p.mode !== 'direct'; },
    peers() { return [...peers.keys()]; },
    rtt,
    /** Ping de la sala: el del anfitrión para un invitado; el peor de los invitados para el anfitrión. */
    ping() {
      const now = Date.now();
      if (now - pingAt >= PING_MS) { pingAt = now; measurePing(); }
      let worst = null;
      for (const u of peers.keys()) { const r = rtt(u); if (r != null && (worst == null || r > worst)) worst = r; }
      return worst;
    },
    get open_() { return !!roomId; },
    get isHost() { return isHost; },
    get uid() { return uid; },
    get hostUid() { return hostUid; },
    stats
  };
})();
