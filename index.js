// Global variables to store our key information
let privateKey, publicKey, modulus;
let challenge, signature, verification;

// Constants for our simplified RSA
// We'll generate these randomly now
let MODULUS, PRIVATE_KEY, PUBLIC_KEY;

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', function() {
    generateKeys();
    initializeDemo();
    setupEventListeners();
    
    // Start typing effect for the first container after a short delay
    setTimeout(() => {
        const firstContainer = document.getElementById('container-1');
        applyTypingEffectToContainer(firstContainer);
    }, 500);
});

// Generate random RSA key components
function generateKeys() {
    // We'll use small prime numbers for educational purposes
    const primes = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73];
    
    // Randomly select two different primes
    const primeIndex1 = Math.floor(Math.random() * primes.length);
    let primeIndex2 = Math.floor(Math.random() * primes.length);
    while (primeIndex2 === primeIndex1) {
        primeIndex2 = Math.floor(Math.random() * primes.length);
    }
    
    const p = primes[primeIndex1];
    const q = primes[primeIndex2];
    
    // Calculate modulus n = p * q
    MODULUS = p * q;
    
    // Calculate totient φ(n) = (p-1) * (q-1)
    const totient = (p - 1) * (q - 1);
    
    // Choose public key e (coprime to totient)
    // For simplicity, let's pick from a set of common public exponents
    const possibleEs = [3, 5, 7, 11, 13, 17, 19, 23];
    let validEs = [];
    
    for (const e of possibleEs) {
        if (e < totient && gcd(e, totient) === 1) {
            validEs.push(e);
        }
    }
    
    // Select a random valid e
    PUBLIC_KEY = validEs[Math.floor(Math.random() * validEs.length)];
    
    // Calculate private key d such that (d * e) % totient = 1
    PRIVATE_KEY = modInverse(PUBLIC_KEY, totient);
    
    console.log(`Generated RSA parameters: p=${p}, q=${q}, n=${MODULUS}, φ(n)=${totient}, e=${PUBLIC_KEY}, d=${PRIVATE_KEY}`);
}

// Calculate greatest common divisor (GCD)
function gcd(a, b) {
    if (b === 0) return a;
    return gcd(b, a % b);
}

// Calculate modular inverse
function modInverse(a, m) {
    for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) {
            return x;
        }
    }
    return 1; // Fallback, should not happen with our inputs
}

// Set up initial state
function initializeDemo() {
    // Make all containers initially hidden except the intro
    document.querySelectorAll('.story-container:not(#container-intro)').forEach(container => {
        container.classList.remove('active');
    });
    
    // Make sure the intro container is active
    const introContainer = document.getElementById('container-intro');
    if (introContainer) {
        introContainer.classList.add('active');
    }
    
    // Use our generated RSA parameters
    privateKey = PRIVATE_KEY;
    publicKey = PUBLIC_KEY;
    modulus = MODULUS;
    
    // Display the keys
    document.getElementById('private-key').textContent = privateKey;
    document.getElementById('public-key').textContent = publicKey;
}

// Apply typing effect to all text in a container
function applyTypingEffectToContainer(container) {
    // Apply to paragraphs, list items, and similar text elements
    const textElements = container.querySelectorAll('p, li, .context-box p, .note, .equation');
    
    // Skip elements that shouldn't have typing effect
    const skipElements = container.querySelectorAll('.key-value, .signature-display, .equation-result');
    const skipElementsArray = Array.from(skipElements);
    
    // Process each text element
    textElements.forEach((element, index) => {
        // Skip if this element should not have typing effect
        if (skipElementsArray.includes(element)) return;
        
        const originalText = element.textContent;
        element.textContent = '';
        element.style.minHeight = '1em'; // Prevent layout shifts
        
        // Delay based on element position to create a sequential effect
        const startDelay = index * 500; // Half second between elements
        
        // Start typing effect after delay
        setTimeout(() => {
            typeText(element, originalText, 0);
        }, startDelay);
    });
}

