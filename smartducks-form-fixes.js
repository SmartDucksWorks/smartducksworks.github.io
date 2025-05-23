// Consolidated fixes for SmartDucks payment form - Fresh implementation
// Version: 2024-05-23
// Focus: Properly handling state/province selection, ensuring it works after page reload

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
    
    // Format postal code based on country selection
    function formatPostalCode(country, value) {
        if (!value) return '';
        
        // First, clean up the value to remove non-alphanumeric characters
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
        
        if (country === 'CA') {
            // For Canadian postal codes: A1A 1A1 format
            // Uppercase all letters
            const upperValue = cleanValue.toUpperCase();
            
            // Insert space after the 3rd character if it doesn't exist and we have more than 3 chars
            if (upperValue.length <= 3) {
                return upperValue;
            } else {
                // Add space after first 3 characters
                return `${upperValue.substring(0, 3)} ${upperValue.substring(3, 6)}`.trim();
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
                            const newPos = Math.min(start + (formattedValue.length - this.value.length), formattedValue.length);
                            this.setSelectionRange(newPos, newPos);
                        } else {
                            // If there was a selection, preserve it
                            this.setSelectionRange(start, end);
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
                    postalInput.removeEventListener('input', window.handlePostalInput);
                    window.handlePostalInput = function() {
                        const countryValue = document.getElementById('countryCode').value;
                        this.value = formatPostalCode(countryValue, this.value);
                    };
                    postalInput.addEventListener('input', window.handlePostalInput);
                    console.log('Postal code formatting handlers applied');
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
                        postalInput.value = formatPostalCode(freshCountrySelect.value, postalInput.value);
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

    // Run the fix when the document is ready
    function runFixes() {
        if (window._fixesHaveRun) return;
        window._fixesHaveRun = true;
        
        initStateProvinceFix();
        setTimeout(monitorStateProvince, 2000);
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
})();
