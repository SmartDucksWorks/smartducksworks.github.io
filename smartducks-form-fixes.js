// Consolidated fixes for SmartDucks payment form - Fresh implementation
// Version: 2024-05-24
// Focus: Properly handling state/province selection and postal code formatting

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
                    return;
                }
                shippingOptionsListEl.innerHTML = '';

                if (quotes.length > 0) {
                    const ul = document.createElement('ul');
                    ul.className = 'list-group'; 
                    ul.style.listStyleType = 'none';
                    ul.style.paddingLeft = '0';

                    quotes.forEach((quote, index) => {
                        const li = document.createElement('li');
                        li.className = 'shipping-option';

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
                        const deliveryDays = quote.delivery_days ? `${quote.delivery_days} business day(s)` : 'Not available';

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
                            const currentlySelected = ul.querySelector('.shipping-option.selected');
                            if (currentlySelected) {
                                currentlySelected.classList.remove('selected');
                            }
                            this.classList.add('selected');

                            const eventDetail = {
                                quoteId: this.dataset.quoteId,
                                price: this.dataset.price,
                                option: this.dataset.option,
                                carrierName: this.dataset.carrierName,
                                serviceName: this.dataset.serviceName,
                                currency: this.dataset.currency,
                                transitTime: this.dataset.deliveryDays,
                            };
                            console.log(`ShippingFix: Dispatching shipping-option-selected event with detail: ${JSON.stringify(eventDetail)}`);
                            document.dispatchEvent(new CustomEvent('shipping-option-selected', { detail: eventDetail }));

                            const confirmBtn = document.getElementById('confirmShipping');
                            if (confirmBtn) confirmBtn.disabled = false;
                        });
                        ul.appendChild(li);
                    });
                    shippingOptionsListEl.appendChild(ul);
                    shippingOptionsDiv.style.display = 'block';

                    const confirmBtn = document.getElementById('confirmShipping');
                    if (confirmBtn) confirmBtn.disabled = true;
                } else {
                    shippingOptionsListEl.innerHTML = '<p>No shipping options available for the provided address. Please check your details and try again.</p>';
                    shippingOptionsDiv.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('ShippingFix: Error fetching shipping options:', error);
                const loadingElExistingCatch = document.getElementById('sm-loading-indicator');
                if (loadingElExistingCatch && loadingElExistingCatch.parentNode) loadingElExistingCatch.parentNode.removeChild(loadingElExistingCatch);

                const shippingOptionsListEl = document.getElementById('shippingOptionsList');
                if (shippingOptionsListEl) {
                    // Corrected template literal for the error message
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

    // Call runFixes after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runFixes);
    } else {
        runFixes();
    }

})(); // End of IIFE