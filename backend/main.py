from fastapi import FastAPI, HTTPException, Depends, APIRouter, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timedelta
import os
import random
import string
import json
from dotenv import load_dotenv
from mangum import Mangum
import bcrypt
import uvicorn
# Import simple callable middleware instead of BaseHTTPMiddleware
from starlette.middleware import Middleware

# Load environment variables
load_dotenv()

# =========================
# Config Settings
# =========================
class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    MONGODB_URI = os.getenv("MONGODB_URI")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")
    OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")
    OPENAI_DEPLOYMENT_NAME = os.getenv("OPENAI_DEPLOYMENT_NAME", "gpt-35-turbo")

settings = Settings()

# =========================
# FastAPI Application Setup - DEFINE APP ONCE
# =========================
app = FastAPI(title="Coding Contest Platform API with Plagiarism Detection")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://project-frontend-nine-mocha.vercel.app/","http://localhost:3000", "*"],  # Use specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def read_root():
    return JSONResponse(content={"message": "Hello from FastAPI on Vercel!"})


# Debug middleware to log requests - using a simple middleware function instead of class
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response Status: {response.status_code}")
    return response

# =========================
# Database Setup
# =========================
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "coding_platform")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

# Database collections
users_collection = db["users"]
contests_collection = db["contests"]
submissions_collection = db["submissions"]
codes_collection = db["codes"]  # For plagiarism check submissions

def get_db():
    return db

def init_db():
    print("Database initialized")

# =========================
# OpenAI Setup
# =========================
try:
    from openai import AzureOpenAI
    
    openai_api_key = settings.OPENAI_API_KEY
    openai_endpoint = settings.OPENAI_ENDPOINT
    openai_api_version = settings.OPENAI_API_VERSION
    
    if all([openai_api_key, openai_endpoint, openai_api_version]):
        openai_client = AzureOpenAI(
            api_key=openai_api_key,
            api_version=openai_api_version,
            azure_endpoint=openai_endpoint
        )
        print("Azure OpenAI client initialized successfully!")
    else:
        openai_client = None
        print("OpenAI environment variables missing - AI features disabled")
except Exception as e:
    print(f"Error initializing OpenAI: {e}")
    openai_client = None

# =========================
# Security Functions
# =========================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    return {"email": email, "role": user["role"]}
    
# =========================
# Helper Functions
# =========================
def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# Mock function for when OpenAI is not available
def generate_mock_analysis(code, language):
    return {
        "plagiarism_detected": False,
        "confidence_score": 75,
        "likely_source": "Original student work",
        "explanation": "This is a mock analysis as OpenAI is unavailable",
        "suspicious_elements": [],
        "red_flags": [],
        "verification_questions": ["Can you explain how this code works?"],
        "recommendations": ["Add more comments to improve readability"],
        "evaluation_metrics": {
            "code_correctness": {
                "status": "Passed",
                "test_cases": "5",
                "failed_cases": "0"
            },
            "code_efficiency": {
                "time_complexity": "O(n)",
                "memory_usage": "8MB",
                "execution_time": "100ms"
            },
            "code_security": {
                "issues_found": [],
                "recommendations": []
            },
            "code_readability": {
                "score": 7.5,
                "suggestions": ["Add more documentation"]
            }
        }
    }

# =========================
# Model Classes
# =========================
class UserModel(BaseModel):
    email: EmailStr
    username: str
    hashed_password: str
    role: Literal["teacher", "student"]
    created_at: datetime = datetime.utcnow()

class SubmissionModel(BaseModel):
    contest_id: str
    student_email: str
    question_title: str
    code: str
    language: str
    submitted_at: datetime = datetime.utcnow()

class ContestModel(BaseModel):
    teacher_email: str
    title: str
    description: str
    contest_code: str = Field(default_factory=generate_code)
    is_active: bool = False
    questions: List[dict] = []

# =========================
# Schema Classes
# =========================
class Question(BaseModel):
    title: str
    description: str
    sample_input: str
    sample_output: str

class ContestCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    questions: List[Question]

class ContestOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    is_active: bool
    questions: List[Question]

class QuestionCreate(BaseModel):
    contest_id: str
    title: str
    description: str
    sample_input: str
    sample_output: str

class SubmissionCreate(BaseModel):
    contest_id: str
    question_title: str
    code: str
    language: str

class SubmissionOut(BaseModel):
    contest_id: str
    student_email: str
    question_title: str
    code: str
    language: str
    submitted_at: str

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: Literal["teacher", "student"]

