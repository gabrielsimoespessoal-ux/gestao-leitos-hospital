/* Hospital São José — PWA. Conteúdo clínico sempre obtido pela rede; não armazenar dados sensíveis offline. */
self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 // Navegação e recursos seguem a política de rede normal. O SW não intercepta conteúdo clínico.
});
