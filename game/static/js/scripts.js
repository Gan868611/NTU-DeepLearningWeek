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
                    document.getElementById("battle-log").innerText = "You won! The monster is defeated.";
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
                                document.getElementById("battle-log").innerText = "You lost! The monster defeated you.";
                                return;
                            }

                            if (data.player.hp <= 0) {
                                setTimeout(() => {
                                    document.getElementById("battle-log").innerText = "You lost! The monster defeated you.";
                                    playLoseSound();
                                }, 1000); // Add a 1-second delay to allow the attack animation to complete
                                return;
                            }

                            // Extracts only the ability name from the full message
                            const fullMessage = data.message;
                            const abilityMatch = fullMessage.match(/Monster used (.*?) You lost/);

                            if (abilityMatch && abilityMatch[1]) {
                                // Sanitize the ability name by removing trailing exclamation mark and whitespace
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
    let playerMaxHp = data.player.max_hp || 100;
    let monsterMaxHp = data.monster.max_hp || 100;

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

    // Play win sound when the player wins
    if (monsterHp <= 0) {
        setTimeout(() => {
            document.getElementById("battle-log").innerText = "You won! The monster is defeated.";
            playWinSound();
        }, 0);
        return;
    }

    // Play lose sound when the player loses
    if (playerHp <= 0) {
        setTimeout(() => {
            document.getElementById("battle-log").innerText = "You lost! The monster defeated you.";
            playLoseSound();
        }, 0);
        return;
    }

    // Trigger hit flash for the monster when the monster is hit
    if (data.message.includes("Monster lost")) {
        triggerHitFlash('monster-img');
        playHitSound();
    }

    // Trigger hit flash for the player when the player is hit
    if (data.message.includes("You lost")) {
        triggerHitFlash('player-img');
        triggerScreenShake();
        playHitSound(); 
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


// Function to speak out the commentary
function speakCommentary(commentary) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(commentary);
    utterance.lang = 'en-US';  
    utterance.rate = 2.5;  // Increase rate for faster speech (1.0 is normal, up to 2.0 for faster)
    utterance.pitch = 1.0;  // Optional: Keep the pitch normal
    synth.speak(utterance);
}

// Automatically reset game on page load or React component mount
window.onload = () => resetGame();

// Apply Buff/Debuff Glow
console.log("Battle Log Message:", data.message);  // Debug log
if (/Buff|Critical Hit|Workout Boost|Lucky Strike/.test(data.message)) {
    document.getElementById("player-img").classList.add("buff-glow");
    setTimeout(() => {
        document.getElementById("player-img").classList.remove("buff-glow");
    }, 1000);
} else if (/Debuff|Sluggishness|Fatigue|Poisoning|Fumbled/.test(data.message)) {
    document.getElementById("player-img").classList.add("debuff-glow");
    setTimeout(() => {
        document.getElementById("player-img").classList.remove("debuff-glow");
    }, 1000);
}
