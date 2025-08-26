import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Dict
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser

# Load environment variables from .env
load_dotenv()

# Define the Pydantic model for multi-level hints
class MultiLevelHint(BaseModel):
    problem_title: str
    hints: Dict[str, str] = Field(..., description="Hints for level 1-4, keys are '1','2','3','4'")

def main():
    # Example problem data
    problem = {
        "title": "Add Two Numbers",
        "difficulty": "Medium",
        "description": (
            "You are given two non-empty linked lists representing two non-negative integers. "
            "The digits are stored in reverse order, and each of their nodes contains a single digit. "
            "Add the two numbers and return the sum as a linked list."
        )
    }

    # Create the prompt template with placeholders
    prompt_template = ChatPromptTemplate([
       ("system", 
    "You are a helpful coding tutor. "
    "Provide hints for all 4 levels as a JSON object. "
    "Never give away the full solution. "
    "Hint levels: "
    "1 = Conceptual, "
    "2 = Algorithm/data structure, "
    "3 = Step-by-step outline, "
    "4 = Implementation details and edge cases. "
    'Output format: {{"problem_title": ..., "hints": {{"1": ..., "2": ..., "3": ..., "4": ...}}}}'
),
        ("human", 
""" 
Problem Title: {title}
Difficulty: {difficulty}
Description: {description}

Generate hints for all 4 levels.
""")
    ])

    # Initialize the Gemini model
    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
        max_output_tokens=2012,
        timeout=60,
        max_retries=2,
    )

    # Set up the output parser
    parser = PydanticOutputParser(pydantic_object=MultiLevelHint)

    # Compose the chain
    chain = prompt_template | model | parser

    # Run the chain with the problem data
    print("Generating hints...")
    prompt = prompt_template.invoke({
        "description": problem["description"],
        "difficulty": problem["difficulty"],
        "title": problem["title"],
})
    print('prompt',prompt)
    res=model.invoke(prompt)
    print('res',res.content)

    # print("\n=== Multi-Level Hints ===")
    # print(f"Problem: {res.problem_title}")
    # for level in ["1", "2", "3", "4"]:
    #     print(f"Level {level} Hint: {res.hints.get(level, '[Missing]')}")

if __name__ == "__main__":
    main()