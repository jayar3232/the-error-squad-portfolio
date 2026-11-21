/* A room uses either local browser events or Supabase Broadcast. */
(() => {
  'use strict';
  const services = window.StudioServices ||= {};
  const empty = () => {};
  let pendingSDK;
  function loadSDK() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    if (pendingSDK) return pendingSDK;
    pendingSDK = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const fail = () => {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        reject(new Error('Could not load the Supabase client. Check your connection and reload.'));
      };
      const timer = setTimeout(fail, 15000);
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        if (window.supabase?.createClient) resolve(window.supabase);
        else fail();
      };
      script.onerror = fail;
      document.head.append(script);
    }).catch(error => { pendingSDK = undefined; throw error; });
    return pendingSDK;
  }

  const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  function normalize(payload) {
    const id = clean(payload?.id, 128), name = clean(payload?.name, 80);
    const text = clean(payload?.text, 4000), clientId = clean(payload?.clientId, 128);
    if (!id || !name || !text || !clientId) return null;
    const timestamp = new Date(payload.time);
    return {id, name, text, clientId, time: Number.isFinite(+timestamp) ? timestamp.toISOString() : new Date().toISOString()};
  }
  services.connectChat = function connectChat(config = {}, onMessage = empty, onTyping = empty, onStatus = empty) {
    const clientId = clean(config.clientId, 128) || crypto.randomUUID();
    const room = clean(config.room, 80) || 'fieldwork-studio';
    const topic = 'portfolio-room/' + room;
    const localKey = 'fieldwork.chat.event.' + room;
    const isRemote = Boolean(config.url || config.key);
    let state = isRemote ? 'connecting' : 'local', closed = false;
    let channel, client, broadcast, lastTyping = 0;
    function status(next, detail) {
      if (closed) return;
      state = next;
      onStatus(next, detail);
    }
    function receive(type, payload) {
      if (closed || payload?.clientId === clientId) return;
      if (type === 'message') {
        const message = normalize(payload);
        if (message) onMessage(message);
      }
      if (type === 'typing' && clean(payload?.name, 80) && clean(payload?.clientId, 128)) {
        onTyping({name: clean(payload.name, 80), clientId: clean(payload.clientId, 128)});
      }
    }
    function storage(event) {
      if (event.key !== localKey || !event.newValue) return;
      try {
        const data = JSON.parse(event.newValue);
        receive(data.type, data.payload);
      } catch { /* Ignore unrelated or damaged storage entries. */ }
    }
    async function online() {
      try {
        const url = new URL(config.url);
        if (url.protocol !== 'https:' || !config.key) throw new Error('Enter a Supabase HTTPS project URL and publishable key.');
        const sdk = await loadSDK();
        if (closed) return;
        client = sdk.createClient(url.origin, config.key, {
          auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}
        });
        channel = client.channel(topic, {config: {broadcast: {ack: true, self: false}}});
        for (const event of ['message', 'typing']) {
          channel.on('broadcast', {event}, ({payload}) => receive(event, payload));
        }
        channel.subscribe(result => {
          if (result === 'SUBSCRIBED') status('online', 'Supabase room connected');
          else if (['TIMED_OUT', 'CLOSED', 'CHANNEL_ERROR'].includes(result)) {
            status('error', 'Shared room disconnected. Check your connection and Supabase settings.');
          }
        });
      } catch (error) {
        status('error', error.message);
      }
    }
    if (isRemote) {
      status('connecting', 'Connecting to Supabase…');
      online();
    } else {
      try {
        broadcast = new BroadcastChannel(topic);
        broadcast.onmessage = ({data}) => receive(data?.type, data?.payload);
      } catch {
        window.addEventListener('storage', storage);
      }
      status('local', 'Local mode · browser-only conversation');
    }
    async function sendEvent(type, payload) {
      if (closed) throw new Error('The room is closed.');
      if (state === 'local') {
        if (broadcast) broadcast.postMessage({type, payload});
        else {
          try {
            localStorage.setItem(localKey, JSON.stringify({type, payload, nonce: Math.random()}));
            localStorage.removeItem(localKey);
          } catch { /* Local composer remains usable when storage is blocked. */ }
        }
        return 'local';
      }
      if (state !== 'online') throw new Error('Shared room is offline. Your message was not sent.');
      const result = await channel.send({type: 'broadcast', event: type, payload});
      if (result !== 'ok') throw new Error('Supabase did not acknowledge the message. Check the room before retrying.');
      return 'online';
    }
    return {
      async send(message) {
        const data = normalize({...message, clientId});
        if (!data) throw new Error('Enter a display name and a message.');
        return sendEvent('message', data);
      },
      typing(name) {
        if (closed || !['local', 'online'].includes(state) || Date.now() - lastTyping < 650) return;
        lastTyping = Date.now();
        sendEvent('typing', {name: clean(name, 80), clientId}).catch(empty);
      },
      close() {
        if (closed) return;
        closed = true;
        broadcast?.close();
        window.removeEventListener('storage', storage);
        if (client && channel) client.removeChannel(channel).catch(empty);
        onStatus('closed', 'Room closed');
      }
    };
  };
})();
