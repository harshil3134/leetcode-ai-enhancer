# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import problem, user  # Add this line
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Dict
from langchain_core.output_parsers import PydanticOutputParser,StrOutputParser
import datetime
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
import json

load_dotenv()

app = FastAPI(title="LeetCode AI Assistant API", version="1.0.0")

# CORS middleware for Chrome extension
app.add_middleware(
   CORSMiddleware,
   allow_origins=["chrome-extension://*", "http://localhost:3000"],
   allow_credentials=True,
   allow_methods=["*"],
   allow_headers=["*"],
)


class ProblemData(BaseModel):
   title:str
   difficulty:str
   description:str
   id:str

class HintRequest(BaseModel):
   problem_data:ProblemData
   hint_level:int=1 #level 1,2,3,4,5

class explainRequest(BaseModel):
   chat:list[object]


class HintResponse(BaseModel):
   hint:dict
   problem_title:str
   timestamp:str

class ExplainRequest(BaseModel):
   question:str
   user_code:str

class ExplainResponse(BaseModel):
   explanation:str

class MultiLevelHint(BaseModel):
   problem_title:str
   hints:Dict[int,str]=Field(..., description="Hints for level 1-4, keys are 1,2,3,4")

@app.get("/")
def root():
   return {"message": "LeetCode AI Assistant API"}

@app.get("/health")
def health_check():
   return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/explain")
async def explain_que(request:explainRequest):
   try:  
         chat=request.chat
         chat_li=[]
         for msg in chat:
            if msg['sender']=="ai":
               chat_li.append(AIMessage(content=msg['text']))
            elif msg['sender']=="user":
               chat_li.append(HumanMessage(content=msg['text']))

         print("chat hist",chat_li)
         model = ChatGoogleGenerativeAI(
                  model="gemini-1.5-flash",
                  temperature=0,
                  max_output_tokens=100,
                  timeout=60,
                  max_retries=2,
         )  
         resp=model.invoke(chat_li)
         print("resp",resp.content)
         
         return ExplainResponse(
               explanation=resp.content
            )
   except Exception as e:
      print("An error occurred in /api/explain:", e)
      return JSONResponse(
         status_code=500,
         content={"error": "Failed to generate explanation", "details": str(e)}
      )



@app.post("/api/hint",response_model=HintResponse)
async def generate_hint(request:HintRequest):
   """Generate a progressive hint for the given problem"""

   try:
      problem=request.problem_data
      print("problem",problem,flush=True)
      prompt_template=ChatPromptTemplate(
      [
      ("system", 
     "You are a helpful coding tutor. "
     "Provide a progressive hint for a programming problem based on the requested hint level. "
     "Never give away the full solution. "
     "Hint levels: "
     "1 = Give a conceptual hint about the general approach or pattern needed. Don't mention specific algorithms or data structures yet. Focus on the key insight that leads to the solution. "
     "2 = Suggest the specific algorithm, data structure, or technique to use. Explain why this approach is suitable for this problem type. "
     "3 = Provide a step-by-step outline of the solution approach. Break down the algorithm into clear steps without giving code. "
     "4 = Give implementation hints including edge cases to consider, time/space complexity, and common pitfalls to avoid."
     "Respond ONLY with a valid JSON object in this format: "
       '{{"problem_title": "<title>", "hints": {{"1": "<hint1>", "2": "<hint2>", "3": "<hint3>", "4": "<hint4>"}}}}'
    ),
    ("human",""" 
Problem Titile: {title}
Difficulty: {difficulty}
Description: {description}


Give all level hints for this problem level 1,2,3,4
""")
         ]
      )
      print("Prompt template created.")
      model = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
             temperature=0,
             max_output_tokens=2012,
             timeout=60,
             max_retries=2,
      )
      parser=PydanticOutputParser(pydantic_object=MultiLevelHint)

      chain = prompt_template | model | parser

      result = chain.invoke({
    "title": problem.title,
    "difficulty": problem.difficulty,
    "description": problem.description
})
      print("Chain result:", result.hints)
      return HintResponse(
            hint=result.hints,
            problem_title=problem.title,
            timestamp=datetime.datetime.now().isoformat()
        )

   except Exception as e:
      print("An error occurred:",e)
   



      