class UserOut(BaseModel):
    email: EmailStr
    username: str
    role: str
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["teacher", "student"]

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str
    email: str

class CodeSubmission(BaseModel):
    code: str
    language: str
    course_level: Optional[str] = None
    assignment_description: Optional[str] = None
    student_id: Optional[str] = None
    assignment_id: Optional[str] = None
    previous_submissions: Optional[List[str]] = None

# =========================
# Auth Router
# =========================
auth_router = APIRouter()

@auth_router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = UserModel(
        email=user.email,
        username=user.username,
        hashed_password=get_password_hash(user.password),
        role=user.role,
    ).dict()

    await users_collection.insert_one(user_dict)
    
    # Generate access token with role information
    token_data = {
        "sub": user.email,
        "role": user.role
    }
    
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
        "email": user.email
    }

@auth_router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = await users_collection.find_one({"email": login_data.email, "role": login_data.role})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {
        "sub": user["email"],
        "role": user["role"]
    }

    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
        "email": user["email"]
    }

# =========================
# Contest Router
# =========================
contest_router = APIRouter()

@contest_router.post("/create")
async def create_contest(contest: ContestCreate, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    role = current_user["role"]
    
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create contests")
    
    model = ContestModel(
        teacher_email=email,
        title=contest.title,
        description=contest.description,
        questions=[q.dict() for q in contest.questions]
    )
    result = await contests_collection.insert_one(model.dict())
    return {
        "id": str(result.inserted_id),
        "contest_code": model.contest_code
    }

@contest_router.post("/start/{contest_id}")
async def start_contest(contest_id: str, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    role = current_user["role"]
    
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can start contests")
    
    updated = await contests_collection.update_one(
        {"_id": ObjectId(contest_id), "teacher_email": email},
        {"$set": {"is_active": True}}
    )
    if updated.modified_count == 0:
        raise HTTPException(404, "Contest not found or you don't have permission")
    return {"message": "Contest started"}

@contest_router.post("/end/{contest_id}")
async def end_contest(contest_id: str, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    role = current_user["role"]
    
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can end contests")
    
    updated = await contests_collection.update_one(
        {"_id": ObjectId(contest_id), "teacher_email": email},
        {"$set": {"is_active": False}}
    )
    if updated.modified_count == 0:
        raise HTTPException(404, "Contest not found or you don't have permission")
    return {"message": "Contest ended"}

@contest_router.get("/all")
async def get_all_contests(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    
    try:
        if role == "teacher":
            # Teachers can see all contests
            contests_cursor = contests_collection.find()
        else:
            # Students can only see active contests
            contests_cursor = contests_collection.find({"is_active": True})
        
        contests = await contests_cursor.to_list(length=None)
        
        for contest in contests:
            contest["id"] = str(contest["_id"])
            del contest["_id"]
        
        return contests
    except Exception as e:
        print(f"Error fetching all contests: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch contests: {str(e)}")

@contest_router.get("/active")
async def get_active_contests():
    try:
        contests_cursor = contests_collection.find({"is_active": True})
        contests = await contests_cursor.to_list(length=None)
        
        for c in contests:
            c["id"] = str(c["_id"])
            del c["_id"]
        
        return contests
    except Exception as e:
        print(f"Error fetching active contests: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch active contests: {str(e)}")

@contest_router.get("/by-code/{code}")
async def get_contest_by_code(code: str, current_user: dict = Depends(get_current_user)):
    try:
        # Find contest by code (case-insensitive)
        code_upper = code.upper()
        contest = await contests_collection.find_one({"contest_code": code_upper})
        
        if not contest:
            raise HTTPException(status_code=404, detail=f"Contest with code '{code}' not found")
        
        # Convert ObjectId to string
        contest["id"] = str(contest["_id"])
        del contest["_id"]
        
        return contest
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error fetching contest by code: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch contest: {str(e)}")

@contest_router.get("/teacher/mycontest")
async def get_teacher_contests(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    role = current_user["role"]
    
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        contests_cursor = contests_collection.find({"teacher_email": email})
        contests = await contests_cursor.to_list(length=None)
        
        for c in contests:
            c["id"] = str(c["_id"])
            del c["_id"]
            
        return contests
    except Exception as e:
        print(f"Error fetching teacher contests: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch contests: {str(e)}")

# =========================
# Questions Router
# =========================
questions_router = APIRouter()
       
@app.get("/protected")
async def protected_route(current_user: dict = Depends(Token)):
    return {"message": "Access granted", "user": current_user}

@questions_router.post("/add")
async def add_question(data: QuestionCreate, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    role = current_user["role"]
    
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can add questions")
    
    # First verify the contest belongs to the teacher
    contest = await contests_collection.find_one({"_id": ObjectId(data.contest_id)})
    if not contest or contest.get("teacher_email") != email:
        raise HTTPException(status_code=403, detail="Not authorized to modify this contest")
    
    update_result = await contests_collection.update_one(
        {"_id": ObjectId(data.contest_id)},
        {"$push": {
            "questions": {
                "title": data.title,
                "description": data.description,
                "sample_input": data.sample_input,
                "sample_output": data.sample_output,
            }
        }}
    )

    if update_result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Contest not found or update failed")

    return {"message": "Question added"}

# =========================
# Submissions Router
# =========================
submissions_router = APIRouter()

@submissions_router.post("/submit")
@submissions_router.post("/submit")
async def submit_code(sub: SubmissionCreate, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    role = current_user["role"]

    contest = await contests_collection.find_one({"_id": ObjectId(sub.contest_id)})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")

    if not contest.get("is_active", False):
        raise HTTPException(status_code=400, detail="Contest is not active")

    question_exists = False
    question_description = ""
    for q in contest.get("questions", []):
        if q.get("title") == sub.question_title:
            question_exists = True
            question_description = q.get("description", "")
            break

    if not question_exists:
        raise HTTPException(status_code=404, detail="Question not found in contest")

    sub_data = SubmissionModel(
        contest_id=sub.contest_id,
        student_email=email,
        question_title=sub.question_title,
        code=sub.code,
        language=sub.language
    ).dict()

    result = await submissions_collection.insert_one(sub_data)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to save submission")

    if not openai_client:
        return {
            "id": "mock-123",
            "message": "Submission successful (mock mode)",
            "plagiarism_analysis": generate_mock_analysis(sub.code, sub.language)
        }

    try:
        code_submission = CodeSubmission(
            code=sub.code,
            language=sub.language,
            assignment_description=question_description,
            student_id=email,
            assignment_id=f"{sub.contest_id}_{sub.question_title}"
        )

        system_prompt = """
        [Insert full prompt here as string literal from earlier version for clarity]
        """

        user_message = f"""
Analyze this code for plagiarism and evaluate it based on the following parameters:

{sub.code}

*Context*:
- Language: {sub.language}
- Course Level: Not provided
- Assignment Description: {question_description or "Not provided"}

*Instructions*:
1. Validate the input to ensure it is valid code in the specified programming language.
2. If the input is not valid code, return a response indicating that no analysis can be performed.
3. If the input is valid code, break down the code into sections and analyze each part for plagiarism.
4. Provide a confidence score (0-100) for your assessment.
5. Highlight specific lines or blocks of code that are suspicious.
6. Evaluate the code based on the following parameters:
   - Code Correctness: Check if the code executes correctly and handles exceptions.
   - Code Efficiency: Estimate time complexity, memory usage, and execution time.
   - Code Security: Detect vulnerabilities such as SQL injection, XSS, and hardcoded secrets.
   - Code Readability: Assess code style, documentation, and naming conventions.
7. Suggest follow-up questions to verify the student's understanding.
8. Provide recommendations for improving originality, security, and code quality.

*Output Format*:
Your response should be in the structured JSON format provided in the system prompt.
"""

        response = openai_client.chat.completions.create(
            model=settings.OPENAI_DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.2
        )

        plagiarism_result = json.loads(response.choices[0].message.content)

        submission_data = code_submission.dict()
        submission_data.update({
            "plagiarism_analysis": plagiarism_result,
            "submission_timestamp": datetime.utcnow(),
            "submitter_email": email,
            "contest_id": sub.contest_id,
            "question_title": sub.question_title
        })

        try:
            result = await codes_collection.insert_one(submission_data)
            return {
                "message": "Submission successful",
                "submission_id": str(result.inserted_id),
                "plagiarism_analysis": plagiarism_result
            }
        except Exception as e:
            return {
                "message": "Submission successful",
                "submission_id": None,
                "plagiarism_analysis": plagiarism_result,
                "storage_error": f"Failed to save to database: {str(e)}"
            }

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse plagiarism analysis result")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plagiarism detection error: {str(e)}")

@submissions_router.get("/by-contest/{contest_id}")
async def get_submissions(contest_id: str, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    role = current_user["role"]
    
    # Get contest to check if user is the teacher
    contest = await contests_collection.find_one({"_id": ObjectId(contest_id)})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
    
    # If teacher, show all submissions for the contest
    # If student, show only their own submissions
    filter_query = {"contest_id": contest_id}
    
    if role != "teacher" or contest.get("teacher_email") != email:
        filter_query["student_email"] = email
    
    subs_cursor = submissions_collection.find(filter_query)
    subs = await subs_cursor.to_list(length=None)

    for s in subs:
        if "_id" in s:
            s["id"] = str(s["_id"])
            del s["_id"]
        if "submitted_at" in s:
            s["submitted_at"] = s["submitted_at"].isoformat()

    return subs

# =========================
# Plagiarism Router
# =========================


plagiarism_router = APIRouter()

@plagiarism_router.post("/check")
async def check_plagiarism(submission: CodeSubmission, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    role = current_user["role"]
    
    if not openai_client:
        mock_analysis = generate_mock_analysis(submission.code, submission.language)
        return {
            "id": "mock-123",
            "plagiarism_analysis": mock_analysis
        }
    try:
        
        # Enhanced system prompt for plagiarism detection and code evaluation
        system_prompt = """
You are an advanced, highly trained AI model specialized in detecting plagiarism in code submissions. Your expertise includes identifying AI-generated code, copied code from online sources, and assessing the originality of student work. Your analysis must be thorough, precise, and context-aware. Follow these guidelines:

---

### *Key Responsibilities*

1. *Validate Input*:
   - Check if the input is valid code in the specified programming language.
   - If the input is not valid code, return a response indicating that no analysis can be performed.

2. *Detect AI-Generated Code*:
   - Identify patterns typical of AI-generated code (e.g., ChatGPT, Claude, GitHub Copilot).
   - Look for overly consistent formatting, excessive or unnatural comments, and generic variable/function names.
   - Detect code that is overly optimized or uses advanced techniques inconsistent with the student's course level.
   - Flag code that lacks common mistakes or shows an unnatural level of perfection.

3. *Identify Copied Code*:
   - Recognize code snippets copied from common online sources (e.g., Stack Overflow, GitHub, GeeksforGeeks).
   - Compare the code against known algorithms, functions, or solutions from tutorials or public repositories.
   - Detect inconsistent coding styles, mixed conventions, or abrupt changes in logic that suggest multiple sources.
   - Use contextual clues (e.g., comments, variable names) to trace potential sources.

4. *Assess Originality*:
   - Evaluate the likelihood that the code was written by the student based on the course level and assignment description.
   - Identify common mistakes, incomplete implementations, or lack of understanding in the code.
   - Check for code that is too simplistic, overly generic, or lacks originality.
   - Consider the student's coding style, if previously available, for consistency.

5. *Provide Detailed Analysis*:
   - Break down the code into logical sections (e.g., functions, loops, classes) and analyze each part for plagiarism.
   - Provide a confidence score (0-100) for your assessment, considering the strength of evidence.
   - Highlight specific lines or blocks of code that are suspicious, with clear explanations.

6. *Generate Recommendations*:
   - Suggest follow-up questions to verify the student's understanding of the code.
   - Provide actionable recommendations for improving the originality and quality of the code.

---

### *Evaluation Parameters*

Your analysis should also consider the following evaluation parameters from the AI-based Code Evaluator:

1. *Code Correctness*:
   - Check if the code executes correctly without errors.
   - Verify if the code handles exceptions properly.
   - Compare expected vs. actual output for given test cases.

2. *Code Efficiency & Performance*:
   - Estimate time complexity using Big-O notation.
   - Measure memory consumption and execution time.
   - Identify performance bottlenecks.

3. *Code Security Analysis*:
   - Detect SQL injection vulnerabilities.
   - Check for cross-site scripting (XSS) risks.
   - Identify hardcoded secrets (e.g., API keys, passwords).
   - Scan for outdated or vulnerable dependencies.

4. *Code Readability & Maintainability*:
   - Assess code style and documentation.
   - Evaluate function and variable naming conventions.
   - Analyze cyclomatic complexity and suggest improvements.

5. *Plagiarism Detection & Code Similarity Analysis*:
   - Perform exact code matching using hashes.
   - Analyze structural similarity using AST (Abstract Syntax Tree).
   - Use NLP-based similarity detection (e.g., SimHash, MinHash) to detect paraphrased code.

---

### *Output Format*

Your response must be a structured JSON object with the following fields:

json
{
    "is_valid_code": true/false,
    "plagiarism_detected": true/false,
    "confidence_score": 0-100,
    "likely_source": "AI-generated" or "Online resource" or "Original student work",
    "explanation": "Detailed reasoning for your conclusion",
    "suspicious_elements": [
        {
            "code_section": "Specific lines or blocks of code",
            "likely_source": "AI-generated" or "Online resource",
            "confidence": 0-100,
            "explanation": "Why this section is suspicious"
        }
    ],
    "red_flags": [
        "List of key concerns (e.g., inconsistent style, advanced techniques, lack of originality)"
    ],
    "verification_questions": [
        "Suggested questions to ask the student to verify authorship"
    ],
    "recommendations": [
        "Suggestions for improving originality and understanding"
    ],
    "evaluation_metrics": {
        "code_correctness": {
            "status": "Passed/Failed",
            "test_cases": "Number of test cases executed",
            "failed_cases": "Number of failed test cases"
        },
        "code_efficiency": {
            "time_complexity": "O(n log n)",
            "memory_usage": "12MB",
            "execution_time": "120ms"
        },
        "code_security": {
            "issues_found": ["SQL Injection", "Hardcoded API Key"],
            "recommendations": ["Use parameterized queries", "Store API keys securely"]
        },
        "code_readability": {
            "score": 8.5,
            "suggestions": ["Improve documentation"]
        }
    }
}
"""
        # User message with context
        user_message = f"""
Analyze this code for plagiarism and evaluate it based on the following parameters:

{submission.code}

*Context*:
- Language: {submission.language}
- Course Level: {submission.course_level if submission.course_level else "Not provided"}
- Assignment Description: {submission.assignment_description if submission.assignment_description else "Not provided"}

*Instructions*:
1. Validate the input to ensure it is valid code in the specified programming language.
2. If the input is not valid code, return a response indicating that no analysis can be performed.
3. If the input is valid code, break down the code into sections and analyze each part for plagiarism.
4. Provide a confidence score (0-100) for your assessment.
5. Highlight specific lines or blocks of code that are suspicious.
6. Evaluate the code based on the following parameters:
   - Code Correctness: Check if the code executes correctly and handles exceptions.
   - Code Efficiency: Estimate time complexity, memory usage, and execution time.
   - Code Security: Detect vulnerabilities such as SQL injection, XSS, and hardcoded secrets.
   - Code Readability: Assess code style, documentation, and naming conventions.
7. Suggest follow-up questions to verify the student's understanding.
8. Provide recommendations for improving originality, security, and code quality.

*Output Format*:
Your response should be in the structured JSON format provided in the system prompt.
"""
        try:
            response = openai_client.chat.completions.create(
                model=settings.OPENAI_DEPLOYMENT_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            plagiarism_result = json.loads(response.choices[0].message.content)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")

        submission_data = submission.dict()
        submission_data["plagiarism_analysis"] = plagiarism_result
        submission_data["submission_timestamp"] = datetime.utcnow()
        submission_data["submitter_email"] = email
        submission_data["submitter_role"] = role

        try:
            result = await codes_collection.insert_one(submission_data)
            return {
                "id": str(result.inserted_id),
                "plagiarism_analysis": plagiarism_result
            }
        except Exception as e:
            return {
                "id": None,
                "plagiarism_analysis": plagiarism_result,
                "storage_error": f"Failed to save to database: {str(e)}"
            }
            
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse plagiarism analysis result")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plagiarism detection error: {str(e)}")
# =========================
# Root endpoint
# =========================
@app.get("/")
async def root():
    try:
        await db.command('ping')
        db_status = "Connected"
    except Exception as e:
        db_status = f"Disconnected: {str(e)}"
    
    openai_status = "Available" if openai_client else "Unavailable"
    
    return JSONResponse(content={
        "message": "Coding Contest Platform API with Plagiarism Detection",
        "status": {
            "mongodb": db_status,
            "openai": openai_status
        }
    })

# Initialize database
init_db()

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(contest_router, prefix="/contest", tags=["Contests"])
app.include_router(questions_router, prefix="/questions", tags=["Questions"])
app.include_router(submissions_router, prefix="/submissions", tags=["Submissions"])
app.include_router(plagiarism_router, prefix="/plagiarism", tags=["Plagiarism"])

# For Vercel/AWS Lambda deployment
handler = Mangum(app)

# For running locally
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)