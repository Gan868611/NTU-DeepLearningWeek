from flask import Flask, render_template, jsonify, request
import random
import openai
import os

app = Flask(__name__)

# Set up your OpenAI API key (ensure you replace with your actual key)
openai.api_key = "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"  # Replace with your actual key

print(f"OpenAI API Key: {openai.api_key}")

# Player health condition and risk level (these should come from your AI model)
game_state = {
    "player": {
        "name": "Player",
        "hp": 100,
        "max_hp": 100,
        "attack": 20,
        "health_status": "Healthy",
        "num_exercise": 0,  # ✅ Add default value to prevent KeyError
        "food_nutrition": "Unknown",  # ✅ Default value
        "sleep_hours": 0,  # ✅ Default value
        "crit_chance": 0  # ✅ Default value
    },
    "monster": {
        "name": "Enemy",
        "hp": 100,
        "max_hp": 100,
        "attack": 15,
        "risk_percentage": 50  # Default risk percentage
    },
    "turn": "player",
    "message": "Battle begins!"
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_commentary', methods=['POST'])
def generate_commentary():
    data = request.json
    battle_log = data.get('log', '')

    print(f"Received battle log for commentary: {battle_log}")

    if not openai.api_key:
        print("Error: OpenAI API key is not set!")
        return jsonify({"commentary": "Unable to generate commentary at this time. (No API Key)"})

    try:
        # Use a shorter and more direct prompt for a very short response
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a fast-paced and very concise game commentator. Keep responses very short, ideally one sentence."},
                {"role": "user", "content": f"Very short commentary: '{battle_log}'"}
            ],
            max_tokens=20,  # Further reduce max tokens for ultra-short responses
            temperature=0.5
        )

        commentary = response.choices[0].message.content.strip()
        print(f"Generated commentary: {commentary}")  # Print to terminal only
        return jsonify({"commentary": commentary})

    except Exception as e:
        print(f"Error generating commentary: {e}")
        return jsonify({"commentary": "Unable to generate commentary at this time."})



@app.route('/attack', methods=['POST'])
def attack():
    """Handles player's attack with buffs and debuffs applied dynamically."""
    global game_state
    data = request.get_json()
    ability = data.get('ability', 'Attack')

    # Define player attack power
    attack_power = {
        "Salad Slam": random.randint(8, 15),
        "Cardio Crush": random.randint(10, 12),
        "Apple A Day": random.randint(5, 20),  # Higher variability, higher crit chance
        "Exercise Explosion": random.randint(10, 18)
    }

    damage = attack_power.get(ability, random.randint(5, 10))
    event_message = ""

    # Apply critical hit chance
    if random.random() < game_state["player"]["crit_chance"] / 100:
        damage = int(damage * 1.5)
        event_message += " 🗡️ Buff: Critical Hit! 50% more damage!"

    # Random Buffs and Debuffs
    if random.random() < 0.1:
        damage += 10
        event_message += " 🍀 Buff: Lucky Strike! Extra damage!"

    if random.random() < 0.05:
        damage = 0
        event_message += " 😵 Debuff: You fumbled! No attack this turn."

    if game_state["player"]["num_exercise"] == 0:
        damage -= 5
        event_message += " 🚫 Debuff: No exercise: -5 attack."

    if random.random() < 0.2:
        damage *= 2
        event_message += " 💪 Buff: Workout Boost! Your attack is doubled!"

    if game_state["player"]["food_nutrition"] == "Very Low" and random.random() < 0.2:
        damage = 0
        event_message += " 💤 Debuff: Sluggishness! You skip a turn."

    if game_state["player"]["sleep_hours"] < 6 and random.random() < 0.5:
        damage = int(damage / 2)
        event_message += " 😴 Debuff: Fatigue sets in... Your damage is halved!"

    if game_state["turn"] == "player":
        game_state["monster"]["hp"] -= damage
        game_state["monster"]["hp"] = max(game_state["monster"]["hp"], 0)
        game_state["message"] = f"You used {ability}! Monster lost {damage} HP. {event_message}"

        if game_state["monster"]["hp"] <= 0:
            game_state["message"] = "You won! The monster is defeated."

        game_state["turn"] = "enemy"

    return jsonify({
        "player": {
            "hp": game_state["player"]["hp"],
            "max_hp": game_state["player"]["max_hp"]
        },
        "monster": {
            "hp": game_state["monster"]["hp"],
            "max_hp": game_state["monster"]["max_hp"]
        },
        "message": game_state["message"]
    })


