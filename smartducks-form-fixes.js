console.log('SMARTDUCKS_FORM_FIXES.JS SCRIPT EXECUTION STARTED - TOP OF FILE - VERSION CHECKPOINT: MAY 29 2025 12:00 PM');

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
    console.log('SmartDucks form fixes loaded - Fresh implementation'); // This is line 29 (approx)

    // Restore the main body of the IIFE from SFH_V13_ENHANCED_LOGS / SOS_V10_SYNC_WITH_SFH_V13 version
    let isFetchingRates = false; 

    // Define our states data (US states and Canadian provinces)
    const states = {
        CA: [ // Canada
            { value: 'AB', text: 'Alberta' },
            { value: 'BC', text: 'British Columbia' },
            { value: 'MB', text: 'Manitoba' },
            { value: 'NB', text: 'New Brunswick' },
            { value: 'NL', text: 'Newfoundland and Labrador' },
            { value: 'NS', text: 'Nova Scotia' },
            { value: 'ON', text: 'Ontario' },
            { value: 'PE', text: 'Prince Edward Island' },
            { value: 'QC', text: 'Quebec' },
            { value: 'SK', text: 'Saskatchewan' },
            { value: 'NT', text: 'Northwest Territories' },
            { value: 'NU', text: 'Nunavut' },
            { value: 'YT', text: 'Yukon' }
        ],
        US: [ // United States
            { value: 'AL', text: 'Alabama' }, { value: 'AK', text: 'Alaska' }, { value: 'AZ', text: 'Arizona' },
            { value: 'AR', text: 'Arkansas' }, { value: 'CA', text: 'California' }, { value: 'CO', text: 'Colorado' },
            { value: 'CT', text: 'Connecticut' }, { value: 'DE', text: 'Delaware' }, { value: 'FL', text: 'Florida' },
            { value: 'GA', text: 'Georgia' }, { value: 'HI', text: 'Hawaii' }, { value: 'ID', text: 'Idaho' },
            { value: 'IL', text: 'Illinois' }, { value: 'IN', text: 'Indiana' }, { value: 'IA', text: 'Iowa' },
            { value: 'KS', text: 'Kansas' }, { value: 'KY', text: 'Kentucky' }, { value: 'LA', text: 'Louisiana' },
            { value: 'ME', text: 'Maine' }, { value: 'MD', text: 'Maryland' }, { value: 'MA', text: 'Massachusetts' },
            { value: 'MI', text: 'Michigan' }, { value: 'MN', text: 'Minnesota' }, { value: 'MS', text: 'Mississippi' },
            { value: 'MO', text: 'Missouri' }, { value: 'MT', text: 'Montana' }, { value: 'NE', text: 'Nebraska' },
            { value: 'NV', text: 'Nevada' }, { value: 'NH', text: 'New Hampshire' }, { value: 'NJ', text: 'New Jersey' },
            { value: 'NM', text: 'New Mexico' }, { value: 'NY', text: 'New York' }, { value: 'NC', text: 'North Carolina' },
            { value: 'ND', text: 'North Dakota' }, { value: 'OH', text: 'Ohio' }, { value: 'OK', text: 'Oklahoma' },
            { value: 'OR', text: 'Oregon' }, { value: 'PA', text: 'Pennsylvania' }, { value: 'RI', text: 'Rhode Island' },
            { value: 'SC', text: 'South Carolina' }, { value: 'SD', text: 'South Dakota' }, { value: 'TN', text: 'Tennessee' },
            { value: 'TX', text: 'Texas' }, { value: 'UT', text: 'Utah' }, { value: 'VT', text: 'Vermont' },
            { value: 'VA', text: 'Virginia' }, { value: 'WA', text: 'Washington' }, { value: 'WV', text: 'West Virginia' },
            { value: 'WI', text: 'Wisconsin' }, { value: 'WY', text: 'Wyoming' }
        ]
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
        console.log(`SFH_DEBUG: updateStateOptions called with country: '${country}'`); // More distinct log
        const stateSelect = document.getElementById('state');
        
        if (!stateSelect) {
            console.error('SFH_DEBUG: State select element (#state) not found in updateStateOptions.');
            return;
        }

        const stateContainer = stateSelect.closest('.form-group');
        if (!stateContainer) {
            console.error('SFH_DEBUG: State select container (.form-group wrapping #state) not found in updateStateOptions.');
            return; 
        }
        console.log('SFH_DEBUG: stateSelect and stateContainer found:', stateSelect, stateContainer);

        // Make the container visible by default, regardless of country selection initially
        stateContainer.style.display = ''; 
        stateSelect.innerHTML = ''; // Clear existing options

        if (country && states[country]) {
            console.log(`SFH_DEBUG: Populating states for ${country}. Count: ${states[country].length}`);
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "-- Select State/Province --";
            stateSelect.appendChild(defaultOption);

            states[country].forEach(state => {
                const option = document.createElement('option');
                option.value = state.value;
                option.textContent = state.text;
                stateSelect.appendChild(option);
            });
            stateSelect.disabled = false;
            console.log(`SFH_DEBUG: State field populated and enabled for ${country}.`);
        } else {
            const placeholderOption = document.createElement('option');
            placeholderOption.value = "";
            // Update placeholder based on whether a country was *attempted* or if it's initial load
            if (country) { // Country was selected, but no states found (e.g. invalid country code)
                placeholderOption.textContent = "-- No states for selected country --";
                console.warn(`SFH_DEBUG: No states defined for country: ${country}. State field disabled.`);
            } else { // Initial load, no country selected yet
                placeholderOption.textContent = "-- Select Country First --";
                console.log('SFH_DEBUG: No country selected. State field disabled with placeholder.');
            }
            stateSelect.appendChild(placeholderOption);
            stateSelect.disabled = true;
        }
        // The container's display is now always '', so no need to log its style.display for visibility checks here.
    }

    // Function to apply postal code formatting based on country
    function applyPostalCodeFormatting(country) {
        console.log(`ShippingFix: Postal code formatting event listener setup for country: ${country}`);
        const postalCodeInput = document.getElementById('postalCode');
        if (!postalCodeInput) {
            console.warn('Postal code input (#postalCode) not found for formatting.');
            return;
        }

        if (postalCodeInput._formatHandler) {
            postalCodeInput.removeEventListener('input', postalCodeInput._formatHandler);
            delete postalCodeInput._formatHandler; // Clean up property
        }

        let formatHandler;
        if (country === 'CA') {
            formatHandler = function(e) {
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (value.length > 3 && value.charAt(3) !== ' ') {
                    value = value.slice(0, 3) + ' ' + value.slice(3);
                }
                e.target.value = value.slice(0, 7); // A1A 1A1
            };
        } else if (country === 'US') {
            formatHandler = function(e) {
                let value = e.target.value.replace(/[^0-9-]/g, ''); // Allow dash for ZIP+4 as it's typed
                // Basic validation: remove multiple dashes or dashes in wrong places
                value = value.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
                if (value.includes('-') && value.indexOf('-') !== 5) {
                     // If dash is present but not at 6th char (index 5), remove it and re-evaluate
                    value = value.replace(/-/g, '');
                }
                if (value.length > 5 && !value.includes('-')) {
                    value = value.slice(0, 5) + '-' + value.slice(5);
                }
                e.target.value = value.slice(0, 10); // 12345-6789
            };
        } else {
            formatHandler = function(e) { /* No specific formatting */ };
        }
        
        postalCodeInput._formatHandler = formatHandler;
        postalCodeInput.addEventListener('input', formatHandler);
        console.log('ShippingFix: Postal code formatting handlers (re)applied.');
    }

    // Main function to initialize the state/province and postal code fixes
    function initStateProvinceFix() {
        console.log('Initializing state/province selector fix (Reinserted 2025-05-29)');
        waitForElement('#countryCode', (countrySelect) => {
            console.log('Country selector (#countryCode) found, applying fix.');
            
            countrySelect.addEventListener('change', function() {
                console.log(`Country changed to: ${this.value}`);
                updateStateOptions(this.value);
                applyPostalCodeFormatting(this.value);
            });

            if (countrySelect.value) {
                console.log(`Initial country detected: ${countrySelect.value}`);
                updateStateOptions(countrySelect.value);
                applyPostalCodeFormatting(countrySelect.value);
            } else {
                console.log('No country selected initially. State/Province will be visible but disabled.');
                updateStateOptions(''); // Call with empty country to set initial placeholder and disabled state
                applyPostalCodeFormatting(''); // Apply no formatting
            }
            console.log('State/province and postal code fix event listeners attached.');
        }, 10000);
    }
    // END REGION: Country/State/Postal Code Logic

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

    function runFixes() {
        console.log('ShippingFix: runFixes function execution started.'); 
        initStateProvinceFix(); // This will call the initStateProvinceFix defined at the top of the IIFE

        const addressForm = document.querySelector('form');
        if (!addressForm) {
            console.error('ShippingFix: Address form not found. Cannot attach submission handler.');
            return;
        }
        
        let submitButton = addressForm.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitButton) {
            const buttons = addressForm.querySelectorAll('button');
            if (buttons.length > 0) {
                submitButton = buttons[buttons.length - 1]; // Fallback: use the last button in the form
                console.warn('ShippingFix: No explicit submit button found, using the last button in the form as a fallback:', submitButton);
            }
        }

        if (!submitButton) {
            console.error('ShippingFix: Submit button not found. Cannot attach submission handler.');
            return;
        }
        
        console.log('ShippingFix: Found form and submit button');
        
        // Remove old handler if it exists from previous script versions or re-runs
        if (window._shippingFixHandler && addressForm._hasShippingFix) {
            if (submitButton._clickHandler) { // Check if the aggressive handler was attached
                submitButton.removeEventListener('click', submitButton._clickHandler, true);
            } else { // Otherwise, assume the direct submit handler was attached
                addressForm.removeEventListener('submit', window._shippingFixHandler);
            }
        }
        
        window._shippingFixHandler = function(e) {
            // console.log('ShippingFix: e.preventDefault() NOT called.'); // DEBUG
            if (e && typeof e.stopPropagation === 'function') {
                // console.log('ShippingFix: e.stopPropagation() called.'); // DEBUG
                e.stopPropagation();
            }
            // console.log('ShippingFix: e.stopPropagation() NOT called.'); // DEBUG

            console.log('ShippingFix: Form submission intercepted - SFH_V13_ENHANCED_LOGS'); 

            if (isFetchingRates) { 
                console.log('ShippingFix: Already fetching rates, submission ignored.');
                return;
            }
            isFetchingRates = true; 

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
                    if (element.type === 'checkbox') {
                        formDataObj[element.name] = element.checked;
                    } else {
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
            
            console.log('ShippingFix: formDataObj:', JSON.stringify(formDataObj, null, 2));

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
                    insuranceType: "CARRIER" // Changed from "NONE" to "CARRIER"
                }
            };

            console.log('ShippingFix: n8nFormattedData (request payload):', JSON.stringify(n8nFormattedData, null, 2));

            function generateCSRFTokenInternal() { // Renamed to avoid conflict if global exists
                const timestamp = Date.now().toString();
                const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
                if (!window._csrfFingerprint) {
                    console.warn("CSRF Fingerprint not available on window object. Consider initializing it.");
                    window._csrfFingerprint = "fingerprint_not_set_" + Math.random().toString(36).substring(2);
                }
                return `${timestamp}:${randomPart}:${window._csrfFingerprint}`;
            }
            
            let csrfToken = '';
            const csrfInput = addressForm.querySelector('input[name="_csrf"], input[name="csrf_token"]');
            if (csrfInput && csrfInput.value) {
                csrfToken = csrfInput.value;
            } else {
                console.warn('ShippingFix: CSRF token input field not found or empty in the form. Generating a new one for the request.');
                csrfToken = generateCSRFTokenInternal();
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
                    const lowerName = name.toLowerCase();
                    if (headerMap[lowerName]) {
                        headerMap[lowerName].count++;
                        headerMap[lowerName].isDuplicate = true;
                    } else {
                        headerMap[lowerName] = { value: value, count: 1, isDuplicate: false };
                    }
                });
                const duplicateHeaders = Object.keys(headerMap).filter(key => headerMap[key].isDuplicate);
                if (duplicateHeaders.length > 0) {
                    console.warn('ShippingFix: Duplicate headers found in response:', duplicateHeaders.join(', '));
                }

                return response.text().then(text => {
                    console.log('ShippingFix: Raw text from server. Type: ' + typeof text + ', Length: ' + (text ? text.length : 'N/A') + ', Value: [' + text + ']');
                    let isTextEmptyOrNull = (text === null || (typeof text === 'string' && text.trim() === ""));
                    console.log('ShippingFix: Evaluating condition "(text === null || (typeof text === \'string\' && text.trim() === \"\" )): \"' + isTextEmptyOrNull);
                    // The line above should correctly log: (typeof text === 'string' && text.trim() === "")

                    if (isTextEmptyOrNull) {
                        console.warn('ShippingFix: Path A - Empty/null text detected. Treating as no rates found.');
                        return []; // Treat as no rates found, similar to an empty JSON array '[]'
                    } else {
                        console.log('ShippingFix: Path B - Text not considered empty/null by initial check. Attempting JSON.parse.');
                        try {
                            const parsedJson = JSON.parse(text);
                            console.log('ShippingFix: Path B.1 - JSON.parse successful.');
                            return parsedJson;
                        } catch (parseError) {
                            console.error('ShippingFix: Path B.2 - JSON.parse error:', parseError);
                            console.error('ShippingFix: Path B.2 - Original raw text that failed parsing. Type: ' + typeof text + ', Length: ' + (text ? text.length : 'N/A') + ', Value: [' + text + ']');
                            return { success: false, error: `JSON parse error: ${parseError.message}`, rawText: text, rates: [], quotes: [] };
                        }
                    }
                });
            })
            .then(data => {
                console.log('ShippingFix: Received data after parsing attempt:', data); 

                if (!data) {
                    console.error('ShippingFix: Parsed data is null or undefined. Cannot process rates.');
                    const shippingOptionsListDiv = document.getElementById('shippingOptionsList');
                    if (shippingOptionsListDiv) {
                        shippingOptionsListDiv.innerHTML = '<p style="color: red;">Error: Received no data from the server.</p>';
                    }
                    return;
                }

                if (data.success === false) {
                    if (data.error) {
                        console.error('ShippingFix: Server returned success=false. Error:', data.error, 'Raw Text (if available):', data.rawText);
                    } else {
                        console.error('ShippingFix: Server returned success=false with no specific error message.');
                    }
                    const shippingOptionsListDiv = document.getElementById('shippingOptionsList');
                    if (shippingOptionsListDiv) {
                        shippingOptionsListDiv.innerHTML = `<p style="color: red;">Could not retrieve shipping options: ${data.error || 'Unknown server error'}. Please check your address details.</p>`;
                    } else {
                        console.error('ShippingFix: #shippingOptionsList element not found. Cannot display server error.');
                    }
                    return;
                }
                
                let quotes = (data && data.rates && Array.isArray(data.rates)) ? data.rates : 
                             (data.quotes && Array.isArray(data.quotes)) ? data.quotes : [];

                const shippingOptionsDiv = document.getElementById('shippingOptions');
                const shippingOptionsListEl = document.getElementById('shippingOptionsList');

                if (!shippingOptionsDiv || !shippingOptionsListEl) {
                    console.error('ShippingFix: #shippingOptions or #shippingOptionsList element not found. Cannot display rates.');
                    alert('Error: Required shipping display elements are missing from the page.');
                    return;
                }
                
                console.log('SFH_DEBUG_V4: shippingOptionsListEl is:', shippingOptionsListEl ? 'Found' : 'NOT FOUND');
                console.log('SFH_DEBUG_V4: PRE-CLEAR: finalActions exists?', document.getElementById('finalActions') ? 'Yes' : 'No');
                console.log('SFH_DEBUG_V4: PRE-CLEAR: proceedToPayment exists?', document.getElementById('proceedToPayment') ? 'Yes' : 'No');
                
                shippingOptionsListEl.innerHTML = ''; 

                console.log('SFH_DEBUG_V4: POST-CLEAR: finalActions exists?', document.getElementById('finalActions') ? 'Yes' : 'No');
                console.log('SFH_DEBUG_V4: POST-CLEAR: proceedToPayment exists?', document.getElementById('proceedToPayment') ? 'Yes' : 'No');

                if (quotes.length > 0) {
                    const ul = document.createElement('ul');
                    ul.className = 'list-group'; 
                    ul.style.listStyleType = 'none';
                    ul.style.paddingLeft = '0';

                    quotes.forEach((quote, index) => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item shipping-option';
                        li.style.cursor = 'pointer';
                        li.style.padding = '10px';
                        li.style.border = '1px solid #ddd';
                        li.style.marginBottom = '5px';
                        li.style.borderRadius = '4px';

                        const transitTime = quote.delivery_days || quote.transitTime || 'N/A';
                        const transitDisplay = (transitTime && transitTime !== 'null' && transitTime !== 'undefined' && transitTime !== 'N/A') ? `${transitTime} business day(s)` : 'Not available';
                        
                        li.innerHTML = `
                            <strong>${quote.carrier} - ${quote.service}</strong><br>
                            Cost: $${parseFloat(quote.cost).toFixed(2)} ${quote.currency}<br>
                            Estimated Delivery: ${transitDisplay}
                        `;
                        li.dataset.carrierName = quote.carrier;
                        li.dataset.serviceName = quote.service;
                        li.dataset.price = quote.cost;
                        li.dataset.currency = quote.currency;
                        li.dataset.transitTime = transitTime; // Use the resolved transitTime

                        li.addEventListener('click', function() {
                            document.querySelectorAll('.shipping-option').forEach(opt => opt.classList.remove('selected-shipping-option'));
                            this.classList.add('selected-shipping-option');
                            
                            const eventDetail = {
                                carrierName: this.dataset.carrierName,
                                serviceName: this.dataset.serviceName,
                                price: this.dataset.price,
                                currency: this.dataset.currency,
                                transitTime: this.dataset.transitTime
                            };
                            console.log('Dispatching shipping-option-selected event:', eventDetail);
                            document.dispatchEvent(new CustomEvent('shipping-option-selected', { detail: eventDetail }));
                        });
                        ul.appendChild(li);
                    });
                    shippingOptionsListEl.appendChild(ul);
                    if (shippingOptionsDiv) shippingOptionsDiv.style.display = 'block'; 
                    if (shippingOptionsDiv) shippingOptionsDiv.style.opacity = '1';

                    const confirmBtn = document.getElementById('confirmShipping');
                    if (confirmBtn) confirmBtn.disabled = true; 
                } else {
                    shippingOptionsListEl.innerHTML = '<p>No shipping options available for the provided address. Please check your details and try again.</p>';
                    if (shippingOptionsDiv) shippingOptionsDiv.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('ShippingFix: Error fetching shipping options:', error);
                const shippingOptionsListEl = document.getElementById('shippingOptionsList');
                if (shippingOptionsListEl) {
                    shippingOptionsListEl.innerHTML = `<p style="color: red;">Error loading shipping options: ${error.message}. Please try again.</p>`;
                    const shippingOptionsDiv = document.getElementById('shippingOptions');
                    if (shippingOptionsDiv) shippingOptionsDiv.style.display = 'block';
                } else {
                    alert('Error loading shipping options. Please try again.');
                }
            })
            .finally(() => {
                isFetchingRates = false; 
                const loadingElExisting = document.getElementById('sm-loading-indicator');
                if (loadingElExisting && loadingElExisting.parentNode) {
                    loadingElExisting.parentNode.removeChild(loadingElExisting);
                    console.log('ShippingFix: Loading indicator removed in finally block.');
                } else {
                    console.log('ShippingFix: Loading indicator not found or already removed in finally block.');
                }
            });
        }; 

        addressForm._hasShippingFix = true;
        
        const buttonClickHandler = function(e) {
            console.log('ShippingFix: Submit Button clicked directly (aggressive handler)');
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation(); 

            if (addressForm._isSubmitting) {
                console.log('ShippingFix: Form already submitting, ignoring click.');
                return;
            }
            addressForm._isSubmitting = true;
            
            // Manually create an event-like object for _shippingFixHandler
            window._shippingFixHandler({
                preventDefault: () => {}, // Provide no-op preventDefault
                stopPropagation: () => {}, // Provide no-op stopPropagation
                submitter: submitButton // Pass the submitter if needed by the handler
            });
            
            setTimeout(() => {
                addressForm._isSubmitting = false;
            }, 2000); 
        };

        if (submitButton._clickHandler) {
            submitButton.removeEventListener('click', submitButton._clickHandler, true);
        }
        submitButton._clickHandler = buttonClickHandler;
        submitButton.addEventListener('click', buttonClickHandler, true); // Use capture phase
        console.log('ShippingFix: Aggressive click handler (re-)attached to submit button.');
    } // End of runFixes function

    function initializeFormStepHandlers() {
        console.log('INITIALIZING FORM STEP HANDLERS - V_ALL_VISIBLE'); 

        const addressForm = document.getElementById('addressForm');
        const shippingOptionsSection = document.getElementById('shippingOptions');
        const orderSummarySection = document.getElementById('orderSummary');
        const confirmShippingBtn = document.getElementById('confirmShipping');
        const finalActionsDiv = document.getElementById('finalActions');
        const paymentSection = document.getElementById('paymentSection');
        const proceedToPaymentBtn = document.getElementById('proceedToPayment');
        // const changeShippingBtn = document.getElementById('changeShipping'); // Commented out in HTML

        // Initially, only the address form and its submit button should be fully active.
        // Shipping options, order summary, and payment are visible but should be non-interactive until populated.

        if (shippingOptionsSection) shippingOptionsSection.style.opacity = '0.5';
        if (orderSummarySection) orderSummarySection.style.opacity = '0.5';
        if (finalActionsDiv) finalActionsDiv.style.opacity = '0.5';
        if (paymentSection) paymentSection.style.opacity = '0.5';

        if (confirmShippingBtn) confirmShippingBtn.disabled = true;
        if (proceedToPaymentBtn) proceedToPaymentBtn.disabled = true;

        // Event listener for when shipping options are fetched and displayed by _shippingFixHandler
        // We'll use a custom event or a direct call from _shippingFixHandler if that's simpler.
        // For now, let's assume _shippingFixHandler will directly enable the confirm button once rates are loaded.
        // And it will make shippingOptionsSection fully opaque.

        document.addEventListener('shipping-option-selected', function(event) {
            console.log('shipping-option-selected event caught', event.detail);
            if (!orderSummarySection) {
                console.error('Order summary section not found.');
                return;
            }
            orderSummarySection.style.opacity = '1';

            const { carrierName, serviceName, price, currency, transitTime } = event.detail;
            const transitDisplay = transitTime && transitTime !== 'null' && transitTime !== 'undefined' && transitTime !== 'N/A' ? `${transitTime} business day(s)` : 'Not available';
            
            // Clear previous summary
            while (orderSummarySection.firstChild && orderSummarySection.firstChild.tagName !== 'H2') {
                orderSummarySection.removeChild(orderSummarySection.firstChild);
            }
            // If H2 is gone, recreate it
            if (!orderSummarySection.querySelector('h2')) {
                const h2 = document.createElement('h2');
                h2.textContent = 'Order Summary';
                orderSummarySection.prepend(h2);
            }

            const pMethod = document.createElement('p');
            pMethod.innerHTML = `<strong>Shipping Method:</strong> ${carrierName} - ${serviceName}`;
            orderSummarySection.appendChild(pMethod);

            const pCost = document.createElement('p');
            pCost.innerHTML = `<strong>Cost:</strong> $${parseFloat(price).toFixed(2)} ${currency}`;
            orderSummarySection.appendChild(pCost);

            const pDelivery = document.createElement('p');
            pDelivery.innerHTML = `<strong>Estimated Delivery:</strong> ${transitDisplay}`;
            orderSummarySection.appendChild(pDelivery);
            
            if (confirmShippingBtn) confirmShippingBtn.disabled = false;
        });

        if (confirmShippingBtn) {
            confirmShippingBtn.addEventListener('click', function onConfirmShippingClickHandler(event) { 
                console.log('Confirm Shipping button clicked');
                if(event) {
                    event.stopPropagation();
                    event.preventDefault();  
                }

                // Visually indicate that shipping is confirmed, perhaps by making other sections less prominent again if desired
                // For now, just enable the next step.
                if (finalActionsDiv) finalActionsDiv.style.opacity = '1';
                if (proceedToPaymentBtn) proceedToPaymentBtn.disabled = false;
                this.disabled = true; 
                // if (changeShippingBtn) changeShippingBtn.disabled = false; // If re-enabled
            }); 
        }

        if (proceedToPaymentBtn) {
            proceedToPaymentBtn.addEventListener('click', function onProceedToPaymentClick(event) { 
                console.log('Proceed to Payment button clicked.');
                 if(event) {
                    event.stopPropagation();
                    event.preventDefault();  
                }
                if (paymentSection) paymentSection.style.opacity = '1';
                // Logic to initialize Stripe or other payment elements would go here.
                console.log('Payment section would be activated here.');
                this.disabled = true;
                // if (changeShippingBtn) changeShippingBtn.disabled = true; // Disable if going to payment
            });
        }
        
        // if (changeShippingBtn) { // If re-enabled
        //     changeShippingBtn.addEventListener('click', function onChangeShippingClick(event) {
        //         console.log('Change Shipping button clicked');
        //         if(event) {
        //             event.stopPropagation();
        //             event.preventDefault();  
        //         }
        //         if (shippingOptionsSection) shippingOptionsSection.style.opacity = '1';
        //         if (confirmShippingBtn) confirmShippingBtn.disabled = true; // Re-disable until a new option is selected
        //         if (orderSummarySection) orderSummarySection.style.opacity = '0.5';
        //         if (finalActionsDiv) finalActionsDiv.style.opacity = '0.5';
        //         if (proceedToPaymentBtn) proceedToPaymentBtn.disabled = true;
        //         if (paymentSection) paymentSection.style.opacity = '0.5';
        //         // Potentially clear selected shipping option in #shippingOptionsList
        //         document.querySelectorAll('.shipping-option.selected-shipping-option').forEach(opt => opt.classList.remove('selected-shipping-option'));
        //         // Clear order summary details
        //         const h2 = orderSummarySection.querySelector('h2');
        //         orderSummarySection.innerHTML = '';
        //         if(h2) orderSummarySection.appendChild(h2);

        //         this.disabled = true;
        //     });
        // }

        console.log('Form step handlers initialized for all-visible layout.');
    }

    // Modify _shippingFixHandler to update opacity and enable confirm button
    // ... within the .then(data => { ... }) block of _shippingFixHandler, after quotes are processed:
    // Find the part where shippingOptionsDiv.style.display = 'block'; is set.
    // Add: if (shippingOptionsDiv) shippingOptionsDiv.style.opacity = '1';
    // And ensure confirmShippingBtn is handled appropriately (it's currently disabled if quotes.length > 0)
    // The 'shipping-option-selected' event will enable it.

    // ---- Execution: Ensure DOM is ready ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded event fired. Running fixes and initializing handlers.');
            runFixes();
            initializeFormStepHandlers();
        });
    } else {
        console.log('DOM already loaded. Running fixes and initializing handlers immediately.');
        runFixes();
        initializeFormStepHandlers();
    }

})();