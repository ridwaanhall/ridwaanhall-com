/**
 * GitHub Contributions Graph Renderer
 * Handles rendering and interaction for GitHub contribution data
 */
class GitHubContributions {
    constructor(githubData) {
        this.contributionWeeks = githubData.data.user.contributionsCollection.contributionCalendar.weeks;
        
        // Constants
        this.DAYS_IN_WEEK = 7;
        this.WEEKS_IN_YEAR = 53;
        this.DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        this.MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // DOM elements
        this.contributionGrid = document.getElementById('contribution-grid');
        this.monthLabelsContainer = document.getElementById('month-labels');
        this.contributionDetails = document.getElementById('contribution-details');
    }

    init() {
        this.initializeContributionGrid();
        this.renderMonthLabels();
    }
    
    /**
     * Formats contribution data into a 2D grid array
     */
    formatDatesIntoGrid() {
        const grid = Array(this.WEEKS_IN_YEAR).fill().map(() => Array(this.DAYS_IN_WEEK).fill(null));
        
        this.contributionWeeks.slice(0, this.WEEKS_IN_YEAR).forEach((week, weekIndex) => {
            week.contributionDays.forEach(day => {
                const date = new Date(day.date);
                const dayOfWeek = date.getDay();
                
                grid[weekIndex][dayOfWeek] = {
                    date: date,
                    contributions: day.contributionCount
                };
            });
        });
        
        return grid;
    }
    
    /**
     * Determines the background color based on contribution count
     */
    getContributionColor(contributions, isFuture) {
        if (isFuture) return ''; // No color for future dates
        
        if (contributions === 0) return 'bg-zinc-950';
        if (contributions >= 1 && contributions <= 8) return 'bg-green-600/20';
        if (contributions >= 9 && contributions <= 21) return 'bg-green-600/50';
        if (contributions >= 22 && contributions <= 30) return 'bg-green-600/90';
        return 'bg-green-500';
    }
    