// Type text character by character
function typeText(element, text, index) {
    if (index < text.length) {
        element.textContent += text.charAt(index);
        setTimeout(() => {
            typeText(element, text, index + 1);
        }, 15); // Speed of typing (lower = faster)
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Add event listeners for all buttons
    document.querySelectorAll('.next-button').forEach(button => {
        // Only add an event listener if there's no onclick attribute
        if (!button.hasAttribute('onclick')) {
            button.addEventListener('click', function() {
                const currentContainer = this.closest('.story-container');
                const currentId = currentContainer.id;
                const currentNum = parseInt(currentId.split('-')[1]);
                
                showContainer(currentNum + 1);
            });
        }
    });
    
    // Random challenge button
    const randomButton = document.querySelector('button[onclick="generateRandomChallenge()"]');
    if (randomButton) {
        randomButton.removeAttribute('onclick');
        randomButton.addEventListener('click', generateRandomChallenge);
    }
    
    // Send challenge button
    const sendChallengeButton = document.querySelector('button[onclick="createSignature()"]');
    if (sendChallengeButton) {
        sendChallengeButton.removeAttribute('onclick');
        sendChallengeButton.addEventListener('click', createSignature);
    }
    
    // Verify signature button
    const verifyButton = document.querySelector('button[onclick="verifySignature()"]');
    if (verifyButton) {
        verifyButton.removeAttribute('onclick');
        verifyButton.addEventListener('click', verifySignature);
    }
    
    // Reset button
    const resetButton = document.querySelector('button[onclick="resetDemo()"]');
    if (resetButton) {
        resetButton.removeAttribute('onclick');
        resetButton.addEventListener('click', resetDemo);
    }
    
    // For any manually specified next buttons with container targets
    document.querySelectorAll('button[onclick]').forEach(button => {
        const onclickAttr = button.getAttribute('onclick');
        
        // Check if it's a showContainer call
        if (onclickAttr && onclickAttr.includes('showContainer')) {
            // Extract the container number or ID
            const match = onclickAttr.match(/showContainer\((['"]?(\w+)['"]?)\)/);
            
            if (match) {
                const containerIdentifier = match[2]; // Get the capture group with the container ID
                
                // Remove onclick attribute
                button.removeAttribute('onclick');
                
                // Add proper event listener
                button.addEventListener('click', function() {
                    // Convert to number if it's numeric
                    const containerNumber = isNaN(parseInt(containerIdentifier)) 
                        ? containerIdentifier 
                        : parseInt(containerIdentifier);
                    
                    showContainer(containerNumber);
                });
            }
        }
    });
}

// Show a specific container and keep previous containers visible
function showContainer(containerNumber) {
    // Create the container ID string
    const containerId = (containerNumber === 'intro') 
        ? 'container-intro' 
        : `container-${containerNumber}`;
    
    // Find the container
    const containerToShow = document.getElementById(containerId);
    
    if (containerToShow) {
        containerToShow.classList.add('active');
        
        // Scroll to the newly visible container
        containerToShow.scrollIntoView({ behavior: 'smooth' });
        
        // Apply typing effect to the newly shown container
        applyTypingEffectToContainer(containerToShow);
    } else {
        console.error(`Container ${containerId} not found`);
    }
}

// Generate a random challenge between 1 and 1000
function generateRandomChallenge() {
    // Use a smaller value to ensure it works with our modulus
    const max = modulus - 1;
    const randomChallenge = Math.floor(Math.random() * Math.min(100, max)) + 1;
    document.getElementById('challenge').value = randomChallenge;
}

// Create signature using the private key
function createSignature() {
    // Get the challenge
    challenge = parseInt(document.getElementById('challenge').value);
    
    // Validate challenge
    if (isNaN(challenge) || challenge <= 0 || challenge >= modulus) {
        alert('Please enter a valid challenge number between 1 and ' + (modulus - 1));
        return;
    }
    
    // Calculate signature using modular exponentiation
    signature = modExp(challenge, privateKey, modulus);
    
    // Display the calculation
    document.getElementById('signature-calculation').textContent = 
        `${challenge}^${privateKey} mod ${modulus} = ${signature}`;
    
    // Display the signature result
    document.getElementById('signature-value').textContent = signature;
    
    // Show the next container
    showContainer(3);
}

// Verify the signature using the public key
function verifySignature() {
    // Get the public key Emma thinks she has for Jake
    const emmaPublicKey = parseInt(document.getElementById('emma-public-key').value);
    
    // Validate the input
    if (isNaN(emmaPublicKey)) {
        alert('Please enter a valid public key');
        return;
    }
    
    // Calculate verification result
    verification = modExp(signature, emmaPublicKey, modulus);
    
    // Display the calculation
    document.getElementById('verification-calculation').textContent = 
        `${signature}^${emmaPublicKey} mod ${modulus} = ${verification}`;
    
    // Display the result container
    showContainer(5);
    
    // Display success or failure
    const resultElement = document.getElementById('verification-result');
    
    if (verification === challenge && emmaPublicKey === publicKey) {
        resultElement.classList.add('success');
        resultElement.classList.remove('failure');
        resultElement.innerHTML = `
            <p>✅ AUTHENTICATION SUCCESSFUL!</p>
            <p>Original Challenge: ${challenge}</p>
            <p>Verification Result: ${verification}</p>
            <p>Emma has confirmed she's really talking to Jake!</p>
        `;
    } else {
        resultElement.classList.add('failure');
        resultElement.classList.remove('success');
        
        if (emmaPublicKey !== publicKey) {
            resultElement.innerHTML = `
                <p>❌ AUTHENTICATION FAILED!</p>
                <p>Emma used the wrong public key!</p>
                <p>Original Challenge: ${challenge}</p>
                <p>Verification Result: ${verification}</p>
                <p>Emma cannot verify Jake's identity.</p>
            `;
        } else {
            resultElement.innerHTML = `
                <p>❌ AUTHENTICATION FAILED!</p>
                <p>Original Challenge: ${challenge}</p>
                <p>Verification Result: ${verification}</p>
                <p>The verification doesn't match the challenge!</p>
                <p>Someone might be pretending to be Jake!</p>
            `;
        }
    }
}

// Reset the demo to start again
function resetDemo() {
    // Generate new keys
    generateKeys();
    
    // Clear all input fields
    document.getElementById('challenge').value = '';
    document.getElementById('emma-public-key').value = '';
    
    // Clear displayed values
    document.getElementById('signature-calculation').textContent = '';
    document.getElementById('signature-value').textContent = '';
    document.getElementById('verification-calculation').textContent = '';
    
    // Hide all containers except the first
    document.querySelectorAll('.story-container').forEach((container, index) => {
        if (index === 0) {
            container.classList.add('active');
        } else {
            container.classList.remove('active');
        }
    });
    
    // Update the displayed keys
    privateKey = PRIVATE_KEY;
    publicKey = PUBLIC_KEY;
    modulus = MODULUS;
    document.getElementById('private-key').textContent = privateKey;
    document.getElementById('public-key').textContent = publicKey;
    
    // Scroll to the top container
    document.getElementById('container-1').scrollIntoView({ behavior: 'smooth' });
    
    // Apply typing effect to the first container
    const firstContainer = document.getElementById('container-1');
    applyTypingEffectToContainer(firstContainer);
}

// Helper function: Modular exponentiation for large integers
// Calculates base^exponent mod modulus efficiently
function modExp(base, exponent, modulus) {
    if (modulus === 1) return 0;
    
    let result = 1;
    base = base % modulus;
    
    while (exponent > 0) {
        // If exponent is odd, multiply result with base
        if (exponent % 2 === 1) {
            result = (result * base) % modulus;
        }
        
        // Exponent is even, square the base
        exponent = Math.floor(exponent / 2);
        base = (base * base) % modulus;
    }
    
    return result;
}