/**
 * Main JavaScript for Course Website
 * Handles markdown loading, navigation, and interactivity
 */

// Configuration
const config = {
    defaultPage: 'README.md',
    contentElement: document.getElementById('content'),
    baseUrl: window.location.pathname.replace(/\/[^/]*$/, '/')
};

// Initialize marked.js options
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
});

/**
 * Load and render markdown file
 */
async function loadMarkdown(filePath) {
    const contentElement = config.contentElement;

    try {
        // Show loading state
        contentElement.innerHTML = '<div class="loading">Loading content...</div>';

        // Fetch markdown file
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Failed to load: ${response.status}`);
        }

        const markdown = await response.text();

        // Parse and render markdown
        const html = marked.parse(markdown);

        // Fix relative links in the rendered HTML
        const fixedHtml = fixRelativeLinks(html, filePath);

        contentElement.innerHTML = fixedHtml;

        // Scroll to top
        window.scrollTo(0, 0);

        // Attach click handlers to internal links
        attachLinkHandlers();

    } catch (error) {
        console.error('Error loading markdown:', error);
        contentElement.innerHTML = `
            <div class="error" style="padding: 2rem; text-align: center;">
                <h2 style="color: #dc2626;">Error Loading Content</h2>
                <p>Could not load <code>${filePath}</code></p>
                <p style="color: #6b7280;">${error.message}</p>
                <button onclick="loadMarkdown('${config.defaultPage}')"
                        style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
                    Return to Home
                </button>
            </div>
        `;
    }
}

/**
 * Fix relative links in rendered markdown
 */
function fixRelativeLinks(html, currentFile) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');

    // Get the directory of the current file
    const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/') + 1);

    links.forEach(link => {
        const href = link.getAttribute('href');

        if (!href) return;

        // Skip external links and anchors
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
            return;
        }

        // Handle relative markdown links
        if (href.endsWith('.md')) {
            // Resolve relative path
            let resolvedPath = href;

            if (href.startsWith('../')) {
                // Go up from current directory
                resolvedPath = currentDir + href;
            } else if (!href.startsWith('/')) {
                // Relative to current directory
                resolvedPath = currentDir + href;
            }

            // Normalize path
            resolvedPath = normalizePath(resolvedPath);

            // Set data attribute for internal navigation
            link.setAttribute('data-page', resolvedPath);
            link.setAttribute('href', '#');
        }
    });

    return doc.body.innerHTML;
}

/**
 * Normalize file path (resolve ../ and ./)
 */
function normalizePath(path) {
    const parts = path.split('/');
    const normalized = [];

    for (const part of parts) {
        if (part === '..') {
            normalized.pop();
        } else if (part !== '.' && part !== '') {
            normalized.push(part);
        }
    }

    return normalized.join('/');
}

/**
 * Attach click handlers to internal links
 */
function attachLinkHandlers() {
    const links = document.querySelectorAll('[data-page]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');

            if (page) {
                loadMarkdown(page);
                updateActiveNav(link);

                // Close mobile menu if open
                const navList = document.querySelector('.nav-list');
                if (navList.classList.contains('active')) {
                    navList.classList.remove('active');
                }
            }
        });
    });
}

/**
 * Update active navigation state
 */
function updateActiveNav(activeLink) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-list a').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to clicked link if it's in main nav
    if (activeLink && activeLink.closest('.main-nav')) {
        activeLink.classList.add('active');
    }
}

/**
 * Mobile menu toggle
 */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }
}

/**
 * Handle dropdown menus
 */
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');

        // Click to toggle on mobile
        toggle.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                menu.classList.toggle('active');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    });
}

/**
 * Handle browser back/forward buttons
 */
function initHistoryNavigation() {
    // Save state when loading a page
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
            loadMarkdown(e.state.page);
        }
    });
}

/**
 * Initialize the application
 */
function init() {
    // Load default page
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || config.defaultPage;

    loadMarkdown(page);

    // Initialize features
    initMobileMenu();
    initDropdowns();
    initHistoryNavigation();
    attachLinkHandlers();
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Expose loadMarkdown globally for button clicks and external use
window.loadMarkdown = loadMarkdown;
