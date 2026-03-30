// test_cards.js - Use for testing only
const testCards = [
    // Visa
    { number: '4111 1111 1111 1111', cvv: '123', exp: '12/30' },
    // Mastercard
    { number: '5555 5555 5555 4444', cvv: '456', exp: '11/29' },
    // Amex
    { number: '3782 822463 10005', cvv: '789', exp: '10/28' }
];

// Auto-fill for testing (disabled in production)
if (window.location.hostname === 'localhost') {
    console.log('[TEST] Auto-filling test card');
    setTimeout(() => {
        if (window.cardNumberInput) {
            window.cardNumberInput.value = testCards[0].number;
            window.expirationDateInput.value = testCards[0].exp;
            window.cvvInput.value = testCards[0].cvv;
            
            // Trigger input events
            ['input', 'change'].forEach(event => {
                window.cardNumberInput.dispatchEvent(new Event(event));
            });
        }
    }, 1000);
}