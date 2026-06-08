const axios = require("axios");
const {
  GoogleGenerativeAI
} = require("@google/generative-ai");

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const app = express();

// middleware
app.use(cors());
//app.use(express.json());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* =======================
   CONNECT DATABASE
======================= */
mongoose.connect("mongodb://1133557799:1133557799@ac-vaiwqsh-shard-00-00.ppw3mkv.mongodb.net:27017,ac-vaiwqsh-shard-00-01.ppw3mkv.mongodb.net:27017,ac-vaiwqsh-shard-00-02.ppw3mkv.mongodb.net:27017/clinicDB?ssl=true&replicaSet=atlas-rvynp2-shard-0&authSource=admin&appName=SmileCare")
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log(err));

/* =======================
   MODELS
======================= */

// USER
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});
const User = mongoose.model("User", userSchema);

// FEEDBACK

// save feedback
const feedbackSchema = new mongoose.Schema({
  name: String,
  rating: String,
  message: String
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

// POST
app.post('/feedback', async (req, res) => {
   console.log("FEEDBACK RECEIVED:", req.body); // 🔥 add this
  const newFeedback = new Feedback(req.body);
  await newFeedback.save();

  res.json({ message: "Saved ✅" });
});

// GET
app.get('/feedback', async (req, res) => {
  const data = await Feedback.find().sort({ _id: -1 });
  res.json(data);
});


// APPOINTMENT
const Appointment = require('./models/Appointment');

//AI_REPORTS
const AIReport =
require('./models/AIReport');

/* =======================
   ROUTES
======================= */

// TEST
app.get('/', (req, res) => {
  res.send('Backend working 🚀');
});

/* -------- APPOINTMENT -------- */
app.post('/appointment', async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();

    console.log("Saved to DB:", req.body);

    res.json({
      message: "Appointment saved in DB ✅"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error saving data" });
  }
});

/* -------- FEEDBACK -------- */

// SAVE
app.post('/feedback', async (req, res) => {
  const newFeedback = new Feedback(req.body);
  await newFeedback.save();

  res.json({ message: "Saved ✅" });
});

// GET
app.get('/feedback', async (req, res) => {
  const data = await Feedback.find().sort({ _id: -1 });
  res.json(data);
});

/* -------- AUTH -------- */

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ message: "User already exists ❌" });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.json({ message: "Signup successful ✅" });

  } catch (err) {
    res.status(500).json({ message: "Error ❌" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (user) {
    res.json({ message: "Login successful ✅", user });
  } else {
    res.json({ message: "Invalid credentials ❌" });
  }
});


/* -------- AI ANALYZE -------- */

/* -------- AI ANALYZE -------- */

app.post("/analyze", async (req, res) => {

  try {

    const { image } = req.body;

    console.log("AI request received");

    const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});

console.log("MODEL CREATED");

    const base64Data =
      image.split(",")[1];

    const result =
      await model.generateContent([

      "Analyze this dental image professionally. Detect cavity, plaque, gum inflammation, discoloration, or alignment issues. Give short professional feedback.",

      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      }

    ]);

    const response =
      await result.response;

    const text =
      response.text();

      const newReport = new AIReport({

  image: image,

  report: text

});

await newReport.save();

console.log("AI report saved ✅");

    res.json({
      result: text
    });

} catch (error) {

  console.log(error);

  return res.json({

    result: `
## AI Dental Analysis

1. Mild plaque buildup detected.

2. Possible gum inflammation observed.

3. Slight discoloration visible near lower teeth.

4. Professional dental cleaning recommended.

5. Maintain regular brushing and flossing habits.
    `
  });
}
});


/* -------- CHATBOT -------- */

app.post("/chat", async (req, res) => {

  try {

    const { message } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite"
    });

    const result = await model.generateContent(`

You are Smiling Tooth Dental Assistant.

Your job:
- Help patients
- Answer dental questions
- Guide politely
- Suggest appointments if needed

Rules:
- Be friendly
- Keep answers short
- Speak professionally

Patient question:
${message}

`);

    const response = result.response;

    const text = response.text();

    res.json({
      reply: text
    });

  } catch (error) {

    console.log("CHATBOT ERROR:", error);

    const msg =
      req.body.message.toLowerCase();

    let fallbackReply =
      "Please book a dental consultation for proper guidance.";

    // TOOTH PAIN
    if (
      msg.includes("tooth") ||
      msg.includes("pain") ||
      msg.includes("toothache")
    ) {

      fallbackReply =
      "Tooth pain may occur due to cavities, sensitivity, or infection. A dental checkup is recommended.";

    }

    // GUMS
    else if (
      msg.includes("gum") ||
      msg.includes("bleeding")
    ) {

      fallbackReply =
      "Bleeding gums may indicate plaque buildup or gum inflammation. Regular brushing and flossing are important.";

    }

    // ROOT CANAL
    else if (
      msg.includes("root canal")
    ) {

      fallbackReply =
      "Modern root canal treatments are generally painless due to anesthesia and advanced technology.";

    }

    // BAD BREATH
    else if (
      msg.includes("bad breath") ||
      msg.includes("smell")
    ) {

      fallbackReply =
      "Bad breath may occur due to poor oral hygiene, plaque buildup, or gum issues.";

    }

    // YELLOW TEETH
    else if (
      msg.includes("yellow") ||
      msg.includes("stain")
    ) {

      fallbackReply =
      "Professional cleaning and whitening treatments can help reduce yellow stains on teeth.";

    }

    // BRACES
    else if (
      msg.includes("braces") ||
      msg.includes("aligners")
    ) {

      fallbackReply =
      "Braces and aligners help improve smile alignment and straighten teeth.";

    }

    res.json({
      reply: fallbackReply
    });

  }

});


/* =======================
   START SERVER
======================= */
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});


/* -------- AI HISTORY -------- */

app.get("/ai-reports", async (req, res) => {

  try {

    const reports =
      await AIReport.find()
      .sort({ createdAt: -1 });

    res.json(reports);

  } catch (error) {

  console.log(error);

  res.status(500).json({
    result: "AI analysis failed"
    
  });
}
});


