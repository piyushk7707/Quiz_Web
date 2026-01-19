"""
Django ORM Script to Seed Quiz Database with Questions

Usage:
    python manage.py shell
    >>> exec(open('seed_questions.py').read())

Or run directly:
    python seed_questions.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.quiz.models import Question, QuestionOption


# ============================================================================
# QUESTION DATA STRUCTURE
# ============================================================================
QUESTIONS_DATA = {
    # ========================================================================
    # EASY QUESTIONS (15 total)
    # ========================================================================
    'easy': [
        {
            'text': 'What is the capital of France?',
            'explanation': 'Paris is the capital and largest city of France.',
            'options': ['London', 'Berlin', 'Paris', 'Madrid'],
            'correct_idx': 2,
        },
        {
            'text': 'Which planet is known as the Red Planet?',
            'explanation': 'Mars appears reddish due to iron oxide (rust) on its surface.',
            'options': ['Venus', 'Mars', 'Jupiter', 'Saturn'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the largest ocean on Earth?',
            'explanation': 'The Pacific Ocean is the largest and deepest ocean.',
            'options': ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
            'correct_idx': 2,
        },
        {
            'text': 'How many continents are there?',
            'explanation': 'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America.',
            'options': ['5', '6', '7', '8'],
            'correct_idx': 2,
        },
        {
            'text': 'What is the smallest country in the world?',
            'explanation': 'Vatican City is the smallest country, located within Rome, Italy.',
            'options': ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
            'correct_idx': 1,
        },
        {
            'text': 'Which element has the chemical symbol Au?',
            'explanation': 'Gold has the chemical symbol Au, from its Latin name "aurum".',
            'options': ['Silver', 'Gold', 'Aluminum', 'Arsenic'],
            'correct_idx': 1,
        },
        {
            'text': 'What is 2 + 2?',
            'explanation': 'Basic arithmetic: 2 + 2 = 4',
            'options': ['3', '4', '5', '6'],
            'correct_idx': 1,
        },
        {
            'text': 'In which year did World War II end?',
            'explanation': 'World War II ended in 1945 with the surrender of Japan.',
            'options': ['1943', '1944', '1945', '1946'],
            'correct_idx': 2,
        },
        {
            'text': 'What is the largest mammal in the world?',
            'explanation': 'The Blue Whale is the largest mammal ever known to have existed.',
            'options': ['African Elephant', 'Giraffe', 'Blue Whale', 'Hippopotamus'],
            'correct_idx': 2,
        },
        {
            'text': 'Which country is known as the Land of the Rising Sun?',
            'explanation': 'Japan is known as the Land of the Rising Sun.',
            'options': ['China', 'Japan', 'Thailand', 'Vietnam'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the primary language spoken in Brazil?',
            'explanation': 'Portuguese is the official language of Brazil.',
            'options': ['Spanish', 'Portuguese', 'French', 'English'],
            'correct_idx': 1,
        },
        {
            'text': 'How many sides does a triangle have?',
            'explanation': 'A triangle has three sides and three angles.',
            'options': ['2', '3', '4', '5'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the main ingredient in guacamole?',
            'explanation': 'Avocado is the main ingredient in guacamole.',
            'options': ['Tomato', 'Avocado', 'Cucumber', 'Spinach'],
            'correct_idx': 1,
        },
        {
            'text': 'Which programming language is known as the "language of the web"?',
            'explanation': 'JavaScript is the primary programming language for web browsers.',
            'options': ['Python', 'JavaScript', 'Java', 'C++'],
            'correct_idx': 1,
        },
        {
            'text': 'What does HTML stand for?',
            'explanation': 'HTML stands for HyperText Markup Language.',
            'options': ['Hyper Text Multiple Language', 'High Tech Modern Language', 'HyperText Markup Language', 'Home Tool Markup Language'],
            'correct_idx': 2,
        },
    ],

    # ========================================================================
    # MEDIUM QUESTIONS (15 total)
    # ========================================================================
    'medium': [
        {
            'text': 'What is the chemical formula for sulfuric acid?',
            'explanation': 'Sulfuric acid has the chemical formula H₂SO₄.',
            'options': ['H₂SO₃', 'H₂SO₄', 'H₃SO₄', 'HSO₄'],
            'correct_idx': 1,
        },
        {
            'text': 'Which artist painted the Starry Night?',
            'explanation': 'Vincent van Gogh painted The Starry Night in 1889.',
            'options': ['Pablo Picasso', 'Vincent van Gogh', 'Claude Monet', 'Salvador Dalí'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the most spoken language in the world by native speakers?',
            'explanation': 'Mandarin Chinese has the most native speakers worldwide.',
            'options': ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'],
            'correct_idx': 2,
        },
        {
            'text': 'What is the speed of light in vacuum?',
            'explanation': 'The speed of light is approximately 299,792,458 meters per second.',
            'options': ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'],
            'correct_idx': 0,
        },
        {
            'text': 'Which country has the most islands in the world?',
            'explanation': 'Sweden has the most islands of any country, with over 50,000 islands.',
            'options': ['Finland', 'Sweden', 'Norway', 'Canada'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the only mammal capable of true flight?',
            'explanation': 'Bats are the only mammals capable of sustained flight.',
            'options': ['Flying squirrel', 'Flying fish', 'Bat', 'Flying lizard'],
            'correct_idx': 2,
        },
        {
            'text': 'How many bones are in the adult human body?',
            'explanation': 'An adult human typically has 206 bones.',
            'options': ['186', '196', '206', '216'],
            'correct_idx': 2,
        },
        {
            'text': 'What is the currency of India?',
            'explanation': 'The Indian Rupee (INR) is the official currency of India.',
            'options': ['Pound', 'Dollar', 'Euro', 'Indian Rupee'],
            'correct_idx': 3,
        },
        {
            'text': 'Which planet has the most moons?',
            'explanation': 'Jupiter has the most moons of any planet, with 95 known moons.',
            'options': ['Saturn', 'Jupiter', 'Neptune', 'Uranus'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the boiling point of water at sea level in Celsius?',
            'explanation': 'Water boils at 100°C (212°F) at standard sea level pressure.',
            'options': ['50°C', '75°C', '100°C', '125°C'],
            'correct_idx': 2,
        },
        {
            'text': 'What is the most abundant gas in Earth\'s atmosphere?',
            'explanation': 'Nitrogen (N₂) makes up about 78% of Earth\'s atmosphere.',
            'options': ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
            'correct_idx': 2,
        },
        {
            'text': 'Which Shakespeare play features the character Macbeth?',
            'explanation': 'Macbeth is both the title and main character of this tragedy.',
            'options': ['Hamlet', 'Othello', 'Macbeth', 'King Lear'],
            'correct_idx': 2,
        },
        {
            'text': 'What year did the Titanic sink?',
            'explanation': 'The RMS Titanic sank on April 15, 1912.',
            'options': ['1911', '1912', '1913', '1914'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the decimal representation of 1/8?',
            'explanation': '1 divided by 8 equals 0.125',
            'options': ['0.125', '0.25', '0.375', '0.5'],
            'correct_idx': 0,
        },
        {
            'text': 'Which element is represented by the symbol Fe?',
            'explanation': 'Iron has the chemical symbol Fe, from its Latin name "ferrum".',
            'options': ['Fluorine', 'Iron', 'Fermium', 'Francium'],
            'correct_idx': 1,
        },
    ],

    # ========================================================================
    # HARD QUESTIONS (15 total)
    # ========================================================================
    'hard': [
        {
            'text': 'What is the name of the process by which plants convert light into chemical energy?',
            'explanation': 'Photosynthesis is the process where plants use sunlight to produce glucose and oxygen.',
            'options': ['Respiration', 'Photosynthesis', 'Fermentation', 'Transpiration'],
            'correct_idx': 1,
        },
        {
            'text': 'Who wrote the novel "One Hundred Years of Solitude"?',
            'explanation': 'Gabriel García Márquez wrote this magical realist masterpiece in 1967.',
            'options': ['Jorge Luis Borges', 'Gabriel García Márquez', 'Pablo Coelho', 'Carlos Fuentes'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the approximate age of the Earth in billions of years?',
            'explanation': 'Earth is approximately 4.54 billion years old.',
            'options': ['2.5', '3.8', '4.54', '6.0'],
            'correct_idx': 2,
        },
        {
            'text': 'What is the name of the first artificial satellite launched by humans?',
            'explanation': 'Sputnik 1 was launched by the Soviet Union on October 4, 1957.',
            'options': ['Vostok 1', 'Sputnik 1', 'Explorer 1', 'Telstar'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the Riemann Hypothesis related to?',
            'explanation': 'The Riemann Hypothesis concerns the distribution of prime numbers.',
            'options': ['Geometry', 'Thermodynamics', 'Prime numbers', 'Quantum mechanics'],
            'correct_idx': 2,
        },
        {
            'text': 'Which enzyme is responsible for breaking down lactose in milk?',
            'explanation': 'Lactase is the enzyme that breaks down lactose into glucose and galactose.',
            'options': ['Amylase', 'Lactase', 'Protease', 'Lipase'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the name of the study of earthquakes and seismic waves?',
            'explanation': 'Seismology is the scientific study of earthquakes and seismic waves.',
            'options': ['Volcanology', 'Seismology', 'Geomorphology', 'Petrology'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the probability of rolling a sum of 7 with two fair six-sided dice?',
            'explanation': 'There are 6 ways to roll a 7 (1,6; 2,5; 3,4; 4,3; 5,2; 6,1) out of 36 possible outcomes.',
            'options': ['1/12', '1/8', '1/6', '1/4'],
            'correct_idx': 2,
        },
        {
            'text': 'What is the Turing Test used to evaluate?',
            'explanation': 'The Turing Test is used to evaluate machine intelligence and a machine\'s ability to exhibit intelligent behavior indistinguishable from a human.',
            'options': ['Computer speed', 'Memory capacity', 'Machine intelligence', 'Data compression'],
            'correct_idx': 2,
        },
        {
            'text': 'Who formulated the theory of relativity?',
            'explanation': 'Albert Einstein developed both the theories of special and general relativity.',
            'options': ['Isaac Newton', 'Albert Einstein', 'Stephen Hawking', 'Richard Feynman'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the main structural protein in human hair and nails?',
            'explanation': 'Keratin is the primary structural protein that makes up hair, nails, and the outer layer of skin.',
            'options': ['Collagen', 'Keratin', 'Elastin', 'Hemoglobin'],
            'correct_idx': 1,
        },
        {
            'text': 'In which year did the Berlin Wall fall?',
            'explanation': 'The Berlin Wall fell on November 9, 1989, symbolizing the end of the Cold War.',
            'options': ['1987', '1988', '1989', '1990'],
            'correct_idx': 2,
        },
        {
            'text': 'What is the name of the legendary sword of Arthurian legend?',
            'explanation': 'Excalibur is the legendary sword of King Arthur in Arthurian legend.',
            'options': ['Avalon', 'Excalibur', 'Merlin', 'Camelot'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the name of the theorem that relates the sides of a right triangle?',
            'explanation': 'The Pythagorean Theorem states that a² + b² = c² for right triangles.',
            'options': ['Euclidean Theorem', 'Pythagorean Theorem', 'Fermat\'s Theorem', 'Thales\' Theorem'],
            'correct_idx': 1,
        },
        {
            'text': 'What is the name of the process where a liquid turns into a gas?',
            'explanation': 'Evaporation is the process where liquid turns into vapor at the surface.',
            'options': ['Condensation', 'Evaporation', 'Sublimation', 'Deposition'],
            'correct_idx': 1,
        },
    ],
}


# ============================================================================
# SEEDING FUNCTION
# ============================================================================
def seed_questions():
    """
    Seed the database with quiz questions.
    Creates 15 easy, 15 medium, and 15 hard questions with their options.
    """
    print("Starting database seeding...")
    
    total_created = 0
    
    for difficulty, questions in QUESTIONS_DATA.items():
        print(f"\nCreating {len(questions)} {difficulty.upper()} questions...")
        
        for i, question_data in enumerate(questions, 1):
            # Create Question
            question = Question.objects.create(
                text=question_data['text'],
                difficulty=difficulty,
                explanation=question_data['explanation'],
            )
            
            # Create Options for this Question
            options = question_data['options']
            correct_idx = question_data['correct_idx']
            
            for order, option_text in enumerate(options):
                QuestionOption.objects.create(
                    question=question,
                    text=option_text,
                    is_correct=(order == correct_idx),
                    order=order,
                )
            
            print(f"   [OK] Question {i}/15: {question.text[:60]}...")
            total_created += 1
    
    print(f"\n[SUCCESS] Created {total_created} questions with {total_created * 4} options!")
    print(f"\nDatabase Summary:")
    print(f"   - Easy:   {Question.objects.filter(difficulty='easy').count()} questions")
    print(f"   - Medium: {Question.objects.filter(difficulty='medium').count()} questions")
    print(f"   - Hard:   {Question.objects.filter(difficulty='hard').count()} questions")
    print(f"   - Total:  {Question.objects.count()} questions")
    print(f"   - Options: {QuestionOption.objects.count()} total options")


# ============================================================================
# CLEAR EXISTING DATA (Optional)
# ============================================================================
def clear_questions():
    """
    Delete all existing questions and options.
    Use with caution!
    """
    count = Question.objects.count()
    Question.objects.all().delete()
    print(f"[INFO] Deleted {count} questions and their options")


# ============================================================================
# MAIN EXECUTION
# ============================================================================
if __name__ == '__main__':
    import sys
    
    # Check for command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == '--clear':
        response = input("[WARNING] Are you sure you want to delete all questions? (yes/no): ")
        if response.lower() == 'yes':
            clear_questions()
            print("Seeding fresh data...\n")
            seed_questions()
        else:
            print("Cancelled.")
    else:
        # Check if data already exists
        if Question.objects.exists():
            print("[ERROR] Questions already exist in the database!")
            response = input("Do you want to:\n  1) Skip seeding\n  2) Clear and reseed\n\nEnter choice (1 or 2): ")
            if response == '2':
                clear_questions()
                seed_questions()
            else:
                print("Skipped seeding.")
        else:
            seed_questions()
