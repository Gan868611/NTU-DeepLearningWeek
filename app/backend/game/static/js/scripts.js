function showAttackMenu() {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("attack-menu").style.display = "flex";
}

function attack(ability) {
    if (ability === "Back to Menu") {
        document.getElementById("attack-menu").style.display = "none";
        document.getElementById("main-menu").style.display = "flex";
        return;
    }

    document.getElementById("battle-log").innerText = `You used ${ability}!`;
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("attack-menu").style.display = "none";

    // Add attack animation to player image
    document.getElementById("player-img").classList.add("attack-animation");
    setTimeout(() => {
        document.getElementById("player-img").classList.remove("attack-animation");
    }, 500);

    // Special Effect for specific attacks
    if (ability === "Cardio Crush") {
        showSpecialEffect('monster-container', 'moving-effect', 'heart');
    } else if (ability === "Salad Slam") {
        showSpecialEffect('monster-container', 'moving-effect', 'salad');
    } else if (ability === "Apple A Day") {
        showSpecialEffect('monster-container', 'moving-effect', 'apple');
    }


    setTimeout(() => {
        fetch('/attack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ability: ability })
        })
        .then(response => response.json())
        .then(data => {
            updateGameState(data);

            if (data.monster.hp <= 0) {
                setTimeout(() => {
                    const winMessage = "🎉 Victory! Your healthy choices made you stronger. Keep it up! 💪";
                    document.getElementById("battle-log").innerText = winMessage;
                    fetchCommentary(winMessage); // Add commentary for win
                    playWinSound();
                }, 1000); // Add a 1-second delay to allow the attack animation to complete
                return;
            }

            setTimeout(() => {
                document.getElementById("battle-log").innerText = "Monster is attacking...";

                setTimeout(() => {
                    fetch('/enemy_turn', { method: 'POST' })
                        .then(response => response.json())
                        .then(data => {
                            updateGameState(data);

                            if (data.player.hp <= 0) {
                                // Extracts only the ability name from the full message
                                const fullMessage = data.message;
                                const abilityMatch = fullMessage.match(/Monster used (.*?) You lost/);
                            
                                if (abilityMatch && abilityMatch[1]) {
                                    const sanitizedAbility = abilityMatch[1].trim().replace(/!$/, '');
                                    console.log(`Sanitized ability name: ${sanitizedAbility}`);
                                    // Play attack animation but do not double trigger the hit flash and sound
                                    enemyAttack(sanitizedAbility, fullMessage);
                                }
                            
                                // Delay to show animation before displaying the lose message
                                setTimeout(() => {
                                    if (!abilityMatch) {
                                        triggerHitFlash('player-img'); // Only trigger if not done by enemyAttack
                                        playHitSound(); // Play hit sound before lose
                                    }
                                }, 500);
                            
                                setTimeout(() => {
                                    const loseMessage = "💔 Defeated! Don't give up—stay healthy and try again! Ask the AI chatbot for tips.";
                                    document.getElementById("battle-log").innerText = loseMessage;
                                    fetchCommentary(loseMessage);
                                    playLoseSound();
                                }, 1500); // Increased delay to 1.5s to match animation duration
                                return;
                            }
                            
                            // Extracts only the ability name from the full message
                            const fullMessage = data.message;
                            const abilityMatch = fullMessage.match(/Monster used (.*?) You lost/);

                            if (abilityMatch && abilityMatch[1]) {
                                const sanitizedAbility = abilityMatch[1].trim().replace(/!$/, '');
                                console.log(`Sanitized ability name: ${sanitizedAbility}`);
                                enemyAttack(sanitizedAbility, fullMessage);
                            } else {
                                console.warn("Could not extract the monster ability name from the message.");
                            }

                            // Add screen shake effect when the player is hit
                            triggerScreenShake();
                            triggerHitFlash('player-img');

                            setTimeout(() => {
                                document.getElementById("main-menu").style.display = "flex";
                            }, 1000);
                        });
                }, 1000);
            }, 2500); // Reduced delay to avoid long waiting
        });
    }, 1000);
}

function enemyAttack(ability, fullMessage) {
    console.log(`Monster attack triggered: ${ability}`);
    document.getElementById("battle-log").innerText = fullMessage;

    if (ability === "Burger Barrage") {
        showSpecialEffect('player-container', 'moving-effect', 'burger', true);
    } else if (ability === "Couch Potato Curse") {
        showSpecialEffect('player-container', 'moving-effect', 'potato', true);
    } else if (ability === "Pizza Pummel") {
        showSpecialEffect('player-container', 'moving-effect', 'pizza', true);
    } else if (ability === "Soda Splash") {
        showSpecialEffect('player-container', 'moving-effect', 'soda', true);
    } else {
        console.warn(`No animation defined for ability: ${ability}`);
    }
}

function useItem() {
    document.getElementById("battle-log").innerText = "You have no items!";
}

function runAway() {
    document.getElementById("battle-log").innerText = "You can't run away from this battle!";
}

