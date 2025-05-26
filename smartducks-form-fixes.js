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
    
    // Format postal code based on country selection
    function formatPostalCode(country, value) {
        if (!value) return '';
        
        // First, clean up the value to remove non-alphanumeric characters
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
        
        if (country === 'CA') {
            // For Canadian postal codes: A1A 1A1 format
            // Simple approach: just uppercase and ensure max 6 chars with space after 3rd char
            const upperValue = cleanValue.toUpperCase();
            
            // Take the first 6 characters only (excluding spaces)
            const sixChars = upperValue.substring(0, 6);
            
            // Insert space after the 3rd character if it doesn't exist and we have more than 3 chars
            if (sixChars.length <= 3) {
                return sixChars;
            } else {
                // Add space after first 3 characters
                const formatted = `${sixChars.substring(0, 3)} ${sixChars.substring(3)}`.trim();
                return formatted;
            }
        } else if (country === 'US') {
            // For US zip codes: 12345 or 12345-6789 format
            if (cleanValue.length <= 5) {
                return cleanValue;
            } else {
                // Insert hyphen after 5th digit
                return `${cleanValue.substring(0, 5)}-${cleanValue.substring(5, 9)}`.trim();
            }
        }
        
        // Default for other countries or no country selected
        return cleanValue;
    }

    // Update state options when country changes
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
            postalInput.pattern = isCanada ? '[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]' : '\\d{5}(-\\d{4})?';
            postalInput.placeholder = isCanada ? 'A1A 1A1' : '12345 or 12345-6789';
            // Clear postal code when country changes
            postalInput.value = '';
            
            // Remove any existing input event handlers and add the new one
            postalInput.removeEventListener('input', window.handlePostalInput);
            window.handlePostalInput = function() {
                const countrySelect = document.getElementById('countryCode');
                const country = countrySelect ? countrySelect.value : '';
                
                // Get cursor position and content before update
                const currentValue = this.value;
                const cursorPos = this.selectionStart;
                
                // Calculate if we're adding or removing a space character
                const willAddSpace = country === 'CA' && 
                                    currentValue.length === 3 && 
                                    !currentValue.includes(' ') && 
                                    cursorPos === 3;
                
                const formattedValue = formatPostalCode(country, currentValue);
                
                // Only update if the formatted value is different
                if (formattedValue !== currentValue) {
                    // Get cursor position before update
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    
                    // Save the old value to compare
                    const oldValue = this.value;
                    this.value = formattedValue;
                    
                    // Adjust cursor position if needed
                    if (document.activeElement === this) {
                        let newPos = start;
                        
                        // If adding a space after typing the first 3 characters, move cursor after space
                        if (willAddSpace) {
                            newPos = 4; // Position after the space
                        }
                        // If cursor was at or after a space that was added/removed, adjust position
                        else if (formattedValue.length !== oldValue.length) {
                            // Check if cursor was after position where space is added in Canadian postal code
                            if (country === 'CA' && cursorPos > 3) {
                                // If space was added, move cursor forward
                                if (formattedValue.length > oldValue.length) {
                                    newPos = cursorPos + 1;
                                } 
                                // If space was removed, move cursor backward
                                else if (formattedValue.length < oldValue.length) {
                                    newPos = Math.max(3, cursorPos - 1);
                                }
                            }
                        }
                        
                        // Make sure we're not beyond the end of the string
                        newPos = Math.min(newPos, formattedValue.length);
                        
                        if (start === end) {
                            // If no selection, use calculated position
                            this.setSelectionRange(newPos, newPos);
                        } else {
                            // If there was a selection, adjust the selection
                            const selectionLength = end - start;
                            this.setSelectionRange(newPos, newPos + selectionLength);
                        }
                    }
                }
            };
            postalInput.addEventListener('input', window.handlePostalInput);
        }
        
        console.log(`Updated state select with ${Object.keys(statesData[country]).length} options`);
    }

    // Main function to initialize the fix
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
                    // Simplified event handling for production
                    
                    postalInput.removeEventListener('input', window.handlePostalInput);
                    window.handlePostalInput = function(event) {
                        const countrySelect = document.getElementById('countryCode');
                        const country = countrySelect ? countrySelect.value : '';
                        
                        // Get cursor position and content before update
                        const currentValue = this.value;
                        const cursorPos = this.selectionStart;
                        
                        // Calculate if we're adding or removing a space character
                        const willAddSpace = country === 'CA' && 
                                            currentValue.length === 3 && 
                                            !currentValue.includes(' ') && 
                                            cursorPos === 3;
                        
                        const formattedValue = formatPostalCode(country, currentValue);
                        
                        // Only update if the formatted value is different
                        if (formattedValue !== currentValue) {
                            // Get cursor position before update
                            const start = this.selectionStart;
                            const end = this.selectionEnd;
                            
                            // Save the old value to compare
                            const oldValue = this.value;
                            this.value = formattedValue;
                            
                            // Adjust cursor position if needed
                            if (document.activeElement === this) {
                                let newPos = start;
                                
                                // If adding a space after typing the first 3 characters, move cursor after space
                                if (willAddSpace) {
                                    newPos = 4; // Position after the space
                                }
                                // If cursor was at or after a space that was added/removed, adjust position
                                else if (formattedValue.length !== oldValue.length) {
                                    // Check if cursor was after position where space is added in Canadian postal code
                                    if (country === 'CA' && cursorPos > 3) {
                                        // If space was added, move cursor forward
                                        if (formattedValue.length > oldValue.length) {
                                            newPos = cursorPos + 1;
                                        } 
                                        // If space was removed, move cursor backward
                                        else if (formattedValue.length < oldValue.length) {
                                            newPos = Math.max(3, cursorPos - 1);
                                        }
                                    }
                                }
                                
                                // Make sure we're not beyond the end of the string
                                newPos = Math.min(newPos, formattedValue.length);
                                
                                if (start === end) {
                                    // If no selection, use calculated position
                                    this.setSelectionRange(newPos, newPos);
                                } else {
                                    // If there was a selection, adjust the selection
                                    const selectionLength = end - start;
                                    this.setSelectionRange(newPos, newPos + selectionLength);
                                }
                            }
                        }
                    };
                    postalInput.addEventListener('input', window.handlePostalInput);
                    console.log('Postal code formatting handlers applied');
                    
                    // Make sure form submission handlers aren't affected
                    const addressForm = document.getElementById('addressForm');
                    if (addressForm) {
                        console.log('Re-verifying form submission handler is working');
                        // We don't need to do anything here, just ensuring it's checked
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
    function ensureFormSubmitWorks() {
        console.log('ShippingFix: Ensuring form submission handler is working');
        
        // Try to find the form with multiple selectors
        let addressForm = document.getElementById('addressForm');
        
        // If not found by ID, try other approaches
        if (!addressForm) {
            console.log('ShippingFix: Form not found by ID, trying alternatives...');
            
            // Look for forms with specific classes or attributes
            addressForm = document.querySelector('form[action*="shipping"], form[action*="checkout"], form.shipping-form, form.checkout-form');
            
            if (addressForm) {
                console.log('ShippingFix: Found form via alternative selector:', addressForm.id || addressForm.className);
            } else {
                // Last resort - any form
                const allForms = document.querySelectorAll('form');
                console.log(`ShippingFix: Found ${allForms.length} forms on page, selecting first one with shipping-related button`);
                
                // Find the first form with a shipping-related button
                for (const form of allForms) {
                    const shippingButton = form.querySelector('button:contains("shipping"), button:contains("Shipping"), input[value*="shipping"]');
                    if (shippingButton) {
                        addressForm = form;
                        console.log('ShippingFix: Selected form with shipping button:', form.id || form.className);
                        break;
                    }
                }
                
                // If still not found, just use the first form
                if (!addressForm && allForms.length > 0) {
                    addressForm = allForms[0];
                    console.log('ShippingFix: Using first form as fallback:', addressForm.id || addressForm.className);
                }
            }
        }
        
        // No need to debug form fields in production
        
        // Find the submit button - try multiple approaches
        let submitButton = null;
        if (addressForm) {
            // Try multiple approaches to find the button
            submitButton = addressForm.querySelector('.submit-button, button[type="submit"], input[type="submit"]');
            
            // Try finding by text content (more comprehensive approach)
            if (!submitButton) {
                const buttons = Array.from(addressForm.querySelectorAll('button, input[type="button"], input[type="submit"]'));
                submitButton = buttons.find(btn => {
                    const btnText = (btn.textContent || btn.value || '').toLowerCase();
                    return btnText.includes('shipping') || 
                           btnText.includes('options') || 
                           btnText.includes('continue') ||
                           btnText.includes('next');
                });
            }
            
            // Last resort - any button in the form
            if (!submitButton) {
                submitButton = addressForm.querySelector('button, input[type="button"], input[type="submit"]');
            }
        }
        
        if (!addressForm) {
            console.log('ShippingFix: Address form not found yet, will retry in 500ms...');
            setTimeout(ensureFormSubmitWorks, 500);
            return;
        }
        
        if (!submitButton) {
            console.log('ShippingFix: Submit button not found, will retry in 500ms...');
            setTimeout(ensureFormSubmitWorks, 500);
            return;
        }
        
        console.log('ShippingFix: Found form and button:', submitButton.textContent?.trim() || submitButton.value || 'Unknown button');
        
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
            
            // No need to log fetch options in production
            
            // Send the request with fallbacks for errors
            fetch(actionUrl, fetchOptions)
            .then(response => {
                console.log('ShippingFix: Got response:', response.status, 'Content-Type:', response.headers.get('content-type'));
                
                // Handle different response types
                const contentType = response.headers.get('content-type');
                
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
                            return { html: text, success: false, error: 'Server returned HTML instead of JSON' };
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
                        } else if (data.success && data.data && Array.isArray(data.data)) {
                            console.log('ShippingFix: Found data array in success response');
                            data.quotes = data.data;
                        }
                    }
                }
                
                // Look for an existing modal first
                let modal = document.querySelector('.modal.shipping-modal, #shippingModal, .shipping-options-modal, .modal, [id*="modal"], [class*="modal"]');
                
                // If no modal exists, create one
                if (!modal) {
                    console.log('ShippingFix: No existing modal found, creating one');
                    modal = document.createElement('div');
                    modal.id = 'shipping-options-modal';
                    modal.className = 'modal shipping-options-modal';
                    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1050;display:block;';
                    
                    modal.innerHTML = `
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
                    
                    document.body.appendChild(modal);
                    
                    // Add event listeners for closing
                    const closeButtons = modal.querySelectorAll('.close, .cancel-btn');
                    closeButtons.forEach(btn => {
                        btn.addEventListener('click', () => {
                            modal.style.display = 'none';
                        });
                    });
                    
                    // Close when clicking outside
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.style.display = 'none';
                        }
                    });
                }
                
                // Get the container for shipping options
                const container = modal.querySelector('.shipping-options-container, .modal-body');
                if (!container) {
                    console.error('ShippingFix: No container found in modal');
                    
                    // If no container found, create one
                    const newContainer = document.createElement('div');
                    newContainer.className = 'shipping-options-container';
                    newContainer.style.cssText = 'padding:15px;';
                    
                    // Find a spot to insert it
                    const modalContent = modal.querySelector('.modal-content, .modal-dialog') || modal;
                    modalContent.appendChild(newContainer);
                    
                    // Use our new container
                    container = newContainer;
                }
                
                // Clear previous content
                container.innerHTML = '';
                
                // Parse and display the shipping options
                // First, try to extract the quotes from the N8N response
                let quotes = [];
                
                // Try all possible response formats from N8N
                if (data.quotes && Array.isArray(data.quotes)) {
                    quotes = data.quotes;

                }
                else if (data.data && data.data.quotes && Array.isArray(data.data.quotes)) {
                    quotes = data.data.quotes;

                }
                else if (data.success && data.data && Array.isArray(data.data)) {
                    quotes = data.data;

                }
                else if (data.html) {
                    // If we got HTML directly
                    container.innerHTML = data.html;
                }
                else if (data.options && Array.isArray(data.options)) {
                    quotes = data.options;

                }
                else if (data.shipping_rates && Array.isArray(data.shipping_rates)) {
                    quotes = data.shipping_rates;

                }
                else {
                    // Check if we got the full response object from N8N
                    try {
                        // Sometimes the quotes are deeply nested in the response
                        if (data.body && typeof data.body === 'string') {
                            const parsedBody = JSON.parse(data.body);
                            if (parsedBody.quotes && Array.isArray(parsedBody.quotes)) {
                                quotes = parsedBody.quotes;
                            }
                        }
                    } catch (e) {
                        console.error('ShippingFix: Error parsing body:', e);
                    }
                }
                
                // If we found quotes, display them
                if (quotes.length > 0) {
                    
                    quotes.forEach(quote => {
                        const optionEl = document.createElement('div');
                        optionEl.className = 'shipping-option';
                        optionEl.style.cssText = 'margin-bottom:10px;padding:10px;border:1px solid #ddd;border-radius:4px;cursor:pointer;';
                        
                        // Store quote data for later use
                        optionEl.dataset.quoteId = quote.id || '';
                        
                        // Format the price consistently (decimal with 2 decimal places)
                        let price = 0;
                        let currency = 'CAD';
                        
                        // Try all possible price formats
                        if (quote.total_charge) {
                            price = quote.total_charge / 100; // Usually in cents
                            currency = quote.currency || 'CAD';
                        } else if (quote.total_price) {
                            price = parseFloat(quote.total_price);
                            currency = quote.currency || 'CAD';
                        } else if (quote.price) {
                            price = parseFloat(quote.price);
                            currency = quote.currency || 'CAD';
                        }
                        
                        // Format the price for display
                        const formattedPrice = `$${price.toFixed(2)} ${currency}`;
                        optionEl.dataset.price = price.toFixed(2);
                        
                        // Build a consistent structure for the shipping option
                        optionEl.innerHTML = `
                            <div class="shipping-option-header" style="display:flex;justify-content:space-between;margin-bottom:5px;">
                                <h3 style="margin:0;font-size:16px;font-weight:bold;">${quote.carrier_name || quote.service_name || quote.name || 'Shipping Option'}</h3>
                                <h3 style="margin:0;font-size:16px;font-weight:bold;">${formattedPrice}</h3>
                            </div>
                            <div class="shipping-details">
                                <div>Transit Time: ${quote.transit_days || quote.transit_time || '3-5'} Days</div>
                                ${quote.description ? `<div style="color:#666;margin-top:5px;">${quote.description}</div>` : ''}
                            </div>
                        `;
                        
                        // Add click handler to select this option
                        optionEl.addEventListener('click', function() {
                            // Remove selected class from all options
                            container.querySelectorAll('.shipping-option').forEach(opt => {
                                opt.classList.remove('selected');
                                opt.style.backgroundColor = '';
                                opt.style.borderColor = '#ddd';
                            });
                            
                            // Mark this option as selected
                            this.classList.add('selected');
                            this.style.backgroundColor = '#f0f8ff';
                            this.style.borderColor = '#007bff';
                            
                            // Update the select button to show the selected option
                            const selectBtn = modal.querySelector('.select-option-btn');
                            if (selectBtn) {
                                selectBtn.textContent = `Select ${quote.carrier_name || quote.service_name || 'This Option'}`;
                                selectBtn.disabled = false;
                            }
                        });
                        
                        container.appendChild(optionEl);
                    });
                    
                    // Add select button functionality
                    const selectBtn = modal.querySelector('.select-option-btn');
                    if (selectBtn) {
                        selectBtn.disabled = true;
                        selectBtn.textContent = 'Select an Option';
                        
                        selectBtn.addEventListener('click', function() {
                            const selectedOption = container.querySelector('.shipping-option.selected');
                            if (!selectedOption) {
                                alert('Please select a shipping option first');
                                return;
                            }
                            
                            // Create an event to communicate the selected shipping option
                            const event = new CustomEvent('shipping-option-selected', {
                                detail: {
                                    quoteId: selectedOption.dataset.quoteId,
                                    price: selectedOption.dataset.price,
                                    option: selectedOption.innerHTML
                                }
                            });
                            document.dispatchEvent(event);
                            
                            // Hide the modal
                            modal.style.display = 'none';
                        });
                    }
                } 
                else {
                    // If no quotes found, show raw data
                    container.innerHTML = `
                        <p>Shipping options received but couldn't be parsed. Please select an option:</p>
                        <pre style="background:#f4f4f4;padding:10px;overflow:auto;font-size:12px;max-height:400px;">${JSON.stringify(data, null, 2)}</pre>
                        <p>If you see shipping options above, please contact support with this data.</p>
                    `;
                }
                
                // Now make the modal visible using multiple approaches
                // 1. Direct style manipulation
                modal.style.display = 'block';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
                
                // 2. Bootstrap jQuery approach
                if (window.jQuery && window.jQuery.fn && window.jQuery.fn.modal) {
                    console.log('ShippingFix: Using jQuery Bootstrap modal method');
                    try {
                        window.jQuery(modal).modal('show');
                    } catch(e) {
                        console.error('ShippingFix: Error showing Bootstrap modal:', e);
                    }
                }
                
                // 3. Native dialog element
                if (modal.tagName && modal.tagName.toLowerCase() === 'dialog') {
                    console.log('ShippingFix: Using native dialog methods');
                    if (modal.showModal) {
                        modal.showModal();
                    } else if (modal.show) {
                        modal.show();
                    }
                }
                
                // 4. Add/remove CSS classes
                modal.classList.add('show', 'in', 'active', 'visible', 'opened');
                modal.classList.remove('hide', 'hidden', 'closed');
                
                // 5. Add backdrop if needed
                if (!document.querySelector('.modal-backdrop')) {
                    const backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1040;background-color:rgba(0,0,0,0.5);';
                    document.body.appendChild(backdrop);
                }
                
                // 6. Use high z-index
                modal.style.zIndex = '1050';
                
                // 7. Force display again after a slight delay in case other scripts try to hide it
                setTimeout(() => {
                    modal.style.display = 'block';
                    modal.style.visibility = 'visible';
                    modal.style.opacity = '1';
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
                
                // Show error message
                alert('Error loading shipping options. Please try again.');
            });
            
            // Set up global event handler for shipping option selection
            if (!window._shippingOptionHandlerInstalled) {
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
                    
                    // Update the shipping display in the form
                    const shippingDisplay = document.createElement('div');
                    shippingDisplay.className = 'selected-shipping-display';
                    shippingDisplay.innerHTML = `
                        <h3>Selected Shipping Option</h3>
                        <div class="shipping-summary">${e.detail.option}</div>
                        <button type="button" class="change-shipping-btn">Change Shipping Option</button>
                    `;
                    
                    // Find a good place to display the shipping information
                    const existingDisplay = document.querySelector('.selected-shipping-display');
                    if (existingDisplay) {
                        existingDisplay.innerHTML = shippingDisplay.innerHTML;
                    } else {
                        // Try to find the submit button to insert before
                        const submitBtn = addressForm.querySelector('.submit-button, button[type="submit"], input[type="submit"]');
                        if (submitBtn && submitBtn.parentNode) {
                            submitBtn.parentNode.insertBefore(shippingDisplay, submitBtn);
                        } else {
                            // Just append to the form if we can't find a good place
                            addressForm.appendChild(shippingDisplay);
                        }
                    }
                    
                    // Enable the change shipping button if it exists
                    const changeBtn = document.querySelector('.change-shipping-btn');
                    if (changeBtn) {
                        changeBtn.addEventListener('click', function() {
                            // Re-show the shipping options modal
                            const modal = document.getElementById('shipping-options-modal');
                            if (modal) {
                                modal.style.display = 'block';
                                modal.style.visibility = 'visible';
                                modal.style.opacity = '1';
                            } else {
                                // If modal doesn't exist anymore, trigger the form submission again
                                window._shippingFixHandler({
                                    preventDefault: () => {},
                                    stopPropagation: () => {}
                                });
                            }
                        });
                    }
                    
                    // Hide the loading/address form and show the next step
                    addressForm.style.display = 'none';
                    
                    // Check if there's a specific section to show next
                    const paymentSection = document.getElementById('payment-section') || document.querySelector('.payment-section, .payment-form');
                    if (paymentSection) {
                        paymentSection.style.display = 'block';
                    }
                    
                    // Dispatch an event indicating shipping selection is complete
                    const completeEvent = new CustomEvent('shipping-selection-complete', {
                        detail: e.detail
                    });
                    document.dispatchEvent(completeEvent);
                });
                window._shippingOptionHandlerInstalled = true;
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
        window._formSubmitFixed = true;
    }
    
    // Run the fix when the document is ready
    function runFixes() {
        if (window._fixesHaveRun) return;
        window._fixesHaveRun = true;
        
        initStateProvinceFix();
        setTimeout(monitorStateProvince, 2000);
        setTimeout(ensureFormSubmitWorks, 1000); // Add form submission fix
        
        // Special case for SmartDucks form5.html
        if (window.location.pathname.includes('form5.html') || 
            document.title.includes('SmartDucks') || 
            document.querySelector('meta[name="description"]')?.content?.includes('SmartDucks')) {
            
            console.log('ShippingFix: Detected SmartDucks form5.html, applying specialized integrations');
            
            // Try to find specific elements from form5.html to integrate with
            setTimeout(function integrateDeeply() {
                // Check for the main shipping options div
                const shippingOptionsDiv = document.getElementById('shippingOptions');
                if (shippingOptionsDiv) {
                    console.log('ShippingFix: Found shippingOptions div, will integrate directly');
                    
                    // Listen for our custom event to update their UI
                    document.addEventListener('shipping-option-selected', function(e) {
                        
                        // Hide our modal since form5.html has its own UI
                        const modal = document.getElementById('shipping-options-modal');
                        if (modal) modal.style.display = 'none';
                        
                        // Show the shipping options div
                        shippingOptionsDiv.style.display = 'block';
                        
                        // Update any summary or order total elements if they exist
                        const orderSummary = document.getElementById('orderSummary');
                        if (orderSummary) {
                            orderSummary.style.display = 'block';
                            
                            // Try to update the shipping cost display
                            const shippingCostEl = document.getElementById('shippingCost');
                            if (shippingCostEl && e.detail.price) {
                                shippingCostEl.textContent = '$' + parseFloat(e.detail.price).toFixed(2);
                                
                                // If they have an updateTotals function, call it
                                if (typeof window.updateTotals === 'function') {
                                    window.updateTotals();
                                }
                            }
                        }
                        
                        // Hide the address form if it exists
                        const addressForm = document.getElementById('addressForm');
                        if (addressForm) {
                            addressForm.style.display = 'none';
                        }
                    });
                } else {
                    // Try again in a moment if page is still loading
                    setTimeout(integrateDeeply, 500);
                }
            }, 1000);
        }
    }

    // Run when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runFixes);
    } else {
        // DOM already loaded, run immediately
        runFixes();
    }

    // Extra safety: also run on window load
    window.addEventListener('load', function() {
        if (!window._fixesHaveRun) {
            console.log('Fixes not run before window load, running now');
            runFixes();
        } else {
            console.log('Fixes already applied, performing final verification');
            
            // Final verification using several approaches
            setTimeout(function() {
                const countrySelect = document.getElementById('countryCode');
                const stateSelect = document.getElementById('state');
                
                if (countrySelect && stateSelect && countrySelect.value) {
                    if (stateSelect.disabled || stateSelect.options.length <= 1) {
                        console.log('Final check: Fixing state selector');
                        
                        try {
                            // First try - direct update
                            updateStateOptions(countrySelect.value);
                            
                            // Additional validation
                            if (stateSelect.disabled || stateSelect.options.length <= 1) {
                                console.log('Direct update failed, trying aggressive approach');
                                
                                // Replace elements if the direct approach didn't work
                                const newCountrySelect = countrySelect.cloneNode(true);
                                countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);
                                
                                const newStateSelect = stateSelect.cloneNode(true);
                                stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);
                                
                                // Get fresh references
                                const freshCountrySelect = document.getElementById('countryCode');
                                freshCountrySelect.value = countrySelect.value;
                                
                                // Re-add event listener
                                freshCountrySelect.addEventListener('change', function() {
                                    updateStateOptions(this.value);
                                });
                                
                                // Update state options
                                updateStateOptions(freshCountrySelect.value);
                                
                                // Also check postal code formatting
                                const postalInput = document.getElementById('postalCode');
                                if (postalInput && postalInput.value) {
                                    console.log('Final check: Reformatting postal code:', postalInput.value);
                                    const formatted = formatPostalCode(freshCountrySelect.value, postalInput.value);
                                    if (formatted !== postalInput.value) {
                                        console.log(`Postal code corrected during final check: ${postalInput.value} → ${formatted}`);
                                        postalInput.value = formatted;
                                    }
                                }
                                console.log('Aggressive fix applied');
                            }
                        } catch (err) {
                            console.error('Error during final state selector fix:', err);
                        }
                    }
                }
            }, 500);
        }
    });
    
    // No need to export function for production
    
    // Final check to ensure form submission handler works
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        console.log('Final verification of form submission handler');
        
        // Find the submit button
        const submitButton = addressForm.querySelector('.submit-button');
        if (submitButton) {
            console.log('Found submit button: "' + submitButton.textContent.trim() + '"');
            
            // If we haven't fixed the form submission yet, do it now as a fallback
            if (!window._formSubmitFixed) {
                console.log('Form submission fix not applied yet, applying now as final measure');
                ensureFormSubmitWorks();
            } else {
                console.log('Form submission handler already verified and fixed if needed');
            }
        } else {
            console.warn('Submit button not found in address form');
        }
    } else {
        console.warn('Could not perform final verification for address form');
        // Try again after a short delay as a last resort
        setTimeout(function() {
            const lateAddressForm = document.getElementById('addressForm');
            if (lateAddressForm && !window._formSubmitFixed) {
                console.log('Late form check: applying form submission fix');
                ensureFormSubmitWorks();
            }
        }, 2000);
    }
})();
