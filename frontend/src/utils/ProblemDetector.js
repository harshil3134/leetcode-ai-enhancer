// src/utils/problemDetector.js
export class ProblemDetector {
  extractProblem() {
    // Get problem ID from URL
    const match = window.location.pathname.match(/\/problems\/([^\/]+)/);
    if (!match) return null;
    const problemSlug = match[1];
    const codeselector=document.querySelector('.monaco-mouse-cursor-text')
    const usercode=codeselector?.innerText
    // Extract title - try multiple selectors
    const titleElement = document.querySelector('title') || 
                        document.querySelector('.text-title-large') ||
                        document.querySelector('h1') ||
                        document.querySelector('[data-cy="question-title"]') ||
                        document.querySelector('.css-v3d350') ||
                        document.querySelector('.text-lg');
    
    let title = titleElement?.textContent?.trim();
    
    // Clean up title if it comes from page title
    if (title && title.includes(' - LeetCode')) {
      title = title.replace(' - LeetCode', '').trim();
    }
    
    // Remove problem number prefix if exists (e.g., "1. Two Sum" -> "Two Sum")
    if (title && /^\d+\.\s/.test(title)) {
      title = title.replace(/^\d+\.\s/, '').trim();
    }
    
    // Extract difficulty - Enhanced with multiple strategies
    let difficulty = 'Unknown';
    
    // Strategy 1: Try specific difficulty selectors
    const difficultySelectors = [
      'div[diff]',
      'span[class*="text-difficulty"]',
      'div[class*="text-difficulty"]',
      'span[class*="difficulty"]',
      'div[class*="difficulty"]',
      '[data-degree]',
      '.text-green-s', // Easy
      '.text-yellow', // Medium  
      '.text-red-s', // Hard
      '.text-olive', // Easy alternative
      '.text-amber', // Medium alternative
      '.text-pink', // Hard alternative
      '.text-green-600', // Tailwind green
      '.text-yellow-600', // Tailwind yellow
      '.text-red-600', // Tailwind red
      '.bg-green-1', // LeetCode specific
      '.bg-yellow-1', // LeetCode specific
      '.bg-red-1' // LeetCode specific
    ];
    
    let difficultyElement = null;
    for (const selector of difficultySelectors) {
      difficultyElement = document.querySelector(selector);
      if (difficultyElement?.textContent?.trim()) {
        const text = difficultyElement.textContent.trim();
        if (/easy|medium|hard/i.test(text)) {
          difficulty = text.match(/easy|medium|hard/i)[0];
          difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
          break;
        }
      }
    }
    
    // Strategy 2: Search by text content if no element found
    if (difficulty === 'Unknown') {
      const allElements = document.querySelectorAll('div, span, p, a');
      for (const element of allElements) {
        const text = element.textContent?.trim();
        if (text && /^(Easy|Medium|Hard)$/i.test(text)) {
          // Verify this is likely a difficulty indicator by checking parent context
          const parent = element.parentElement;
          const elementClass = element.className || '';
          const parentClass = parent?.className || '';
          
          if (parent && (
            parentClass.includes('flex') || 
            parentClass.includes('tag') ||
            parentClass.includes('difficulty') ||
            elementClass.includes('text-') ||
            elementClass.includes('bg-') ||
            element.tagName.toLowerCase() === 'span'
          )) {
            difficulty = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            console.log('✅ Found difficulty via text search:', difficulty, element);
            break;
          }
        }
      }
    }
    
    // Strategy 3: Look for color-based difficulty indicators
    if (difficulty === 'Unknown') {
      const colorMappings = [
        { colors: ['green', 'olive', 'emerald'], difficulty: 'Easy' },
        { colors: ['yellow', 'amber', 'orange'], difficulty: 'Medium' },
        { colors: ['red', 'pink', 'rose', 'crimson'], difficulty: 'Hard' }
      ];
      
      for (const mapping of colorMappings) {
        for (const color of mapping.colors) {
          const colorSelectors = [
            `[class*="text-${color}"]`,
            `[class*="bg-${color}"]`,
            `[class*="${color}-"]`,
            `.${color}`
          ];
          
          for (const selector of colorSelectors) {
            const colorElement = document.querySelector(selector);
            if (colorElement && colorElement.textContent?.trim()) {
              const text = colorElement.textContent.trim();
              if (text.length < 15 && (
                /easy|medium|hard/i.test(text) ||
                text.length < 6 // Short text likely to be difficulty
              )) {
                difficulty = mapping.difficulty;
                console.log('✅ Found difficulty via color mapping:', difficulty, colorElement);
                break;
              }
            }
          }
          if (difficulty !== 'Unknown') break;
        }
        if (difficulty !== 'Unknown') break;
      }
    }
    
    // Strategy 4: Look in specific LeetCode containers
    if (difficulty === 'Unknown') {
      const containers = [
        '.css-1jqueqk', // LeetCode specific container
        '.text-label-1', // LeetCode label
        '.flex.items-center', // Common flex container
        '[class*="difficulty-"]' // Any difficulty-related class
      ];
      
      for (const containerSelector of containers) {
        const container = document.querySelector(containerSelector);
        if (container) {
          const difficultyText = container.textContent;
          const match = difficultyText?.match(/(Easy|Medium|Hard)/i);
          if (match) {
            difficulty = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            console.log('✅ Found difficulty in container:', difficulty, container);
            break;
          }
        }
      }
    }
    
    // Extract description
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                       '';
    
    // Extract problem statement from the page
    let problemStatement = '';
    const contentSelectors = [
      '[data-track-load="description_content"]',
      '.question-content',
      '[class*="question"]',
      '.elfjS', // Sometimes LeetCode uses this class
      '.css-1jqueqk .text-body', // LeetCode specific
      '.xFUwe' // Another LeetCode class
    ];
    
    for (const selector of contentSelectors) {
      const contentElement = document.querySelector(selector);
      if (contentElement?.textContent?.trim()) {
        problemStatement = contentElement.textContent.trim();
        break;
      }
    }
    
    // Debug logging
    console.log('🔍 Extraction Results:');
    console.log('📊 Title:', title);
    console.log('📊 Difficulty:', difficulty);
    console.log('📊 Problem Slug:', problemSlug);
    console.log('📊 Description:', description?.substring(0, 100) + '...');
    
    // Debug: Log all elements that might contain difficulty
    const potentialDifficultyElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent?.trim().toLowerCase();
      return text === 'easy' || text === 'medium' || text === 'hard';
    });
    
    if (potentialDifficultyElements.length > 0) {
      console.log('🔍 All potential difficulty elements:', 
        potentialDifficultyElements.map(el => ({
          element: el,
          text: el.textContent?.trim(),
          className: el.className,
          parent: el.parentElement?.className,
          tagName: el.tagName
        }))
      );
    }
    
    if (!title) {
      console.warn('❌ Could not extract title');
      return null;
    }
    
    const result = {
      id: problemSlug,
      title: title,
      difficulty: difficulty,
      description: description,
      message: description || problemStatement,
      problemStatement: problemStatement,
      url: window.location.href,
      code:usercode,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Final extracted problem data:', result);
    return result;
  }

  // Add a helper method to wait for elements to load
  async waitForProblemLoad(maxAttempts = 10, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts} to extract problem...`);
      
      const problemData = this.extractProblem();
      
      if (problemData && problemData.title) {
        // Accept the result even if difficulty is unknown
        if (problemData.difficulty !== 'Unknown') {
          console.log('✅ Problem successfully extracted with difficulty!', problemData);
          return problemData;
        } else if (attempt > 5) {
          // After 5 attempts, accept result even without difficulty
          console.log('⚠️ Problem extracted but difficulty unknown, accepting result:', problemData);
          return problemData;
        }
      }
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.warn('⚠️ Could not extract complete problem data after', maxAttempts, 'attempts');
    return this.extractProblem(); // Return whatever we could extract
  }

  // Helper method to check if we're on a problem page
  isOnProblemPage() {
    return /\/problems\/[^\/]+/.test(window.location.pathname);
  }

  // Debug method to inspect current page elements
  debugInspectPage() {
    console.log('🔍 DEBUG: Page inspection');
    console.log('URL:', window.location.href);
    console.log('Title element:', document.querySelector('title')?.textContent);
    console.log('All h1 elements:', Array.from(document.querySelectorAll('h1')).map(h => h.textContent));
    console.log('All difficulty-like elements:', 
      Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.trim().toLowerCase();
        return text === 'easy' || text === 'medium' || text === 'hard';
      })
    );
  }

  fetchCode(){
      const codeselector=document.querySelector('.monaco-mouse-cursor-text')
    const usercode=codeselector?.innerText

      const result = {
      code:usercode,
      timestamp: new Date().toISOString()
      }
      return result;
    };
  }