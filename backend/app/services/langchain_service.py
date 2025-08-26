from langchain_google_genai import ChatGoogleGenerativeAI  
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from dotenv import load_dotenv
import os
load_dotenv()

class LangChainService:
    def __init__(self):
        self.llm=ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3
        )
        self.hint_chain = self._create_hint_chain()
    def _create_hint_chain(self):
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a coding tutor. Provide progressive hints for programming problems."),
            ("human", """
            Problem: {title}
            Difficulty: {difficulty}
            Description: {description}
            Hint Level: {hint_level}
            
            Generate a level {hint_level} hint (1=conceptual, 2=algorithm, 3=implementation, 4=detailed).
            """)
        ])
        
        return LLMChain(llm=self.llm, prompt=prompt)
    
    async def generate_hint(self, problem_data: dict, hint_level: int) -> str:
        response = await self.hint_chain.arun(
            title=problem_data["title"],
            difficulty=problem_data["difficulty"],
            description=problem_data["description"],
            hint_level=hint_level
        )
        return response    