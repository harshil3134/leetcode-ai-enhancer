# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Dict
from langchain_core.output_parsers import PydanticOutputParser,StrOutputParser
from langchain.schema.runnable import RunnableBranch, RunnableLambda
import datetime
from dotenv import load_dotenv
from langchain_core.prompts import MessagesPlaceholder
from fastapi.responses import JSONResponse
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
import json
import traceback
from groq import Groq
from langchain_groq import ChatGroq
import os

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
   problem:str
   code:str


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
        chat = request.chat
        problem = request.problem
        code = request.code
        print(problem)
        chat_history = []
        for msg in chat:
            if msg['sender'] == "ai":
                chat_history.append(AIMessage(content=msg['text']))
            elif msg['sender'] == "user":
                chat_history.append(HumanMessage(content=msg['text']))
        print("chat hist", chat_history)
        # Try LangChain Groq (Llama-3.1-8b-instant)
        try:
            model = ChatGroq(
                model="llama-3.1-8b-instant",
                api_key=os.getenv("GROQ_API_KEY"),
                temperature=0.3,
                max_tokens=600,
                timeout=60,
                max_retries=2,
            )
            print("using groq")
        except Exception as groq_e:
            print("Groq failed, falling back to Google Gemini:", groq_e)
            # Fallback to Google Gemini
            model = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                temperature=0.3,
                max_output_tokens=600,
                timeout=60,
                max_retries=2,
            )
         

        que = chat_history.pop()
        question = que.content
        
        prompt_with_code = ChatPromptTemplate([
            ('system', """You are a helpful coding assistant. 
            For greetings, reply briefly and friendly. 
            For coding questions, provide clear explanations. 
            Analyze the provided code and give detailed feedback.
            
            Problem Context: {problem}"""),
            MessagesPlaceholder(variable_name='chat_history',optional=True),
            ('human', 'Question: {question}\n\nCode to analyze:\n{code}')
        ])
        
        prompt_without_code = ChatPromptTemplate([
            ('system', """You are a helpful coding assistant. 
            For greetings, reply briefly and friendly. 
            For coding questions, provide clear explanations. 
            Keep responses concise unless detailed help is requested.
            
            Problem Context: {problem}"""),
            MessagesPlaceholder(variable_name='chat_history'),
            ('human', '{question}')
        ])
        #pre check
        precheck_prompt=ChatPromptTemplate([
           ('system',"""You are a strict binary classifier.
               Task: Decide if answering the user’s question requires analyzing the user’s code.
               Rules:
               - Output only `1` if the question asks for debugging, fixing, improving, or explaining code.
               - Output only `0` if the question is general (e.g., greetings, casual chat, theory, definitions, or anything not directly about the code).
               Answer format: Return only a single character: `1` or `0`. No explanation.
               """),
           ('human','{question}')
        ])
        def process_with_code(inputs):
            return prompt_with_code.invoke({
                "problem": inputs["problem"],
                "chat_history": inputs["chat_history"],
                "question": inputs["question"],
                "code": inputs["code"]
            })
        
        def process_without_code(inputs):
            return prompt_without_code.invoke({
                "problem": inputs["problem"],
                "chat_history": inputs["chat_history"],
                "question": inputs["question"]
            })
        

        def needs_code_check(inputs):
            precheck_result=(precheck_prompt| model).invoke({"question":inputs['question']})
            needs_code=str(precheck_result.content).strip()
            print(f"Pre-check result: '{needs_code}'")
            return needs_code == "1"
        
        branch_chain=RunnableBranch(
            (needs_code_check,RunnableLambda(process_with_code) | model),
            RunnableLambda(process_without_code) | model
        )           
        inputs={
            "problem": problem,
            "chat_history": chat_history,
            "question": question,
            "code": code
         }
        result = branch_chain.invoke(inputs)
        print("Final resp", result)
        print("Final resp content", result.content)
        return ExplainResponse(explanation=result.content)
    except Exception as e:
        print("An error occurred in /api/explain:", e)
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to generate explanation", "details": str(e)}
        )



@app.post("/api/hint",response_model=HintResponse)
async def generate_hint(request:HintRequest):
   """Generate a progressive hint for the given problem"""

   try:
      problem=request.problem_data
      #print("problem",problem,flush=True)
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





