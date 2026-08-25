// ===================================
// AI TOOLS DATA
// ===================================

const aiTools = [
  {
    id: 1,
    name: "ChatGPT",
    category: "content",
    description: "Advanced conversational AI for writing, brainstorming, and problem-solving.",
    uses: [
      "Essay writing and editing",
      "Code explanation and debugging",
      "Research assistance",
      "Creative content generation"
    ],
    link: "https://chat.openai.com"
  },
  {
    id: 2,
    name: "GitHub Copilot",
    category: "development",
    description: "AI pair programmer that helps you write code faster with intelligent suggestions.",
    uses: [
      "Code autocompletion",
      "Function generation",
      "Bug fixing suggestions",
      "Documentation writing"
    ],
    link: "https://github.com/features/copilot"
  },
  {
    id: 3,
    name: "Midjourney",
    category: "design",
    description: "AI art generator creating stunning images from text descriptions.",
    uses: [
      "Project presentations",
      "Concept art creation",
      "Visual brainstorming",
      "Design inspiration"
    ],
    link: "https://www.midjourney.com"
  },
  {
    id: 4,
    name: "Perplexity AI",
    category: "research",
    description: "AI-powered search engine providing accurate answers with citations.",
    uses: [
      "Academic research",
      "Fact-checking",
      "Literature review",
      "Quick information lookup"
    ],
    link: "https://www.perplexity.ai"
  },
  {
    id: 5,
    name: "Notion AI",
    category: "productivity",
    description: "AI assistant integrated into Notion for enhanced note-taking and organization.",
    uses: [
      "Note summarization",
      "Meeting notes generation",
      "Task organization",
      "Content drafting"
    ],
    link: "https://www.notion.so/product/ai"
  },
  {
    id: 6,
    name: "Grammarly",
    category: "content",
    description: "AI writing assistant for grammar, spelling, and style improvements.",
    uses: [
      "Essay proofreading",
      "Email writing",
      "Grammar correction",
      "Tone adjustment"
    ],
    link: "https://www.grammarly.com"
  },
  {
    id: 7,
    name: "Tableau AI",
    category: "data",
    description: "AI-powered data visualization and analytics platform.",
    uses: [
      "Data visualization",
      "Statistical analysis",
      "Report generation",
      "Pattern recognition"
    ],
    link: "https://www.tableau.com"
  },
  {
    id: 8,
    name: "Figma AI",
    category: "design",
    description: "Collaborative design tool with AI-powered features for UI/UX design.",
    uses: [
      "Interface design",
      "Prototyping",
      "Design system creation",
      "Collaborative projects"
    ],
    link: "https://www.figma.com"
  },
  {
    id: 9,
    name: "Replit Ghostwriter",
    category: "development",
    description: "AI coding assistant built into Replit for instant code help.",
    uses: [
      "Code generation",
      "Error debugging",
      "Code explanation",
      "Project scaffolding"
    ],
    link: "https://replit.com/ai"
  },
  {
    id: 10,
    name: "Otter.ai",
    category: "productivity",
    description: "AI meeting assistant that records and transcribes conversations.",
    uses: [
      "Lecture transcription",
      "Meeting notes",
      "Interview recording",
      "Study group sessions"
    ],
    link: "https://otter.ai"
  },
  {
    id: 11,
    name: "Consensus",
    category: "research",
    description: "AI search engine for scientific research papers and studies.",
    uses: [
      "Literature review",
      "Scientific research",
      "Citation finding",
      "Evidence-based answers"
    ],
    link: "https://consensus.app"
  },
  {
    id: 12,
    name: "Canva AI",
    category: "design",
    description: "Design platform with AI tools for creating presentations and graphics.",
    uses: [
      "Presentation design",
      "Social media graphics",
      "Infographic creation",
      "Brand materials"
    ],
    link: "https://www.canva.com"
  },
  {
    id: 13,
    name: "Wolfram Alpha",
    category: "data",
    description: "Computational intelligence engine for mathematics and data analysis.",
    uses: [
      "Math problem solving",
      "Statistical calculations",
      "Data plotting",
      "Formula derivation"
    ],
    link: "https://www.wolframalpha.com"
  },
  {
    id: 14,
    name: "Jasper AI",
    category: "content",
    description: "AI content creation platform for marketing and creative writing.",
    uses: [
      "Blog writing",
      "Marketing copy",
      "Social media content",
      "Creative storytelling"
    ],
    link: "https://www.jasper.ai"
  },
  {
    id: 15,
    name: "Todoist AI",
    category: "productivity",
    description: "Smart task manager with AI-powered task suggestions and scheduling.",
    uses: [
      "Task management",
      "Project planning",
      "Deadline tracking",
      "Priority organization"
    ],
    link: "https://todoist.com"
  },
  {
    id: 16,
    name: "Cursor",
    category: "development",
    description: "AI-first code editor designed for pair programming with AI.",
    uses: [
      "AI-assisted coding",
      "Code refactoring",
      "Bug detection",
      "Code review"
    ],
    link: "https://cursor.sh"
  },
  {
    id: 17,
    name: "Elicit",
    category: "research",
    description: "AI research assistant that helps analyze research papers.",
    uses: [
      "Paper summarization",
      "Research synthesis",
      "Literature mapping",
      "Question answering"
    ],
    link: "https://elicit.org"
  },
  {
    id: 18,
    name: "Julius AI",
    category: "data",
    description: "AI data analyst that helps interpret and visualize data.",
    uses: [
      "Data analysis",
      "Chart generation",
      "Statistical insights",
      "Data cleaning"
    ],
    link: "https://julius.ai"
  },
  {
    id: 19,
    name: "Claude",
    category: "content",
    description: "Anthropic's advanced AI assistant for analysis, writing, and coding.",
    uses: [
      "Long-form content analysis",
      "Code generation and review",
      "Research synthesis",
      "Complex problem solving"
    ],
    link: "https://claude.ai"
  },
  {
    id: 20,
    name: "Google Gemini",
    category: "content",
    description: "Google's multimodal AI for text, code, images, and more.",
    uses: [
      "Multimodal understanding",
      "Code assistance",
      "Image analysis",
      "Research and writing"
    ],
    link: "https://gemini.google.com"
  },
  {
    id: 21,
    name: "Codeium",
    category: "development",
    description: "Free AI-powered code completion and chat assistant for developers.",
    uses: [
      "Real-time code suggestions",
      "Multi-language support",
      "Code explanation",
      "Refactoring assistance"
    ],
    link: "https://codeium.com"
  },
  {
    id: 22,
    name: "Tabnine",
    category: "development",
    description: "AI code assistant with team learning and privacy-focused features.",
    uses: [
      "Context-aware completions",
      "Code pattern learning",
      "Team collaboration",
      "Private model training"
    ],
    link: "https://www.tabnine.com"
  },
  {
    id: 23,
    name: "Amazon CodeWhisperer",
    category: "development",
    description: "AWS's AI coding companion with security scanning built-in.",
    uses: [
      "AWS-optimized code",
      "Security vulnerability detection",
      "Code suggestions",
      "Reference tracking"
    ],
    link: "https://aws.amazon.com/codewhisperer"
  },
  {
    id: 24,
    name: "Phind",
    category: "development",
    description: "AI search engine optimized for developers and technical questions.",
    uses: [
      "Code search",
      "Technical documentation",
      "Error troubleshooting",
      "API reference lookup"
    ],
    link: "https://www.phind.com"
  },
  {
    id: 25,
    name: "Sourcegraph Cody",
    category: "development",
    description: "AI coding assistant that understands your entire codebase.",
    uses: [
      "Codebase navigation",
      "Context-aware suggestions",
      "Code explanations",
      "Refactoring help"
    ],
    link: "https://sourcegraph.com/cody"
  },
  {
    id: 26,
    name: "Llama (Meta AI)",
    category: "content",
    description: "Meta's open-source large language model for various AI applications.",
    uses: [
      "Custom AI applications",
      "Research and experimentation",
      "Fine-tuning for specific tasks",
      "Local deployment"
    ],
    link: "https://ai.meta.com/llama"
  },
  {
    id: 27,
    name: "Mistral AI",
    category: "content",
    description: "European AI company offering powerful open and commercial LLMs.",
    uses: [
      "Multilingual tasks",
      "Code generation",
      "Reasoning tasks",
      "Enterprise solutions"
    ],
    link: "https://mistral.ai"
  },
  {
    id: 28,
    name: "Hugging Face Chat",
    category: "content",
    description: "Access to various open-source LLMs through a unified interface.",
    uses: [
      "Model comparison",
      "Open-source AI exploration",
      "Research and testing",
      "Community models"
    ],
    link: "https://huggingface.co/chat"
  },
  {
    id: 29,
    name: "Poe",
    category: "content",
    description: "Platform to access multiple AI models (GPT-4, Claude, etc.) in one place.",
    uses: [
      "Multi-model access",
      "Bot creation",
      "Model comparison",
      "Custom AI assistants"
    ],
    link: "https://poe.com"
  },
  {
    id: 30,
    name: "v0 by Vercel",
    category: "development",
    description: "AI-powered UI generation tool that creates React components from prompts.",
    uses: [
      "UI component generation",
      "React code creation",
      "Rapid prototyping",
      "Design to code"
    ],
    link: "https://v0.dev"
  },
  {
    id: 31,
    name: "Windsurf Editor",
    category: "development",
    description: "Next-generation AI code editor with advanced context understanding.",
    uses: [
      "Intelligent code completion",
      "Multi-file editing",
      "Context-aware suggestions",
      "Collaborative coding"
    ],
    link: "https://codeium.com/windsurf"
  },
  {
    id: 32,
    name: "Bolt.new",
    category: "development",
    description: "AI-powered full-stack web development in the browser.",
    uses: [
      "Instant app creation",
      "Full-stack development",
      "Live preview",
      "Deployment ready code"
    ],
    link: "https://bolt.new"
  },
  {
    id: 33,
    name: "Continue",
    category: "development",
    description: "Open-source AI code assistant for VS Code and JetBrains IDEs.",
    uses: [
      "Custom model integration",
      "Code chat",
      "Inline editing",
      "Privacy-focused coding"
    ],
    link: "https://continue.dev"
  },
  {
    id: 34,
    name: "Runway ML",
    category: "design",
    description: "AI-powered video editing and generation platform for creative professionals.",
    uses: [
      "Text-to-video generation",
      "Video editing with AI",
      "Motion tracking",
      "Green screen removal"
    ],
    link: "https://runwayml.com"
  },
  {
    id: 35,
    name: "ElevenLabs",
    category: "content",
    description: "Advanced AI voice synthesis and text-to-speech platform.",
    uses: [
      "Voice cloning",
      "Audiobook narration",
      "Podcast creation",
      "Multilingual voiceovers"
    ],
    link: "https://elevenlabs.io"
  },
  {
    id: 36,
    name: "Synthesia",
    category: "content",
    description: "AI video creation platform with virtual avatars and text-to-video.",
    uses: [
      "Training video creation",
      "Presentation videos",
      "Marketing content",
      "Multilingual videos"
    ],
    link: "https://www.synthesia.io"
  },
  {
    id: 37,
    name: "Adobe Firefly",
    category: "design",
    description: "Adobe's generative AI for creative content and design.",
    uses: [
      "Image generation",
      "Text effects",
      "Generative fill",
      "Creative variations"
    ],
    link: "https://www.adobe.com/products/firefly.html"
  },
  {
    id: 38,
    name: "Stable Diffusion",
    category: "design",
    description: "Open-source AI image generation model with extensive customization.",
    uses: [
      "Custom image generation",
      "Art creation",
      "Style transfer",
      "Image editing"
    ],
    link: "https://stability.ai"
  },
  {
    id: 39,
    name: "DALL-E 3",
    category: "design",
    description: "OpenAI's advanced image generation AI with improved accuracy.",
    uses: [
      "Concept visualization",
      "Creative artwork",
      "Product mockups",
      "Illustration generation"
    ],
    link: "https://openai.com/dall-e-3"
  },
  {
    id: 40,
    name: "Zapier AI",
    category: "productivity",
    description: "AI-powered automation platform connecting apps and workflows.",
    uses: [
      "Workflow automation",
      "App integration",
      "Task automation",
      "Data synchronization"
    ],
    link: "https://zapier.com/ai"
  },
  {
    id: 41,
    name: "Make (Integromat)",
    category: "productivity",
    description: "Visual automation platform with AI-enhanced workflow building.",
    uses: [
      "Complex automation",
      "API integration",
      "Data transformation",
      "Multi-step workflows"
    ],
    link: "https://www.make.com"
  },
  {
    id: 42,
    name: "Notion AI Assistant",
    category: "productivity",
    description: "Enhanced AI features within Notion for advanced productivity.",
    uses: [
      "Document summarization",
      "Content generation",
      "Database queries",
      "Project planning"
    ],
    link: "https://www.notion.so/product/ai"
  },
  {
    id: 43,
    name: "Mem",
    category: "productivity",
    description: "AI-powered note-taking app that organizes information automatically.",
    uses: [
      "Smart note organization",
      "Knowledge management",
      "Automatic tagging",
      "Context retrieval"
    ],
    link: "https://mem.ai"
  },
  {
    id: 44,
    name: "Reflect",
    category: "productivity",
    description: "AI-enhanced note-taking with end-to-end encryption and smart features.",
    uses: [
      "Secure note-taking",
      "Meeting transcription",
      "Backlink suggestions",
      "Daily reflections"
    ],
    link: "https://reflect.app"
  },
  {
    id: 45,
    name: "Scite",
    category: "research",
    description: "AI tool for evaluating scientific articles with citation context.",
    uses: [
      "Citation analysis",
      "Research validation",
      "Literature review",
      "Scientific credibility check"
    ],
    link: "https://scite.ai"
  },
  {
    id: 46,
    name: "ResearchRabbit",
    category: "research",
    description: "AI-powered research discovery and paper recommendation tool.",
    uses: [
      "Paper discovery",
      "Citation networks",
      "Research trends",
      "Collaborative research"
    ],
    link: "https://www.researchrabbit.ai"
  },
  {
    id: 47,
    name: "Looker Studio",
    category: "data",
    description: "Google's AI-enhanced data visualization and reporting platform.",
    uses: [
      "Interactive dashboards",
      "Data reporting",
      "Business intelligence",
      "Custom visualizations"
    ],
    link: "https://lookerstudio.google.com"
  },
  {
    id: 48,
    name: "DataRobot",
    category: "data",
    description: "Enterprise AI platform for automated machine learning and analytics.",
    uses: [
      "Automated ML models",
      "Predictive analytics",
      "Model deployment",
      "Data insights"
    ],
    link: "https://www.datarobot.com"
  },
  {
    id: 49,
    name: "MonkeyLearn",
    category: "data",
    description: "AI-powered text analysis and data extraction platform.",
    uses: [
      "Sentiment analysis",
      "Text classification",
      "Data extraction",
      "Survey analysis"
    ],
    link: "https://monkeylearn.com"
  },
  {
    id: 50,
    name: "Framer AI",
    category: "design",
    description: "AI-powered website builder and design tool for interactive sites.",
    uses: [
      "Website generation",
      "Interactive prototypes",
      "Responsive design",
      "No-code development"
    ],
    link: "https://www.framer.com"
  },
  {
    id: 51,
    name: "Gemini Nano",
    category: "content",
    description: "Google's lightweight on-device AI model for mobile and edge computing.",
    uses: [
      "On-device AI processing",
      "Privacy-focused tasks",
      "Offline AI capabilities",
      "Mobile app integration"
    ],
    link: "https://deepmind.google/technologies/gemini/nano/"
  },
  {
    id: 52,
    name: "Gemini Flash",
    category: "content",
    description: "Google's fast and efficient AI model optimized for speed and cost.",
    uses: [
      "Quick responses",
      "High-volume tasks",
      "Cost-effective AI",
      "Real-time applications"
    ],
    link: "https://deepmind.google/technologies/gemini/flash/"
  },
  {
    id: 53,
    name: "Gemini Pro",
    category: "content",
    description: "Google's advanced AI model for complex reasoning and multimodal tasks.",
    uses: [
      "Complex problem solving",
      "Advanced reasoning",
      "Multimodal understanding",
      "Professional applications"
    ],
    link: "https://deepmind.google/technologies/gemini/pro/"
  },
  {
    id: 54,
    name: "n8n",
    category: "productivity",
    description: "Open-source workflow automation tool with AI integrations and visual builder.",
    uses: [
      "Workflow automation",
      "AI integration pipelines",
      "Self-hosted automation",
      "Custom API workflows"
    ],
    link: "https://n8n.io"
  }
];