function updateGameState(data) {
    let playerHp = Math.max(data.player.hp, 0);
    let monsterHp = Math.max(data.monster.hp, 0);
    let playerMaxHp = data.player.max_hp || 50;
    let monsterMaxHp = data.monster.max_hp || 50;

    document.getElementById("player-hp").style.width = `${(playerHp / playerMaxHp) * 100}%`;
    document.getElementById("monster-hp").style.width = `${(monsterHp / monsterMaxHp) * 100}%`;

    document.getElementById("player-hp-text").innerText = `${playerHp}/${playerMaxHp}`;
    document.getElementById("monster-hp-text").innerText = `${monsterHp}/${monsterMaxHp}`;

    document.getElementById("battle-log").innerText = data.message;

    // Generate live commentary
    fetchCommentary(data.message);

    // Apply Buff/Debuff Glow
    if (data.message.includes("Buff")) {
        document.getElementById("player-img").classList.add("buff-glow");
        setTimeout(() => {
            document.getElementById("player-img").classList.remove("buff-glow");
        }, 1000);
    } else if (data.message.includes("Debuff")) {
        document.getElementById("player-img").classList.add("debuff-glow");
        setTimeout(() => {
            document.getElementById("player-img").classList.remove("debuff-glow");
        }, 1000);
    }

    // Play hit sound and trigger hit flash for monster when damaged
    if (data.message.includes("Monster lost")) {
        triggerHitFlash('monster-img');
        playHitSound();

        // if (monsterHp <= 0) {
        //     setTimeout(() => {
        //         document.getElementById("battle-log").innerText = "You won! The monster is defeated.";
        //         playWinSound();
        //     }, 1000); // Delay win message to allow animation and hit sound to complete
        //     return;
        // }
    }

    // Play hit sound and trigger hit flash for player when hit
    if (data.message.includes("You lost")) {
        triggerHitFlash('player-img');
        triggerScreenShake();
        playHitSound();

        // if (playerHp <= 0) {
        //     setTimeout(() => {
        //         document.getElementById("battle-log").innerText = "You lost! The monster defeated you.";
        //         playLoseSound();
        //     }, 1000); // Delay lose message to allow animation and hit sound to complete
        //     return;
        // }
    }
}

// Function to fetch updated status and show tooltip
function showTooltip(event, character) {
    fetch('/get_status')
        .then(response => response.json())
        .then(data => {
            const tooltip = document.getElementById(character + "-tooltip");
            if (character === "player") {
                tooltip.innerHTML = data.player_effect; // Get updated player stats
            } else if (character === "monster") {
                tooltip.innerHTML = data.monster_effect; // Get updated monster stats
            }
            tooltip.style.display = "block";
            moveTooltip(event, character);
        })
        .catch(error => console.error("Error fetching status effects:", error));
}

function moveTooltip(event, character) {
    let tooltip = document.getElementById(character + "-tooltip");
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
}

function hideTooltip(character) {
    let tooltip = document.getElementById(character + "-tooltip");
    tooltip.style.display = "none";
}

function resetGame() {
    fetch('/reset', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            updateGameState(data);  // Ensure the HP numbers reset correctly

            document.getElementById("player-hp").style.width = "100%";
            document.getElementById("monster-hp").style.width = "100%";

            document.getElementById("main-menu").style.display = "none";
            document.getElementById("attack-menu").style.display = "none";

            // ✅ Show health & risk message immediately
            let initialMessage = data.message;
            console.log("Received Reset Message:", initialMessage);
            document.getElementById("battle-log").innerText = initialMessage + "\nBattle begins!";

            // ✅ Show the buttons immediately
            document.getElementById("main-menu").style.display = "flex";
        })
        .catch(error => console.error("Error resetting game:", error));
}

// ✅ Expose function so it can be called from the parent (iframe)
window.resetGame = resetGame;

function triggerHitFlash(target) {
    const element = document.getElementById(target);
    element.classList.add('hit-flash');
    playHitSound(); // Play sound when hit
    setTimeout(() => element.classList.remove('hit-flash'), 300);
}

function showSpecialEffect(target, effectClass, imageName, reverse = false) {
    console.log(`Triggering special effect: ${effectClass} on ${target} with image ${imageName}, reverse: ${reverse}`);
    
    const container = document.querySelector(".battle-area");
    if (!container) {
        console.error(`No element found with class: battle-area`);
        return;
    }

    // Create the animation effect as an image element
    const effect = document.createElement('img');
    effect.src = `/static/images/${imageName}.png`; // Use dynamic image name
    effect.className = effectClass;

    // Set the initial position and animation direction
    effect.style.position = 'absolute';
    effect.style.width = '100px';
    effect.style.height = '100px';
    effect.style.animationDuration = '1s';
    effect.style.animationTimingFunction = 'ease-in-out';
    effect.style.zIndex = '9999';

    if (reverse) {
        console.log("Applying reverse animation for effect");
        // Animation from monster to player
        effect.style.left = '80%'; // Start near the monster
        effect.style.top = '20%';  // Start at monster height
        effect.style.animationName = 'moveEffectReverse';
    } else {
        console.log("Applying normal animation for effect");
        // Animation from player to monster
        effect.style.left = '20%'; // Start near the player
        effect.style.top = '80%'; // Start at player height
        effect.style.animationName = 'moveEffect';
    }

    // Append the effect and schedule its removal
    container.appendChild(effect);

    setTimeout(() => {
        effect.remove();
        console.log('Special effect removed.');
    }, 1000);
}

