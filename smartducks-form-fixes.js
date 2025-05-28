// Consolidated fixes for SmartDucks payment form - Fresh implementation
// Version: 2024-05-24 
// Focus: Properly handling state/province selection and postal code formatting

/***************************************************************************************************
 * IMPORTANT NOTE FOR DEBUGGING:
 * 
 * The browser logs indicate that a function named `integrateDeeplyHandler` is active and
 * that `_shippingFixHandler` might be creating a modal (around line 756 of the executed script).
 * 
 * 1. `integrateDeeplyHandler` IS CONFLICTING with `initializeFormStepHandlers`.
 *    `integrateDeeplyHandler` and all its calls MUST BE REMOVED from your script.
 *    It appears to be cloning buttons and adding its own event listeners, which breaks
 *    the listeners set up by `initializeFormStepHandlers`.
 * 
 * 2. `_shippingFixHandler` MUST NOT create any dynamic modal for shipping options.
 *    It should ONLY populate the existing HTML element `div#shippingOptionsList`.
 *    The version of `_shippingFixHandler` below (lines 370-700 approx.) does this correctly.
 *    Ensure the version in your executed script matches this behavior and removes any
 *    modal creation logic (e.g., what might be at line 756 in your logs).
 * 
 * The `initializeFormStepHandlers` function (defined below) is intended to be the
 * SOLE controller for form progression steps after a shipping option is selected.
 ***************************************************************************************************/

