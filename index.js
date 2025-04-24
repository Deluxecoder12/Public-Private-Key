// Global variables to store our key information
let privateKey, publicKey, modulus;
let challenge, signature, verification;

// Constants for our simplified RSA
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

    if (document.getElementById('container-6') && 
        document.getElementById('container-6').classList.contains('active')) {
        setupQuizOptions();
    }
});

// Generate random RSA key components
function generateKeys() {
    // We'll use small prime numbers for educational purposes
    const primes = [3, 5, 7, 11, 13];
    
    // Randomly select two different primes
    const p = primes[Math.floor(Math.random() * 3)]; // Use only the first 3 primes
    const q = primes[Math.floor(Math.random() * 3)];
    if (p * q > 50) {
        // Try again with smaller primes
        p = primes[Math.floor(Math.random() * 3)]; // Use only the first 3 primes
        q = primes[Math.floor(Math.random() * 3)];
        while (q === p) {
            q = primes[Math.floor(Math.random() * 3)];
        }
    }
    
    // Calculate modulus n = p * q
    MODULUS = p * q;
    
    // Calculate totient φ(n) = (p-1) * (q-1)
    const totient = (p - 1) * (q - 1);
    
    // Choose public key e (coprime to totient)
    // For simplicity, let's pick from a set of common public exponents
    const possibleEs = [3, 5, 7];
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

// This function applies a typing effect to all text elements in a container
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

        // Skip elements with HTML tags
        if (element.innerHTML.includes('<')) return;
        
        // Store the original text in a data attribute for reference
        const originalText = element.textContent;
        element.setAttribute('data-original-text', originalText);
        element.textContent = '';
        element.style.minHeight = '1em'; // Prevent layout shifts
        
        // Delay based on element position to create a sequential effect
        const startDelay = index * 500; // Half second between elements
        
        // Start typing effect after delay
        setTimeout(() => {
            // Reset the element before typing to ensure clean start
            element.innerHTML = '';
            typeTextImproved(element, originalText, 0);
        }, startDelay);
    });
}

// Improved typing function with better character handling
function typeTextImproved(element, text, index) {
    if (index < text.length) {
        // Add one character at a time
        element.textContent = text.substring(0, index + 1);
        
        // Schedule the next character
        setTimeout(() => {
            typeTextImproved(element, text, index + 1);
        }, 15); // Speed of typing (lower = faster)
    } else {
        // When finished, ensure the final text matches the original exactly
        element.textContent = text;
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
        
        // Update progress indicators
        updateProgress(containerNumber);
        
        // Scroll to the newly visible container
        containerToShow.scrollIntoView({ behavior: 'smooth' });
        
        // Apply typing effect to the newly shown container
        applyTypingEffectToContainer(containerToShow);
        
        // If this is the quiz container (container-6), set up the quiz options
        if (containerId === 'container-6') {
            setupQuizOptions();
        }
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
    document.getElementById('signature-calculation').innerHTML = 
        `${challenge}<sup>${privateKey}</sup> mod ${modulus} = ${signature}`;
    
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
    document.getElementById('verification-calculation').innerHTML = 
        `${signature}<sup>${emmaPublicKey}</sup> mod ${modulus} = ${verification}`;
    
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

// Make sure to add this function to your JavaScript file
function setupQuizOptions() {
    // Select all quiz option buttons
    const quizButtons = document.querySelectorAll('.quiz-option');
    
    // Add event listeners to each button
    quizButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get question ID and whether this is the correct answer
            const questionId = this.getAttribute('data-question');
            const isCorrect = this.getAttribute('data-correct') === 'true';
            
            // Find the result element for this question
            const resultElement = document.getElementById(`result-${questionId}`);
            
            // Remove any existing selected/correct/incorrect classes from all options for this question
            document.querySelectorAll(`.quiz-option[data-question="${questionId}"]`).forEach(option => {
                option.classList.remove('selected', 'correct', 'incorrect');
            });
            
            // Add selected class to the clicked button
            this.classList.add('selected');
            
            // Add correct/incorrect class based on the answer
            if (isCorrect) {
                this.classList.add('correct');
                resultElement.textContent = 'Correct! ✅';
                resultElement.className = 'quiz-result correct';
            } else {
                this.classList.add('incorrect');
                resultElement.textContent = 'Try again! ❌';
                resultElement.className = 'quiz-result incorrect';
            }
            
            // Check if all questions have been answered correctly
            checkQuizCompletion();
        });
    });
}

// Function to check if all quiz questions have been answered correctly
function checkQuizCompletion() {
    // Get all question IDs
    const questionIds = Array.from(new Set(
        Array.from(document.querySelectorAll('.quiz-option'))
            .map(option => option.getAttribute('data-question'))
    ));
    
    // Check if all questions have a correct answer selected
    const allCorrect = questionIds.every(id => {
        return document.querySelector(`.quiz-option[data-question="${id}"][data-correct="true"].selected`) !== null;
    });
    
    // Show certificate if all questions are answered correctly
    const certificate = document.getElementById('completion-certificate');
    if (certificate && allCorrect) {
        certificate.classList.add('completed');
        
        // Update all progress steps to completed
        document.querySelectorAll('.progress-step').forEach(step => {
            step.classList.remove('current');
            step.classList.add('completed');
        });
        
        // Add special styling to the quiz dot in the progress bar
        const quizDot = document.querySelector('.progress-step[data-step="6"] .progress-dot');
        if (quizDot) {
            quizDot.classList.add('completed');
        }
    }
}

// Update the resetDemo function
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
    
    // Reset quiz responses
    document.querySelectorAll('.quiz-result').forEach(result => {
        result.textContent = '';
        result.className = 'quiz-result';
    });
    
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Hide certificate
    const certificate = document.getElementById('completion-certificate');
    if (certificate) {
        certificate.classList.remove('completed');
    }
    
    // Reset progress bar completely
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('completed', 'current', 'all-done');
        
        // Clear any tick marks
        const dot = step.querySelector('.progress-dot');
        if (dot) {
            dot.innerHTML = '';
            dot.classList.remove('completed');
        }
    });
    
    // Set intro as the current step
    const introStep = document.querySelector('.progress-step[data-step="intro"]');
    if (introStep) {
        introStep.classList.add('current');
    }
    
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
    document.getElementById('container-intro').scrollIntoView({ behavior: 'smooth' });
    
    // Apply typing effect to the first container
    const firstContainer = document.getElementById('container-intro');
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

function updateProgress(containerNumber) {
    // Skip if progress container doesn't exist
    if (!document.getElementById('progress-container')) return;
    
    // Convert 'intro' to 0 for numeric comparison
    const currentNum = containerNumber === 'intro' ? 0 : 
                      (typeof containerNumber === 'string' ? parseInt(containerNumber) : containerNumber);
    
    // Update all progress steps
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        // Clear any existing classes
        step.classList.remove('completed', 'current');
        
        // Mark as completed or current
        if (index < currentNum) {
            step.classList.add('completed');
        } else if (index === currentNum) {
            step.classList.add('current');
        }
    });
}