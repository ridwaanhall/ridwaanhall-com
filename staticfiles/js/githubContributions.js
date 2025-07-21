class GitHubContributions {
    constructor(githubData) {
        this.contributionWeeks = githubData.data.user.contributionsCollection.contributionCalendar.weeks;

        this.DAYS_IN_WEEK = 7;
        this.WEEKS_IN_YEAR = 53;
        this.DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        this.MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        this.contributionGrid = document.getElementById("contribution-grid");
        this.monthLabelsContainer = document.getElementById("month-labels");
        this.contributionDetails = document.getElementById("contribution-details");
    }

    init() {
        this.initializeContributionGrid();
        this.renderMonthLabels();
    }

    formatDatesIntoGrid() {
        const grid = Array(this.WEEKS_IN_YEAR)
            .fill()
            .map(() => Array(this.DAYS_IN_WEEK).fill(null));

        this.contributionWeeks.slice(0, this.WEEKS_IN_YEAR).forEach((week, weekIndex) => {
            week.contributionDays.forEach((day) => {
                const date = new Date(day.date);
                const dayOfWeek = date.getDay();

                grid[weekIndex][dayOfWeek] = {
                    date: date,
                    contributions: day.contributionCount,
                };
            });
        });

        return grid;
    }

    getContributionColor(contributions, isFuture) {
        if (isFuture) return "";

        if (contributions === 0) return "bg-zinc-950";
        if (contributions >= 1 && contributions <= 8) return "bg-green-600/20";
        if (contributions >= 9 && contributions <= 21) return "bg-green-600/50";
        if (contributions >= 22 && contributions <= 30) return "bg-green-600/90";
        return "bg-green-500";
    }

    createGridCell(cellData, weekIndex, dayIndex) {
        const cell = document.createElement("div");

        const isMobile = window.innerWidth < 640;
        const cellSize = isMobile ? "w-2 h-2" : "w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5";

        cell.className = `${cellSize} rounded-xs hover:border hover:border-green-400/30 transition-opacity duration-300 opacity-0`;
        cell.style.gridRow = `${dayIndex + 1}`;
        cell.style.gridColumn = `${weekIndex + 1}`;

        if (!cellData || !cellData.date) {
            cell.className += " opacity-30";
            return cell;
        }

        const date = cellData.date;
        const contributions = cellData.contributions;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isFuture = date > today + 1;

        cell.className += ` ${this.getContributionColor(contributions, isFuture)}`;

        const dayName = this.DAY_NAMES[date.getDay()];
        const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        if (isFuture) {
            cell.setAttribute("data-contributions", "future");
            cell.setAttribute("data-date", formattedDate);
            cell.setAttribute("data-day", dayName);
        } else {
            let contribText;
            if (contributions === 0) {
                contribText = "No contributions";
            } else {
                contribText = contributions === 1 ? "1 contribution" : `${contributions} contributions`;
            }
            cell.setAttribute("data-contributions", contributions);
            cell.setAttribute("data-date", formattedDate);
            cell.setAttribute("data-day", dayName);
            cell.setAttribute("data-contrib-text", contribText);
        }

        const contributionDetails = this.contributionDetails;
        cell.addEventListener("mouseenter", function () {
            const contributions = this.getAttribute("data-contributions");
            const date = this.getAttribute("data-date");
            const day = this.getAttribute("data-day");

            if (contributions === "future") {
                contributionDetails.textContent = `Future date: ${day}, ${date}`;
            } else {
                const contribText = this.getAttribute("data-contrib-text");
                contributionDetails.textContent = `${contribText} on ${day}, ${date}`;
            }
            contributionDetails.classList.remove("opacity-0");
            contributionDetails.classList.add("opacity-100");
        });

        cell.addEventListener("mouseleave", function () {
            contributionDetails.classList.remove("opacity-100");
            contributionDetails.classList.add("opacity-0");
        });

        return cell;
    }

    initializeContributionGrid() {
        const grid = this.formatDatesIntoGrid();

        this.contributionGrid.innerHTML = "";
        this.contributionGrid.style.display = "grid";
        this.contributionGrid.style.gridTemplateColumns = `repeat(${this.WEEKS_IN_YEAR}, minmax(0, 1fr))`;
        this.contributionGrid.style.gridTemplateRows = `repeat(${this.DAYS_IN_WEEK}, minmax(0, 1fr))`;

        const gap = window.innerWidth < 640 ? "1px" : "1.5px";
        this.contributionGrid.style.gap = gap;

        window.addEventListener("resize", () => {
            this.contributionGrid.style.gap = window.innerWidth < 640 ? "1px" : "1.5px";
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

        this.animateCellsAppearance(cells);
    }

    animateCellsAppearance(cells) {
        const shuffledCells = [...cells].sort(() => Math.random() - 0.5);

        const maxDelay = 4000;

        shuffledCells.forEach((cell) => {
            const delay = Math.floor(Math.random() * maxDelay);
            setTimeout(() => {
                cell.classList.replace("opacity-0", "opacity-100");
            }, delay);
        });
    }

    renderMonthLabels() {
        this.monthLabelsContainer.innerHTML = "";
        const grid = this.formatDatesIntoGrid();

        const monthYearToEarliestWeek = new Map();
        const monthYearToFirstDay = new Map();
        const monthYearToWeekCount = new Map();
        const currentYear = new Date().getFullYear();

        for (let week = 0; week < this.WEEKS_IN_YEAR; week++) {
            for (let day = 0; day < this.DAYS_IN_WEEK; day++) {
                if (grid[week] && grid[week][day] && grid[week][day].date) {
                    const date = grid[week][day].date;
                    const month = date.getMonth();
                    const year = date.getFullYear();
                    const key = `${year}-${month}`;
                    const dayOfMonth = date.getDate();

                    // Count weeks for each month-year combination
                    if (!monthYearToWeekCount.has(key)) {
                        monthYearToWeekCount.set(key, new Set());
                    }
                    monthYearToWeekCount.get(key).add(week);

                    if (!monthYearToEarliestWeek.has(key) || week < monthYearToEarliestWeek.get(key)) {
                        monthYearToEarliestWeek.set(key, week);
                        monthYearToFirstDay.set(key, { day, dayOfMonth });
                    }
                }
            }
        }

        const monthPositions = Array.from(monthYearToEarliestWeek.entries())
            .map(([key, week]) => {
                const [year, month] = key.split("-").map(Number);
                const firstDayInfo = monthYearToFirstDay.get(key);
                const weekCount = monthYearToWeekCount.get(key).size;
                const isPastYear = year < currentYear;
                
                return {
                    month,
                    year,
                    week,
                    weekCount,
                    isPastYear,
                    firstDayOfWeek: firstDayInfo ? firstDayInfo.day : null,
                    firstDayOfMonth: firstDayInfo ? firstDayInfo.dayOfMonth : null,
                };
            })
            .filter(pos => {
                // Only show month labels if they have at least 2 weeks of data
                // This applies to both past year and current year
                return pos.weekCount >= 2;
            })
            .sort((a, b) => a.week - b.week);

        const processedMonths = new Set();

        monthPositions.forEach((pos, index) => {
            const monthKey = `${pos.year}-${pos.month}`;

            if (processedMonths.has(monthKey)) {
                return;
            }

            const label = document.createElement("span");
            label.className = "absolute text-xs text-zinc-400 font-medium";

            let offsetWeek = pos.week;
            let monthLabel = this.MONTH_NAMES[pos.month];

            const isFirstMonth = index === 0;
            const isLastMonth = index === monthPositions.length - 1;
            const currentMonthWeekCount = monthPositions.filter((p) => p.month === pos.month && p.year === pos.year).length;
            const isEndOfMonthScenario = currentMonthWeekCount === 1 && pos.firstDayOfMonth > 25;

            const isSundayOrMondayStart = pos.firstDayOfWeek === 0 || pos.firstDayOfWeek === 1;

            // Additional check for months with insufficient data (redundant but kept for safety)
            if (pos.weekCount < 2) {
                return; // Skip rendering this label
            }

            // Special handling for last month in the year period
            if (isLastMonth) {
                // If it's the last month and it's in the last few weeks (week >= 50),
                // only show label if there are at least 2 weeks AND
                // the month started early enough in the week to warrant a label
                if (pos.week >= 50) {
                    // If this is just 1 week of the month at the end, don't show label
                    if (pos.weekCount < 2) {
                        return;
                    }
                    // If it has 2+ weeks, show the label at the earliest week (first week of the month)
                    offsetWeek = pos.week;
                }
            }

            if (isFirstMonth && isEndOfMonthScenario) {
                const nextMonth = (pos.month + 1) % 12;
                const nextYear = pos.month === 11 ? pos.year + 1 : pos.year;
                monthLabel = this.MONTH_NAMES[nextMonth];

                processedMonths.add(monthKey);
                const nextMonthKey = `${nextYear}-${nextMonth}`;
                processedMonths.add(nextMonthKey);
            } else if (isEndOfMonthScenario && !isFirstMonth && !isLastMonth) {
                const nextMonth = (pos.month + 1) % 12;
                const nextYear = pos.month === 11 ? pos.year + 1 : pos.year;
                monthLabel = this.MONTH_NAMES[nextMonth];
                offsetWeek = Math.min(pos.week + 1, this.WEEKS_IN_YEAR - 1);

                const nextMonthKey = `${nextYear}-${nextMonth}`;
                processedMonths.add(nextMonthKey);
            } else if (!isFirstMonth && !isSundayOrMondayStart && !isLastMonth) {
                offsetWeek = Math.min(pos.week + 1, this.WEEKS_IN_YEAR - 1);
            }

            label.textContent = monthLabel;
            const percentPosition = (offsetWeek / this.WEEKS_IN_YEAR) * 100;
            label.style.left = `${percentPosition}%`;

            label.setAttribute("data-year", pos.year);
            label.setAttribute("data-original-month", this.MONTH_NAMES[pos.month]);
            label.setAttribute("data-week-count", pos.weekCount);

            this.monthLabelsContainer.appendChild(label);

            processedMonths.add(monthKey);
        });
    }
}

window.GitHubContributions = GitHubContributions;