// ===================================
// PRELOADER ANIMATION (GSAP)
// ===================================

if (document.querySelector('.preloader')) {
  // Animate progress bar
  gsap.to(".progress-bar", {
    width: "100%",
    duration: 2,
    ease: "power2.out",
    onComplete: () => {
      // Fade out preloader
      gsap.to(".preloader", {
        opacity: 0,
        scale: 0.9,
        duration: 1,
        onComplete: () => {
          document.querySelector(".preloader").style.display = "none";

          // Fade in main content
          gsap.to(".landing-page", {
            opacity: 1,
            duration: 1,
            ease: "power2.out"
          });

          // Animate hero content
          gsap.from(".hero-content", {
            y: 50,
            opacity: 0,
            duration: 1,
            delay: 0.5,
            ease: "power3.out"
          });

          gsap.from(".hero-buttons", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 1,
            ease: "power3.out"
          });
        }
      });
    }
  });
}

// ===================================
// PAGE ANIMATIONS
// ===================================

// Animate auth cards on load
if (document.querySelector('.auth-card')) {
  gsap.from(".auth-card", {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out"
  });
}

// Animate dashboard on load
if (document.querySelector('.dashboard')) {
  gsap.from(".dashboard-header", {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out"
  });

  gsap.from(".filter-buttons", {
    y: 20,
    opacity: 0,
    duration: 0.8,
    delay: 0.2,
    ease: "power3.out"
  });
}

