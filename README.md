# Math Notes


## 📝 Overview

Math Notes is an interactive web application that allows users to draw and solve mathematical equations and expressions in real-time. Using a combination of drawing capabilities and AI-powered equation solving, this tool helps students, educators, and math enthusiasts quickly work through mathematical problems with visual feedback.

## ✨ Features

- **Interactive Drawing Canvas:** Write or draw mathematical expressions with customizable pen tools
- **Real-time Equation Solving:** Get instant solutions to your handwritten math problems
- **Customization Options:**
  - Adjustable pen size and color
  - Eraser tool with variable size
  - Undo/Redo functionality
  - Grid display toggle
- **Save & Share:** Export your work or share it with others
- **Responsive Design:** Works on various screen sizes and devices

## 🧠 Technology Stack

### Frontend
- React.js with Vite
- Tailwind CSS for styling
- React components for drawing and UI controls
- Mathematical expression rendering and processing

### Backend
- Node.js with Express
- Google Generative AI (Gemini 1.5 Pro) for equation solving
- Image processing capabilities

## 🚀 Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm or yarn package manager
- Google Gemini API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Math-Notes.git
   cd Math-Notes
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   npm install
   ```
   
   Create a `.env` file in the backend directory with:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   ```

3. **Set up the frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the application:**
   
   Start the backend:
   ```bash
   cd backend
   npm start
   ```
   
   Start the frontend (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

5. **Open your browser:**
   Visit `http://localhost:5173` to access the application.

## 📱 Usage

1. **Drawing Mathematical Expressions:**
   - Select the pen tool and choose your color and size
   - Write or draw your mathematical expression on the canvas
   - Use the eraser to correct mistakes if needed

2. **Solving Equations:**
   - Click the calculator icon to solve your drawn expression
   - The solution will appear below the canvas

3. **Managing Your Work:**
   - Use undo/redo buttons to navigate through changes
   - Toggle the grid for better alignment of expressions
   - Clear the canvas to start fresh
   - Save your work as an image
   - Share your work with the share button

## 🔍 How It Works

1. User draws a mathematical expression on the canvas
2. The canvas image is captured and sent to the backend
3. The backend processes the image using Google's Gemini AI
4. The AI identifies and solves the mathematical expressions
5. Results are returned to the frontend and displayed to the user

## 📄 License

This project is licensed under the GNU GENERAL PUBLIC LICENSE - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👥 Acknowledgements

- Google Generative AI for powering the equation solving capabilities
- React and Vite communities for the frontend frameworks
- Node.js and Express communities for the backend framework 