function triggerScreenShake() {
    const container = document.querySelector(".game-container");
    container.classList.add("shake-effect");
    setTimeout(() => container.classList.remove("shake-effect"), 300);
}

// Function to play the hit sound
function playHitSound() {
    const hitSound = document.getElementById('hit-sound');
    hitSound.currentTime = 0; // Rewind to the start
    hitSound.play();
}

// Function to play the win sound
function playWinSound() {
    const winSound = document.getElementById('win-sound');
    winSound.currentTime = 0;
    winSound.play();
}

// Function to play the lose sound
function playLoseSound() {
    const loseSound = document.getElementById('lose-sound');
    loseSound.currentTime = 0;
    loseSound.play();
}

function fetchCommentary(logMessage) {
    fetch('/generate_commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: logMessage })
    })
    .then(response => response.json())
    .then(data => {
        // Only read out the commentary, do not display it on the battle log
        speakCommentary(data.commentary);
    })
    .catch(error => console.error("Error fetching commentary:", error));
}

// let speechQueue = [];
// let isSpeaking = false;

// function fetchCommentary(logMessage) {
//     fetch('/generate_commentary', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ log: logMessage })
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log("Commentary:", data.commentary);
//         queueSpeech(data.commentary);
//     })
//     .catch(error => console.error("Error fetching commentary:", error));
// }

// // Add commentary to the queue
// function queueSpeech(text) {
//     speechQueue.push(text);
//     if (!isSpeaking) {
//         playNextInQueue();
//     }
// }

// // Play the next commentary in the queue
// function playNextInQueue() {
//     if (speechQueue.length === 0) {
//         isSpeaking = false;
//         return;
//     }

//     isSpeaking = true;
//     const text = speechQueue.shift();
//     playGoogleTTS(text);
// }

// // Function to play commentary using Google TTS API
// function playGoogleTTS(text) {
//     const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
//     const payload = {
//         input: { text: text },
//         voice: {
//             languageCode: "en-US",
//             name: "en-US-Wavenet-D" // Choose an exciting voice
//         },
//         audioConfig: {
//             audioEncoding: "MP3",
//             speakingRate: 1.8, // Speed up for excitement
//             pitch: 2 // Slightly higher pitch for energy
//         }
//     };

//     fetch(ttsUrl, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.audioContent) {
//             const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
            
//             // When the audio finishes, play the next in the queue
//             audio.onended = () => {
//                 isSpeaking = false;
//                 playNextInQueue();
//             };

//             audio.play();
//         } else {
//             console.error("No audio content received from TTS API");
//             isSpeaking = false;
//             playNextInQueue();
//         }
//     })
//     .catch(error => {
//         console.error("Error with Google TTS API:", error);
//         isSpeaking = false;
//         playNextInQueue();
//     });
// }

//browser api
function fetchCommentary(logMessage) {
    fetch('/generate_commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: logMessage })
    })
    .then(response => response.json())
    .then(data => {
        // Only read out the commentary, do not display it on the battle log
        speakCommentary(data.commentary);
    })
    .catch(error => console.error("Error fetching commentary:", error));
}

// Function to speak out the commentary with more excitement
function speakCommentary(commentary) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(commentary);
    utterance.lang = 'en-US';  

    // Make the speech more dynamic
    utterance.rate = 3.0 + Math.random() * 0.5; // Randomize rate slightly for a natural feel
    utterance.pitch = 1.5;  // Slightly higher pitch for excitement
    utterance.volume = 1.0;  // Max volume for clear sound

    synth.speak(utterance);
}

// Automatically reset game on page load or React component mount
window.onload = () => resetGame();

// // Apply Buff/Debuff Glow
// console.log("Battle Log Message:", data.message);  // Debug log
// if (/Buff|Critical Hit|Workout Boost|Lucky Strike/.test(data.message)) {
//     document.getElementById("player-img").classList.add("buff-glow");
//     setTimeout(() => {
//         document.getElementById("player-img").classList.remove("buff-glow");
//     }, 1000);
// } else if (/Debuff|Sluggishness|Fatigue|Poisoning|Fumbled/.test(data.message)) {
//     document.getElementById("player-img").classList.add("debuff-glow");
//     setTimeout(() => {
//         document.getElementById("player-img").classList.remove("debuff-glow");
//     }, 1000);
// }