    /**
     * Creates and returns a cell for the contribution grid
     */
    createGridCell(cellData, weekIndex, dayIndex) {
        const cell = document.createElement('div');
        
        // Responsive cell sizing based on screen width
        const isMobile = window.innerWidth < 640;
        const cellSize = isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5';
        
        cell.className = `${cellSize} rounded-xs hover:border hover:border-green-400/30 transition-opacity duration-300 opacity-0`;
        cell.style.gridRow = `${dayIndex + 1}`;
        cell.style.gridColumn = `${weekIndex + 1}`;
        
        if (!cellData || !cellData.date) {
            cell.className += ' opacity-30';
            return cell;
        }
        
        const date = cellData.date;
        const contributions = cellData.contributions;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isFuture = date > today + 1;
        
        // Set appropriate background color
        cell.className += ` ${this.getContributionColor(contributions, isFuture)}`;
        
        // Set tooltip data
        const dayName = this.DAY_NAMES[date.getDay()];
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short',
            day: 'numeric' 
        });
        
        if (isFuture) {
            cell.setAttribute('data-contributions', 'future');
            cell.setAttribute('data-date', formattedDate);
            cell.setAttribute('data-day', dayName);
        } else {
            let contribText;
            if (contributions === 0) {
                contribText = 'No contributions';
            } else {
                contribText = contributions === 1 ? '1 contribution' : `${contributions} contributions`;
            }
            cell.setAttribute('data-contributions', contributions);
            cell.setAttribute('data-date', formattedDate);
            cell.setAttribute('data-day', dayName);
            cell.setAttribute('data-contrib-text', contribText);
        }
        
        // Add event listeners for hover effect
        const contributionDetails = this.contributionDetails;
        cell.addEventListener('mouseenter', function() {
            const contributions = this.getAttribute('data-contributions');
            const date = this.getAttribute('data-date');
            const day = this.getAttribute('data-day');
            
            if (contributions === 'future') {
                contributionDetails.textContent = `Future date: ${day}, ${date}`;
            } else {
                const contribText = this.getAttribute('data-contrib-text');
                contributionDetails.textContent = `${contribText} on ${day}, ${date}`;
            }
            contributionDetails.classList.remove('opacity-0');
            contributionDetails.classList.add('opacity-100');
        });
        
        cell.addEventListener('mouseleave', function() {
            contributionDetails.classList.remove('opacity-100');
            contributionDetails.classList.add('opacity-0');
        });
        
        return cell;
    }
    
    /**
     * Initializes and renders the contribution grid
     */
    initializeContributionGrid() {
        const grid = this.formatDatesIntoGrid();
        
        this.contributionGrid.innerHTML = '';
        this.contributionGrid.style.display = 'grid';
        this.contributionGrid.style.gridTemplateColumns = `repeat(${this.WEEKS_IN_YEAR}, minmax(0, 1fr))`;
        this.contributionGrid.style.gridTemplateRows = `repeat(${this.DAYS_IN_WEEK}, minmax(0, 1fr))`;
        
        // Set gap dynamically based on screen size
        const gap = window.innerWidth < 640 ? '1px' : '1.5px';
        this.contributionGrid.style.gap = gap;
        
        // Handle resize events for responsive gap
        window.addEventListener('resize', () => {
            this.contributionGrid.style.gap = window.innerWidth < 640 ? '1px' : '1.5px';
        });
        
        const cells = [];
        for (let week = 0; week < this.WEEKS_IN_YEAR; week++) {
            for (let day = 0; day < this.DAYS_IN_WEEK; day++) {
                const cellData = grid[week] && grid[week][day];
                const cell = this.createGridCell(cellData, week, day);
                this.contributionGrid.appendChild(cell);
                cells.push(cell);
            }
        }
        
        // Animate cells with random fade-in
        this.animateCellsAppearance(cells);
    }
    
    /**
     * Animate cells to fade in with a random effect
     */
    animateCellsAppearance(cells) {
        // Create a shuffled copy of the cells array
        const shuffledCells = [...cells].sort(() => Math.random() - 0.5);
        
        const maxDelay = 1200; // Maximum delay in milliseconds
        
        // Apply random delays to each cell
        shuffledCells.forEach(cell => {
            // Generate random delay between 0 and maxDelay
            const delay = Math.floor(Math.random() * maxDelay);
            setTimeout(() => {
                cell.classList.replace('opacity-0', 'opacity-100');
            }, delay);
        });
    }
    
    /**
     * Renders month labels beneath the contribution grid
     */
    renderMonthLabels() {
        this.monthLabelsContainer.innerHTML = '';
        const grid = this.formatDatesIntoGrid();
        
        // Track earliest week for each unique month-year combination
        const monthYearToEarliestWeek = new Map();
        const monthYearToFirstDay = new Map(); // Track the first day of week for each month
        
        // Find the earliest occurrence of each month-year in the grid
        for (let week = 0; week < this.WEEKS_IN_YEAR; week++) {
            for (let day = 0; day < this.DAYS_IN_WEEK; day++) {
                if (grid[week] && grid[week][day] && grid[week][day].date) {
                    const date = grid[week][day].date;
                    const month = date.getMonth();
                    const year = date.getFullYear();
                    const key = `${year}-${month}`;
                    const dayOfMonth = date.getDate();
                    
                    if (!monthYearToEarliestWeek.has(key) || week < monthYearToEarliestWeek.get(key)) {
                        monthYearToEarliestWeek.set(key, week);
                        // Store the first day of week we encounter for this month
                        monthYearToFirstDay.set(key, { day, dayOfMonth });
                    }
                }
            }
        }
        
        // Convert the map to an array and sort by week position
        const monthPositions = Array.from(monthYearToEarliestWeek.entries())
            .map(([key, week]) => {
                const [year, month] = key.split('-').map(Number);
                const firstDayInfo = monthYearToFirstDay.get(key);
                return { 
                    month, 
                    year, 
                    week,
                    firstDayOfWeek: firstDayInfo ? firstDayInfo.day : null,
                    firstDayOfMonth: firstDayInfo ? firstDayInfo.dayOfMonth : null
                };
            })
            .sort((a, b) => a.week - b.week);
        
        // Create and position month labels for ALL months (no filtering)
        monthPositions.forEach((pos, index) => {
            const label = document.createElement('span');
            label.textContent = this.MONTH_NAMES[pos.month];
            label.className = 'absolute text-xs text-zinc-400 font-medium';
            
            // Check special conditions for positioning:
            // 1. First month is always at original position
            // 2. Other months: if they start on the 1st day of month AND on Sunday (0), keep at original position
            let offsetWeek = pos.week;
            
            const isFirstMonth = index === 0;
            const startsOnFirstDayOfMonth = pos.firstDayOfMonth === 1;
            const startsOnSunday = pos.firstDayOfWeek === 0;
            
            if (!isFirstMonth && !(startsOnFirstDayOfMonth && startsOnSunday)) {
                // Only offset if not first month and doesn't start on Sunday with 1st day of month
                offsetWeek = Math.min(pos.week + 1, this.WEEKS_IN_YEAR - 1);
            }
            
            const percentPosition = (offsetWeek / this.WEEKS_IN_YEAR) * 100;
            label.style.left = `${percentPosition}%`;
            
            // Add a data attribute for debugging if needed
            label.setAttribute('data-year', pos.year);
            
            this.monthLabelsContainer.appendChild(label);
        });
    }
}

// Export the class for use in other files
window.GitHubContributions = GitHubContributions;
