class StripeHandler {
    constructor(publishableKey) {
        this.stripe = Stripe(publishableKey);
        this.elements = this.stripe.elements();
        this.webhookSecret = 'whsec_smartducks_2024'; // This should match the server-side secret
        // Create an instance of the WebhookVerifier for signing requests
        this.verifier = new WebhookVerifier(this.webhookSecret);
    }

    /**
     * Signs a request payload for secure webhook communication
     * @param {Object} payload - The data to sign
     * @returns {Object} - The signed request with headers
     */
    async signRequest(payload) {
        const timestamp = Math.floor(Date.now() / 1000);
        const dataToSign = `${timestamp}.${JSON.stringify(payload)}`;
        
        // Use the WebhookVerifier to compute a proper HMAC signature
        let signature;
        try {
            // Use Web Crypto API through the verifier
            signature = await this.verifier.computeHMAC(dataToSign);
        } catch (error) {
            console.error('Error computing signature, falling back to simple hash:', error);
            signature = this.generateSimpleSignature(dataToSign);
        }
        
        return {
            signedPayload: payload,
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': `t=${timestamp},v1=${signature}`
            }
        };
    }
    
    /**
     * Fallback signature method in case Web Crypto API fails
     */
    generateSimpleSignature(data) {
        // Simple hashing function as fallback
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(32, '0');
    }

    async createCustomer(customerData) {
        // Sign the request using proper webhook signing
        const signedRequest = await this.signRequest({
            type: 'create_customer',
            data: customerData
        });
        
        console.log('Creating customer with data:', JSON.stringify(customerData, null, 2));
        
        // Get the appropriate webhook URL based on environment
        const customerWebhookUrl = window.getWebhookUrl ? 
            window.getWebhookUrl('create_customer') : 
            'https://duckpond.smartducks.works/webhook/create-customer';
            
        console.log(`📞 STRIPE_HANDLER: Calling createCustomer with URL: ${customerWebhookUrl}`);
        
        // Special handling for no-cors mode which doesn't provide usable response
        const isNoCorsMode = window.FORCE_REMOTE_API && 
                         (window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1');
        
        if (isNoCorsMode) {
            console.log("Using no-cors mode with remote API for customer creation - limited response access");
            console.log("Customer creation may not work in local testing mode");
            alert("Customer creation requires using the form on the actual server for full functionality.");
            
            // Since we can't read the response in no-cors mode, inform user to use the live server
            return {
                success: false,
                error: "Customer creation not available in local testing mode"
            };
        }
        
        const response = await fetch(customerWebhookUrl, {
            method: 'POST',
            headers: signedRequest.headers,
            // Set mode to no-cors when running locally with FORCE_REMOTE_API
            mode: isNoCorsMode ? 'no-cors' : 'cors',
            body: JSON.stringify(signedRequest.signedPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Customer creation failed:', response.status, errorText);
            throw new Error(`Failed to create customer: ${response.statusText}`);
        }

        return response.json();
    }

    async createPaymentIntent(orderData, customerId) {
        try {
            console.log('Creating payment intent:', { orderData, customerId });
            
            // Sign the request using proper webhook signing
            const signedRequest = await this.signRequest({
                type: 'create_payment_intent',
                data: {
                    amount: Math.round(orderData.total * 100), // Convert to cents
                    currency: 'cad',
                    customer: customerId,
                    shipping: orderData.shipping,
                    quote: orderData.selectedQuote
                }
            });
            
            // Use the dedicated payment intent production webhook URL
            const paymentIntentWebhookUrl = 'https://duckpond.smartducks.works/webhook/payment-intent'; // <-- Define URL
            console.log(`📞 STRIPE_HANDLER: Calling createPaymentIntent with URL: ${paymentIntentWebhookUrl}`); // <-- Log URL
            const response = await fetch(paymentIntentWebhookUrl, { // <-- Use variable
                method: 'POST',
                headers: signedRequest.headers,
                body: JSON.stringify(signedRequest.signedPayload)
            });

            if (!response.ok) {
                throw new Error(`Payment intent failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Payment intent created:', result);
            return result;
        } catch (error) {
            console.error('Payment intent error:', error);
            throw error;
        }
    }

    // Modify the showPaymentModal method to not only return the elements but also assign to window.stripeElements
    async showPaymentModal(clientSecret, elementContainerId = 'stripe-element', errorElementId = 'payment-error', successElementId = 'payment-success', processingElementId = 'processing-payment', billingDetails = null) {
        const stripeElementContainer = document.getElementById(elementContainerId);
        const paymentError = document.getElementById(errorElementId);
        const paymentSuccess = document.getElementById(successElementId);
        const processingIndicator = document.getElementById(processingElementId);

        console.log('showPaymentModal called with clientSecret:', clientSecret ? 'Yes' : 'No');
        console.log('Billing details passed to payment modal:', billingDetails);
        
        if (!paymentError) {
            console.error(`Error element with ID ${errorElementId} not found`);
            return null;
        }
        
        paymentError.style.display = 'none';
        stripeElementContainer.innerHTML = ''; // Clear previous elements if any

        let elements;
        try {
            // Use appearance API for styling
            const appearance = {
              theme: 'stripe',
              variables: {
                colorPrimary: '#1f6685', // Match your primary color
              },
            };
            
            // Create the elements instance with options
            const elementsOptions = { 
                clientSecret, 
                appearance
            };
            
            elements = this.stripe.elements(elementsOptions);
            console.log('Stripe elements instance created with options:', elementsOptions);
        } catch (error) {
            console.error('Error creating Stripe elements instance:', error);
            paymentError.textContent = `Error initializing payment form: ${error.message}`;
            paymentError.style.display = 'block';
            return null; // Return null as elements couldn't be created
        }

        let paymentElement;
        try {
            // Create payment element with billing details enabled
            const paymentElementOptions = {
                layout: {
                    type: 'tabs',
                    defaultCollapsed: false,
                },
            };
            
            // Add prefilled billing details if available
            if (billingDetails) {
                console.log('Processing billing details for Stripe Elements:', billingDetails);
                
                // Format name properly - handle different input formats
                let fullName = '';
                if (billingDetails.name) {
                    fullName = billingDetails.name;
                } else if (billingDetails.firstName || billingDetails.lastName) {
                    fullName = `${billingDetails.firstName || ''} ${billingDetails.lastName || ''}`.trim();
                }

                // Get country code - support multiple formats
                let countryCode = '';
                if (billingDetails.countryCode) {
                    countryCode = billingDetails.countryCode;
                } else if (billingDetails.address?.country) {
                    countryCode = billingDetails.address.country;
                }
                
                // Ensure it's just the 2-letter code without extra text
                if (countryCode && countryCode.length > 2) {
                    countryCode = countryCode.substring(0, 2);
                }

                // Get postal code - support multiple formats
                let postalCode = '';
                if (billingDetails.postalCode) {
                    postalCode = billingDetails.postalCode;
                } else if (billingDetails.address?.postal_code) {
                    postalCode = billingDetails.address.postal_code;
                } else if (billingDetails.address?.postalCode) {
                    postalCode = billingDetails.address.postalCode;
                }

                // Get state - support multiple formats
                let state = '';
                if (billingDetails.state) {
                    state = billingDetails.state;
                } else if (billingDetails.address?.state) {
                    state = billingDetails.address.state;
                }

                // Get city - support multiple formats
                let city = '';
                if (billingDetails.city) {
                    city = billingDetails.city;
                } else if (billingDetails.address?.city) {
                    city = billingDetails.address.city;
                }

                // Get address line 1 - support multiple formats
                let line1 = '';
                if (billingDetails.streetAddress) {
                    line1 = billingDetails.streetAddress;
                } else if (billingDetails.address?.line1) {
                    line1 = billingDetails.address.line1;
                } else if (billingDetails.address?.streetAddress) {
                    line1 = billingDetails.address.streetAddress;
                }

                // Get address line 2 - support multiple formats
                let line2 = '';
                if (billingDetails.streetAddress2) {
                    line2 = billingDetails.streetAddress2;
                } else if (billingDetails.address?.line2) {
                    line2 = billingDetails.address.line2;
                } else if (billingDetails.address?.streetAddress2) {
                    line2 = billingDetails.address.streetAddress2;
                }

                // Properly format billing details for Stripe Elements
                paymentElementOptions.defaultValues = {
                    billingDetails: {
                        name: fullName,
                        email: billingDetails.email || '',
                        phone: billingDetails.phone || '',
                        address: {
                            country: countryCode,
                            postal_code: postalCode,
                            state: state,
                            city: city,
                            line1: line1,
                            line2: line2,
                        }
                    }
                };
                
                console.log('Adding billing details to Payment Element:', paymentElementOptions.defaultValues);
            }
            
            // Create the payment element
            paymentElement = elements.create('payment', paymentElementOptions);
            paymentElement.mount(stripeElementContainer);
            console.log('Payment element mounted to container:', elementContainerId);
            
            // IMPORTANT: Store the elements in the global variable for access during payment confirmation
            if (typeof window !== 'undefined') {
                window.stripeElements = elements;
                console.log('Stored Stripe elements in global window.stripeElements');
                
                // Add a timestamp to help with debugging
                window.stripeElementsTimestamp = Date.now();
                
                // Store the client secret in the elements object for recovery if needed
                if (clientSecret) {
                    window.stripeElementsClientSecret = clientSecret;
                }
                
                // Add a backup access method in case direct property access fails
                try {
                    sessionStorage.setItem('stripeElementsAvailable', 'true');
                    sessionStorage.setItem('stripeElementsClientSecret', clientSecret);
                } catch (e) {
                    console.log('Unable to store stripe elements status in sessionStorage', e);
                }
            }
            
            // Return the elements instance for further operations
            return elements;
        } catch (error) {
            console.error('Error creating payment element:', error);
            paymentError.textContent = `Error creating payment form: ${error.message}`;
            paymentError.style.display = 'block';
            return null;
        }
    }
    
    // Helper method to destroy Stripe elements
    destroyCardElement() {
        // This method can be empty but is referenced in form5.html
        // If needed, add logic here to clean up stripe elements instance
        console.log('Cleaning up Stripe elements');
    }

    async confirmCardPayment(clientSecret, paymentData = null, errorElementId = 'payment-error', successElementId = 'payment-success', processingElementId = 'processing-payment') {
        const paymentError = document.getElementById(errorElementId);
        const paymentSuccess = document.getElementById(successElementId);
        const processingIndicator = document.getElementById(processingElementId);
        
        if (!paymentError || !paymentSuccess || !processingIndicator) {
            console.error('Required element(s) not found for payment confirmation');
            return { error: { message: 'Required element(s) not found for payment confirmation' } };
        }
        
        paymentError.style.display = 'none';
        paymentSuccess.style.display = 'none';
        processingIndicator.style.display = 'block';
        
        console.log('Confirming card payment...');
        
        try {
            const result = await this.stripe.confirmCardPayment(clientSecret, paymentData);
            console.log('Payment confirmation result:', result);
            
            processingIndicator.style.display = 'none';
            
            if (result.error) {
                console.error('Payment confirmation error:', result.error);
                paymentError.textContent = result.error.message;
                paymentError.style.display = 'block';
                return { error: result.error };
            } else if (result.paymentIntent.status === 'succeeded') {
                console.log('Payment succeeded');
                paymentSuccess.textContent = 'Payment successful! Your order has been placed.';
                paymentSuccess.style.display = 'block';
                return { paymentIntent: result.paymentIntent };
            } else {
                console.warn('Payment requires additional action:', result.paymentIntent.status);
                paymentError.textContent = `Payment status: ${result.paymentIntent.status}. Please try again.`;
                paymentError.style.display = 'block';
                return { paymentIntent: result.paymentIntent };
            }
        } catch (error) {
            console.error('Unexpected error in confirmCardPayment:', error);
            processingIndicator.style.display = 'none';
            paymentError.textContent = `Unexpected error: ${error.message}`;
            paymentError.style.display = 'block';
            return { error: { message: error.message } };
        }
    }
}