@app.route('/enemy_turn', methods=['POST'])
def enemy_turn():
    """Handles enemy's attack with randomized abilities."""
    global game_state

    # Define random monster attack power and abilities
    monster_attacks = {
        "Burger Barrage": random.randint(12, 22),
        "Couch Potato Curse": random.randint(8, 16),
        "Pizza Pummel": random.randint(12, 22),
        "Soda Splash": random.randint(14, 26),
    }

    selected_attack = random.choice(list(monster_attacks.keys()))
    damage = monster_attacks[selected_attack]

    if game_state["turn"] == "enemy":
        game_state["player"]["hp"] -= damage
        game_state["player"]["hp"] = max(game_state["player"]["hp"], 0)
        game_state["message"] = f"Monster used {selected_attack}! You lost {damage} HP."

        if game_state["player"]["hp"] <= 0:
            game_state["message"] = "You lost! The enemy defeated you."

        game_state["turn"] = "player"

    return jsonify({
        "player": {
            "hp": game_state["player"]["hp"],
            "max_hp": game_state["player"]["max_hp"]
        },
        "monster": {
            "hp": game_state["monster"]["hp"],
            "max_hp": game_state["monster"]["max_hp"]
        },
        "message": game_state["message"]
    })

@app.route('/get_status', methods=['GET'])
def get_status():
    """Returns player buffs, debuffs, and monster scaling details with enhanced visual presentation."""
    global game_state

    # Fetch player stats
    num_exercise = game_state["player"].get("num_exercise", 0)
    food_nutrition = game_state["player"].get("food_nutrition", "Unknown")
    sleep_hours = game_state["player"].get("sleep_hours", 0)
    crit_chance = game_state["player"].get("crit_chance", 0)

    # Monster stats
    risk_percentage = game_state["monster"].get("risk_percentage", 50)
    monster_attack = game_state["monster"].get("attack", 15)
    monster_hp = game_state["monster"].get("hp", 100)

    # Buffs and Debuffs with Icons and Formatting
    player_effects = [
        f"🏋️ <strong>Exercise:</strong> {num_exercise} sessions. {'💪 <span class=\"buff\">Buff:</span> +' + str(num_exercise * (4 if num_exercise > 3 else 3)) + ' to attack.' if num_exercise > 0 else '❌ <span class=\"debuff\">Debuff:</span> -5 to attack (No exercise).'}",
        f"🍎 <strong>Nutrition:</strong> {food_nutrition}. {'🍀 <span class=\"buff\">Add 50 to health</span> and +5 HP regen' if food_nutrition == 'Very high' else ('🍏 <span class=\"buff\">Add 30 to health</span>' if food_nutrition == 'High' else ('😐 No bonus' if food_nutrition == 'Low' else '⚠️ <span class=\"debuff\">Debuff:</span> -20 health, chance to skip turn'))}"
    ]

    # Sleep Buffs and Debuffs
    if sleep_hours > 6:
        crit_increase = int((sleep_hours - 6) * 5)
        player_effects.append(f"🛌 <strong>Sleep:</strong> {sleep_hours} hours. 🌟 <span class=\"buff\">Buff:</span> +{crit_increase}% critical hit chance.")
    elif sleep_hours < 6:
        player_effects.append(f"🛌 <strong>Sleep:</strong> {sleep_hours} hours. 🔻 Baseline crit chance, 💤 <span class=\"debuff\">Debuff:</span> 50% chance to deal half damage.")
    else:
        player_effects.append(f"🛌 <strong>Sleep:</strong> {sleep_hours} hours. 👍 Normal crit chance, no bonus.")

    # Additional Buffs and Debuffs
    if food_nutrition == "Very Low":
        player_effects.append("⚠️ <span class=\"debuff\">Debuff:</span> Sluggishness! 20% chance to skip a turn.")
        player_effects.append("🤢 <span class=\"debuff\">Debuff:</span> Food Poisoning! 10% chance to lose 5 HP.")
    
    if num_exercise > 3:
        player_effects.append("🔥 <span class=\"buff\">Buff:</span> Workout Boost! 20% chance to double attack power.")

    # Random Events
    player_effects.append("🎯 <span class=\"buff\">Random Event:</span> Lucky Strike! 10% chance to add +10 to attack.")
    player_effects.append("😵 <span class=\"debuff\">Random Event:</span> Clumsy Move! 5% chance to fumble and skip the turn.")

    # Monster Effects
    monster_effects = [
        f"⚔️ <strong>Risk Level:</strong> {risk_percentage}%.",
        f"👹 <strong>Enemy Attack:</strong> {monster_attack}.",
        f"🩸 <strong>Enemy HP:</strong> {monster_hp}."
    ]

    return jsonify({
        "player_effect": "<br>".join(player_effects),
        "monster_effect": "<br>".join(monster_effects)
    })

