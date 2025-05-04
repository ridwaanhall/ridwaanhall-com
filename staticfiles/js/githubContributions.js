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
        if (isFuture) return 'bg-zinc-950';
        
        if (contributions === 0) return 'bg-zinc-900/90';
        if (contributions >= 1 && contributions <= 3) return 'bg-green-600/20';
        if (contributions >= 4 && contributions <= 9) return 'bg-green-600/50';
        if (contributions >= 10 && contributions <= 15) return 'bg-green-600/90';
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
            cell.className += ' bg-zinc-950 opacity-30';
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
        
        // Create a map to track the earliest week for each month
        const monthToEarliestWeek = new Map();
        
        // Find the earliest occurrence of each month in the grid
        for (let week = 0; week < this.WEEKS_IN_YEAR; week++) {
            for (let day = 0; day < this.DAYS_IN_WEEK; day++) {
                if (grid[week] && grid[week][day] && grid[week][day].date) {
                    const date = grid[week][day].date;
                    const month = date.getMonth();
                    
                    if (!monthToEarliestWeek.has(month) || week < monthToEarliestWeek.get(month)) {
                        monthToEarliestWeek.set(month, week);
                    }
                }
            }
        }
        
        // Convert the map to an array and sort by week position
        const monthPositions = Array.from(monthToEarliestWeek.entries())
            .map(([month, week]) => ({ month, week }))
            .sort((a, b) => a.week - b.week);
        
        // Apply minimum distance between labels
        const MIN_WEEK_DISTANCE = 3; // Minimum weeks between labels
        const filteredPositions = [];
        
        for (let i = 0; i < monthPositions.length; i++) {
            if (i === 0) {
                filteredPositions.push(monthPositions[i]);
                continue;
            }
            
            const current = monthPositions[i];
            const previous = filteredPositions[filteredPositions.length - 1];
            
            if (current.week - previous.week >= MIN_WEEK_DISTANCE) {
                filteredPositions.push(current);
            }
        }
        
        // Create and position month labels
        filteredPositions.forEach(pos => {
            const label = document.createElement('span');
            label.textContent = this.MONTH_NAMES[pos.month];
            label.className = 'absolute text-2xs sm:text-xs font-medium';
            label.style.left = `${(pos.week / this.WEEKS_IN_YEAR) * 100}%`;
            this.monthLabelsContainer.appendChild(label);
        });
    }
}

// Export the class for use in other files
window.GitHubContributions = GitHubContributions;
