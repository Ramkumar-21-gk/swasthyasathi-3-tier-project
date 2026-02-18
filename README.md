### cd background
-> npm run dev

### Run image
->  docker run -it  -p 5001:5000  -e LT_DISABLE_WEB_UI=true  -e LT_CORS_ALLOWED_ORIGINS="*"  -e LT_LOAD_ONLY="en,hi"  libretranslate/libretranslate

### cd AIChatbot
Pip install :
pip install groq
pip install python-dotenv
pip install fastapi
pip install uvicorn
pip install python-multipart pydub speechrecognition
pip install elevenlabs
pip install gtts
->.envfile  
  GROQ_API_KEY=""
  ELEVENLABS_API_KEY=""
uvicorn app:app --reload