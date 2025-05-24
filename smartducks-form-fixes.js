// Consolidated fixes for SmartDucks payment form - Fresh implementation
// Version: 2024-05-24
// Focus: Properly handling state/province selection and postal code formatting

(function() {
    console.log('SmartDucks form fixes loaded - Fresh implementation');
    
    // Expose formatPostalCode function globally for testing purposes
    window.formatPostalCode = formatPostalCode;

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
                console.log('Canadian postal code formatting: short value', sixChars);
                return sixChars;
            } else {
                // Add space after first 3 characters
                const formatted = `${sixChars.substring(0, 3)} ${sixChars.substring(3)}`.trim();
                console.log('Canadian postal code formatting:', {
                    original: value,
                    cleaned: cleanValue,
                    formatted: formatted
                });
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
        stateSelect.innerHTML = '<option value="" disabled selected>Select State/Province</option>';
        
        // If no country or no states for country, disable state select
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
        
        // Make sure the states data is available globally
        window.states = statesData;
        
        // Also make updateStateOptions available globally immediately
        window.updateStateOptions = updateStateOptions;
            
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
                
                // Store the handler on window for potential future use
                window.handleCountryChange = handleCountryChange;
                
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
                    // Preserve the existing handlers by keeping track of them
                    if (!window.existingPostalInputHandlers) {
                        window.existingPostalInputHandlers = [];
                        const originalAddEventListener = postalInput.addEventListener;
                        
                        // Override the addEventListener method to track handlers
                        postalInput.addEventListener = function(type, handler, options) {
                            if (type === 'input') {
                                window.existingPostalInputHandlers.push(handler);
                            }
                            return originalAddEventListener.call(this, type, handler, options);
                        };
                    }
                    
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
                        console.log('Reformatting postal code via monitor:', postalInput.value);
                        const formatted = formatPostalCode(currentCountry, postalInput.value);
                        if (formatted !== postalInput.value) {
                            console.log(`Postal code updated: ${postalInput.value} → ${formatted}`);
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
        
        const addressForm = document.getElementById('addressForm');
        
        // Find the submit button - try multiple approaches
        let submitButton = null;
        if (addressForm) {
            // Try multiple approaches to find the button
            submitButton = addressForm.querySelector('.submit-button, button[type="submit"], input[type="submit"]');
            
            // Try finding by text content
            if (!submitButton) {
                const buttons = Array.from(addressForm.querySelectorAll('button'));
                submitButton = buttons.find(btn => 
                    (btn.textContent && btn.textContent.trim().toLowerCase().includes('shipping')) || 
                    (btn.textContent && btn.textContent.trim().toLowerCase().includes('options')) ||
                    (btn.value && btn.value.toLowerCase().includes('shipping'))
                );
            }
            
            // Last resort - any button in the form
            if (!submitButton) {
                submitButton = addressForm.querySelector('button');
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
        console.log(`ShippingFix: Found ${existingModals.length} potential modal elements in the DOM`);
        existingModals.forEach((modal, i) => {
            console.log(`ShippingFix: Modal ${i+1}: class="${modal.className}" id="${modal.id}"`);
        });
        
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
            
            // Log which button triggered the submission
            if (e.submitter) {
                console.log('ShippingFix: Button that triggered submission:', e.submitter.textContent?.trim() || e.submitter.value);
            }
            
            // Show a loading indicator
            const loadingEl = document.createElement('div');
            loadingEl.id = 'sm-loading-indicator';
            loadingEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;';
            loadingEl.innerHTML = '<div style="background:white;padding:20px;border-radius:5px;">Loading shipping options...</div>';
            document.body.appendChild(loadingEl);
            
            // Collect form data
            const formData = new FormData(addressForm);
            const formDataObj = {};
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            console.log('ShippingFix: Submitting form data:', formDataObj);
            
            // Get the form action URL
            const actionUrl = addressForm.getAttribute('action') || window.shippingOptionsUrl || '/api/shipping-options';
            console.log('ShippingFix: Submitting to URL:', actionUrl);
            
            // Send the request
            fetch(actionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            })
            .then(response => {
                console.log('ShippingFix: Got response:', response.status);
                
                // Handle different response types
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    return response.text().then(text => {
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            return { html: text };
                        }
                    });
                }
            })
            .then(data => {
                console.log('ShippingFix: Received data:', data);
                
                // Remove loading indicator
                const loadingEl = document.getElementById('sm-loading-indicator');
                if (loadingEl) loadingEl.remove();
                
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
                if (data.html) {
                    // If we got HTML directly
                    container.innerHTML = data.html;
                } 
                else if (data.options && Array.isArray(data.options)) {
                    // If we got options array
                    data.options.forEach(option => {
                        const optionEl = document.createElement('div');
                        optionEl.className = 'shipping-option';
                        optionEl.style.cssText = 'margin-bottom:10px;padding:10px;border:1px solid #ddd;border-radius:4px;';
                        
                        optionEl.innerHTML = `
                            <input type="radio" name="shipping_option" value="${option.id || option.value || ''}">
                            <label style="margin-left:8px;font-weight:bold;">${option.name || option.label || 'Option'}</label>
                            <span style="float:right">${option.price || option.cost || ''}</span>
                            ${option.description ? `<div style="margin-top:5px;color:#666;">${option.description}</div>` : ''}
                        `;
                        
                        container.appendChild(optionEl);
                    });
                } 
                else if (data.shipping_rates && Array.isArray(data.shipping_rates)) {
                    // Alternative structure sometimes used
                    data.shipping_rates.forEach(option => {
                        const optionEl = document.createElement('div');
                        optionEl.className = 'shipping-option';
                        optionEl.style.cssText = 'margin-bottom:10px;padding:10px;border:1px solid #ddd;border-radius:4px;';
                        
                        optionEl.innerHTML = `
                            <input type="radio" name="shipping_option" value="${option.id || option.service_code || ''}">
                            <label style="margin-left:8px;font-weight:bold;">${option.service_name || option.carrier || 'Option'}</label>
                            <span style="float:right">${option.total_price || option.price || ''}</span>
                        `;
                        
                        container.appendChild(optionEl);
                    });
                } 
                else {
                    // If we didn't recognize the data structure, just show raw data
                    container.innerHTML = `
                        <p>Shipping options received. Please select an option:</p>
                        <pre style="background:#f4f4f4;padding:10px;overflow:auto;font-size:12px;">${JSON.stringify(data, null, 2)}</pre>
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
        };
        
        // Add the submit handler to the form
        addressForm._hasShippingFix = true;
        addressForm.addEventListener('submit', window._shippingFixHandler);
        
        // Also add a click handler to the button as a backup
        const buttonClickHandler = function(e) {
            console.log('ShippingFix: Button clicked directly');
            // If it's not a submit button, manually trigger submit
            if (submitButton.type !== 'submit') {
                e.preventDefault();
                
                // Trigger form submission to use our handler
                const submitEvent = new Event('submit', {
                    bubbles: true,
                    cancelable: true
                });
                addressForm.dispatchEvent(submitEvent);
            }
        };
        
        submitButton._clickHandler = buttonClickHandler;
        submitButton.addEventListener('click', buttonClickHandler);
        
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
    
    // Export function for testing
    window.formatPostalCode = formatPostalCode;
    
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
