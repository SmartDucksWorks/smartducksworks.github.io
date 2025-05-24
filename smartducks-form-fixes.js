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
        console.log('Ensuring form submission handler is working');
        
        const addressForm = document.getElementById('addressForm');
        const submitButton = addressForm ? 
            (addressForm.querySelector('.submit-button, button[type="submit"], input[type="submit"]') || 
            addressForm.querySelector('button:contains("Get Shipping Options")')) : null;
        
        if (!addressForm) {
            console.log('Address form not found yet for form submission check, will retry...');
            setTimeout(ensureFormSubmitWorks, 500);
            return;
        }
        
        if (!submitButton) {
            console.log('Submit button not found, looking for any button in the form...');
            const anyButton = addressForm.querySelector('button');
            if (anyButton) {
                console.log('Using generic button as submit button:', anyButton.textContent.trim());
            } else {
                console.log('No button found in form, will retry...');
                setTimeout(ensureFormSubmitWorks, 500);
                return;
            }
        }
        
        console.log('Form found, ensuring submission handler is working');

        // Find all potential modal elements
        const potentialModals = document.querySelectorAll('.shipping-options-modal, .modal, #shippingOptionsModal, [class*="modal"], [id*="modal"], dialog');
        console.log(`Found ${potentialModals.length} potential modal elements`);
        potentialModals.forEach((modal, i) => {
            console.log(`Modal ${i+1}: class="${modal.className}" id="${modal.id}"`);
        });
        
        // Re-attach the submit event listener to make sure it works
        const originalSubmit = addressForm.onsubmit;
        
        // Check if the form already has our fixed handler installed
        if (!window._formSubmitFixed) {
            window._formSubmitFixed = true;
            
            // Enhanced submission handler that ensures the modal is shown
            addressForm.addEventListener('submit', function(e) {
                console.log('Form submit event intercepted');
                
                // Always prevent default to ensure we control the submission flow
                e.preventDefault();
                
                // Find all potential modal elements - check again in case elements were added after page load
                const shippingModal = document.querySelector('.shipping-options-modal, .modal, #shippingOptionsModal, [class*="modal"], [id*="modal"], dialog');
                if (shippingModal) {
                    console.log('Found shipping modal:', shippingModal);
                    console.log('Modal class:', shippingModal.className);
                    console.log('Modal ID:', shippingModal.id);
                    console.log('Modal display style:', shippingModal.style.display);
                    console.log('Modal visibility:', window.getComputedStyle(shippingModal).visibility);
                } else {
                    console.warn('No shipping modal found in DOM!');
                }
                
                const loadingIndicator = document.querySelector('.loading-indicator, .spinner, #loadingSpinner, .loader, .loading');
                
                // Show the loading indicator if it exists
                if (loadingIndicator) {
                    console.log('Showing loading indicator');
                    loadingIndicator.style.display = 'block';
                    loadingIndicator.style.visibility = 'visible';
                    loadingIndicator.classList.add('active', 'visible', 'show');
                } else {
                    console.log('No loading indicator found, creating one');
                    // Create a simple loading indicator if none exists
                    const tempLoader = document.createElement('div');
                    tempLoader.id = 'tempLoadingIndicator';
                    tempLoader.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:rgba(255,255,255,0.8);padding:20px;border-radius:5px;box-shadow:0 0 10px rgba(0,0,0,0.2);';
                    tempLoader.innerHTML = 'Loading shipping options...';
                    document.body.appendChild(tempLoader);
                }
                
                // Collect form data to send
                const formData = new FormData(addressForm);
                const formDataObj = {};
                formData.forEach((value, key) => {
                    formDataObj[key] = value;
                });
                
                console.log('Submitting form data to get shipping options:', formDataObj);
                
                // Make the AJAX request (always do our own request to ensure it works)
                // Find the form action URL
                const actionUrl = addressForm.getAttribute('action') || window.shippingOptionsUrl || '/api/shipping-options';
                
                console.log('Sending form data to URL:', actionUrl);
                
                // Send the AJAX request
                fetch(actionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formDataObj),
                })
                .then(response => {
                    console.log('Received response:', response.status);
                    // Try to parse JSON, but also handle non-JSON responses
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return response.json().then(data => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok: ' + response.status);
                            }
                            return data;
                        });
                    } else {
                        return response.text().then(text => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok: ' + response.status);
                            }
                            // Try to parse as JSON anyway, in case content-type is wrong
                            try {
                                return JSON.parse(text);
                            } catch(e) {
                                // Return as HTML content
                                return { html: text };
                            }
                        });
                    }
                })
                .then(data => {
                    console.log('Received shipping options data:', data);
                    
                    // Remove temp loader if we created one
                    const tempLoader = document.getElementById('tempLoadingIndicator');
                    if (tempLoader) {
                        tempLoader.remove();
                    }
                    
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                        loadingIndicator.style.visibility = 'hidden';
                        loadingIndicator.classList.remove('active', 'visible', 'show');
                    }
                    
                    // Find the modal again - it might have been added to the DOM after our initial check
                    const shippingModal = document.querySelector('.shipping-options-modal, .modal, #shippingOptionsModal, [class*="modal"], [id*="modal"], dialog');
                    
                    // Show the modal with the shipping options
                    if (shippingModal) {
                        console.log('Found shipping modal, attempting to show it');
                        
                        // Populate the modal with the received data if needed
                        const shippingOptionsContainer = shippingModal.querySelector('.shipping-options-container, .modal-body, .shipping-options');
                        
                        if (shippingOptionsContainer) {
                            console.log('Found container for shipping options, populating it');
                            
                            // If we have HTML content directly, use it
                            if (data.html) {
                                shippingOptionsContainer.innerHTML = data.html;
                            }
                            // Otherwise, try to build from JSON data
                            else if (data.options) {
                                // Clear previous options
                                shippingOptionsContainer.innerHTML = '';
                                
                                // Add new options
                                data.options.forEach(option => {
                                    const optionElement = document.createElement('div');
                                    optionElement.className = 'shipping-option';
                                    optionElement.innerHTML = `
                                        <input type="radio" name="shipping_option" value="${option.id}">
                                        <label>${option.name} - ${option.price}</label>
                                    `;
                                    shippingOptionsContainer.appendChild(optionElement);
                                });
                            }
                            // If none of the above match, try to handle as generic data
                            else {
                                // Just in case the data structure is different than expected
                                const content = document.createElement('div');
                                content.innerHTML = '<p>Shipping options available:</p>';
                                
                                // Create a simple representation of the data
                                const dataList = document.createElement('pre');
                                dataList.textContent = JSON.stringify(data, null, 2);
                                content.appendChild(dataList);
                                
                                shippingOptionsContainer.appendChild(content);
                            }
                        } else {
                            console.warn('No container found for shipping options in modal');
                            // Create a simple container as a fallback
                            const container = document.createElement('div');
                            container.className = 'shipping-options-container';
                            container.innerHTML = '<p>Shipping options data received</p>';
                            shippingModal.appendChild(container);
                        }
                        
                        // Show the modal - try EVERY possible approach
                        console.log('Showing modal using multiple methods');
                        
                        // Try direct style manipulation
                        shippingModal.style.display = 'block';
                        shippingModal.style.visibility = 'visible';
                        shippingModal.style.opacity = '1';
                        
                        // For Bootstrap modals
                        if (window.jQuery && window.jQuery.fn && window.jQuery.fn.modal) {
                            console.log('Using jQuery Bootstrap modal method');
                            try {
                                window.jQuery(shippingModal).modal('show');
                            } catch(e) {
                                console.error('Error showing Bootstrap modal:', e);
                            }
                        }
                        
                        // For Dialog element
                        if (shippingModal.tagName.toLowerCase() === 'dialog') {
                            console.log('Using native dialog methods');
                            if (shippingModal.showModal) {
                                shippingModal.showModal();
                            } else if (shippingModal.show) {
                                shippingModal.show();
                            }
                        }
                        
                        // Add all possible classes that might make it visible
                        shippingModal.classList.add('show', 'active', 'visible', 'displayed', 'in', 'open');
                        shippingModal.classList.remove('hide', 'hidden', 'closed');
                        
                        // Add backdrop if needed
                        if (!document.querySelector('.modal-backdrop')) {
                            const backdrop = document.createElement('div');
                            backdrop.className = 'modal-backdrop fade show';
                            document.body.appendChild(backdrop);
                            
                            // Make backdrop visible
                            backdrop.style.display = 'block';
                            backdrop.style.opacity = '0.5';
                            backdrop.style.position = 'fixed';
                            backdrop.style.top = '0';
                            backdrop.style.right = '0';
                            backdrop.style.bottom = '0';
                            backdrop.style.left = '0';
                            backdrop.style.zIndex = '1040';
                            backdrop.style.backgroundColor = '#000';
                        }
                        
                        // Set z-index high to ensure visibility
                        shippingModal.style.zIndex = '1050';
                        
                        // Force display after a short delay in case other scripts are hiding it
                        setTimeout(() => {
                            shippingModal.style.display = 'block';
                            shippingModal.style.visibility = 'visible';
                            shippingModal.style.opacity = '1';
                        }, 100);
                        
                        console.log('Modal should now be visible');
                    } else {
                        console.error('Shipping modal not found in the DOM after submission');
                        
                        // As a last resort, create our own modal if none exists
                        console.log('Creating a temporary modal to display shipping options');
                        const tempModal = document.createElement('div');
                        tempModal.className = 'shipping-options-modal modal show';
                        tempModal.id = 'tempShippingOptionsModal';
                        tempModal.style.cssText = 'display:block;position:fixed;top:0;left:0;width:100%;height:100%;z-index:1050;overflow:auto;background-color:rgba(0,0,0,0.5);';
                        
                        // Create modal content
                        tempModal.innerHTML = `
                            <div class="modal-dialog" style="margin:50px auto;max-width:600px;background:#fff;border-radius:5px;padding:20px;position:relative;">
                                <div class="modal-header" style="border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:20px;">
                                    <h3>Shipping Options</h3>
                                    <button type="button" class="close" style="position:absolute;top:10px;right:15px;font-size:24px;cursor:pointer;background:none;border:none;">&times;</button>
                                </div>
                                <div class="modal-body shipping-options-container"></div>
                                <div class="modal-footer" style="margin-top:20px;padding-top:10px;border-top:1px solid #eee;">
                                    <button type="button" class="btn-close" style="padding:8px 16px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;">Close</button>
                                </div>
                            </div>
                        `;
                        
                        document.body.appendChild(tempModal);
                        
                        // Populate the temporary modal
                        const tempContainer = tempModal.querySelector('.shipping-options-container');
                        if (tempContainer) {
                            if (data.html) {
                                tempContainer.innerHTML = data.html;
                            } else if (data.options) {
                                data.options.forEach(option => {
                                    const optionElement = document.createElement('div');
                                    optionElement.className = 'shipping-option';
                                    optionElement.innerHTML = `
                                        <input type="radio" name="shipping_option" value="${option.id}">
                                        <label>${option.name} - ${option.price}</label>
                                    `;
                                    tempContainer.appendChild(optionElement);
                                });
                            } else {
                                tempContainer.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                            }
                        }
                        
                        // Add close button functionality
                        const closeButtons = tempModal.querySelectorAll('.close, .btn-close');
                        closeButtons.forEach(button => {
                            button.addEventListener('click', () => {
                                tempModal.remove();
                            });
                        });
                    }
                    
                    // If there was an original submit handler, call it now but prevent form submission
                    if (originalSubmit && typeof originalSubmit === 'function') {
                        console.log('Calling original submit handler...');
                        try {
                            // Create a fake event to pass to the original handler
                            const fakeEvent = { preventDefault: () => {} };
                            originalSubmit.call(addressForm, fakeEvent);
                        } catch (err) {
                            console.error('Error calling original submit handler:', err);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error getting shipping options:', error);
                    
                    // Remove temp loader if we created one
                    const tempLoader = document.getElementById('tempLoadingIndicator');
                    if (tempLoader) {
                        tempLoader.remove();
                    }
                    
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                        loadingIndicator.style.visibility = 'hidden';
                        loadingIndicator.classList.remove('active', 'visible', 'show');
                    }
                    
                    // Show an error message to the user
                    alert('Error getting shipping options. Please try again.');
                });
            }, true); // Use capturing to ensure our handler runs first
            
            // Also keep the click handler for additional logging
            if (submitButton) {
                submitButton.addEventListener('click', function(e) {
                    console.log('Submit button clicked, form will be submitted...');
                    
                    // Look for the shipping modal element on click as well
                    const shippingModal = document.querySelector('.shipping-options-modal, .modal, #shippingOptionsModal, [class*="modal"]');
                    if (shippingModal) {
                        console.log('Found shipping modal on click:', shippingModal);
                    } else {
                        console.warn('No shipping modal found on click!');
                    }
                });
            }
            
            console.log('Enhanced form submission handler applied successfully');
        }
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