@app.route('/reset', methods=['POST'])
def reset():
    """Resets the game state and initializes dynamic buffs and debuffs based on health habits."""
    global game_state

    # Simulate ML model output (Replace with actual ML model result)
    risk_percentage = random.randint(0, 100)  

    # Scale monster stats based on risk
    base_monster_attack = 10
    base_monster_hp = 100

    monster_attack = int(base_monster_attack * (1 + risk_percentage / 100))
    monster_hp = int(base_monster_hp * (1 + risk_percentage / 200))

    # Determine risk level based on risk percentage
    risk_level = "Low" if risk_percentage < 33 else "Medium" if risk_percentage < 66 else "High"

    # Example player stats (Replace these with real AI inputs)
    num_exercise = 5
    food_nutrition = "High"
    sleep_hours = 8
    crit_chance_bonus = 0

    # 🏋️ Exercise Buffs and Debuffs
    exercise_attack_bonus = num_exercise * (4 if num_exercise > 3 else 3)
    if num_exercise == 0:
        exercise_attack_bonus = -5
        game_state["message"] += " 🚫 Debuff: No exercise. Attack reduced by 5!"

    # 💥 Random Workout Boost
    if random.random() < 0.2:
        exercise_attack_bonus *= 2
        game_state["message"] += " 💪 Buff: Workout Boost! Attack power doubled!"

    # 🍔 Food Nutrition Buffs and Debuffs   
    if food_nutrition == "Very high":
        food_health_bonus = 30
        game_state["player"]["hp"] += 5
        game_state["message"] += " 🍀 Buff: High Nutrition! +5 HP regen per turn."
    elif food_nutrition == "High":
        food_health_bonus = 10
    elif food_nutrition == "Low":
        food_health_bonus = 0
        if random.random() < 0.1:
            game_state["message"] += " 🤢 Debuff: Food Poisoning! Lose 5 HP."
            game_state["player"]["hp"] -= 5
    else:  # "Very Low" nutrition
        food_health_bonus = -20
        if random.random() < 0.2:
            game_state["message"] += " 💤 Debuff: Sluggishness! Skip a turn."
            game_state["turn"] = "enemy"

    # 🛌 Sleep Buffs and Debuffs
    if sleep_hours > 8:
        crit_chance_bonus = 25
        game_state["message"] += " 🌙 Buff: Rested! +25% critical hit chance."
        if random.random() < 0.1:
            game_state["message"] += " 🛌 Debuff: Overrested. Attack reduced by 5."
            exercise_attack_bonus -= 5
    elif sleep_hours < 6:
        crit_chance_bonus = int(sleep_hours * 1)
        if random.random() < 0.2:
            game_state["message"] += " 😴 Debuff: Fatigue! 50% chance to deal half damage."

    # Update `game_state` with buffs and debuffs
    game_state["player"].update({
        "hp": 100 + food_health_bonus,
        "max_hp": 100 + food_health_bonus,
        "attack": 20 + exercise_attack_bonus,
        "crit_chance": crit_chance_bonus,
        "num_exercise": num_exercise,
        "food_nutrition": food_nutrition,
        "sleep_hours": sleep_hours
    })

    game_state["monster"].update({
        "hp": monster_hp,
        "max_hp": monster_hp,
        "attack": monster_attack,
        "risk_percentage": risk_percentage,
        "risk_level": risk_level
    })

    game_state["turn"] = "player"
    game_state["message"] = f"Your health stats have been applied. Monster risk: {risk_percentage}%."

    return jsonify(game_state)


if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5000, debug=True)
