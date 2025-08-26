import asyncio
from app.services.langchain_service import LangChainService

async def test_hint_generation():
    service = LangChainService()
    
    # Test problem data
    problem_data = {
        "title": "Two Sum",
        "difficulty": "Easy",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
    }
    
    # Test hint generation
    hint = await service.generate_hint(problem_data, hint_level=1)
    print(f"Generated hint: {hint}")

# Run the test
if __name__ == "__main__":
    asyncio.run(test_hint_generation())