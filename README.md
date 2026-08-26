# Sheet2Mondai

[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2.0-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3.3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Overview

**Sheet2Mondai** is a powerful interactive learning tool that automatically converts vocabulary spreadsheets into engaging Japanese language exercises. Simply paste your data from Excel or Google Sheets and instantly access multiple learning modes including flashcards, multiple-choice quizzes, handwriting practice, word scrambles, card matching, and Kanji stroke order visualization.

> **"Transform your vocabulary lists into interactive learning experiences in seconds."**

---

## ✨ Features

### 🎯 **6 Learning Modes**

| Mode | Description | Best For |
|------|-------------|----------|
| **Flashcard** | Interactive flashcards with auto-play and pronunciation | Vocabulary review & memorization |
| **Multiple Choice** | Quiz-based testing with instant feedback | Knowledge assessment & self-testing |
| **Handwriting** | Practice typing answers with hints and auto-check | Writing practice & spelling reinforcement |
| **Word Scramble** | Rearrange scrambled characters to form correct words | Word recognition & problem-solving |
| **Card Matching** | Match corresponding pairs under time pressure | Association & quick recall training |
| **Kanji SVG** | Visual Kanji stroke order with animated SVG | Kanji writing & stroke sequence learning |

### 🎨 **Core Capabilities**

- **📊 Spreadsheet Input** – Paste tab-separated data from Excel/Google Sheets
- **🔊 Text-to-Speech** – Built-in Japanese pronunciation (Web Speech API)
- **🌓 Dark/Light Theme** – Full Material Design 3 color system with auto-switching
- **📱 Responsive Design** – Optimized for desktop, tablet, and mobile devices
- **⏱️ Timed Challenges** – Time-limited modes for added difficulty
- **📈 Progress Tracking** – Detailed results with accuracy metrics and review
- **🎯 Practice Mode** – Generate focused 5-question sessions from larger datasets
- **🧠 Auto-detection** – Automatically identifies Hiragana and Kanji columns

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sheet2mondai.git
cd sheet2mondai

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

```bash
# Deploy to GitHub Pages
npm run deploy
```

---

## 📋 Data Format

Sheet2Mondai expects tab-separated values (TSV) with each row representing a vocabulary entry:

### Example Input
```
Kanji	Hiragana	Meaning	Example
日本語	にほんご	Japanese language	私は日本語を勉強します
ありがとう	ありがとう	Thank you	ありがとうございます
こんにちは	こんにちは	Hello	こんにちは世界
```

### Column Mapping

When configuring exercises, you can map:
- **Question Column** – The prompt displayed to the user
- **Answer Column** – The correct response/translation
- **Hiragana Column** – Pronunciation guide (auto-detected)
- **Kanji Column** – Kanji characters (auto-detected for SVG mode)
- **Card Columns** – Pairs for matching exercises

> **💡 Tip:** Paste directly from Google Sheets or Excel with `Ctrl+V` (Cmd+V on Mac)

---

## 🎮 Learning Modes Explained

### 1. Flashcard Mode
- Browse through vocabulary cards with keyboard shortcuts
- Auto-play feature with pronunciation and timed progression
- Click cards to cycle through individual columns
- Shuffle and random card navigation

**Keyboard Shortcuts:**
- `Space/Enter` – Toggle card view
- `←/↑` – Previous card
- `→/↓` – Next card
- `R` – Shuffle deck

### 2. Multiple Choice
- Select from 4 options with the correct answer randomized
- Listening mode available for audio-based questions
- Instant feedback with visual indicators
- Detailed results breakdown with accuracy scores

### 3. Handwriting Mode
- Type answers and verify against correct responses
- Show/hide hints for challenging questions
- Listening mode for pronunciation practice
- Comprehensive results review with error analysis

### 4. Word Scramble
- Reassemble scrambled characters to form correct words
- Drag-and-drop style character selection
- Extra distractor characters added for difficulty
- Visual feedback for correct/incorrect answers

### 5. Card Matching
- Match 6 pairs of cards under time pressure
- 3 wrong attempts allowed before game over
- Score based on remaining time
- Detailed summary with matched pairs and errors

### 6. Kanji SVG Flashcard
- View Kanji stroke order with animated SVG paths
- Fetch real-time from KanjiVG repository
- Click individual Kanji to replay animations
- Hover to see character details

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with hooks and component-based architecture |
| **Vite** | Fast build tool and development server |
| **TailwindCSS 4** | Utility-first CSS framework |
| **Web Speech API** | Text-to-speech for Japanese pronunciation |
| **Material Symbols** | Google's icon system |
| **KanjiVG** | Open-source Kanji stroke order SVG database |
| **GitHub Pages** | Hosting platform |

---

## 📁 Project Structure

```
sheet2mondai/
├── src/
│   ├── components/
│   │   ├── CardMatching.jsx       # Card matching game
│   │   ├── FlashCard.jsx          # Flashcard mode
│   │   ├── HandwritingMode.jsx    # Handwriting practice
│   │   ├── KanjiSvgFlashCard.jsx  # Kanji stroke visualization
│   │   ├── MultipleChoice.jsx     # Multiple choice quiz
│   │   ├── PopUp.jsx              # Exercise selection modal
│   │   └── WordScrambleMode.jsx   # Word scramble game
│   ├── pages/
│   │   └── Home.jsx               # Main landing page
│   ├── utils/
│   │   └── text_to_speech.js      # TTS utility
│   ├── App.jsx                    # Root component
│   ├── App.css                    # Component styles
│   ├── index.css                  # Global styles & themes
│   └── main.jsx                   # Entry point
├── index.html                     # HTML template
├── package.json                   # Dependencies & scripts
├── vite.config.js                 # Vite configuration
└── README.md                      # Documentation
```

---

## 🎨 Theme System

Sheet2Mondai implements **Material Design 3** color system with full dark/light theme support:

### Light Theme
- Primary: `#1C3200` (Forest Green)
- Surface: `#F9FAEF` (Warm White)
- On Surface: `#000000`
- Error: `#600004` (Deep Red)

### Dark Theme
- Primary: `#DAFBB0` (Light Green)
- Surface: `#12140E` (Dark Gray)
- On Surface: `#FFFFFF`
- Error: `#FFECE9` (Light Red)

> **Theme switching** is handled via CSS classes with smooth transitions.

---

## 🔧 Configuration

### Environment Variables

No environment variables are required for basic usage. The app works offline after initial load.

### Customization

To modify the theme colors, edit the CSS variables in `src/index.css`:

```css
:root {
  --md-sys-color-primary: #1C3200;
  /* Customize your colors here */
}

.dark {
  --md-sys-color-primary: #DAFBB0;
  /* Dark theme overrides */
}
```

---

## 🧪 Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run Oxlint for code quality
npm run deploy     # Deploy to GitHub Pages
```

### Code Quality

- **Oxlint** – Fast linting with React plugin
- **React Compiler** – Optional optimization (disabled by default)
- **ES Modules** – Modern JavaScript module system

---

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full Support |
| Firefox 88+ | ✅ Full Support |
| Safari 15+ | ✅ Full Support |
| Edge 90+ | ✅ Full Support |
| Opera 76+ | ✅ Full Support |

> **Note:** Text-to-Speech requires browsers with Web Speech API support.

---

## 📸 Screenshots

*(Add screenshots here)*

| Home Page | Flashcard Mode | Kanji SVG |
|-----------|----------------|-----------|
| ![](screenshots/home.png) | ![](screenshots/flashcard.png) | ![](screenshots/kanji.png) |

| Matching Game | Results | Dark Theme |
|---------------|---------|------------|
| ![](screenshots/matching.png) | ![](screenshots/results.png) | ![](screenshots/dark.png) |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Use functional components with hooks
- Follow React best practices
- Maintain consistent styling with TailwindCSS
- Ensure accessibility (WAI-ARIA compliant)
- Write clean, documented code

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[KanjiVG](https://kanjivg.tagaini.net/)** – Providing the stroke order SVG data
- **[Google Material Symbols](https://fonts.google.com/icons)** – Icon system
- **[React](https://reactjs.org/)** – UI framework
- **[Vite](https://vitejs.dev/)** – Build tooling
- **[TailwindCSS](https://tailwindcss.com/)** – Styling framework

---

## 📞 Support

For issues, questions, or feature requests:
- Open an [issue](https://github.com/yourusername/sheet2mondai/issues)
- Check the [discussions](https://github.com/yourusername/sheet2mondai/discussions)

---

## 📝 Changelog

### v1.0.0 (Current)
- Initial release
- 6 learning modes
- Dark/light theme
- Text-to-speech support
- Practice mode
- Card matching with time limits
- Kanji SVG stroke visualization
- Auto-detection of Hiragana/Kanji columns

---

## 🏆 Roadmap

- [ ] User authentication and progress saving
- [ ] Export results and performance reports
- [ ] Customizable exercise generation rules
- [ ] Mobile app (React Native)
- [ ] Integration with popular SRS systems (Anki, Wanikani)
- [ ] AI-powered sentence generation
- [ ] Multi-language support (beyond Japanese)

---

## ⭐ Show Your Support

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Made with ❤️ by TeyyPro**