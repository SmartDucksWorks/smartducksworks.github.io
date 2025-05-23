// smartducks-form-fixes.js
// Consolidated fixes for SmartDucks payment form
// For production deployment only

(function() {
    console.log('SmartDucks form fixes loaded');

    // 1. Fix State/Province Selection
    function fixStateProvinceSelection() {
        console.log('Fixing state/province selector...');
        
        // Get fresh references to DOM elements
        const countrySelect = document.getElementById('countryCode');
        const stateSelect = document.getElementById('state');
        
        if (!countrySelect || !stateSelect) {
            console.log('Country or state select elements not found yet, trying again in 500ms');
            setTimeout(fixStateProvinceSelection, 500);
            return;
        }
        
        // Create backup states object if not already defined globally
        if (typeof window.states !== 'object') {
            window.states = {
                US: {
                    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
                    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
                    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
                    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
                    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
                    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
                    NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
                    ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
                    RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
                    TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
                    WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
                },
                CA: {
                    AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
                    NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', ON: 'Ontario',
                    PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan'
                }
            };
        }
        
        // Define the updateStateOptions function in the global scope
        // Use a cleaner approach to avoid redefining if it already exists
        if (typeof window.updateStateOptions !== 'function') {
            window.updateStateOptions = function(country) {
                console.log("Updating state options for country:", country);
                
                // Get a fresh reference to the state select element each time
                const stateSelect = document.getElementById('state');
                
                if (!stateSelect) {
                    console.error("State select element not available");
                    return;
                }
                
                // Clear existing options
                stateSelect.innerHTML = '<option value="" disabled selected>Select State/Province</option>';
                
                // Use the global states object
                const statesObj = window.states;
                
                // If no country selected or no states for the country, disable the select and return early
                if (!country || !statesObj[country]) {
                    stateSelect.disabled = true;
                    console.log('No country selected or no states found for country:', country);
                    return;
                }
                
                // Add state options sorted alphabetically
                Object.entries(statesObj[country])
                    .sort((a, b) => a[1].localeCompare(b[1]))
                    .forEach(([code, name]) => {
                        const option = document.createElement('option');
                        option.value = code;
                        option.textContent = name;
                        stateSelect.appendChild(option);
                    });
                
                // Make sure the select is enabled when a supported country is selected
                stateSelect.disabled = false;
                
                // Update labels and validation patterns
                const isCanada = country === 'CA';
                const postalInput = document.getElementById('postalCode');
                if (postalInput) {
                    postalInput.pattern = isCanada ? '[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]' : '\\d{5}(-\\d{4})?';
                    postalInput.placeholder = isCanada ? 'A1A 1A1' : '12345 or 12345-6789';
                }
                
                // Update state/province label
                const stateLabel = document.querySelector('label[for="state"]');
                if (stateLabel) {
                    stateLabel.textContent = isCanada ? 'Province*' : 'State*';
                }
                
                console.log(`State/Province selector updated for ${country} with ${Object.keys(statesObj[country]).length} options`);
            };
        }
        
        // Store a reference to the handler function in the window object for consistent reference
        if (typeof window.handleCountryChange !== 'function') {
            window.handleCountryChange = function() {
                // Use fresh references to DOM elements
                const countrySelect = document.getElementById('countryCode');
                window.updateStateOptions(countrySelect.value);
                
                // Clear postal code input when country changes
                const postalInput = document.getElementById('postalCode');
                if (postalInput) postalInput.value = '';
            };
        }
        
        // Remove any existing listeners by replacing the element
        const oldCountrySelect = countrySelect;
        const newCountrySelect = oldCountrySelect.cloneNode(true);
        oldCountrySelect.parentNode.replaceChild(newCountrySelect, oldCountrySelect);
        
        // Get fresh reference after replacement
        const freshCountrySelect = document.getElementById('countryCode');
        
        // Add the change listener
        freshCountrySelect.addEventListener('change', window.handleCountryChange);
        
        // If country is already selected, update state options
        if (freshCountrySelect.value) {
            console.log('Country already selected, updating state options:', freshCountrySelect.value);
            window.updateStateOptions(freshCountrySelect.value);
            
            // Get fresh reference to state select
            const freshStateSelect = document.getElementById('state');
            // Make sure state select is enabled when country is selected
            if (freshStateSelect) {
                freshStateSelect.disabled = false;
            }
        } else {
            // If no country is selected, make sure state select is disabled
            stateSelect.disabled = true;
        }
        
        console.log('State/Province selector fix applied successfully');
    }

    // 2. Fix Postal Code Formatting
    function fixPostalCodeFormatting() {
        console.log('Fixing postal code formatting...');
        
        const countrySelect = document.getElementById('countryCode');
        const postalInput = document.getElementById('postalCode');
        
        if (!countrySelect || !postalInput) {
            console.log('Country or postal code elements not found yet, trying again in 500ms');
            setTimeout(fixPostalCodeFormatting, 500);
            return;
        }
        
        // Set proper placeholder and pattern based on selected country
        function updatePostalFormat(country) {
            if (country === 'CA') {
                postalInput.placeholder = 'A1A 1A1';
                postalInput.pattern = '[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]';
            } else if (country === 'US') {
                postalInput.placeholder = '12345 or 12345-6789';
                postalInput.pattern = '\\d{5}(-\\d{4})?';
            } else {
                postalInput.placeholder = 'Enter postal code';
                postalInput.pattern = '';
            }
        }
        
        // Format postal code based on country
        function formatPostalCode(country, value) {
            if (!value) return '';
            
            // Remove all non-alphanumeric characters
            const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            
            if (country === 'CA') {
                // Format Canadian postal code: A1A 1A1
                if (cleanValue.length <= 3) {
                    return cleanValue;
                } else {
                    return `${cleanValue.substring(0, 3)} ${cleanValue.substring(3, 6)}`.trim();
                }
            } else if (country === 'US') {
                // Format US ZIP code: 12345 or 12345-6789
                if (cleanValue.length <= 5) {
                    return cleanValue;
                } else {
                    return `${cleanValue.substring(0, 5)}-${cleanValue.substring(5, 9)}`.trim();
                }
            }
            
            // Default format for other countries
            return cleanValue;
        }
        
        function handlePostalInput() {
            const country = countrySelect.value;
            const formattedValue = formatPostalCode(country, this.value);
            
            // Only update if the formatted value is different
            if (formattedValue !== this.value) {
                // Get cursor position before update
                const start = this.selectionStart;
                const end = this.selectionEnd;
                
                this.value = formattedValue;
                
                // Adjust cursor position if needed
                if (document.activeElement === this) {
                    if (start === end) {
                        // If no selection, just move cursor to appropriate position
                        const newPos = Math.min(start + (formattedValue.length - start), formattedValue.length);
                        this.setSelectionRange(newPos, newPos);
                    } else {
                        // If there was a selection, preserve it
                        this.setSelectionRange(start, end);
                    }
                }
            }
        }
        
        // Remove any existing input listener
        postalInput.removeEventListener('input', handlePostalInput);
        
        // Add the input listener
        postalInput.addEventListener('input', handlePostalInput);
        
        // Initialize with current country value
        if (countrySelect.value) {
            updatePostalFormat(countrySelect.value);
        }
        
        console.log('Postal code formatting fix applied successfully');
    }

    // 3. Fix Form Submission
    function fixFormSubmission() {
        const addressForm = document.getElementById('addressForm');
        
        if (!addressForm) return;
        
        // Clone the form to remove all existing event listeners
        const oldForm = addressForm;
        const newForm = oldForm.cloneNode(true);
        oldForm.parentNode.replaceChild(newForm, oldForm);
        
        // Get the new form reference
        const form = document.getElementById('addressForm');
        
        // Add a single event listener for form submission
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Check if residential checkbox is checked
            const residential = document.getElementById('residential');
            const checkboxError = document.getElementById('checkbox-error');
            
            if (residential && !residential.checked) {
                // Show error message
                if (checkboxError) {
                    checkboxError.textContent = 'Please confirm this is a residential address';
                    checkboxError.style.display = 'block';
                }
                return;
            }
            
            // Hide error message if previously shown
            if (checkboxError) {
                checkboxError.style.display = 'none';
            }
            
            // Get form data
            const formData = new FormData(form);
            const formObject = Object.fromEntries(formData.entries());
            
            // Show shipping options section
            const shippingOptions = document.getElementById('shippingOptions');
            if (shippingOptions) {
                shippingOptions.style.display = 'block';
            }
            
            // Scroll to shipping options
            shippingOptions.scrollIntoView({ behavior: 'smooth' });
            
            // Fetch shipping rates
            fetchShippingRates(formObject);
        });
        
        // Fetch shipping rates
        function fetchShippingRates(formData) {
            const shippingOptionsList = document.getElementById('shippingOptionsList');
            
            if (!shippingOptionsList) return;
            
            // Clear existing options
            shippingOptionsList.innerHTML = '<div class="loading">Loading shipping options...</div>';
            
            // Prepare data for API
            const apiData = {
                type: 'shipping_quote',
                address: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    company: formData.companyName || '',
                    attention: formData.attention || '',
                    street1: formData.streetAddress,
                    street2: formData.streetAddress2 || '',
                    city: formData.city,
                    state: formData.state,
                    postal_code: formData.postalCode,
                    country: formData.countryCode,
                    residential: formData.residential === 'on',
                    email: formData.email,
                    phone: formData.phone,
                    instructions: formData.instructions || ''
                }
            };
            
            // Fetch shipping rates
            fetch('https://duckpond.smartducks.works/webhook/shiptime-rates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(apiData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                displayShippingRates(data);
            })
            .catch(error => {
                shippingOptionsList.innerHTML = `<div class="error">Error fetching shipping options: ${error.message}</div>`;
            });
        }
        
        // Display shipping rates
        function displayShippingRates(data) {
            const shippingOptionsList = document.getElementById('shippingOptionsList');
            
            if (!shippingOptionsList) return;
            
            // Clear loading message
            shippingOptionsList.innerHTML = '';
            
            if (!data || !data.quotes || data.quotes.length === 0) {
                shippingOptionsList.innerHTML = '<div class="error">No shipping options available for this address</div>';
                return;
            }
            
            // Sort quotes by price
            const quotes = data.quotes.sort((a, b) => a.total - b.total);
            
            // Display each quote
            quotes.forEach((quote, index) => {
                const quoteElement = document.createElement('div');
                quoteElement.className = 'shipping-option';
                
                const radioBtn = document.createElement('input');
                radioBtn.type = 'radio';
                radioBtn.name = 'shippingOption';
                radioBtn.id = `shipping-${index}`;
                radioBtn.value = JSON.stringify(quote);
                radioBtn.checked = index === 0; // Select first option by default
                
                const label = document.createElement('label');
                label.htmlFor = `shipping-${index}`;
                label.className = 'shipping-option-label';
                
                const serviceName = document.createElement('div');
                serviceName.className = 'shipping-service';
                serviceName.textContent = `${quote.carrier} - ${quote.service}`;
                
                const price = document.createElement('div');
                price.className = 'shipping-price';
                price.textContent = `$${quote.total.toFixed(2)}`;
                
                const deliveryTime = document.createElement('div');
                deliveryTime.className = 'delivery-time';
                deliveryTime.textContent = quote.delivery_days > 0 ? 
                    `Estimated delivery: ${quote.delivery_days} business days` : 
                    'Estimated delivery time not available';
                
                label.appendChild(serviceName);
                label.appendChild(price);
                label.appendChild(deliveryTime);
                
                quoteElement.appendChild(radioBtn);
                quoteElement.appendChild(label);
                
                shippingOptionsList.appendChild(quoteElement);
            });
            
            // Add event listener for the confirm button
            const confirmShippingBtn = document.getElementById('confirmShipping');
            
            if (!confirmShippingBtn) return;
            
            confirmShippingBtn.addEventListener('click', function() {
                const selectedOption = document.querySelector('input[name="shippingOption"]:checked');
                
                if (!selectedOption) {
                    alert('Please select a shipping option');
                    return;
                }
                
                const quote = JSON.parse(selectedOption.value);
                
                // Store the selected quote
                window.selectedShippingQuote = quote;
                
                // Update order summary
                updateOrderSummary(quote);
                
                // Hide shipping options and show order summary
                const shippingOptions = document.getElementById('shippingOptions');
                const orderSummary = document.getElementById('orderSummary');
                const finalActions = document.getElementById('finalActions');
                
                if (shippingOptions) shippingOptions.style.display = 'none';
                if (orderSummary) orderSummary.style.display = 'block';
                if (finalActions) finalActions.style.display = 'block';
                
                // Scroll to order summary
                orderSummary.scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // Update order summary
        function updateOrderSummary(quote) {
            const shippingTotal = document.getElementById('shippingTotal');
            const taxesTotal = document.getElementById('taxesTotal');
            const orderTotal = document.getElementById('orderTotal');
            
            if (!shippingTotal || !taxesTotal || !orderTotal) return;
            
            // Update shipping cost
            shippingTotal.textContent = `$${quote.total.toFixed(2)}`;
            
            // Calculate taxes (example: 13% for Ontario)
            const productTotal = 179.00; // $59 + $120
            const taxRate = 0.13; // 13%
            const taxes = (productTotal + quote.total) * taxRate;
            
            // Update taxes
            taxesTotal.textContent = `$${taxes.toFixed(2)}`;
            
            // Update order total
            const total = productTotal + quote.total + taxes;
            orderTotal.textContent = `$${total.toFixed(2)}`;
        }
        
        // Set up the change shipping button
        const changeShippingBtn = document.getElementById('changeShipping');
        
        if (changeShippingBtn) {
            changeShippingBtn.addEventListener('click', function() {
                const shippingOptions = document.getElementById('shippingOptions');
                const orderSummary = document.getElementById('orderSummary');
                const finalActions = document.getElementById('finalActions');
                
                if (shippingOptions) shippingOptions.style.display = 'block';
                if (orderSummary) orderSummary.style.display = 'none';
                if (finalActions) finalActions.style.display = 'none';
                
                // Scroll to shipping options
                shippingOptions.scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // Set up the proceed to payment button
        const proceedToPaymentBtn = document.getElementById('proceedToPayment');
        
        if (proceedToPaymentBtn) {
            proceedToPaymentBtn.addEventListener('click', function() {
                const orderSummary = document.getElementById('orderSummary');
                const paymentSection = document.getElementById('paymentSection');
                
                if (orderSummary) orderSummary.style.display = 'block';
                if (paymentSection) paymentSection.style.display = 'block';
                
                // Scroll to payment section
                paymentSection.scrollIntoView({ behavior: 'smooth' });
                
                // Initialize payment form
                initializePaymentForm();
            });
        }
    }

    // 4. Fix Payment Form
    function initializePaymentForm() {
        console.log('Initializing payment form...');
        
        const paymentSection = document.getElementById('paymentSection');
        const stripeElementContainer = document.getElementById('stripe-element-main');
        const paymentErrorMain = document.getElementById('payment-error-main');
        const paymentSubmitBtn = document.getElementById('payment-submit-btn');
        
        if (!paymentSection || !stripeElementContainer || !paymentErrorMain || !paymentSubmitBtn) {
            console.error('Payment form elements not found');
            return;
        }
        
        // Hide error messages and show container
        paymentErrorMain.style.display = 'none';
        
        // Create customer and payment intent
        createCustomerAndPaymentIntent()
            .then(({ customerId, paymentIntent }) => {
                if (!paymentIntent || !paymentIntent.client_secret) {
                    throw new Error('No valid payment intent returned');
                }
                
                // Store payment intent for later use
                window.paymentIntent = paymentIntent;
                
                // Initialize Stripe Elements
                return initializeStripeElements(paymentIntent.client_secret);
            })
            .then(() => {
                // Show payment button
                paymentSubmitBtn.style.display = 'block';
                paymentSubmitBtn.disabled = false;
                
                // Set up payment submission
                setupPaymentSubmission();
            })
            .catch(error => {
                console.error('Error initializing payment form:', error);
                paymentErrorMain.textContent = `Error initializing payment: ${error.message}`;
                paymentErrorMain.style.display = 'block';
            });
        
        // Create customer and payment intent
        async function createCustomerAndPaymentIntent() {
            // Get form data
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                company: document.getElementById('companyName')?.value || '',
                address: {
                    line1: document.getElementById('streetAddress').value,
                    line2: document.getElementById('streetAddress2')?.value || '',
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    postal_code: document.getElementById('postalCode').value,
                    country: document.getElementById('countryCode').value
                },
                shipping: {
                    name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
                    phone: document.getElementById('phone').value,
                    address: {
                        line1: document.getElementById('streetAddress').value,
                        line2: document.getElementById('streetAddress2')?.value || '',
                        city: document.getElementById('city').value,
                        state: document.getElementById('state').value,
                        postal_code: document.getElementById('postalCode').value,
                        country: document.getElementById('countryCode').value
                    }
                }
            };
            
            // Create customer
            const customerResponse = await fetch('https://duckpond.smartducks.works/webhook/create-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    type: 'create_customer',
                    data: formData
                })
            });
            
            if (!customerResponse.ok) {
                throw new Error(`Failed to create customer: ${customerResponse.statusText}`);
            }
            
            const customerData = await customerResponse.json();
            const customerId = customerData.id;
            
            // Store customer ID
            window.customerId = customerId;
            
            // Get order total from the page
            const orderTotalElement = document.getElementById('orderTotal');
            const orderTotalText = orderTotalElement ? orderTotalElement.textContent : '$0.00';
            const orderTotal = parseFloat(orderTotalText.replace(/[^0-9.]/g, ''));
            
            // Get selected shipping quote
            const selectedQuote = window.selectedShippingQuote;
            
            // Create payment intent
            const paymentIntentResponse = await fetch('https://duckpond.smartducks.works/webhook/payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    type: 'create_payment_intent',
                    data: {
                        amount: Math.round(orderTotal * 100), // Convert to cents
                        currency: 'cad',
                        customer: customerId,
                        shipping: formData.shipping,
                        quote: selectedQuote
                    }
                })
            });
            
            if (!paymentIntentResponse.ok) {
                throw new Error(`Failed to create payment intent: ${paymentIntentResponse.statusText}`);
            }
            
            const paymentIntentData = await paymentIntentResponse.json();
            
            return {
                customerId,
                paymentIntent: {
                    id: paymentIntentData.id,
                    client_secret: paymentIntentData.clientSecret
                }
            };
        }
        
        // Initialize Stripe Elements
        function initializeStripeElements(clientSecret) {
            // Get Stripe publishable key based on environment
            const stripePublishableKey = 'pk_live_51OdQs9I8fHaR6Zh5tPDDC7BzMD8GVsOD9E1gvYkJIBjwB0K4hBPvT4hs6FpXIGUVvKvs0NqSJIqZGXshiG9OcXQp00UjtYQ1WV';
            
            // Initialize Stripe
            const stripe = Stripe(stripePublishableKey);
            
            // Store Stripe instance
            window.stripe = stripe;
            
            // Create elements instance
            const elements = stripe.elements({
                clientSecret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#1f6685'
                    }
                }
            });
            
            // Create payment element
            const paymentElement = elements.create('payment', {
                layout: {
                    type: 'tabs',
                    defaultCollapsed: false
                },
                defaultValues: {
                    billingDetails: {
                        name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
                        email: document.getElementById('email').value,
                        phone: document.getElementById('phone').value,
                        address: {
                            line1: document.getElementById('streetAddress').value,
                            line2: document.getElementById('streetAddress2')?.value || '',
                            city: document.getElementById('city').value,
                            state: document.getElementById('state').value,
                            postal_code: document.getElementById('postalCode').value,
                            country: document.getElementById('countryCode').value
                        }
                    }
                }
            });
            
            // Mount payment element
            paymentElement.mount(stripeElementContainer);
            
            // Store elements for later use
            window.stripeElements = elements;
            
            return elements;
        }
        
        // Set up payment submission
        function setupPaymentSubmission() {
            const paymentSubmitBtn = document.getElementById('payment-submit-btn');
            const paymentErrorMain = document.getElementById('payment-error-main');
            const paymentSuccessMain = document.getElementById('payment-success-main');
            const processingPaymentMain = document.getElementById('processing-payment-main');
            
            if (!paymentSubmitBtn || !paymentErrorMain || !paymentSuccessMain || !processingPaymentMain) {
                console.error('Payment submission elements not found');
                return;
            }
            
            // Remove any existing event listeners by cloning
            const oldBtn = paymentSubmitBtn;
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            
            // Get new reference
            const submitBtn = document.getElementById('payment-submit-btn');
            
            // Add event listener for payment submission
            submitBtn.addEventListener('click', async function(event) {
                event.preventDefault();
                
                if (!window.stripe || !window.stripeElements) {
                    paymentErrorMain.textContent = 'Payment system not initialized properly. Please refresh and try again.';
                    paymentErrorMain.style.display = 'block';
                    return;
                }
                
                // Hide error and show processing indicator
                paymentErrorMain.style.display = 'none';
                paymentSuccessMain.style.display = 'none';
                processingPaymentMain.style.display = 'block';
                submitBtn.disabled = true;
                
                try {
                    // Confirm payment
                    const { error, paymentIntent } = await window.stripe.confirmPayment({
                        elements: window.stripeElements,
                        confirmParams: {
                            return_url: `${window.location.origin}/payment-confirmation.html`
                        },
                        redirect: 'if_required'
                    });
                    
                    // Hide processing indicator
                    processingPaymentMain.style.display = 'none';
                    
                    if (error) {
                        // Show error message
                        paymentErrorMain.textContent = error.message;
                        paymentErrorMain.style.display = 'block';
                        submitBtn.disabled = false;
                    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                        // Show success message
                        paymentSuccessMain.textContent = 'Payment successful! Your order has been placed.';
                        paymentSuccessMain.style.display = 'block';
                        
                        // Redirect to confirmation page
                        setTimeout(() => {
                            window.location.href = '/payment-confirmation.html?status=success';
                        }, 2000);
                    } else {
                        // Show processing message
                        paymentSuccessMain.textContent = 'Processing payment... You may need to complete additional steps.';
                        paymentSuccessMain.style.display = 'block';
                    }
                } catch (err) {
                    // Hide processing indicator and show error
                    processingPaymentMain.style.display = 'none';
                    paymentErrorMain.textContent = `Unexpected error: ${err.message}`;
                    paymentErrorMain.style.display = 'block';
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Set up cancel payment button
        const cancelPaymentBtn = document.getElementById('cancelPaymentProcess');
        
        if (cancelPaymentBtn) {
            cancelPaymentBtn.addEventListener('click', function() {
                if (paymentSection) paymentSection.style.display = 'none';
                
                // Clear elements if needed
                if (window.stripeElements) {
                    stripeElementContainer.innerHTML = '';
                }
            });
        }
    }

    // Run all fixes
    function initFixes() {
        try {
            console.log('Running SmartDucks form fixes...');
            
            // Create a flag to prevent multiple initializations
            if (window._fixesInitialized) {
                console.log('Fixes already initialized, skipping');
                return;
            }
            window._fixesInitialized = true;
            
            // Define the states object first to ensure it's available for all functions
            if (typeof window.states !== 'object') {
                window.states = {
                    US: {
                        AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
                        CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
                        HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
                        KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
                        MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
                        MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
                        NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
                        ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
                        RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
                        TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
                        WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
                    },
                    CA: {
                        AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
                        NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', ON: 'Ontario',
                        PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan'
                    }
                };
            }
            
            // Apply state/province fix FIRST with a clean approach that replaces DOM elements
            function applyStateProvinceFix() {
                console.log('Applying robust state/province fix...');
                
                // Get fresh references
                const countrySelect = document.getElementById('countryCode');
                const stateSelect = document.getElementById('state');
                
                if (!countrySelect || !stateSelect) {
                    console.log('Form elements not found, retrying in 500ms...');
                    setTimeout(applyStateProvinceFix, 500);
                    return;
                }
                
                // Replace the country select element to clear all event listeners
                const newCountrySelect = countrySelect.cloneNode(true);
                countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);
                
                // Replace the state select element too for good measure
                const newStateSelect = stateSelect.cloneNode(true);
                stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);
                
                // Get fresh references after replacement
                const freshCountrySelect = document.getElementById('countryCode');
                const freshStateSelect = document.getElementById('state');
                
                // Define updateStateOptions in the window scope for global access
                window.updateStateOptions = function(country) {
                    console.log('Updating state options for country:', country);
                    
                    // Always get fresh references
                    const stateSelect = document.getElementById('state');
                    if (!stateSelect) {
                        console.error("State select element not available");
                        return;
                    }
                    
                    // Clear options
                    stateSelect.innerHTML = '<option value="" disabled selected>Select State/Province</option>';
                    
                    // Exit early if no country selected
                    if (!country || !window.states[country]) {
                        stateSelect.disabled = true;
                        return;
                    }
                    
                    // Add options sorted alphabetically
                    Object.entries(window.states[country])
                        .sort((a, b) => a[1].localeCompare(b[1]))
                        .forEach(([code, name]) => {
                            const option = document.createElement('option');
                            option.value = code;
                            option.textContent = name;
                            stateSelect.appendChild(option);
                        });
                    
                    // Enable the select
                    stateSelect.disabled = false;
                    
                    // Update labels and validation
                    const isCanada = country === 'CA';
                    const postalInput = document.getElementById('postalCode');
                    if (postalInput) {
                        postalInput.pattern = isCanada ? '[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]' : '\\d{5}(-\\d{4})?';
                        postalInput.placeholder = isCanada ? 'A1A 1A1' : '12345 or 12345-6789';
                    }
                    
                    // Update label
                    const stateLabel = document.querySelector('label[for="state"]');
                    if (stateLabel) {
                        stateLabel.textContent = isCanada ? 'Province*' : 'State*';
                    }
                    
                    console.log(`State/Province selector updated for ${country} with ${Object.keys(window.states[country]).length} options`);
                };
                
                // Define a clear event handler for country changes
                window.handleCountryChange = function() {
                    const countrySelect = document.getElementById('countryCode');
                    if (!countrySelect) return;
                    
                    const country = countrySelect.value;
                    console.log("Country changed to:", country);
                    
                    // Update state options
                    window.updateStateOptions(country);
                    
                    // Clear postal code
                    const postalInput = document.getElementById('postalCode');
                    if (postalInput) postalInput.value = '';
                };
                
                // Add the change event handler with our named function
                freshCountrySelect.removeEventListener('change', window.handleCountryChange);
                freshCountrySelect.addEventListener('change', window.handleCountryChange);
                
                // Initialize with current country value
                if (freshCountrySelect.value) {
                    console.log('Country already selected, updating state options:', freshCountrySelect.value);
                    window.updateStateOptions(freshCountrySelect.value);
                } else {
                    // Disable state select if no country selected
                    freshStateSelect.disabled = true;
                }
                
                console.log('State/province fix applied successfully');
                
                // Return true to indicate success
                return true;
            }
            
            // Apply the state/province fix FIRST and only continue if successful
            const stateFixApplied = applyStateProvinceFix();
            
            // Now apply the other fixes
            fixPostalCodeFormatting();
            fixFormSubmission();
            
            // Add a more reliable monitoring mechanism for state/province selector
            function monitorStateSelector() {
                const countrySelect = document.getElementById('countryCode');
                const stateSelect = document.getElementById('state');
                
                if (countrySelect && stateSelect) {
                    // Check if country has a value but state is disabled or has no options
                    if (countrySelect.value && (stateSelect.disabled || stateSelect.options.length <= 1)) {
                        console.log('State monitor: State selector broken after reload - fixing...');
                        
                        // Completely replace both elements to clear all event handlers
                        const newCountrySelect = countrySelect.cloneNode(true);
                        countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);
                        
                        const newStateSelect = stateSelect.cloneNode(true);
                        stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);
                        
                        // Get fresh references
                        const freshCountrySelect = document.getElementById('countryCode');
                        const freshStateSelect = document.getElementById('state');
                        
                        // Add event listener again
                        freshCountrySelect.addEventListener('change', window.handleCountryChange);
                        
                        // Update state options
                        window.updateStateOptions(freshCountrySelect.value);
                        freshStateSelect.disabled = false;
                    }
                }
                
                // Continue monitoring every 1 second for the first minute, then every 30 seconds
                const nextInterval = window._monitorCount && window._monitorCount < 60 ? 1000 : 30000;
                window._monitorCount = (window._monitorCount || 0) + 1;
                
                setTimeout(monitorStateSelector, nextInterval);
            }
            
            // Start monitoring immediately
            monitorStateSelector();
            
        } catch (err) {
            console.error('Error during SmartDucks form fixes initialization:', err);
        }
    }
    
    // Run immediately if DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('Document already loaded, initializing fixes immediately');
        initFixes();
    } else {
        console.log('Document still loading, waiting for DOMContentLoaded event');
        document.addEventListener('DOMContentLoaded', initFixes);
    }
    
    // Add additional window.load event handler for extra assurance
    window.addEventListener('load', function() {
        console.log('Window load event triggered - ensuring state/province selector works');
        
        // Make sure fixes run even if they didn't run earlier
        if (!window._fixesInitialized) {
            console.log('Fixes not initialized before window load, running now');
            initFixes();
        }
        
        // Final verification after a short delay to ensure DOM is fully ready
        setTimeout(function() {
            const countrySelect = document.getElementById('countryCode');
            const stateSelect = document.getElementById('state');
            
            if (countrySelect && stateSelect) {
                console.log('Final window.load check: Verifying state selector');
                
                if (countrySelect.value) {
                    if (stateSelect.disabled || stateSelect.options.length <= 1) {
                        console.log('State selector broken at window.load - fixing immediately');
                        
                        // Force a clean slate by replacing elements
                        const newCountrySelect = countrySelect.cloneNode(true);
                        countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);
                        
                        const newStateSelect = stateSelect.cloneNode(true);
                        stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);
                        
                        // Get fresh references
                        const freshCountrySelect = document.getElementById('countryCode');
                        freshCountrySelect.addEventListener('change', window.handleCountryChange);
                        
                        // Re-initialize the state options
                        window.updateStateOptions(freshCountrySelect.value);
                        
                        // Ensure state select is enabled
                        document.getElementById('state').disabled = false;
                    } else {
                        console.log('State selector appears to be working correctly');
                    }
                }
            }
        }, 500);
    });
})();
