// Consolidated fixes for SmartDucks payment form - Fresh implementation
// Version: 2024-05-24
// Focus: Properly handling state/province selection and postal code formatting

(function() {
    console.log('SmartDucks form fixes loaded - Fresh implementation');
    
    // No need to expose for testing purposes

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
        
        // Get fresh references each time
        const stateSelect = document.getElementById('state');
        if (!stateSelect) {
            console.error('State select element not found');
            return;
        }
        
        // Clear existing options
        stateSelect.innerHTML = '<option value="" disabled selected>Select State/Province</option>';            // If no country or no states for country, disable state select
        if (!country || !statesData[country]) {
            stateSelect.disabled = true;
            return;
        }
        
        // Add the options sorted alphabetically
        Object.entries(statesData[country])
            .sort((a, b) => a[1].localeCompare(b[1]))
            .forEach(([code, name]) => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                stateSelect.appendChild(option);
            });
        
        // Enable the select
        stateSelect.disabled = false;
        
        // Update label and validation
        const isCanada = country === 'CA';
        const stateLabel = document.querySelector('label[for="state"]');
        if (stateLabel) {
            stateLabel.textContent = isCanada ? 'Province*' : 'State*';
        }
        
        // Update postal code input pattern
        const postalInput = document.getElementById('postalCode');
        if (postalInput) {
            postalInput.pattern = isCanada ? '[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]' : '\\\\d{5}(-\\\\d{4})?';
            postalInput.placeholder = isCanada ? 'A1A 1A1' : '12345 or 12345-6789';
            // Do not clear postalInput.value here automatically, allow user to re-format if country changes back and forth
            
            // Ensure the input event handler is correctly set up
            // Remove existing to prevent duplicates if this function is called multiple times
            postalInput.removeEventListener('input', window.handlePostalInput); 
            postalInput.addEventListener('input', window.handlePostalInput);

            // Also re-format the current value if any
            if(postalInput.value){
                postalInput.value = formatPostalCode(country, postalInput.value);
            }
        }
        
        console.log(`Updated state select with ${Object.keys(statesData[country]).length} options`);
    }

    // Main function to initialize the state/province and postal code fixes
    function initStateProvinceFix() {
        console.log('Initializing state/province selector fix');
        
        // No need to expose these functions globally for production
            
        // Wait for the country select to be available
        waitForElement('#countryCode', (countrySelect) => {
            // Wait for the state select to be available
            waitForElement('#state', (stateSelect) => {
                console.log('Both country and state selectors found, applying fix');

                // Store the current value before replacing elements
                const currentCountryValue = countrySelect.value;

                // Clone elements to remove any existing event listeners
                const newCountrySelect = countrySelect.cloneNode(true);
                countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);

                const newStateSelect = stateSelect.cloneNode(true);
                stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);

                // Get fresh references after replacement
                const freshCountrySelect = document.getElementById('countryCode');
                const freshStateSelect = document.getElementById('state');
                
                // Add change event listener to country select - use a named function for better debugging
                function handleCountryChange() {
                    console.log('Country changed to:', this.value);
                    updateStateOptions(this.value);
                }
                
                // Add the event listener
                freshCountrySelect.addEventListener('change', handleCountryChange);
                
                // No need to store the handler on window
                
                // Initialize with current country selection if available
                if (currentCountryValue) {
                    console.log('Country already selected, initializing states for:', currentCountryValue);
                    // Make sure the value is set properly after clone
                    freshCountrySelect.value = currentCountryValue;
                    // Update the state options
                    updateStateOptions(currentCountryValue);
                    
                    // Also format the postal code if it has a value
                    const postalInput = document.getElementById('postalCode');
                    if (postalInput && postalInput.value) {
                        postalInput.value = formatPostalCode(currentCountryValue, postalInput.value);
                    }
                } else {
                    console.log('No country selected yet, state select will initialize when country is chosen');
                    freshStateSelect.disabled = true;
                }
                
                // Initialize postal code formatting handlers
                const postalInput = document.getElementById('postalCode');
                if (postalInput) {
                    // Define or redefine window.handlePostalInput to ensure it's correct
                    window.handlePostalInput = function(event) {
                        const countrySelect = document.getElementById('countryCode');
                        const country = countrySelect ? countrySelect.value : 'CA'; // Default to CA if not found
                        
                        let cursorPos = this.selectionStart;
                        const originalValue = this.value;
                        const formattedValue = formatPostalCode(country, originalValue);
                        
                        if (formattedValue !== originalValue) {
                            this.value = formattedValue;
                            // Adjust cursor position carefully
                            // If a space was added (e.g., A1A1A1 -> A1A 1A1) and cursor was after 3rd char
                            if (country === 'CA' && originalValue.length === 6 && formattedValue.length === 7 && cursorPos > 3) {
                                cursorPos++;
                            }
                            // If a hyphen was added (e.g., 123456789 -> 12345-6789) and cursor was after 5th char
                            else if (country === 'US' && originalValue.length === 9 && formattedValue.length === 10 && cursorPos > 5) {
                                cursorPos++;
                            }
                            // Basic adjustment: if length changed, try to maintain relative position
                            else if (formattedValue.length !== originalValue.length) {
                                // This is a simplified adjustment, might need refinement for all cases
                                cursorPos = Math.max(0, cursorPos + (formattedValue.length - originalValue.length));
                            }
                            
                            // Ensure cursor is not out of bounds
                            cursorPos = Math.min(cursorPos, formattedValue.length);
                            this.setSelectionRange(cursorPos, cursorPos);
                        }
                    };
                    
                    // Remove any old listener and add the (potentially new) one
                    postalInput.removeEventListener('input', window.handlePostalInput);
                    postalInput.addEventListener('input', window.handlePostalInput);
                    
                    console.log('ShippingFix: Postal code formatting handlers (re)applied.');

                    // Initial format if a value already exists
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
            // Check if country has a value but state is disabled or has no options
            if (countrySelect.value && (stateSelect.disabled || stateSelect.options.length <= 1)) {
                console.log('Monitor detected broken state selector - fixing');
                
                try {
                    // More aggressive fix: completely replace both elements again
                const newCountrySelect = countrySelect.cloneNode(true);
                countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);
                
                const newStateSelect = stateSelect.cloneNode(true);
                stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);
                
                // Get fresh references
                const freshCountrySelect = document.getElementById('countryCode');
                
                // Re-add event listener
                if (window.handleCountryChange) {
                    freshCountrySelect.addEventListener('change', window.handleCountryChange);
                } else {
                    freshCountrySelect.addEventListener('change', function() {
                        updateStateOptions(this.value);
                    });
                }
                
                // Preserve the country value
                freshCountrySelect.value = countrySelect.value;
                
                // Update state options
                updateStateOptions(freshCountrySelect.value);
                
                // Also reapply postal code formatting handlers if needed
                const postalInput = document.getElementById('postalCode');
                if (postalInput) {
                    postalInput.removeEventListener('input', window.handlePostalInput);
                    postalInput.addEventListener('input', window.handlePostalInput);
                    
                    // Format the current value if it exists
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
                    // Try a simpler approach as a fallback
                    try {
                        updateStateOptions(countrySelect.value);
                    } catch (innerErr) {
                        console.error('Fallback approach also failed:', innerErr);
                    }
                }
            }
        }
        
        // Monitoring frequency: more aggressive initially, then less frequent
        const interval = window._monitorCount && window._monitorCount > 10 ? 5000 : 1000;
        window._monitorCount = (window._monitorCount || 0) + 1;
        
        // Continue monitoring
        setTimeout(monitorStateProvince, interval);
    }

    // Ensure form submission handler is properly working
    function runFixes() {
        console.log('ShippingFix: runFixes function execution started (called from IIFE event handler).');
        
        // Call the state/province fix initialization
        initStateProvinceFix(); // Ensure this is called

        // Find form and submit button
        const addressForm = document.querySelector('form');
        
        if (!addressForm) {
            console.error('ShippingFix: No form found on page');
            return;
        }
        
        // Find submit button in various ways
        let submitButton = addressForm.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitButton) {
            submitButton = addressForm.querySelector('button.submit-button, .button[type="submit"], [class*="submit"], .btn-primary');
        }
        
        if (!submitButton) {
            console.error('ShippingFix: No submit button found');
            return;
        }
        
        console.log('ShippingFix: Found form and submit button');
        
        // Check for any existing modals to determine the right approach
        const existingModals = document.querySelectorAll('.modal, [id*="modal"], [class*="modal"], dialog');
        
        // Remove previous handlers to prevent duplicate submissions
        if (window._shippingFixHandler && addressForm._hasShippingFix) {
            console.log('ShippingFix: Removing previous handler to avoid duplicates');
            addressForm.removeEventListener('submit', window._shippingFixHandler);
            if (submitButton._clickHandler) {
                submitButton.removeEventListener('click', submitButton._clickHandler);
            }
        }
        
        // Re-attach the submit event listener to make sure it works
        const originalSubmit = addressForm.onsubmit;
        
        // Create our handler function and store it for potential removal later
        window._shippingFixHandler = function(e) {
            console.log('ShippingFix: Form submission intercepted');
            
            // Always prevent default - this is critical to prevent double submission
            e.preventDefault();
            e.stopPropagation();
            
            // Simplified for production
            
            // Show a loading indicator
            const loadingEl = document.createElement('div');
            loadingEl.id = 'sm-loading-indicator';
            loadingEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;';
            loadingEl.innerHTML = '<div style="background:white;padding:20px;border-radius:5px;">Loading shipping options...</div>';
            document.body.appendChild(loadingEl);
            
            // Collect form data - use form elements directly to ensure we get everything
            let formDataObj = {};
            
            // Get all form elements directly to ensure we capture everything
            const formElements = addressForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                // Only include elements with names
                if (element.name) {
                    // Handle different input types appropriately
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        if (element.checked) {
                            formDataObj[element.name] = element.value;
                        }
                    } else if (element.type !== 'submit' && element.type !== 'button') {
                        formDataObj[element.name] = element.value;
                    }
                }
            }
            
            // Also try FormData as a backup approach
            try {
                const formData = new FormData(addressForm);
                formData.forEach((value, key) => {
                    formDataObj[key] = value;
                });
            } catch (err) {
                console.error('ShippingFix: Error with FormData:', err);
            }
            
            // Get the form action URL - try multiple approaches
            let actionUrl = addressForm.getAttribute('action');
            
            // Use direct URL to duckpond in all environments since CORS is properly configured now
            actionUrl = 'https://duckpond.smartducks.works/webhook/shiptime-rates';
            
            // Log the URL being used
            console.log('ShippingFix: Using direct webhook URL:', actionUrl);
            
            console.log('ShippingFix: Submitting to URL:', actionUrl);
            
            // Create a properly formatted data structure for N8N
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
                        declaredValue: {
                            currency: "CAD",
                            amount: 1000
                        },
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

            // Generate CSRF token for N8N if none exists
            function generateCSRFToken() {
                // Current time in milliseconds
                const timestamp = Date.now();
                
                // Generate a random fingerprint if one doesn't exist
                if (!window._csrfFingerprint) {
                    window._csrfFingerprint = Math.random().toString(36).substring(2) + 
                                              Math.random().toString(36).substring(2);
                }
                
                // Format: timestamp:random:fingerprint
                return `${timestamp}:${Math.random().toString(36).substring(2)}:${window._csrfFingerprint}`;
            }
            
            // Get or generate CSRF token
            let csrfToken = '';
            // First try to get it from a form field
            const csrfField = document.querySelector('input[name="_csrf"], input[name="csrf_token"]');
            if (csrfField && csrfField.value) {
                csrfToken = csrfField.value;
                console.log('ShippingFix: Found CSRF token in form field');
            } else {
                // Generate a new token
                csrfToken = generateCSRFToken();
                console.log('ShippingFix: Generated new CSRF token');
            }
            
            // Try multiple content types since some servers are particular about what they accept
            let fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'request-method': 'POST',  // Add this explicitly for N8N
                    'X-CSRF-Token': csrfToken, // Add CSRF token needed by N8N
                    'Origin': window.location.origin  // Explicitly set origin for CORS
                },
                body: JSON.stringify(n8nFormattedData),
                // Include credentials to allow cookies to be sent
                credentials: 'include',
                // Explicitly set mode for CORS
                mode: 'cors'
            };
            
            console.log('ShippingFix: Starting fetch request to:', actionUrl);
            
            // Send the request with fallbacks for errors
            fetch(actionUrl, fetchOptions)
            .then(response => {
                console.log('ShippingFix: Got response:', response.status, 'Content-Type:', response.headers.get('content-type'));
                
                // Handle different response types
                const contentType = response.headers.get('content-type');
                
                // Log all response headers for debugging
                console.log('ShippingFix: Response headers:');
                let headerMap = {};
                response.headers.forEach((value, name) => {
                    console.log(`${name}: ${value}`);
                    
                    // Check for duplicate CORS headers
                    name = name.toLowerCase();
                    if (name.startsWith('access-control-')) {
                        if (headerMap[name]) {
                            console.warn(`ShippingFix: Duplicate CORS header detected: ${name}`);
                            // For duplicates, we'll still use the first value
                            headerMap[name].isDuplicate = true;
                            headerMap[name].values.push(value);
                        } else {
                            headerMap[name] = { value: value, isDuplicate: false, values: [value] };
                        }
                    }
                });
                
                // Check if we found duplicate headers that could cause CORS issues
                const duplicateHeaders = Object.keys(headerMap).filter(key => headerMap[key].isDuplicate);
                if (duplicateHeaders.length > 0) {
                    console.error('ShippingFix: Duplicate CORS headers found:', duplicateHeaders);
                    console.info('ShippingFix: This may cause browser CORS errors. Server configuration needs to be fixed.');
                }                        // Check for CORS issues in headers before processing response
                        if (duplicateHeaders.length > 0) {
                            console.error('ShippingFix: CORS issue detected - duplicate headers:', duplicateHeaders.join(', '));
                            return { 
                                success: false, 
                                error: 'CORS configuration issue on server', 
                                cors_error: true,
                                duplicate_headers: duplicateHeaders
                            };
                        }

                        // First try to get the text response for debugging
                        return response.text().then(text => {
                            console.log('ShippingFix: Raw response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
                            
                            try {
                                // Try to parse as JSON
                                return JSON.parse(text);
                            } catch (e) {
                                console.error('ShippingFix: JSON parse error:', e);
                                
                                // If the response is empty or whitespace only, return empty object
                                if (!text.trim()) {
                                    console.log('ShippingFix: Empty response body');
                                    return { success: false, error: 'Empty response from server' };
                                }
                                
                                // Check if it might be HTML or plain text response
                                if (text.includes('<html') || text.includes('<!DOCTYPE')) {
                                    return { html: text, success: false, error: 'Server returned HTML instead of JSON', possible_cors_issue: true };
                        }
                        
                        // If it looks like it might be JSON but has an error,
                        // try to clean it up and parse again
                        if (text.includes('{') && text.includes('}')) {
                            try {
                                // Try to extract JSON from the response if there might be extra text
                                const jsonStartIndex = text.indexOf('{');
                                const jsonEndIndex = text.lastIndexOf('}') + 1;
                                if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
                                    const jsonPart = text.substring(jsonStartIndex, jsonEndIndex);
                                    console.log('ShippingFix: Attempting to extract JSON part:', jsonPart.substring(0, 100) + (jsonPart.length > 100 ? '...' : ''));
                                    return JSON.parse(jsonPart);
                                }
                            } catch (innerError) {
                                console.error('ShippingFix: Failed to extract JSON:', innerError);
                            }
                        }
                        
                        // Last resort - return as HTML/text
                        return { 
                            html: text, 
                            success: false, 
                            error: 'Failed to parse server response as JSON',
                            debug_info: { 
                                parse_error: e.message,
                                content_type: contentType,
                                response_length: text.length
                            }
                        };
                    }
                });
            })
            .then(data => {
                console.log('ShippingFix: Received data:', data);
                
                // Remove loading indicator
                const loadingEl = document.getElementById('sm-loading-indicator');
                if (loadingEl) loadingEl.remove();
                
                // Normalize data format
                if (!data) {
                    console.error('ShippingFix: No data received from server');
                    data = { success: false, error: 'No data received from server' };
                }
                
                console.log('ShippingFix: Data type:', typeof data, 'Structure:', Object.keys(data));
                
                if (data && data.quotes && Array.isArray(data.quotes)) {
                    console.log('ShippingFix: Found quotes directly in response');
                } else if (data && typeof data === 'object') {
                    // Try to find quotes in a nested structure
                    console.log('ShippingFix: Searching for quotes in nested structure');
                    
                    // Handle N8N response format where data might be nested inside body or json property
                    if (data.body) {
                        try {
                            // If body is a string that contains JSON
                            if (typeof data.body === 'string' && data.body.includes('{')) {
                                const parsedBody = JSON.parse(data.body);
                                if (parsedBody.quotes && Array.isArray(parsedBody.quotes)) {
                                    console.log('ShippingFix: Found quotes in parsed body string');
                                    data = parsedBody;
                                } else if (parsedBody.success && parsedBody.data) {
                                    console.log('ShippingFix: Found success and data in parsed body');
                                    data = parsedBody.data;
                                }
                            } 
                            // If body is already an object with quotes
                            else if (data.body.quotes && Array.isArray(data.body.quotes)) {
                                console.log('ShippingFix: Found quotes in body object');
                                data = data.body;
                            }
                        } catch (e) {
                            console.error('ShippingFix: Error parsing body:', e);
                        }
                    }
                    
                    // Try other possible locations for quotes
                    if (!data.quotes) {
                        if (data.json && data.json.quotes && Array.isArray(data.json.quotes)) {
                            console.log('ShippingFix: Found quotes in json property');
                            data = data.json;
                        } else if (data.data && data.data.quotes && Array.isArray(data.data.quotes)) {
                            console.log('ShippingFix: Found quotes in data property');
                            data = data.data;
                        } else if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
                            console.log('ShippingFix: Found data array in success response');
                            data.quotes = data.data;
                        }
                    }
                }
                
                // Parse and display the shipping options
                // First, try to extract the quotes from the N8N response
                let quotes = [];

                // NEW: Prioritize data.rates as per N8N workflow's current successful output
                if (data && data.rates && Array.isArray(data.rates)) {
                    console.log('ShippingFix: Using data.rates directly.');
                    quotes = data.rates;
                }
                // Existing logic as fallbacks
                else if (data.quotes && Array.isArray(data.quotes)) {
                    console.log('ShippingFix: Using data.quotes as fallback.');
                    quotes = data.quotes;
                }
                else if (data.data && data.data.quotes && Array.isArray(data.data.quotes)) {
                    console.log('ShippingFix: Assigning data.data.quotes to quotes. Count:', data.data.quotes.length);
                    quotes = data.data.quotes;
                }
                else if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
                    console.log('ShippingFix: Assigning data.data to quotes (as direct array). Count:', data.data.length);
                    quotes = data.data;
                }
                else if (data.html) {
                    // If we got HTML directly, we may have a CORS issue
                    // Show a user-friendly error message
                    const corsErrorDiv = document.createElement('div');
                    corsErrorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;justify-content:center;align-items:center;color:white;';
                    corsErrorDiv.innerHTML = `
                        <div style="background:#f44336;padding:20px;border-radius:5px;max-width:500px;text-align:center;">
                        <h3 style="margin-top:0;">Connection Error</h3>
                        <p>We're having trouble connecting to our shipping service due to a security configuration issue.</p>
                        <p>Our team has been notified and is working on a fix. Please try again later or contact customer service.</p>
                        <p>Technical details: CORS configuration error</p>
                        <button onclick="this.parentNode.parentNode.remove()" style="padding:8px 16px;background:#fff;color:#f44336;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Close</button>
                        </div>
                    `;
                    document.body.appendChild(corsErrorDiv);
                    
                    console.error('ShippingFix: Possible CORS issue detected. HTML response received instead of JSON.');
                    return;
                }
                else if (data.options && Array.isArray(data.options) && data.options.length > 0) {
                    console.log('ShippingFix: Assigning data.options to quotes. Count:', data.options.length);
                    quotes = data.options;
                }
                else if (data.shipping_rates && Array.isArray(data.shipping_rates) && data.shipping_rates.length > 0) {
                    console.log('ShippingFix: Assigning data.shipping_rates to quotes. Count:', data.shipping_rates.length);
                    quotes = data.shipping_rates;
                }
                // Check if we got the full response object from N8N
                try {
                    // Sometimes the quotes are deeply nested in the response
                    if (data.body && typeof data.body === 'string') {
                        const parsedBody = JSON.parse(data.body);
                        if (parsedBody.quotes && Array.isArray(parsedBody.quotes) && parsedBody.quotes.length > 0) {
                            console.log('ShippingFix: Re-assigning from parsedBody.quotes to quotes. Count:', parsedBody.quotes.length);
                            quotes = parsedBody.quotes;
                        }
                    }
                } catch (e) {
                    console.error('ShippingFix: Error parsing body for quotes:', e);
                }

                // --- BEGIN Enhanced Logging ---
                console.log('ShippingFix: AFTER quotes assignment. quotes type:', typeof quotes, 'isArray:', Array.isArray(quotes));
                if (Array.isArray(quotes)) {
                    console.log('ShippingFix: quotes.length directly before check:', quotes.length);
                    if (quotes.length > 0) {
                        console.log('ShippingFix: First item in quotes array before check:', JSON.parse(JSON.stringify(quotes[0])));
                    }
                } else {
                    console.log('ShippingFix: quotes is not an array before check.');
                }
                // --- END Enhanced Logging ---
                
                // Get the modal element for shipping options
                let modalElement = document.getElementById('shipping-options-modal');
                
                // If modal doesn't exist, create it
                if (!modalElement) {
                    console.log('ShippingFix: Modal not found, creating new one');
                    modalElement = document.createElement('div');
                    modalElement.id = 'shipping-options-modal';
                    modalElement.className = 'modal shipping-options-modal';
                    modalElement.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1050;display:block;';
                    
                    modalElement.innerHTML = `
                        <div class="modal-dialog" style="margin:60px auto;max-width:600px;background:white;border-radius:5px;box-shadow:0 5px 15px rgba(0,0,0,0.5);">
                            <div class="modal-content">
                                <div class="modal-header" style="padding:15px;border-bottom:1px solid #e5e5e5;">
                                    <h4 class="modal-title">Shipping Options</h4>
                                    <button type="button" class="close" style="position:absolute;right:15px;top:15px;font-size:24px;font-weight:bold;background:none;border:none;cursor:pointer;">&times;</button>
                                </div>
                                <div class="modal-body shipping-options-container" style="padding:15px;max-height:70vh;overflow-y:auto;">
                                    <!-- Options will be inserted here -->
                                </div>
                                <div class="modal-footer" style="padding:15px;border-top:1px solid #e5e5e5;text-align:right;">
                                    <button type="button" class="btn btn-primary select-option-btn" style="padding:8px 16px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:5px;">Select</button>
                                    <button type="button" class="btn btn-secondary cancel-btn" style="padding:8px 16px;background:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:5px;">Cancel</button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(modalElement);
                    
                    // Add event listeners for closing
                    const closeButtons = modalElement.querySelectorAll('.close, .cancel-btn');
                    closeButtons.forEach(btn => {
                        btn.addEventListener('click', () => {
                            modalElement.style.display = 'none';
                        });
                    });
                    
                    // Close when clicking outside
                    modalElement.addEventListener('click', (e) => {
                        if (e.target === modalElement) {
                            modalElement.style.display = 'none';
                        }
                    });
                }
                
                // Get the container for shipping options
                const container = modalElement.querySelector('.shipping-options-container, .modal-body');
                if (!container) {
                    console.error('ShippingFix: No container found in modal');
                    return;
                }
                
                // Clear previous options
                container.innerHTML = '';
                
                // If we found quotes, display them
                if (quotes && Array.isArray(quotes) && quotes.length > 0) {
                    console.log('ShippingFix: Displaying shipping options. Actual count being looped:', quotes.length);
                    
                    quotes.forEach(quote => { // Ensure quote is defined and has properties
                        if (!quote || typeof quote !== 'object') {
                            console.warn('ShippingFix: Invalid quote object encountered:', quote);
                            return; // Skip this iteration
                        }
                        // Define a default structure for quote details
                        const serviceName = quote.service_name || quote.serviceName || 'N/A';
                        const transitTime = quote.transit_time || quote.transitTime || 'N/A';
                        const cost = quote.cost || quote.total_charge || quote.price || 'N/A'; // Added quote.price
                        const currency = quote.currency || 'CAD'; // Default to CAD if not specified
                        const quoteId = quote.id || quote.quoteId || serviceName + '_' + cost; // Ensure a unique ID

                        // Check if cost is a valid number for formatting
                        const displayCost = (typeof cost === 'number' && !isNaN(cost)) ? `$${cost.toFixed(2)} ${currency}` : 'Price N/A';

                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'shipping-option';
                        optionDiv.style.cssText = 'padding: 10px; border: 1px solid #eee; margin-bottom: 10px; border-radius: 4px; cursor: pointer;';
                        optionDiv.innerHTML = `
                            <strong class="service-name">${serviceName}</strong> - ${displayCost}
                            <em class="transit-time" style="display: block; font-size: 0.9em; color: #555;">Est. Transit: ${transitTime}</em>
                        `;
                        optionDiv.dataset.quoteId = quoteId;
                        optionDiv.dataset.price = (typeof cost === 'number' && !isNaN(cost)) ? cost.toFixed(2) : '0';
                        optionDiv.dataset.option = serviceName;
                        optionDiv.dataset.carrierName = quote.carrier_name || quote.carrierName || 'N/A';
                        optionDiv.dataset.serviceName = serviceName;
                        optionDiv.dataset.transitTime = transitTime;
                        
                        optionDiv.addEventListener('click', () => {
                            // Remove 'selected' style from currently selected option
                            const currentlySelected = container.querySelector('.shipping-option.selected');
                            if (currentlySelected) {
                                currentlySelected.classList.remove('selected');
                                currentlySelected.style.borderColor = '#eee'; // Reset border color
                            }
                            // Add 'selected' style to clicked option
                            optionDiv.classList.add('selected');
                            optionDiv.style.borderColor = '#007bff'; // Highlight selected

                            // Enable select button if it exists
                            const selectBtn = modalElement.querySelector('.select-option-btn');
                            if (selectBtn) selectBtn.disabled = false;
                        });
                        container.appendChild(optionDiv);
                    });
                    
                    // Add the select button functionality
                    const selectButton = modalElement.querySelector('.select-option-btn');
                    if (selectButton) {
                        // Ensure button is initially disabled if no option is pre-selected
                        // selectButton.disabled = !container.querySelector('.shipping-option.selected');
                        
                        // Clone and replace to remove old listeners
                        const newSelectButton = selectButton.cloneNode(true);
                        selectButton.parentNode.replaceChild(newSelectButton, selectButton);
                        newSelectButton.disabled = true; // Should be disabled until an option is clicked

                        newSelectButton.addEventListener('click', () => {
                            const selectedOptionDiv = container.querySelector('.shipping-option.selected');
                            if (selectedOptionDiv) {
                                const eventDetail = {
                                    quoteId: selectedOptionDiv.dataset.quoteId,
                                    price: selectedOptionDiv.dataset.price,
                                    option: selectedOptionDiv.dataset.option,
                                    carrierName: selectedOptionDiv.dataset.carrierName,
                                    serviceName: selectedOptionDiv.dataset.serviceName,
                                    transitTime: selectedOptionDiv.dataset.transitTime,
                                };
                                console.log('ShippingFix: Dispatching shipping-option-selected event with detail:', eventDetail);
                                document.dispatchEvent(new CustomEvent('shipping-option-selected', { detail: eventDetail }));
                                modalElement.style.display = 'none'; // Hide modal on selection
                            } else {
                                console.log('ShippingFix: Select button clicked but no option selected.');
                                // Optionally, provide feedback to the user (e.g., an alert or message in the modal)
                            }
                        });
                    }
                } 
                else { // This block executes if quotes.length is 0 or quotes is not a valid array
                    console.log('ShippingFix: Fallback - quotes array is empty, not an array, or length is zero. Actual length:', (quotes ? quotes.length : 'N/A'), 'Is Array:', Array.isArray(quotes), 'Data received:', data);
                    let messageHTML = ""; // Initialize empty

                    if (data && data.success === false && data.error) {
                        messageHTML = `<p><strong>An error occurred:</strong> ${data.error}</p>`;
                        if (data.error.toLowerCase().includes("empty response from server") || data.error.toLowerCase().includes("no data received")) {
                            messageHTML += "<p>The shipping service did not return any data. This might be a temporary issue or a problem with the address provided. Please ensure all address fields are correct and try again.</p>";
                        } else if (data.error.toLowerCase().includes("json parse error") || data.error.toLowerCase().includes("unexpected eof")) {
                            messageHTML += "<p>There was a problem understanding the response from the shipping service. Please try again. If the issue persists, contact support.</p>";
                        } else {
                            messageHTML += "<p>Please check your address details and try again. If the problem persists, contact support.</p>";
                        }
                    } else if (data && data.message && (!quotes || quotes.length === 0)) { 
                         messageHTML = `<p>${data.message}</p>`; // Display message from server if rates are empty but message exists
                    } else {
                        // Default generic message if no specific error info is available in 'data'
                        messageHTML = "<p>Could not display shipping options at this time.</p>";
                        messageHTML += "<p>No shipping data was received. Please check your address and try again.</p>";
                    }
                    container.innerHTML = messageHTML;
                }
                
                // Make sure the modal is visible
                setTimeout(() => {
                    modalElement.style.display = 'block';
                    modalElement.style.visibility = 'visible';
                    modalElement.style.opacity = '1';
                }, 100);
                
                console.log('ShippingFix: Modal should now be visible');
                
                // If there was an original submit handler, call it now but prevent form submission
                if (originalSubmit && typeof originalSubmit === 'function') {
                    console.log('ShippingFix: Calling original submit handler');
                    try {
                        // Create a fake event to pass to the original handler
                        const fakeEvent = { preventDefault: () => {} };
                        originalSubmit.call(addressForm, fakeEvent);
                    } catch (err) {
                        console.error('ShippingFix: Error calling original handler:', err);
                    }
                }
            })
            .catch(error => {
                console.error('ShippingFix: Error fetching shipping options:', error);
                
                // Remove loading indicator
                const loadingEl = document.getElementById('sm-loading-indicator');
                if (loadingEl) loadingEl.remove();
                
                // Check for specific errors that might indicate CORS issues
                if (error.message && error.message.includes('CORS')) {
                    // Show a helpful error message specifically for CORS issues
                    const corsErrorDiv = document.createElement('div');
                    corsErrorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;justify-content:center;align-items:center;color:white;';
                    corsErrorDiv.innerHTML = `
                        <div style="background:#f44336;padding:20px;border-radius:5px;max-width:500px;text-align:center;">
                        <h3 style="margin-top:0;">Connection Error</h3>
                        <p>We're having trouble connecting to our shipping service due to a security configuration issue.</p>
                        <p>Our team has been notified and is working on a fix. Please try again later or contact customer service.</p>
                        <p>Technical details: CORS configuration error</p>
                        <button onclick="this.parentNode.parentNode.remove()" style="padding:8px 16px;background:#fff;color:#f44336;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Close</button>
                        </div>
                    `;
                    document.body.appendChild(corsErrorDiv);
                } else {
                    // SIMPLIFIED THIS BLOCK
                    // The console.error and loadingEl.remove() are already done at the start of the catch block.
                    alert('Error loading shipping options. Please try again. If the problem persists, contact support.');
            }
            });
            
            // Set up global event handler for shipping option selection
            if (!window._shippingOptionHandlerInstalled) {
                window._shippingOptionHandlerInstalled = true;
                document.addEventListener('shipping-option-selected', function(e) {
                    console.log('ShippingFix: Shipping option selected:', e.detail);
                    
                    // Find or create a field to store the selected shipping option
                    let shippingOptionField = addressForm.querySelector('input[name="selected_shipping_option"]');
                    if (!shippingOptionField) {
                        shippingOptionField = document.createElement('input');
                        shippingOptionField.type = 'hidden';
                        shippingOptionField.name = 'selected_shipping_option';
                        addressForm.appendChild(shippingOptionField);
                    }
                    shippingOptionField.value = e.detail.quoteId;
                    
                    // Find or create a field to store the selected shipping price
                    let shippingPriceField = addressForm.querySelector('input[name="selected_shipping_price"]');
                    if (!shippingPriceField) {
                        shippingPriceField = document.createElement('input');
                        shippingPriceField.type = 'hidden';
                        shippingPriceField.name = 'selected_shipping_price';
                        addressForm.appendChild(shippingPriceField);
                    }
                    shippingPriceField.value = e.detail.price;
                    
                    // Try to find an element to display the selection
                    let shippingDisplay = document.querySelector('.shipping-display, .shipping-selection, .selected-option');
                    
                    // If no display element exists, create one
                    if (!shippingDisplay) {
                        shippingDisplay = document.createElement('div');
                        shippingDisplay.className = 'shipping-display';
                        shippingDisplay.style.cssText = 'margin:15px 0;padding:10px;border:1px solid #ddd;border-radius:4px;';
                        
                        // Try to find the right place to insert it
                        const possibleContainers = [
                            document.querySelector('.shipping-container, .order-summary, .checkout-summary'),
                            addressForm.querySelector('fieldset:last-of-type, div:last-of-type'),
                            addressForm
                        ];
                        
                        // Insert into the first container that exists
                        for (let container of possibleContainers) {
                            if (container) {
                                container.appendChild(shippingDisplay);
                                break;
                            }
                        }
                    }
                    
                    // Update the display
                    shippingDisplay.innerHTML = `
                        <h4>Selected Shipping Option</h4>
                        <div>${e.detail.option}</div>
                        <button type="button" class="change-shipping-btn" style="margin-top:10px;padding:5px 10px;background:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;">Change</button>
                    `;
                    
                    // Add event listener to the change button
                    const changeBtn = shippingDisplay.querySelector('.change-shipping-btn');
                    if (changeBtn) {
                        changeBtn.addEventListener('click', () => {
                            const modal = document.querySelector('#shipping-options-modal, .modal.shipping-modal, .shipping-options-modal');
                            if (modal) {
                                modal.style.display = 'block';
                            }
                        });
                    }
                });
            }
        };
        
        // Add the submit handler to the form
        addressForm._hasShippingFix = true;
        addressForm.addEventListener('submit', window._shippingFixHandler);
        
        // Add a much more aggressive click handler to the button that directly
        // handles the submission without relying on form events
        const buttonClickHandler = function(e) {
            console.log('ShippingFix: Button clicked directly');
            
            // Always prevent default behavior to take full control
            e.preventDefault();
            e.stopPropagation();
            
            // Mark the form as being processed to prevent multiple submissions
            if (addressForm._isSubmitting) {
                console.log('ShippingFix: Form already submitting, ignoring additional clicks');
                return;
            }
            
            addressForm._isSubmitting = true;
            
            // We'll manually call our handler function directly
            console.log('ShippingFix: Manually triggering submission handler');
            
            // Call our handler directly with a fake event
            window._shippingFixHandler({
                preventDefault: () => {},
                stopPropagation: () => {},
                submitter: submitButton
            });
            
            // Reset the submitting flag after a delay
            setTimeout(() => {
                addressForm._isSubmitting = false;
            }, 2000);
        };
        
        // Store the handler for potential cleanup
        submitButton._clickHandler = buttonClickHandler;
        
        // Remove any existing click handlers from the button to avoid conflicts
        submitButton.removeEventListener('click', submitButton._clickHandler);
        
        // Add our click handler with capture to ensure it runs first
        submitButton.addEventListener('click', buttonClickHandler, true);
        
        console.log('ShippingFix: Form handlers installed successfully');
        
        // Special fix for nested form or form within a form
        const parentForm = addressForm.closest('form');
        if (parentForm && parentForm !== addressForm) {
            console.log('ShippingFix: Detected nested form, applying special fix');
            parentForm.addEventListener('submit', function(e) {
                // If our form is inside another form, prevent the outer form from submitting
                e.preventDefault();
                e.stopPropagation();
                
                // Trigger our form instead
                const submitEvent = new Event('submit', {
                    bubbles: true,
                    cancelable: true
                });
                addressForm.dispatchEvent(submitEvent);
            });
        }
        
        // Mark the form as fixed
        window._fixesHaveRun = true;
        
        // Special case for SmartDucks form5.html
        if (window.location.pathname.includes('form5.html') || 
            document.title.includes('SmartDucks') || 
            document.querySelector('meta[name="description"]')?.content?.includes('SmartDucks')) {
            
            console.log('ShippingFix: Detected SmartDucks form5.html, applying specialized integrations');
            
            // Try to find specific elements from form5.html to integrate with
            setTimeout(function integrateDeeply() {
                const shippingOptionsDiv = document.getElementById('shippingOptions');
                const orderSummary = document.getElementById('orderSummary');
                const shippingOptionsList = document.getElementById('shippingOptionsList');
                const paymentSection = document.getElementById('paymentSection');
                const finalActionsSection = document.getElementById('finalActions');
                const confirmShippingButtonOriginal = document.getElementById('confirmShipping');
                const addressForm = document.getElementById('addressForm'); // Also get addressForm here

                // Check if all essential elements are found
                if (shippingOptionsDiv && orderSummary && shippingOptionsList && paymentSection && finalActionsSection && confirmShippingButtonOriginal && addressForm) {
                    console.log('ShippingFix (integrateDeeply): All essential form5.html elements found. Attaching event listener.');
                    
                    try {
                        // Listen for our custom event to update their UI
                        // Ensure this listener is only added ONCE
                        if (!window._integrateDeeplyHandlerAttached) {
                            document.addEventListener('shipping-option-selected', function integrateDeeplyHandler(e) {
                                console.log('ShippingFix (integrateDeeplyHandler): shipping-option-selected event caught. Detail:', e.detail);
                                window._integrateDeeplyHandlerAttached = true; // Mark as attached

                                // Hide our modal since form5.html has its own UI
                                const customModal = document.getElementById('shipping-options-modal');
                                if (customModal) {
                                    customModal.style.display = 'none';
                                    console.log('ShippingFix (integrateDeeplyHandler): Hiding custom modal.');
                                }

                                // Use the elements from the integrateDeeply scope
                                shippingOptionsDiv.style.display = 'block';
                                console.log('ShippingFix (integrateDeeplyHandler): Showing form5 shippingOptions div.');

                                console.log('ShippingFix (integrateDeeplyHandler): Populating form5 shippingOptionsList.');
                                shippingOptionsList.innerHTML = `
                                    <p><strong>Selected Shipping:</strong> ${e.detail.option}</p>
                                    <p><strong>Price:</strong> $${parseFloat(e.detail.price).toFixed(2)}</p>
                                    <p><strong>Carrier:</strong> ${e.detail.carrierName || 'N/A'}</p>
                                    <p><strong>Service:</strong> ${e.detail.serviceName || 'N/A'}</p>
                                    <p><strong>Delivery Time:</strong> ${e.detail.transitTime || 'N/A'}</p>
                                `;
                                shippingOptionsList.style.display = 'block'; // Ensure it's visible

                                orderSummary.style.display = 'block';
                                console.log('ShippingFix (integrateDeeplyHandler): Showing orderSummary.');

                                const shippingTotalEl = document.getElementById('shippingTotal'); // This can be fetched here or passed if static
                                if (shippingTotalEl) {
                                    shippingTotalEl.textContent = `$${parseFloat(e.detail.price).toFixed(2)}`;
                                    console.log(`ShippingFix (integrateDeeplyHandler): Updating shippingTotal to: ${e.detail.price}`);
                                } else {
                                    console.log('ShippingFix (integrateDeeplyHandler): shippingTotal element in form5.html not found.');
                                }

                                addressForm.style.display = 'none';
                                console.log('ShippingFix (integrateDeeplyHandler): Hiding addressForm.');

                                if (typeof recalculateOrderTotal === 'function') {
                                    recalculateOrderTotal();
                                }

                                console.log('ShippingFix (integrateDeeplyHandler): Setting up confirmShipping button using original reference.');

                                // Use confirmShippingButtonOriginal from the outer scope
                                const confirmShippingButtonClone = confirmShippingButtonOriginal.cloneNode(true);
                                if (confirmShippingButtonOriginal.parentNode) {
                                    confirmShippingButtonOriginal.parentNode.replaceChild(confirmShippingButtonClone, confirmShippingButtonOriginal);
                                    console.log('ShippingFix (integrateDeeplyHandler): confirmShippingButton cloned and replaced in DOM.');

                                    confirmShippingButtonClone.addEventListener('click', function onConfirmShippingClick(event) {
                                        event.preventDefault();
                                        console.log('ShippingFix (confirmShippingButton clone): Clicked!');

                                        shippingOptionsDiv.style.display = 'none';
                                        console.log('ShippingFix (confirmShippingButton clone): Hid form5.html shippingOptionsDiv.');

                                        orderSummary.style.display = 'block';
                                        console.log('ShippingFix (confirmShippingButton clone): Ensured orderSummary is visible.');

                                        shippingOptionsList.style.display = 'block';
                                        console.log('ShippingFix (confirmShippingButton clone): Ensured shippingOptionsList is visible.');

                                        finalActionsSection.style.display = 'block';
                                        console.log('ShippingFix (confirmShippingButton clone): Displayed finalActionsSection.');

                                        const proceedToPaymentButton = finalActionsSection.querySelector('#proceedToPayment'); // Query within finalActionsSection

                                        if (proceedToPaymentButton) {
                                            const proceedToPaymentClone = proceedToPaymentButton.cloneNode(true);
                                            if (proceedToPaymentButton.parentNode) {
                                                proceedToPaymentButton.parentNode.replaceChild(proceedToPaymentClone, proceedToPaymentButton);
                                                console.log('ShippingFix (confirmShippingButton clone): #proceedToPayment button cloned and replaced.');

                                                proceedToPaymentClone.addEventListener('click', function onProceedToPaymentClick(ev) {
                                                    ev.preventDefault();
                                                    console.log('ShippingFix (#proceedToPayment clone): Clicked.');

                                                    finalActionsSection.style.display = 'none';
                                                    console.log('ShippingFix (#proceedToPayment clone): Hid finalActionsSection.');

                                                    // --- BEGIN INTENSIVE PAYMENTSECTION DEBUG ---
                                                    const currentPaymentSection = document.getElementById('paymentSection');

                                                    if (currentPaymentSection && currentPaymentSection instanceof HTMLElement) {
                                                        console.log('ShippingFix DEBUG (Before): currentPaymentSection is an HTMLElement. ID:', currentPaymentSection.id, 'TagName:', currentPaymentSection.tagName);
                                                        console.log('ShippingFix DEBUG (Before): currentPaymentSection.className:', currentPaymentSection.className);
                                                        console.log('ShippingFix DEBUG (Before): currentPaymentSection display:', window.getComputedStyle(currentPaymentSection).display);
                                                        
                                                        currentPaymentSection.style.setProperty('display', 'block', 'important');
                                                        currentPaymentSection.style.setProperty('visibility', 'visible', 'important');
                                                        currentPaymentSection.style.setProperty('opacity', '1', 'important');
                                                        currentPaymentSection.style.setProperty('border', '5px dashed red', 'important'); 
                                                        currentPaymentSection.style.setProperty('min-height', '50px', 'important'); 
                                                        currentPaymentSection.style.setProperty('background-color', 'yellow', 'important');
                                                        currentPaymentSection.style.setProperty('z-index', '999999', 'important');

                                                        let debugChild = currentPaymentSection.querySelector('#payment-debug-child');
                                                        if (!debugChild) {
                                                            debugChild = document.createElement('div');
                                                            debugChild.id = 'payment-debug-child';
                                                            debugChild.style.setProperty('width', '100%', 'important');
                                                            debugChild.style.setProperty('height', '40px', 'important');
                                                            debugChild.style.setProperty('background-color', 'lime', 'important');
                                                            debugChild.style.setProperty('color', 'black', 'important');
                                                            debugChild.style.setProperty('text-align', 'center', 'important');
                                                            debugChild.style.setProperty('font-weight', 'bold', 'important');
                                                            debugChild.textContent = 'PAYMENT SECTION SHOULD BE HERE';
                                                            currentPaymentSection.appendChild(debugChild);
                                                        } else {
                                                            debugChild.textContent = 'PAYMENT SECTION SHOULD BE HERE (already existed)';
                                                        }
                                                        
                                                        const offsetHeight = currentPaymentSection.offsetHeight; 
                                                        console.log('ShippingFix DEBUG (After Style Set): currentPaymentSection.className:', currentPaymentSection.className);
                                                        console.log('ShippingFix DEBUG (After Style Set): offsetHeight read to force reflow:', offsetHeight);
                                                        console.log('ShippingFix DEBUG (After Style Set): Computed display:', window.getComputedStyle(currentPaymentSection).display, 'Computed visibility:', window.getComputedStyle(currentPaymentSection).visibility, 'Computed opacity:', window.getComputedStyle(currentPaymentSection).opacity);
                                                        console.log('ShippingFix DEBUG (After Style Set): currentPaymentSection.getBoundingClientRect():', JSON.stringify(currentPaymentSection.getBoundingClientRect()));
                                                        console.log('ShippingFix DEBUG (After Style Set): currentPaymentSection.innerHTML (first 200 chars):', currentPaymentSection.innerHTML.substring(0, 200) + (currentPaymentSection.innerHTML.length > 200 ? '...' : ''));

                                                        setTimeout(() => {
                                                            const paymentSectionInTimeout = document.getElementById('paymentSection'); 
                                                            const orderSummaryInTimeout = document.getElementById('orderSummary');
                                                            const shippingOptionsListInTimeout = document.getElementById('shippingOptionsList');

                                                            console.log('--- ShippingFix DEBUG (setTimeout 0ms) --- BEGIN ---');

                                                            if (orderSummaryInTimeout) {
                                                                orderSummaryInTimeout.style.display = 'block'; 
                                                                console.log('ShippingFix DEBUG (setTimeout 0ms): orderSummaryInTimeout.id:', orderSummaryInTimeout.id, 'className:', orderSummaryInTimeout.className, 'Computed display:', window.getComputedStyle(orderSummaryInTimeout).display);
                                                            } else {
                                                                console.error('ShippingFix DEBUG (setTimeout 0ms): orderSummaryInTimeout NOT FOUND');
                                                            }

                                                            if (shippingOptionsListInTimeout) {
                                                                shippingOptionsListInTimeout.style.display = 'block'; 
                                                                console.log('ShippingFix DEBUG (setTimeout 0ms): shippingOptionsListInTimeout.id:', shippingOptionsListInTimeout.id, 'className:', shippingOptionsListInTimeout.className, 'Computed display:', window.getComputedStyle(shippingOptionsListInTimeout).display);
                                                            } else {
                                                                console.error('ShippingFix DEBUG (setTimeout 0ms): shippingOptionsListInTimeout NOT FOUND');
                                                            }
                                                            
                                                            if (paymentSectionInTimeout && paymentSectionInTimeout instanceof HTMLElement) {
                                                                console.log('ShippingFix DEBUG (setTimeout 0ms): Re-fetched paymentSection. ID:', paymentSectionInTimeout.id, 'className:', paymentSectionInTimeout.className);
                                                                const currentStyles = window.getComputedStyle(paymentSectionInTimeout);
                                                                console.log('ShippingFix DEBUG (setTimeout 0ms): paymentSection Computed display:', currentStyles.display, 'visibility:', currentStyles.visibility, 'opacity:', currentStyles.opacity, 'z-index:', currentStyles.zIndex);
                                                                const rect = paymentSectionInTimeout.getBoundingClientRect();
                                                                console.log('ShippingFix DEBUG (setTimeout 0ms): paymentSection getBoundingClientRect(): width:', rect.width, 'height:', rect.height, 'top:', rect.top, 'left:', rect.left, 'bottom:', rect.bottom, 'right:', rect.right, 'x:', rect.x, 'y:', rect.y);
                                                                console.log('ShippingFix DEBUG (setTimeout 0ms): paymentSection.innerHTML (first 200 chars):', paymentSectionInTimeout.innerHTML.substring(0, 200) + (paymentSectionInTimeout.innerHTML.length > 200 ? '...' : ''));

                                                                if (currentStyles.display === 'none') {
                                                                    console.warn('ShippingFix DEBUG (setTimeout 0ms): paymentSection display is STILL NONE. Something is actively hiding it or it was never properly shown.');
                                                                }
                                                                if (rect.width === 0 || rect.height === 0) {
                                                                    console.warn('ShippingFix DEBUG (setTimeout 0ms): paymentSection has zero width or height. This could be due to parent display, or its own styles.');
                                                                }
                                                                
                                                                if (document.body.contains(paymentSectionInTimeout)) {
                                                                    console.log('ShippingFix DEBUG (setTimeout 0ms): paymentSection IS IN THE DOM.');
                                                                    let parent = paymentSectionInTimeout.parentElement;
                                                                    let level = 1;
                                                                    while (parent && parent !== document.body) {
                                                                        const parentStyles = window.getComputedStyle(parent);
                                                                        console.log(`ShippingFix DEBUG (setTimeout 0ms): Parent L${level} - Tag: ${parent.tagName}, ID: ${parent.id || 'N/A'}, Class: '${parent.className}', Display: ${parentStyles.display}, Visibility: ${parentStyles.visibility}`);
                                                                        parent = parent.parentElement;
                                                                        level++;
                                                                    }
                                                                    if (parent === document.body) {
                                                                        console.log('ShippingFix DEBUG (setTimeout 0ms): Reached document.body.');
                                                                    } else {
                                                                        console.warn('ShippingFix DEBUG (setTimeout 0ms): Traversal stopped before reaching document.body. Last parent:', parent);
                                                                    }
                                                                } else {
                                                                    console.error('ShippingFix DEBUG (setTimeout 0ms): paymentSection is NO LONGER IN THE DOM.');
                                                                }

                                                            } else {
                                                                console.error('ShippingFix DEBUG (setTimeout 0ms): Could not re-fetch paymentSection by ID, or it is not an HTMLElement. Original currentPaymentSection reference was:', currentPaymentSection ? currentPaymentSection.id : 'null/undefined');
                                                                const stillExists = document.getElementById('paymentSection');
                                                                console.log('ShippingFix DEBUG (setTimeout 0ms): Second attempt to find #paymentSection:', stillExists ? 'Found (' + stillExists.tagName + ')' : 'Not Found');
                                                            }
                                                            console.log('--- ShippingFix DEBUG (setTimeout 0ms) --- END ---');
                                                        }, 0); 

                                                        if (currentPaymentSection.parentElement) { 
                                                            console.log('ShippingFix DEBUG: Parent (tagName:', currentPaymentSection.parentElement.tagName, 'id:', currentPaymentSection.parentElement.id, ') computed display:', window.getComputedStyle(currentPaymentSection.parentElement).display);
                                                            if (currentPaymentSection.parentElement.parentElement) {
                                                                console.log('ShippingFix DEBUG: Grandparent (tagName:', currentPaymentSection.parentElement.parentElement.tagName, 'id:', currentPaymentSection.parentElement.parentElement.id, ') computed display:', window.getComputedStyle(currentPaymentSection.parentElement.parentElement).display);
                                                            }
                                                        }
                                                    } else {
                                                        console.error('ShippingFix DEBUG: currentPaymentSection (ID: paymentSection) NOT FOUND or not an HTMLElement. Value:', currentPaymentSection);
                                                    }
                                                    // --- END INTENSIVE PAYMENTSECTION DEBUG ---
                                                    
                                                    const orderSummaryElement = document.getElementById('orderSummary'); 
                                                    if (orderSummaryElement) {
                                                        orderSummaryElement.style.display = 'block';
                                                        console.log('ShippingFix (#proceedToPayment clone): Ensured orderSummary is visible with paymentSection. Display:', window.getComputedStyle(orderSummaryElement).display);
                                                    } else {
                                                        console.error('ShippingFix (#proceedToPayment clone): orderSummary element NOT FOUND when trying to ensure visibility.');
                                                    }

                                                    const shippingOptionsListElement = document.getElementById('shippingOptionsList'); 
                                                    if (shippingOptionsListElement) {
                                                        shippingOptionsListElement.style.display = 'block';
                                                        console.log('ShippingFix (#proceedToPayment clone): Ensured shippingOptionsList is visible with paymentSection. Display:', window.getComputedStyle(shippingOptionsListElement).display);
                                                    } else {
                                                        console.error('ShippingFix (#proceedToPayment clone): shippingOptionsList element NOT FOUND when trying to ensure visibility.');
                                                    }

                                                    if (typeof recalculateOrderTotal === 'function') {
                                                        recalculateOrderTotal();
                                                    }
                                                }
                                            });
                                        } 
                                        else { // This block executes if quotes.length is 0 or quotes is not a valid array
                                            console.log('ShippingFix: Fallback - quotes array is empty, not an array, or length is zero. Actual length:', (quotes ? quotes.length : 'N/A'), 'Is Array:', Array.isArray(quotes), 'Data received:', data);
                                            let messageHTML = ""; // Initialize empty

                                            if (data && data.success === false && data.error) {
                                                messageHTML = `<p><strong>An error occurred:</strong> ${data.error}</p>`;
                                                if (data.error.toLowerCase().includes("empty response from server") || data.error.toLowerCase().includes("no data received")) {
                                                    messageHTML += "<p>The shipping service did not return any data. This might be a temporary issue or a problem with the address provided. Please ensure all address fields are correct and try again.</p>";
                                                } else if (data.error.toLowerCase().includes("json parse error") || data.error.toLowerCase().includes("unexpected eof")) {
                                                    messageHTML += "<p>There was a problem understanding the response from the shipping service. Please try again. If the issue persists, contact support.</p>";
                                                } else {
                                                    messageHTML += "<p>Please check your address details and try again. If the problem persists, contact support.</p>";
                                                }
                                            } else if (data && data.message && (!quotes || quotes.length === 0)) { 
                                                 messageHTML = `<p>${data.message}</p>`; // Display message from server if rates are empty but message exists
                                            } else {
                                                // Default generic message if no specific error info is available in 'data'
                                                messageHTML = "<p>Could not display shipping options at this time.</p>";
                                                messageHTML += "<p>No shipping data was received. Please check your address and try again.</p>";
                                            }
                                            container.innerHTML = messageHTML;
                                        }
                                        
                                        // Make sure the modal is visible
                                        setTimeout(() => {
                                            modalElement.style.display = 'block';
                                            modalElement.style.visibility = 'visible';
                                            modalElement.style.opacity = '1';
                                        }, 100);
                                        
                                        console.log('ShippingFix: Modal should now be visible');
                                        
                                        // If there was an original submit handler, call it now but prevent form submission
                                        if (originalSubmit && typeof originalSubmit === 'function') {
                                            console.log('ShippingFix: Calling original submit handler');
                                            try {
                                                // Create a fake event to pass to the original handler
                                                const fakeEvent = { preventDefault: () => {} };
                                                originalSubmit.call(addressForm, fakeEvent);
                                            } catch (err) {
                                                console.error('ShippingFix: Error calling original handler:', err);
                                            }
                                        }
                                    })
                                    .catch(error => {
                                        console.error('ShippingFix: Error fetching shipping options:', error);
                                        const loadingEl = document.getElementById('sm-loading-indicator');
                                        if (loadingEl) loadingEl.remove();
                                        
                                        if (error.message && error.message.includes('CORS')) {
                                            const corsErrorDiv = document.createElement('div');
                                            corsErrorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;justify-content:center;align-items:center;color:white;';
                                            corsErrorDiv.innerHTML = `
                                                <div style="background:#f44336;padding:20px;border-radius:5px;max-width:500px;text-align:center;">
                                                <h3 style="margin-top:0;">Connection Error</h3>
                                                <p>We\\'re having trouble connecting to our shipping service due to a security configuration issue.</p>
                                                <p>Our team has been notified and is working on a fix. Please try again later or contact customer service.</p>
                                                <p>Technical details: CORS configuration error</p>
                                                <button onclick="this.parentNode.parentNode.remove()" style="padding:8px 16px;background:#fff;color:#f44336;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Close</button>
                                                </div>
                                            `;
                                            document.body.appendChild(corsErrorDiv);
                                        } else {
                                            alert('Error loading shipping options. Please try again. If the problem persists, contact support.');
                                        }
                                    }); // End of .catch() for fetch
                }; // End of window._shippingFixHandler = function(e) { ... }

                // Ensure addressForm and submitButton are defined in the scope of runFixes
                // (They are expected to be found by ID at the beginning of runFixes)
                if (addressForm && submitButton) {
                    addressForm._hasShippingFix = true;
                    addressForm.removeEventListener('submit', window._shippingFixHandler); // Remove if already there
                    addressForm.addEventListener('submit', window._shippingFixHandler);
                    console.log('ShippingFix: Main submit handler (re-)attached to form.');

                    const buttonClickHandler = function(e) {
                        console.log('ShippingFix: Submit Button clicked directly (aggressive handler)');
                        e.preventDefault();
                        e.stopPropagation(); 

                        if (addressForm._isSubmitting) {
                            console.log('ShippingFix: Form already submitting, ignoring click.');
                            return;
                        }
                        addressForm._isSubmitting = true;
                        console.log('ShippingFix: Manually triggering submission handler via button click.');
                        
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
                } else {
                    if (!addressForm) console.error('ShippingFix Error: addressForm not found in runFixes. Cannot attach main submit handler.');
                    if (!submitButton) console.error('ShippingFix Error: submitButton not found in runFixes. Cannot attach aggressive click handler.');
                }
                
                if (addressForm) {
                    const parentForm = addressForm.closest('form');
                    if (parentForm && parentForm !== addressForm) {
                        console.log('ShippingFix: Detected nested form, applying special fix to parent form.');
                        parentForm.addEventListener('submit', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('ShippingFix: Parent form submission intercepted, dispatching to our addressForm.');
                            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                            addressForm.dispatchEvent(submitEvent);
                        });
                    }
                }

                // Set up global event handler for shipping option selection
                if (!window._shippingOptionHandlerInstalled) {
                    window._shippingOptionHandlerInstalled = true;
                    document.addEventListener('shipping-option-selected', function(e) {
                        console.log('ShippingFix (Global Listener): Shipping option selected:', e.detail);
                        const currentAddressForm = document.getElementById('addressForm'); 
                        if (!currentAddressForm) {
                            console.error("ShippingFix (Global Listener): addressForm not found. Cannot store shipping details.");
                            return;
                        }

                        let shippingOptionField = currentAddressForm.querySelector('input[name="selected_shipping_option"]');
                        if (!shippingOptionField) {
                            shippingOptionField = document.createElement('input');
                            shippingOptionField.type = 'hidden';
                            shippingOptionField.name = 'selected_shipping_option';
                            currentAddressForm.appendChild(shippingOptionField);
                        }
                        shippingOptionField.value = e.detail.quoteId;

                        let shippingPriceField = currentAddressForm.querySelector('input[name="selected_shipping_price"]');
                        if (!shippingPriceField) {
                            shippingPriceField = document.createElement('input');
                            shippingPriceField.type = 'hidden';
                            shippingPriceField.name = 'selected_shipping_price';
                            currentAddressForm.appendChild(shippingPriceField);
                        }
                        shippingPriceField.value = e.detail.price;
                        console.log('ShippingFix (Global Listener): Stored shipping option and price in hidden fields on addressForm.');
                        
                        let shippingDisplay = document.querySelector('.shipping-display-fix'); 
                        if (!shippingDisplay) {
                            shippingDisplay = document.createElement('div');
                            shippingDisplay.className = 'shipping-display-fix'; 
                            shippingDisplay.style.cssText = 'margin:15px 0;padding:10px;border:1px solid #ddd;border-radius:4px;background:#f9f9f9;';
                            const submitBtnEl = currentAddressForm.querySelector('button[type="submit"], input[type="submit"], .submit-button');
                            if (submitBtnEl && submitBtnEl.parentNode) {
                                submitBtnEl.parentNode.insertBefore(shippingDisplay, submitBtnEl);
                            } else {
                                currentAddressForm.appendChild(shippingDisplay); 
                            }
                        }
                        shippingDisplay.innerHTML = `
                            <p style="margin:0 0 5px 0;font-weight:bold;">Selected Shipping:</p>
                            <p style="margin:0 0 8px 0;">${e.detail.option} ($${parseFloat(e.detail.price).toFixed(2)})</p>
                            <button type="button" class="change-shipping-btn-fix" style="padding:6px 12px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;">Change Shipping</button>
                        `;
                        const changeBtn = shippingDisplay.querySelector('.change-shipping-btn-fix');
                        if (changeBtn) {
                            changeBtn.addEventListener('click', () => {
                                const modal = document.getElementById('shipping-options-modal'); 
                                if (modal) {
                                    modal.style.display = 'block';
                                    console.log('ShippingFix: "Change Shipping" clicked, showing modal.');
                                } else {
                                    console.warn("ShippingFix: Modal 'shipping-options-modal' not found for change button.");
                                    if(submitButton) submitButton.click(); // Fallback: try to re-trigger original process
                                }
                            });
                        }
                    });
                    console.log('ShippingFix: Global shipping-option-selected listener installed.');
                }
            } // End of runFixes function

            // Initialize the fixes when the DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('ShippingFix: DOMContentLoaded, now running fixes.');
                    runFixes();
                });
            } else {
                console.log('ShippingFix: DOM already ready, running fixes immediately.');
                runFixes();
            }

        })(); // End of IIFE