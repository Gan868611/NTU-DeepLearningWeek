from flask import Flask, render_template, jsonify, request, send_file, session, redirect, url_for, make_response
import random
import openai
import os
from google.cloud import texttospeech
from flask_cors import CORS
from flask_session import Session
import uuid

app = Flask(__name__)

# Configure Flask-Session
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = "./flask_sessions"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.secret_key = os.getenv("FLASK_SECRET_KEY", "supersecretkey")
app.config["SESSION_COOKIE_DOMAIN"] = "to be updated"
app.config["SERVER_NAME"] = "to be updated"

# Initialize Flask-Session
Session(app)

# ✅ Enable CORS for all routes
CORS(app, supports_credentials=True)
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # If you want to limit it to React only
# Set up your OpenAI API key (ensure you replace with your actual key)

openai.api_key = os.environ.get("OPENAI_API_KEY")
if not openai.api_key:
    print("⚠️ OpenAI API Key is missing! Please set the environment variable.")
# print(f"OpenAI API Key: {openai.api_key}")

# Player health condition and risk level (these should come from your AI model)
# game_state = {
#     "player": {
#         "name": "Player",
#         "hp": 100,
#         "max_hp": 100,
#         "attack": 20,
#         "health_status": "Healthy",
#         "num_exercise": 0,  # ✅ Add default value to prevent KeyError
#         "food_nutrition": "Unknown",  # ✅ Default value
#         "sleep_hours": 0,  # ✅ Default value
#         "crit_chance": 0  # ✅ Default value
#     },
#     "monster": {
#         "name": "Enemy",
#         "hp": 100,
#         "max_hp": 100,
#         "attack": 15,
#         "risk_percentage": 50  # Default risk percentage
#     },
#     "turn": "player",
#     "message": "Battle begins!"
# }

@app.route("/set-session")
def set_session():
    session["user"] = "some_unique_id"
    response = make_response({"message": "Session set!"})
    response.set_cookie("session_id", "some_unique_id", 
                        secure=True, httponly=True, samesite="None")  # Ensure secure cookie settings
    return response

@app.route('/')
def index():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
        # Initialize the game state in the session
        session["game_state"] = {
            "player": {
                "hp": 50,
                "max_hp": 50,
                "crit_chance": 10,
                "num_exercise": 0,
                "food_nutrition": "Medium",
                "sleep_hours": 8
            },
            "monster": {
                "hp": 50,
                "max_hp": 50,
                "attack": 15,
                "risk_percentage": 15
            },
            "turn": "player",
            "message": "Battle begins!"
        }
    game_url = url_for("game", session_id=session["session_id"], _external=True)
    return jsonify({"game_url": game_url})

@app.route('/game/<session_id>')
def game(session_id):
    """Serve a unique game instance for each session."""
    if session.get("session_id") != session_id:
        return "Invalid session!", 400
    return render_template('index.html', session_id=session_id)

# @app.route('/generate_commentary', methods=['POST'])
# def generate_commentary():
#     data = request.json
#     battle_log = data.get('log', '')

#     print(f"Received battle log for commentary: {battle_log}")

#     try:
#         # Generate short and dynamic commentary with OpenAI
#         response = openai.ChatCompletion.create(
#             model="gpt-3.5-turbo",
#             messages=[
#                 {"role": "system", "content": "You are a fast-paced and exciting game commentator. Generate a short commentary maybe few words to one sentence."},
#                 {"role": "user", "content": f"Very short commentary: '{battle_log}'"}
#             ],
#             max_tokens=20,
#             temperature=0.8
#         )

#         commentary = response.choices[0].message.content.strip()
#         print(f"Generated commentary: {commentary}")

#         return jsonify({"commentary": commentary})

#     except Exception as e:
#         print(f"Error generating commentary: {e}")
#         return jsonify({"commentary": "Wow! This exciting battle makes me speechless!"})