(function() {
    console.log('SmartDucks form fixes loaded - Fresh implementation');
    
    // Define our states data (US states and Canadian provinces)
    const statesData = {
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

    // Simple helper to ensure an element exists with improved reliability
    function waitForElement(selector, callback, maxAttempts = 50) {
        let attempts = 0;
        
        function checkElement() {
            attempts++;
            const element = document.querySelector(selector);
            
            if (element) {
                callback(element);
                return true;
            } else if (attempts >= maxAttempts) {
                console.error(`Element ${selector} not found after ${maxAttempts} attempts`);
                return false;
            } else {
                console.log(`Waiting for ${selector}... (attempt ${attempts}/${maxAttempts})`);
                setTimeout(checkElement, 100);
                return false;
            }
        }
        
        return checkElement();
    }
    
    // Ensure this function is robust for Canadian and US postal codes
    function formatPostalCode(country, value) {
        if (typeof value !== 'string') {
            return '';
        }

        let originalValue = value;
        value = value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Keep only alphanumeric

        if (country === 'CA') {
            // Canadian Postal Code: A1A 1A1
            if (value.length > 3) {
                value = value.substring(0, 3) + ' ' + value.substring(3);
            }
            if (value.length > 7) { // Max length "A1A 1A1"
                value = value.substring(0, 7);
            }
        } else if (country === 'US') {
            // US ZIP Code: 12345 or 12345-6789
            if (value.length > 5) {
                value = value.substring(0, 5) + '-' + value.substring(5);
            }
            if (value.length > 10) { // Max length "12345-6789"
                value = value.substring(0, 10);
            }
        } else {
            // For other countries, just return the cleaned alphanumeric value or original if preferred
            return originalValue.replace(/[^A-Z0-9\\s-]/gi, ''); // Allow spaces and hyphens for others
        }
        return value;
    }

    // Function to update state/province options based on selected country
    function updateStateOptions(country) {
        console.log('Updating state options for country:', country);
        
        const stateSelect = document.getElementById('state');
        if (!stateSelect) {
            console.error('State select element not found');
            return;
        }
        
        stateSelect.innerHTML = '<option value="" disabled selected>Select State/Province</option>';
        if (!country || !statesData[country]) {
            stateSelect.disabled = true;
            return;
        }
        
        Object.entries(statesData[country])
            .sort((a, b) => a[1].localeCompare(b[1]))
            .forEach(([code, name]) => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                stateSelect.appendChild(option);
            });
        
        stateSelect.disabled = false;
        
        const isCanada = country === 'CA';
        const stateLabel = document.querySelector('label[for="state"]');
        if (stateLabel) {
            stateLabel.textContent = isCanada ? 'Province*' : 'State*';
        }
        
        const postalInput = document.getElementById('postalCode');
        if (postalInput) {
            postalInput.pattern = isCanada ? '[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]' : '\\\\d{5}(-\\\\d{4})?';
            postalInput.placeholder = isCanada ? 'A1A 1A1' : '12345 or 12345-6789';
            
            postalInput.removeEventListener('input', window.handlePostalInput); 
            postalInput.addEventListener('input', window.handlePostalInput);

            if(postalInput.value){
                postalInput.value = formatPostalCode(country, postalInput.value);
            }
        }
        
        console.log(`Updated state select with ${Object.keys(statesData[country]).length} options`);
    }

    // Main function to initialize the state/province and postal code fixes
    function initStateProvinceFix() {
        console.log('Initializing state/province selector fix');
            
        waitForElement('#countryCode', (countrySelect) => {
            waitForElement('#state', (stateSelect) => {
                console.log('Both country and state selectors found, applying fix');

                const currentCountryValue = countrySelect.value;

                const newCountrySelect = countrySelect.cloneNode(true);
                countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);

                const newStateSelect = stateSelect.cloneNode(true);
                stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);

                const freshCountrySelect = document.getElementById('countryCode');
                const freshStateSelect = document.getElementById('state');
                
                function handleCountryChange() {
                    console.log('Country changed to:', this.value);
                    updateStateOptions(this.value);
                }
                
                freshCountrySelect.addEventListener('change', handleCountryChange);
                
                if (currentCountryValue) {
                    console.log('Country already selected, initializing states for:', currentCountryValue);
                    freshCountrySelect.value = currentCountryValue;
                    updateStateOptions(currentCountryValue);
                    
                    const postalInput = document.getElementById('postalCode');
                    if (postalInput && postalInput.value) {
                        postalInput.value = formatPostalCode(currentCountryValue, postalInput.value);
                    }
                } else {
                    console.log('No country selected yet, state select will initialize when country is chosen');
                    freshStateSelect.disabled = true;
                }
                
                const postalInput = document.getElementById('postalCode');
                if (postalInput) {
                    window.handlePostalInput = function(event) {
                        const countrySelect = document.getElementById('countryCode');
                        const country = countrySelect ? countrySelect.value : 'CA'; 
                        
                        let cursorPos = this.selectionStart;
                        const originalValue = this.value;
                        const formattedValue = formatPostalCode(country, originalValue);
                        
                        if (formattedValue !== originalValue) {
                            this.value = formattedValue;
                            if (country === 'CA' && originalValue.length === 6 && formattedValue.length === 7 && cursorPos > 3) {
                                cursorPos++;
                            }
                            else if (country === 'US' && originalValue.length === 9 && formattedValue.length === 10 && cursorPos > 5) {
                                cursorPos++;
                            }
                            else if (formattedValue.length !== originalValue.length) {
                                cursorPos = Math.max(0, cursorPos + (formattedValue.length - originalValue.length));
                            }
                            
                            cursorPos = Math.min(cursorPos, formattedValue.length);
                            this.setSelectionRange(cursorPos, cursorPos);
                        }
                    };
                    
                    postalInput.removeEventListener('input', window.handlePostalInput);
                    postalInput.addEventListener('input', window.handlePostalInput);
                    
                    console.log('ShippingFix: Postal code formatting handlers (re)applied.');

                    if (postalInput.value) {
                        const currentCountry = document.getElementById('countryCode') ? document.getElementById('countryCode').value : 'CA';
                        postalInput.value = formatPostalCode(currentCountry, postalInput.value);
                    }
                }
                
                console.log('State/province fix successfully applied');
            });
        });
    }

    // Set up a monitoring function to ensure the fix stays applied
    function monitorStateProvince() {
        const countrySelect = document.getElementById('countryCode');
        const stateSelect = document.getElementById('state');
        
        if (countrySelect && stateSelect) {
            if (countrySelect.value && (stateSelect.disabled || stateSelect.options.length <= 1)) {
                console.log('Monitor detected broken state selector - fixing');
                
                try {
                    const newCountrySelect = countrySelect.cloneNode(true);
                    countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);
                    
                    const newStateSelect = stateSelect.cloneNode(true);
                    stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);
                    
                    const freshCountrySelect = document.getElementById('countryCode');
                    
                    if (window.handleCountryChange) { // Assuming handleCountryChange is defined in a scope accessible to monitor
                        freshCountrySelect.addEventListener('change', window.handleCountryChange);
                    } else { // Fallback if handleCountryChange is not globally available
                        freshCountrySelect.addEventListener('change', function() {
                            updateStateOptions(this.value);
                        });
                    }
                    
                    freshCountrySelect.value = countrySelect.value; // Preserve current value
                    
                    updateStateOptions(freshCountrySelect.value);
                    
                    const postalInput = document.getElementById('postalCode');
                    if (postalInput && window.handlePostalInput) { // Ensure handler exists
                        postalInput.removeEventListener('input', window.handlePostalInput);
                        postalInput.addEventListener('input', window.handlePostalInput);
                        
                        if (postalInput.value) {
                            const currentCountry = freshCountrySelect.value || 'CA';
                            const formatted = formatPostalCode(currentCountry, postalInput.value);
                            if (formatted !== postalInput.value) {
                                postalInput.value = formatted;
                            }
                        }
                    }
                    console.log('State selector and postal code handlers fixed by monitor');
                } catch (err) {
                    console.error('Error fixing state selector:', err);
                    try {
                        updateStateOptions(countrySelect.value);
                    } catch (innerErr) {
                        console.error('Fallback approach also failed:', innerErr);
                    }
                }
            }
        }
        
        const interval = window._monitorCount && window._monitorCount > 10 ? 5000 : 1000;
        window._monitorCount = (window._monitorCount || 0) + 1;
        
        setTimeout(monitorStateProvince, interval);
    }

    // Ensure form submission handler is properly working
    function runFixes() {
        console.log('ShippingFix: runFixes function execution started.');
        
        initStateProvinceFix(); 

        const addressForm = document.querySelector('form');
        
        if (!addressForm) {
            console.error('ShippingFix: No form found on page');
            return;
        }
        
        let submitButton = addressForm.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitButton) {
            submitButton = addressForm.querySelector('button.submit-button, .button[type="submit"], [class*="submit"], .btn-primary');
        }
        
        if (!submitButton) {
            console.error('ShippingFix: No submit button found');
            return;
        }
        
        console.log('ShippingFix: Found form and submit button');
        
        if (window._shippingFixHandler && addressForm._hasShippingFix) {
            console.log('ShippingFix: Removing previous handler to avoid duplicates');
            addressForm.removeEventListener('submit', window._shippingFixHandler);
            if (submitButton._clickHandler) {
                submitButton.removeEventListener('click', submitButton._clickHandler);
            }
        }
        
        window._shippingFixHandler = function(e) {
            console.log('ShippingFix: Form submission intercepted');
            
            e.preventDefault();
            e.stopPropagation();
            
            const loadingEl = document.createElement('div');
            loadingEl.id = 'sm-loading-indicator';
            loadingEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;';
            loadingEl.innerHTML = '<div style="background:white;padding:20px;border-radius:5px;">Loading shipping options...</div>';
            document.body.appendChild(loadingEl);
            
            let formDataObj = {};
            const formElements = addressForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        if (element.checked) {
                            formDataObj[element.name] = element.value;
                        }
                    } else if (element.type !== 'submit' && element.type !== 'button') {
                        formDataObj[element.name] = element.value;
                    }
                }
            }
            
            try {
                const formData = new FormData(addressForm);
                formData.forEach((value, key) => {
                    formDataObj[key] = value;
                });
            } catch (err) {
                console.error('ShippingFix: Error with FormData:', err);
            }
            
            let actionUrl = 'https://duckpond.smartducks.works/webhook/shiptime-rates';
            console.log('ShippingFix: Using direct webhook URL:', actionUrl);
            
            const n8nFormattedData = {
                type: 'shipping_quote',
                data: {
                    from: {
                        companyName: "SmartDucks.Works",
                        streetAddress: formDataObj.fromStreetAddress || "2053 Wildflower Drive",
                        city: formDataObj.fromCity || "Orleans",
                        state: formDataObj.fromState || "ON",
                        postalCode: formDataObj.fromPostalCode || "K1E 3R5",
                        countryCode: formDataObj.fromCountryCode || "CA",
                    },
                    to: {
                        companyName: formDataObj.companyName || formDataObj.lastName || "",
                        streetAddress: formDataObj.streetAddress || formDataObj.address || "",
                        city: formDataObj.city || "",
                        state: formDataObj.state || "",
                        postalCode: formDataObj.postalCode || "",
                        countryCode: formDataObj.countryCode || "CA",
                        attention: (formDataObj.firstName || "") + (formDataObj.firstName && formDataObj.lastName ? " " : "") + (formDataObj.lastName || ""),
                        email: formDataObj.email || "",
                        phone: formDataObj.phone || ""
                    },
                    packageType: "PACKAGE",
                    lineItems: [{
                        length: 12,
                        width: 5,
                        height: 5,
                        weight: 0.7,
                        declaredValue: { currency: "CAD", amount: 1000 },
                        description: "SmartDucks",
                        nmfcCode: "",
                        freightClass: "package"
                    }],
                    unitOfMeasurement: "IMPERIAL",
                    serviceOptions: ["APPOINTMENT"],
                    shipDate: new Date().toISOString().split('T')[0],
                    insuranceType: "NONE"
                }
            };

            function generateCSRFToken() {
                const timestamp = Date.now();
                if (!window._csrfFingerprint) {
                    window._csrfFingerprint = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
                }
                return `${timestamp}:${Math.random().toString(36).substring(2)}:${window._csrfFingerprint}`;
            }
            
            let csrfToken = '';
            const csrfField = document.querySelector('input[name="_csrf"], input[name="csrf_token"]');
            if (csrfField && csrfField.value) {
                csrfToken = csrfField.value;
            } else {
                csrfToken = generateCSRFToken();
            }
            
            let fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'request-method': 'POST',
                    'X-CSRF-Token': csrfToken,
                    'Origin': window.location.origin
                },
                body: JSON.stringify(n8nFormattedData),
                credentials: 'include',
                mode: 'cors'
            };
            
            fetch(actionUrl, fetchOptions)
            .then(response => {
                console.log('ShippingFix: Got response:', response.status, 'Content-Type:', response.headers.get('content-type'));
                const contentType = response.headers.get('content-type');
                let headerMap = {};
                response.headers.forEach((value, name) => {
                    name = name.toLowerCase();
                    if (name.startsWith('access-control-')) {
                        if (headerMap[name]) {
                            headerMap[name].isDuplicate = true;
                            headerMap[name].values.push(value);
                        } else {
                            headerMap[name] = { value: value, isDuplicate: false, values: [value] };
                        }
                    }
                });
                const duplicateHeaders = Object.keys(headerMap).filter(key => headerMap[key].isDuplicate);
                if (duplicateHeaders.length > 0) {
                    console.error('ShippingFix: Duplicate CORS headers found:', duplicateHeaders.join(', '));
                    return { success: false, error: 'CORS configuration issue on server', cors_error: true, duplicate_headers: duplicateHeaders };
                }

                return response.text().then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error('ShippingFix: JSON parse error:', e, 'Raw text:', text.substring(0,500));
                        if (!text.trim()) return { success: false, error: 'Empty response from server' };
                        if (text.includes('<html') || text.includes('<!DOCTYPE')) return { html: text, success: false, error: 'Server returned HTML instead of JSON' };
                        return { success: false, error: 'Failed to parse server response as JSON', rawResponse: text };
                    }
                });
            })
            .then(data => {
                console.log('ShippingFix: Received data:', data);
                const loadingElExisting = document.getElementById('sm-loading-indicator');
                if (loadingElExisting && loadingElExisting.parentNode) loadingElExisting.parentNode.removeChild(loadingElExisting);

                if (!data) {
                    alert('Could not retrieve shipping options. No data received.');
                    return;
                }

                if (data.success === false) {
                    let userMessage = 'An error occurred while fetching shipping options.';
                    if (data.error) {
                        if (data.error.toLowerCase().includes("required field") || data.error.toLowerCase().includes("validation")) {
                            userMessage = "Please check your address details. Some required information might be missing or incorrect.";
                        } else if (data.error.toLowerCase().includes("no rates found") || data.error.toLowerCase().includes("no shipping options")) {
                            userMessage = "No shipping options could be found for the provided address. Please verify your address details.";
                        } else {
                             userMessage = `Error: ${data.error}. Please try again.`;
                        }
                    }
                    const shippingOptionsListDiv = document.getElementById('shippingOptionsList');
                    if (shippingOptionsListDiv) {
                        shippingOptionsListDiv.innerHTML = `<p style="color: red;">${userMessage}</p>`;
                        const shippingOptionsDiv = document.getElementById('shippingOptions');
                        if (shippingOptionsDiv) shippingOptionsDiv.style.display = 'block';
                    } else {
                        alert(userMessage);
                    }
                    return;
                }
                
                let quotes = (data && data.rates && Array.isArray(data.rates)) ? data.rates : 
                             (data.quotes && Array.isArray(data.quotes)) ? data.quotes : [];

                const shippingOptionsDiv = document.getElementById('shippingOptions');
                const shippingOptionsListEl = document.getElementById('shippingOptionsList');

                if (!shippingOptionsDiv || !shippingOptionsListEl) {
                    console.error('ShippingFix: #shippingOptions or #shippingOptionsList element not found. Cannot display rates.');
                    // CRITICAL: DO NOT CREATE A MODAL HERE. This was a source of issues.
                    // If these elements are not found, it's an HTML structure problem.
                    alert('Error: Required shipping display elements are missing from the page.');
                    return;
                }

                // Replace previous diagnostic logs (DEBUG_MARKER_1, [Diag SFH Pre-Clear V2], etc.)
                console.log('SFH_DEBUG_V4: shippingOptionsListEl is:', shippingOptionsListEl ? 'Found' : 'NOT FOUND');
                console.log('SFH_DEBUG_V4: PRE-CLEAR: finalActions exists?', document.getElementById('finalActions') ? 'Yes' : 'No');
                console.log('SFH_DEBUG_V4: PRE-CLEAR: proceedToPayment exists?', document.getElementById('proceedToPayment') ? 'Yes' : 'No');
                
                shippingOptionsListEl.innerHTML = ''; // Clear previous options

                console.log('SFH_DEBUG_V4: POST-CLEAR: finalActions exists?', document.getElementById('finalActions') ? 'Yes' : 'No');
                console.log('SFH_DEBUG_V4: POST-CLEAR: proceedToPayment exists?', document.getElementById('proceedToPayment') ? 'Yes' : 'No');

                if (quotes.length > 0) {
                    const ul = document.createElement('ul');
                    ul.className = 'list-group'; 
                    ul.style.listStyleType = 'none';
                    ul.style.paddingLeft = '0';

                    quotes.forEach((quote, index) => {
                        const li = document.createElement('li');
                        li.className = 'shipping-option'; // Ensure this class matches CSS for styling/selection

                        li.dataset.quoteId = quote.id || `quote-${index}-${Date.now()}`;
                        li.dataset.price = quote.cost;
                        li.dataset.carrierName = quote.carrier;
                        li.dataset.serviceName = quote.service;
                        li.dataset.currency = quote.currency;
                        li.dataset.deliveryDays = quote.delivery_days; 
                        li.dataset.option = `${quote.carrier} - ${quote.service}`;

                        const carrier = quote.carrier || 'N/A';
                        const service = quote.service || 'N/A';
                        const cost = quote.cost ? `$${parseFloat(quote.cost).toFixed(2)}` : 'Price N/A';
                        const currency = quote.currency || 'CAD';
                        // Ensure delivery_days is handled correctly, even if null or undefined from API
                        const transitTimeValue = quote.delivery_days;
                        const deliveryDays = (transitTimeValue !== null && transitTimeValue !== undefined && transitTimeValue !== 'null' && transitTimeValue !== 'undefined') 
                                           ? `${transitTimeValue} business day(s)` 
                                           : 'Not available';


                        li.innerHTML = `
                            <div class="shipping-option-header">
                                <strong>${carrier} - ${service}</strong>
                                <span class="price" style="font-weight: bold;">${cost} ${cost !== 'Price N/A' ? currency : ''}</span>
                            </div>
                            <div>
                                <small>Estimated Delivery: ${deliveryDays}</small>
                            </div>
                        `;

                        li.addEventListener('click', function() {
                            // Visually mark selection
                            const currentlySelected = ul.querySelector('.shipping-option.selected');
                            if (currentlySelected) {
                                currentlySelected.classList.remove('selected');
                                // You might also want to remove any specific styling applied directly for selection
                            }
                            this.classList.add('selected');
                            // Add specific styling if needed, e.g., this.style.backgroundColor = '#f0f0f0';


                            const eventDetail = {
                                quoteId: this.dataset.quoteId,
                                price: this.dataset.price,
                                option: this.dataset.option, // carrier - service
                                carrierName: this.dataset.carrierName,
                                serviceName: this.dataset.serviceName,
                                currency: this.dataset.currency,
                                transitTime: this.dataset.deliveryDays, // Pass the raw delivery_days value
                            };
                            console.log(`ShippingFix: Dispatching shipping-option-selected event with detail: ${JSON.stringify(eventDetail)}`);
                            document.dispatchEvent(new CustomEvent('shipping-option-selected', { detail: eventDetail }));

                            const confirmBtn = document.getElementById('confirmShipping');
                            if (confirmBtn) confirmBtn.disabled = false;
                        });
                        ul.appendChild(li);
                    });
                    shippingOptionsListEl.appendChild(ul);
                    if (shippingOptionsDiv) shippingOptionsDiv.style.display = 'block'; // Show the container

                    // Ensure confirm button is initially disabled until a selection is made
                    const confirmBtn = document.getElementById('confirmShipping');
                    if (confirmBtn) confirmBtn.disabled = true; 
                } else {
                    shippingOptionsListEl.innerHTML = '<p>No shipping options available for the provided address. Please check your details and try again.</p>';
                    if (shippingOptionsDiv) shippingOptionsDiv.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('ShippingFix: Error fetching shipping options:', error);
                const loadingElExistingCatch = document.getElementById('sm-loading-indicator');
                if (loadingElExistingCatch && loadingElExistingCatch.parentNode) loadingElExistingCatch.parentNode.removeChild(loadingElExistingCatch);

                const shippingOptionsListEl = document.getElementById('shippingOptionsList');
                if (shippingOptionsListEl) {
                    shippingOptionsListEl.innerHTML = `<p style="color: red;">Error loading shipping options: ${error.message}. Please try again.</p>`;
                    const shippingOptionsDiv = document.getElementById('shippingOptions');
                    if (shippingOptionsDiv) shippingOptionsDiv.style.display = 'block';
                } else {
                    alert('Error loading shipping options. Please try again.');
                }
            });
        }; // End of window._shippingFixHandler

        addressForm._hasShippingFix = true;
        addressForm.addEventListener('submit', window._shippingFixHandler);
        
        const buttonClickHandler = function(e) {
            console.log('ShippingFix: Submit Button clicked directly (aggressive handler)');
            e.preventDefault();
            e.stopPropagation(); 

            if (addressForm._isSubmitting) {
                console.log('ShippingFix: Form already submitting, ignoring click.');
                return;
            }
            addressForm._isSubmitting = true;
            
            window._shippingFixHandler({
                preventDefault: () => {},
                stopPropagation: () => {},
                submitter: submitButton 
            });
            
            setTimeout(() => {
                addressForm._isSubmitting = false;
            }, 2000); 
        };

        if (submitButton._clickHandler) {
            submitButton.removeEventListener('click', submitButton._clickHandler, true);
        }
        submitButton._clickHandler = buttonClickHandler;
        submitButton.addEventListener('click', buttonClickHandler, true);
        console.log('ShippingFix: Aggressive click handler (re-)attached to submit button.');
    } // End of runFixes function

    function initializeFormStepHandlers() {
        console.log('INITIALIZING FORM STEP HANDLERS - SCRIPT VERSION CHECKPOINT: MAY 28 2025 - SOS_DEBUG_V9_LONGER_DELAY');
        console.log('Initializing form step handlers (V9 - longer delay)');

        const shippingOptionsSection = document.getElementById('shippingOptions');
        const orderSummarySection = document.getElementById('orderSummary');
        const confirmShippingBtn = document.getElementById('confirmShipping');

        // Helper to hide sections
        function hideSection(section) {
            if (section) section.style.display = 'none';
        }

        // Helper to show sections
        function showSection(section, displayType = 'block') {
            if (section) section.style.display = displayType;
        }

        hideSection(orderSummarySection);
        
        const initialFinalActionsDiv = document.getElementById('finalActions');
        hideSection(initialFinalActionsDiv);
        const initialPaymentSection = document.getElementById('paymentSection');
        hideSection(initialPaymentSection);

        if (shippingOptionsSection) shippingOptionsSection.style.display = 'block';

        // 1. Global listener for when a shipping option is selected
        document.addEventListener('shipping-option-selected', function(event) {
            console.log('shipping-option-selected event caught by global listener', event.detail);
            if (!orderSummarySection) {
                console.error('Order summary section not found by shipping-option-selected listener.');
                return;
            }

            const { carrierName, serviceName, price, currency, transitTime } = event.detail;
            const transitDisplay = transitTime && transitTime !== 'null' && transitTime !== 'undefined' ? `${transitTime} business day(s)` : 'Not available';
            
            console.log('SOS_DEBUG_V2_DOM_MANIP: PRE-SUMMARY-UPDATE: finalActions exists?', document.getElementById('finalActions') ? 'Yes' : 'No');
            console.log('SOS_DEBUG_V2_DOM_MANIP: PRE-SUMMARY-UPDATE: proceedToPayment exists?', document.getElementById('proceedToPayment') ? 'Yes' : 'No');
            console.log('SOS_DEBUG_V2_DOM_MANIP: PRE-SUMMARY-UPDATE: orderSummarySection.outerHTML (first 100 chars):', orderSummarySection && orderSummarySection.outerHTML ? orderSummarySection.outerHTML.substring(0,100) : 'orderSummarySection NOT FOUND or no outerHTML');

            // Clear existing content
            while (orderSummarySection.firstChild) {
                orderSummarySection.removeChild(orderSummarySection.firstChild);
            }

            // Create and append new content
            const h4 = document.createElement('h4');
            h4.textContent = 'Order Summary';
            orderSummarySection.appendChild(h4);

            const pMethod = document.createElement('p');
            const strongMethod = document.createElement('strong');
            strongMethod.textContent = 'Shipping Method: ';
            pMethod.appendChild(strongMethod);
            pMethod.appendChild(document.createTextNode(`${carrierName} - ${serviceName}`));
            orderSummarySection.appendChild(pMethod);

            const pCost = document.createElement('p');
            const strongCost = document.createElement('strong');
            strongCost.textContent = 'Cost: ';
            pCost.appendChild(strongCost);
            pCost.appendChild(document.createTextNode(`$${parseFloat(price).toFixed(2)} ${currency}`));
            orderSummarySection.appendChild(pCost);

            const pDelivery = document.createElement('p');
            const strongDelivery = document.createElement('strong');
            strongDelivery.textContent = 'Estimated Delivery: ';
            pDelivery.appendChild(strongDelivery);
            pDelivery.appendChild(document.createTextNode(transitDisplay));
            orderSummarySection.appendChild(pDelivery);

            console.log('SOS_DEBUG_V2_DOM_MANIP: POST-SUMMARY-UPDATE: finalActions exists?', document.getElementById('finalActions') ? 'Yes' : 'No');
            console.log('SOS_DEBUG_V2_DOM_MANIP: POST-SUMMARY-UPDATE: proceedToPayment exists?', document.getElementById('proceedToPayment') ? 'Yes' : 'No');
            
            showSection(orderSummarySection);
            if (confirmShippingBtn) confirmShippingBtn.disabled = false;
        });

        // Define the handler function for "Proceed to Payment"
        // Moved definition before onConfirmShippingClickHandler for clarity
        function onProceedToPaymentClick(event) { // Added event parameter
            console.log('[PROCEED_TO_PAYMENT] Click handler fired.');
            if (event) {
                console.log(`[PROCEED_TO_PAYMENT] Event details: type=${event.type}, isTrusted=${event.isTrusted}, timeStamp=${event.timeStamp}`);
                console.log(`[PROCEED_TO_PAYMENT] Event target:`, event.target);
                console.log(`[PROCEED_TO_PAYMENT] Event currentTarget:`, event.currentTarget);
            } else {
                console.log('[PROCEED_TO_PAYMENT] Event object was not received by handler.');
            }
            
            const currentFinalActions = document.getElementById('finalActions');
            const paymentSection = document.getElementById('paymentSection');
            const thisButton = document.getElementById('proceedToPayment'); 

            console.log(`[PROCEED_TO_PAYMENT] finalActions current display: ${currentFinalActions ? getComputedStyle(currentFinalActions).display : 'NOT FOUND'}`);
            console.log(`[PROCEED_TO_PAYMENT] proceedToPaymentButton current disabled state: ${thisButton ? thisButton.disabled : 'NOT FOUND'}`); // 'this' would refer to the button here
            console.log(`[PROCEED_TO_PAYMENT] paymentSection current display: ${paymentSection ? getComputedStyle(paymentSection).display : 'NOT FOUND'}`);

            if (currentFinalActions) {
                currentFinalActions.style.display = 'none';
                console.log(`[PROCEED_TO_PAYMENT] currentFinalActions.style.display set to 'none'. Actual: ${currentFinalActions.style.display}. Computed: ${getComputedStyle(currentFinalActions).display}`);
            } else {
                console.warn('[PROCEED_TO_PAYMENT] Final actions section not found when trying to hide for payment.');
            }

            if (paymentSection) {
                paymentSection.style.display = 'block';
                console.log(`[PROCEED_TO_PAYMENT] paymentSection.style.display set to 'block'. Actual: ${paymentSection.style.display}. Computed: ${getComputedStyle(paymentSection).display}`);
            } else {
                console.error('[PROCEED_TO_PAYMENT] Payment section not found, cannot show.');
            }
        }

        // 2. Handler for "Confirm Shipping" button
        if (confirmShippingBtn) {
            confirmShippingBtn.addEventListener('click', function onConfirmShippingClickHandler(event) { 
                console.log('Confirm Shipping button clicked (Updated Logic V9 - longer delay)');
                event.stopPropagation();
                event.preventDefault();  

                console.log('[Diag V2] Checking document body for element IDs...');
                if (document && document.body && typeof document.body.outerHTML === 'string') {
                    console.log('[Diag V2] document.body.outerHTML length:', document.body.outerHTML.length);
                    const finalActionsHTMLCheck = document.body.outerHTML.includes('id="finalActions"');
                    const proceedToPaymentHTMLCheck = document.body.outerHTML.includes('id="proceedToPayment"');
                    console.log(`[Diag V2] In document.body.outerHTML: id="finalActions" present: ${finalActionsHTMLCheck}, id="proceedToPayment" present: ${proceedToPaymentHTMLCheck}`);
                    if (!finalActionsHTMLCheck) console.log('[Diag V2] #finalActions was NOT found in document.body.outerHTML.');
                    if (!proceedToPaymentHTMLCheck) console.log('[Diag V2] #proceedToPayment was NOT found in document.body.outerHTML.');
                } else {
                    console.error('[Diag V2] document.body.outerHTML is not available or not a string.');
                }

                const currentShippingOptionsSection = document.getElementById('shippingOptions');
                const currentOrderSummarySection = document.getElementById('orderSummary');
                
                console.log('[Diag CSC] --- Element States Before Changes (queried on demand) ---');
                console.log('[Diag CSC] currentShippingOptionsSection:', currentShippingOptionsSection ? `Found, display: ${getComputedStyle(currentShippingOptionsSection).display}` : 'NOT FOUND');
                console.log('[Diag CSC] currentOrderSummarySection:', currentOrderSummarySection ? `Found, display: ${getComputedStyle(currentOrderSummarySection).display}` : 'NOT FOUND');
                // Query finalActionsDiv and proceedToPaymentButton here for logging, before the setTimeout
                const finalActionsDivForLog = document.getElementById('finalActions'); 
                const proceedToPaymentButtonForLog = document.getElementById('proceedToPayment');
                console.log('[Diag CSC] finalActionsDiv (for log):', finalActionsDivForLog ? `Found, display: ${getComputedStyle(finalActionsDivForLog).display}` : 'NOT FOUND'); 
                console.log('[Diag CSC] proceedToPaymentButton (for log):', proceedToPaymentButtonForLog ? `Found, display: ${getComputedStyle(proceedToPaymentButtonForLog).display}, disabled: ${proceedToPaymentButtonForLog.disabled}` : 'NOT FOUND');
                console.log('[Diag CSC] confirmShippingButton (this):', this ? `Found, disabled: ${this.disabled}` : 'NOT FOUND (this is unexpected)');

                if (currentShippingOptionsSection) currentShippingOptionsSection.style.display = 'none';
                else console.error('[Diag CSC] currentShippingOptionsSection NOT FOUND, cannot hide.');

                if (currentOrderSummarySection) currentOrderSummarySection.style.display = 'block';
                else console.error('[Diag CSC] currentOrderSummarySection NOT FOUND, cannot show.');

                this.disabled = true; 

                setTimeout(() => {
                    const finalActionsDiv = document.getElementById('finalActions');
                    let originalProceedToPaymentButton = document.getElementById('proceedToPayment'); 

                    console.log(`[CONFIRM_SHIPPING_DEFERRED_V9_LONGER_DELAY] About to modify finalActions and proceedToPaymentButton.`);
                    console.log(`[CONFIRM_SHIPPING_DEFERRED_V9_LONGER_DELAY] finalActionsDiv found: ${!!finalActionsDiv}, original proceedToPaymentButton found: ${!!originalProceedToPaymentButton}`);
                    
                    if (finalActionsDiv) {
                        finalActionsDiv.style.display = 'block';
                        console.log(`[CONFIRM_SHIPPING_DEFERRED_V9_LONGER_DELAY] finalActionsDiv.style.display set to 'block'. Actual style: ${finalActionsDiv.style.display}. Computed style: ${getComputedStyle(finalActionsDiv).display}`);
                        
                        if (originalProceedToPaymentButton && originalProceedToPaymentButton.parentNode) {
                            const newProceedToPaymentButton = originalProceedToPaymentButton.cloneNode(true);
                            newProceedToPaymentButton.disabled = true; // Ensure clone is disabled initially
                            
                            originalProceedToPaymentButton.removeEventListener('click', onProceedToPaymentClick); // From original, just in case

                            originalProceedToPaymentButton.parentNode.replaceChild(newProceedToPaymentButton, originalProceedToPaymentButton);
                            console.log(`[CONFIRM_SHIPPING_DEFERRED_V9_LONGER_DELAY] Original proceedToPaymentButton replaced with a clone.`);
                            
                            newProceedToPaymentButton.addEventListener('click', onProceedToPaymentClick, { once: true });
                            console.log(`[CONFIRM_SHIPPING_DEFERRED_V9_LONGER_DELAY] Event listener attached to NEW proceedToPaymentButton with { once: true } while it is disabled.`);

                            setTimeout(() => {
                                const currentButtonInDom = document.getElementById('proceedToPayment');
                                if (currentButtonInDom === newProceedToPaymentButton) {
                                    newProceedToPaymentButton.disabled = false;
                                    console.log(`[CONFIRM_SHIPPING_DEFERRED_ENABLE_V9_LONGER_DELAY] NEW proceedToPaymentButton.disabled set to false. Actual state: ${newProceedToPaymentButton.disabled}`);
                                } else {
                                    console.error('[CONFIRM_SHIPPING_DEFERRED_ENABLE_V9_LONGER_DELAY] NEW proceedToPaymentButton was NOT FOUND or changed in DOM when trying to enable it after delay.');
                                    if (currentButtonInDom) {
                                        console.log('[CONFIRM_SHIPPING_DEFERRED_ENABLE_V9_LONGER_DELAY] A different button was found with ID proceedToPayment.');
                                    }
                                }
                            }, 300); // Increased delay to 300ms

                        } else {
                            console.error('[CONFIRM_SHIPPING_DEFERRED_V9_LONGER_DELAY] Original proceedToPaymentButton was NOT FOUND or has no parentNode when trying to clone.');
                        }
                    } else {
                        console.error('[CONFIRM_SHIPPING_DEFERRED_V9_LONGER_DELAY] finalActionsDiv was NOT FOUND when trying to show it.');
                    }
                }, 0); // End of main setTimeout
            }); // End of confirmShippingBtn event listener
        } else {
            console.warn('#confirmShipping button not found at init.');
        }

        // 3. Handler for "Proceed to Payment" button - Listener is now attached dynamically.
        // We can still check if the button exists at init for a warning if it's missing from HTML.
        const proceedToPaymentBtnForWarning = document.getElementById('proceedToPayment');
        if (!proceedToPaymentBtnForWarning) {
            console.warn('#proceedToPayment button not found in HTML at initial script load. Listener will be attached dynamically if button appears.');
        }
        
        // Initialize button states
        if (confirmShippingBtn) confirmShippingBtn.disabled = true;
        
        const ptpButtonForInitialDisable = document.getElementById('proceedToPayment');
        if (ptpButtonForInitialDisable) {
            ptpButtonForInitialDisable.disabled = true;
            // Explicitly remove any potential old listener for onProceedToPaymentClick, especially if it might have been added without {once: true}
            // This is a safeguard.
            ptpButtonForInitialDisable.removeEventListener('click', onProceedToPaymentClick);
        }


        console.log('Form step handlers initialized (V9).');
    }


    // Call runFixes and initializeFormStepHandlers after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            runFixes();
            initializeFormStepHandlers(); // This should be the main controller for form progression
        });
    } else {
        runFixes();
        initializeFormStepHandlers(); // This should be the main controller for form progression
    }

})(); // End of IIFE