// ===================================
// REGISTRATION FORM HANDLING
// ===================================

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Reset errors
    document.querySelectorAll('.form-error').forEach(error => {
      error.classList.remove('show');
    });

    let isValid = true;

    // Validate full name
    if (fullName.length < 2) {
      document.getElementById('fullNameError').classList.add('show');
      isValid = false;
    }

    // Validate student ID
    if (studentId.length < 3) {
      document.getElementById('studentIdError').classList.add('show');
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      document.getElementById('emailError').classList.add('show');
      isValid = false;
    }

    // Validate password
    if (password.length < 6) {
      document.getElementById('passwordError').classList.add('show');
      isValid = false;
    }

    // Validate password match
    if (password !== confirmPassword) {
      document.getElementById('confirmPasswordError').classList.add('show');
      isValid = false;
    }

    if (isValid) {
      // Store user data
      const userData = {
        fullName,
        studentId,
        email,
        password // In production, never store plain passwords!
      };

      localStorage.setItem('userData', JSON.stringify(userData));

      // Animate success and redirect
      gsap.to(".auth-card", {
        scale: 0.95,
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          window.location.href = 'login.html';
        }
      });
    }
  });
}

// ===================================
// LOGIN FORM HANDLING
// ===================================

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Reset errors
    document.querySelectorAll('.form-error').forEach(error => {
      error.classList.remove('show');
    });

    let isValid = true;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      document.getElementById('loginEmailError').classList.add('show');
      isValid = false;
    }

    // Validate password
    if (password.length < 1) {
      document.getElementById('loginPasswordError').classList.add('show');
      isValid = false;
    }

    if (isValid) {
      // Check credentials
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      if (userData.email === email && userData.password === password) {
        // Set session
        localStorage.setItem('isLoggedIn', 'true');

        // Animate success and redirect
        gsap.to(".auth-card", {
          scale: 0.95,
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            window.location.href = 'dashboard.html';
          }
        });
      } else {
        document.getElementById('loginError').classList.add('show');
      }
    }
  });
}

