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

    // Simple helper to ensure an element exists
    function waitForElement(selector, callback) {
        if (document.querySelector(selector)) {
            callback(document.querySelector(selector));
        } else {
            console.log(`Waiting for ${selector}...`);
            setTimeout(() => waitForElement(selector, callback), 100);
        }
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
        }
        
        console.log(`Updated state select with ${Object.keys(statesData[country]).length} options`);
    }

    // Main function to initialize the fix
    function initStateProvinceFix() {
        console.log('Initializing state/province selector fix');
        
        // Make sure the states data is available globally
        window.states = statesData;
            
        // Wait for the country select to be available
        waitForElement('#countryCode', (countrySelect) => {
            // Wait for the state select to be available
            waitForElement('#state', (stateSelect) => {
                console.log('Both country and state selectors found, applying fix');

                // Clone elements to remove any existing event listeners
                const newCountrySelect = countrySelect.cloneNode(true);
                countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);

                const newStateSelect = stateSelect.cloneNode(true);
                stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);

                // Get fresh references after replacement
                const freshCountrySelect = document.getElementById('countryCode');
                
                // Add change event listener to country select
                freshCountrySelect.addEventListener('change', function() {
                    updateStateOptions(this.value);
                });
                
                // Make our function available globally
                window.updateStateOptions = updateStateOptions;
                
                // Initialize with current country selection if available
                if (freshCountrySelect.value) {
                    console.log('Country already selected, initializing states for:', freshCountrySelect.value);
                    updateStateOptions(freshCountrySelect.value);
                } else {
                    console.log('No country selected yet, state select will initialize when country is chosen');
                    document.getElementById('state').disabled = true;
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
                updateStateOptions(countrySelect.value);
            }
        }
        
        // Continue monitoring every 2 seconds
        setTimeout(monitorStateProvince, 2000);
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
            
            // Final verification
            setTimeout(function() {
                const countrySelect = document.getElementById('countryCode');
                const stateSelect = document.getElementById('state');
                
                if (countrySelect && stateSelect && countrySelect.value) {
                    if (stateSelect.disabled || stateSelect.options.length <= 1) {
                        console.log('Final check: Fixing state selector');
                        updateStateOptions(countrySelect.value);
                    }
                }
            }, 500);
        }
    });
})();