#browser api
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
                {"role": "system", "content": "You are a fast-paced and exciting game commentator. Generate a short commentary maybe few words to one sentence. Here is either the ability used or the effect done"},
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
    """Handles player's attack with buffs and debuffs applied dynamically per session."""
    if "session_id" not in session:
        return jsonify({"error": "Invalid session!"}), 400

    game_state = session.get("game_state", {
            "player": {
            "name": "Player",
            "hp": 50,
            "max_hp": 50,
            "attack": 20,
            "health_status": "Healthy",
            "num_exercise": 0,  # ✅ Add default value to prevent KeyError
            "food_nutrition": "High",  # ✅ Default value
            "sleep_hours": 7,  # ✅ Default value
            "crit_chance": 0  # ✅ Default value
        },
        "monster": {
            "name": "Enemy",
            "hp": 50,
            "max_hp": 50,
            "attack": 15,
            "risk_percentage": 15  # Default risk percentage
        },
        "turn": "player",
        "message": "Battle begins!"
    })

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
            game_state["message"] = f"You used {ability}! Monster lost {damage} HP. {event_message}"
            # Keep the turn as "enemy" temporarily to show the final attack message
            game_state["turn"] = "final_attack"
        else:
            game_state["message"] = f"You used {ability}! Monster lost {damage} HP. {event_message}"
            game_state["turn"] = "enemy"

    # Store the updated game state back in the session
    session["game_state"] = game_state

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
    """Handles enemy's attack with randomized abilities per session."""
    if "session_id" not in session:
        return jsonify({"error": "Invalid session!"}), 400

    game_state = session.get("game_state", {
        "player": {"hp": 50, "max_hp": 50},
        "monster": {"hp": 50, "max_hp": 50},
        "turn": "player",
        "message": ""
    })

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

        if game_state["player"]["hp"] <= 0:
            game_state["message"] = f"Monster used {selected_attack}! You lost {damage} HP."
            game_state["turn"] = "final_attack"
        else:
            game_state["message"] = f"Monster used {selected_attack}! You lost {damage} HP."
            game_state["turn"] = "player"

    # Store the updated game state back in the session
    session["game_state"] = game_state

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
    # Retrieve the game state from the session
    game_state = session.get("game_state", {
        "player": {},
        "monster": {},
        "turn": "player",
        "message": ""
    })

    # Fetch player stats
    num_exercise = game_state["player"].get("num_exercise", 0)
    food_nutrition = game_state["player"].get("food_nutrition", "Unknown")
    sleep_hours = game_state["player"].get("sleep_hours", 0)
    crit_chance = game_state["player"].get("crit_chance", 0)

    # Monster stats
    risk_percentage = game_state["monster"].get("risk_percentage", 50)
    monster_attack = game_state["monster"].get("attack", 15)
    monster_hp = game_state["monster"].get("hp", 50)

    # Buffs and Debuffs with Icons and Formatting
    player_effects = [
        f"🏋️ <strong>Exercise:</strong> {num_exercise} sessions. {'💪 <span class=\"buff\">Buff:</span> +' + str(num_exercise * (4 if num_exercise > 3 else 3)) + ' to attack.' if num_exercise > 0 else '❌ <span class=\"debuff\">Debuff:</span> -5 to attack (No exercise).'}",
        f"🍎 <strong>Nutrition:</strong> {food_nutrition}. {'🍀 <span class=\"buff\">Add 20 to health</span>' if food_nutrition == 'Very high' else ('🍏 <span class=\"buff\">Add 10 to health</span>' if food_nutrition == 'High' else ('😐 No bonus' if food_nutrition == 'Low' else '⚠️ <span class=\"debuff\">Debuff:</span> -20 health, chance to skip turn'))}"
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


player_profile = {}  # Stores player stats from React

# @app.route('/update-profile', methods=['POST'])
# def update_profile():
#     """Receive profile data from React and store it."""
#     global player_profile
#     player_profile = request.json
#     print("Received profile data:", player_profile)
#     return jsonify({"message": "Profile updated successfully"}), 200

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """Update player profile within the session."""
    session["player_profile"] = request.json
    return jsonify({"message": "Profile updated successfully"})

@app.route('/reset', methods=['POST'])
def reset():
    """Resets the game state and initializes dynamic buffs and debuffs based on health habits."""
    """Resets the game state and initializes dynamic buffs and debuffs based on health habits."""
    if "session_id" not in session:
        return jsonify({"error": "Invalid session!"}), 400
    
    # Retrieve existing game state or initialize a new one
    game_state = session.get("game_state", {
        "player": {"hp": 100, "max_hp": 100, "crit_chance": 10, "num_exercise": 0, "food_nutrition": "Medium", "sleep_hours": 8},
        "monster": {"hp": 100, "max_hp": 100},
        "turn": "player",
        "message": ""
    })

    # Retrieve player profile from session
    player_profile = session.get("player_profile", {})

    # 🎯 Extract relevant values from ProfileContext
    num_exercise = int(player_profile.get("exercise", 0))
    meal_log = player_profile.get("mealLog", [])  # 🔹 Get meal log from frontend
    sleep_hours = int(player_profile.get("sleep_hours", 7)) 
    risk_percentage = float(player_profile.get("risk_score", 0))
    risk_percentage = round(risk_percentage*100, 3)  # Convert to percentage

    avg_food_health_score = sum(meal["healthScore"] for meal in meal_log) / len(meal_log) if meal_log else 0.5  # Default to 0.5 if empty

    if avg_food_health_score < 0.25:
        food_nutrition = "Very Low"
    elif avg_food_health_score <= 0.5:
        food_nutrition = "Low"
    elif avg_food_health_score < 0.75:
        food_nutrition = "High"
    else:
        food_nutrition = "Very high"

    # Scale monster stats based on risk
    base_monster_attack = 10
    base_monster_hp = 40
    base_player_hp = 40

    # Non-linear scaling for monster stats
    # Using (risk_percentage / 10)² to create a non-linear difficulty curve
    scaling_factor = (risk_percentage / 10) ** 2

    # Apply scaling factor
    monster_attack = int(base_monster_attack * (1 + scaling_factor))
    monster_hp = int(base_monster_hp * (1 + scaling_factor / 2))

    # Determine risk level based on the new risk percentage
    if risk_percentage < 10:
        risk_level = "Low"
    elif risk_percentage < 20:
        risk_level = "Moderate"
    else:
        risk_level = "High"

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
        food_health_bonus = 20
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
        "hp": base_player_hp + food_health_bonus,
        "max_hp": base_player_hp + food_health_bonus,
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

    # Store the updated game state back in the session
    session["game_state"] = game_state

    return jsonify(game_state)

# if __name__ == '__main__':
#     app.run(host="127.0.0.1", port=5000, debug=True)
PORT = int(os.environ.get("PORT", 5001))  # Use Railway's assigned port

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=PORT)