// ===================================
// DASHBOARD FUNCTIONALITY
// ===================================

// Check if user is logged in
if (window.location.pathname.includes('dashboard.html')) {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!isLoggedIn) {
    window.location.href = 'login.html';
  }

  // Render tools
  renderTools(aiTools);

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredTools = aiTools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description.toLowerCase().includes(searchTerm) ||
        tool.category.toLowerCase().includes(searchTerm)
      );
      renderTools(filteredTools);
    });
  }

  // Filter functionality
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;
      const filteredTools = category === 'all'
        ? aiTools
        : aiTools.filter(tool => tool.category === category);

      renderTools(filteredTools);
    });
  });

  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('isLoggedIn');

      gsap.to(".dashboard", {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          window.location.href = 'index.html';
        }
      });
    });
  }
}

// ===================================
// RENDER TOOLS FUNCTION
// ===================================

function renderTools(tools) {
  const toolsGrid = document.getElementById('toolsGrid');
  if (!toolsGrid) return;

  // Clear existing tools
  toolsGrid.innerHTML = '';

  // Category labels
  const categoryLabels = {
    content: 'Content Creation',
    development: 'Development',
    design: 'Design',
    research: 'Research',
    productivity: 'Productivity',
    data: 'Data Analysis'
  };

  // Render each tool
  tools.forEach((tool, index) => {
    const toolCard = document.createElement('div');
    toolCard.className = 'tool-card';
    toolCard.style.opacity = '0';

    toolCard.innerHTML = `
      <div class="tool-category">${categoryLabels[tool.category]}</div>
      <h3 class="tool-name">${tool.name}</h3>
      <p class="tool-description">${tool.description}</p>
      <div class="tool-uses">
        <div class="tool-uses-title">Use Cases:</div>
        <ul class="tool-uses-list">
          ${tool.uses.map(use => `<li>${use}</li>`).join('')}
        </ul>
      </div>
      <a href="${tool.link}" target="_blank" class="tool-link">
        Explore Tool →
      </a>
    `;

    toolsGrid.appendChild(toolCard);

    // Animate card entrance
    gsap.to(toolCard, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay: index * 0.05,
      ease: "power3.out"
    });
  });

  // Show message if no tools found
  if (tools.length === 0) {
    toolsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <h3 style="color: var(--text-secondary);">No tools found</h3>
        <p style="color: var(--text-muted);">Try adjusting your search or filter</p>
      </div>
    `;
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});
