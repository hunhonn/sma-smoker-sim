/**
 * Modular Data Visualization Framework
 * This system allows for dynamically adding and updating multiple graphs
 * Compatible with D3.js version 3.4.5
 */

// Main visualization controller
const DataViz = {
    // Store chart configurations and data
    charts: {},
    
    // Default settings for charts
    defaults: {
        margin: { top: 30, right: 30, bottom: 50, left: 60 },
        width: 400,
        height: 250,
        maxDataPoints: 100,
        transitionDuration: 300,
        colors: ["#BB2117", "#1569C7", "#5CB85C", "#F0AD4E", "#D9534F"]
    },
    
    /**
     * Initialize a new time series chart
     * @param {string} chartId - Unique ID for the chart
     * @param {string} containerId - DOM element ID to place the chart
     * @param {Object} config - Chart configuration options
     */
    createTimeSeriesChart: function(chartId, containerId, config = {}) {
        // Merge provided config with defaults
        const chartConfig = {};
        // Copy defaults
        for (let key in this.defaults) {
            if (key === 'margin') {
                chartConfig.margin = {};
                for (let mKey in this.defaults.margin) {
                    chartConfig.margin[mKey] = this.defaults.margin[mKey];
                }
                // Override with custom margin if provided
                if (config.margin) {
                    for (let mKey in config.margin) {
                        chartConfig.margin[mKey] = config.margin[mKey];
                    }
                }
            } else {
                chartConfig[key] = this.defaults[key];
            }
        }
        // Override with custom config
        for (let key in config) {
            if (key !== 'margin') {
                chartConfig[key] = config[key];
            }
        }
        
        // Calculate actual dimensions
        const width = chartConfig.width - chartConfig.margin.left - chartConfig.margin.right;
        const height = chartConfig.height - chartConfig.margin.top - chartConfig.margin.bottom;
        
        // Create chart container if needed
        let container = d3.select(`#${containerId}`);
        if (container.select(`#${chartId}-container`).empty()) {
            container = container.append("div")
                .attr("id", `${chartId}-container`)
                .attr("class", "chart-container")
                .style("margin-bottom", "20px");
        }
        
        // Create SVG element
        const svg = container.append("svg")
            .attr("width", chartConfig.width)
            .attr("height", chartConfig.height)
            .append("g")
            .attr("transform", `translate(${chartConfig.margin.left}, ${chartConfig.margin.top})`);
        
        // Add chart title
        if (chartConfig.title) {
            svg.append("text")
                .attr("class", "chart-title")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text(chartConfig.title);
        }
        
        // Define X scale - use d3.scale.linear() for D3 v3
        const xScale = d3.scale.linear()
            .domain(chartConfig.domain || [0, 10]) // Initial domain
            .range([0, width]);
        
        // Add X axis - use d3.svg.axis() for D3 v3
        const xAxis = svg.append("g")
            .attr("class", `${chartId}-x-axis`)
            .attr("transform", `translate(0, ${height})`)
            .call(d3.svg.axis().scale(xScale).orient("bottom"));
        
        // Add X axis label
        if (chartConfig.xAxisLabel) {
            svg.append("text")
                .attr("class", "x-axis-label")
                .attr("x", width / 2)
                .attr("y", height + 40)
                .style("text-anchor", "middle")
                .text(chartConfig.xAxisLabel);
        }
        
        // Define Y scale - use d3.scale.linear() for D3 v3
        const yScale = d3.scale.linear()
            .domain(chartConfig.yDomain || [0, 100])
            .range([height, 0]);
        
        // Add Y axis - use d3.svg.axis() for D3 v3
        const yAxis = svg.append("g")
            .attr("class", `${chartId}-y-axis`)
            .call(d3.svg.axis().scale(yScale).orient("left"));
        
        // Add Y axis label
        if (chartConfig.yAxisLabel) {
            svg.append("text")
                .attr("class", "y-axis-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -40)
                .style("text-anchor", "middle")
                .text(chartConfig.yAxisLabel);
        }
        
        // Add legend if multiple series are expected
        let legend;
        if (chartConfig.showLegend) {
            legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width - 100}, 0)`);
        }
        
        // Store chart reference
        this.charts[chartId] = {
            config: chartConfig,
            svg,
            width,
            height,
            xScale,
            yScale,
            xAxis,
            yAxis,
            legend,
            series: {},
            data: {}
        };
        
        return this.charts[chartId];
    },
    
    /**
     * Add a new data series to an existing chart
     * @param {string} chartId - ID of the target chart
     * @param {string} seriesId - Unique ID for the data series
     * @param {Object} seriesConfig - Configuration for the data series
     */
    addSeries: function(chartId, seriesId, seriesConfig) {
        seriesConfig = seriesConfig || {};
        const chart = this.charts[chartId];
        if (!chart) {
            console.error(`Chart ${chartId} not found`);
            return;
        }
        
        // Default series config
        const config = {
            label: seriesId,
            color: chart.config.colors[Object.keys(chart.series).length % chart.config.colors.length],
            strokeWidth: 2,
            dashArray: null
        };
        
        // Apply custom config
        for (let key in seriesConfig) {
            config[key] = seriesConfig[key];
        }
        
        // Initialize empty data array for this series
        chart.data[seriesId] = [];
        
        // Create path for this series
        const path = chart.svg.append("path")
            .attr("class", `${chartId}-${seriesId}-line`)
            .attr("fill", "none")
            .attr("stroke", config.color)
            .attr("stroke-width", config.strokeWidth);

        if (config.dashArray) {
            path.attr("stroke-dasharray", config.dashArray);
        }
        
        // Add to legend if enabled
        if (chart.legend && config.label) {
            const legendY = Object.keys(chart.series).length * 20;
            
            // Add color swatch
            chart.legend.append("rect")
                .attr("x", 0)
                .attr("y", legendY)
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", config.color);

                        // Add dashed border to the swatch if the line is dashed
            if (config.dashArray) {
                chart.legend.append("rect")
                    .attr("x", 0)
                    .attr("y", legendY)
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("fill", "none")
                    .attr("stroke", config.color)
                    .attr("stroke-dasharray", config.dashArray);
            }
        
            
            // Add series name
            chart.legend.append("text")
                .attr("x", 20)
                .attr("y", legendY + 10)
                .style("font-size", "12px")
                .text(config.label);
        }
        
        // Store series configuration
        chart.series[seriesId] = {
            config,
            path
        };
        
        return chart.series[seriesId];
    },
    
    /**
     * Update chart with new data point(s)
     * @param {string} chartId - ID of the target chart
     * @param {string} seriesId - ID of the data series to update
     * @param {number} x - X value (typically time)
     * @param {number} y - Y value to plot
     */
    updateChart: function(chartId, seriesId, x, y) {
        const chart = this.charts[chartId];
        if (!chart || !chart.data[seriesId]) return;
        
        // Add new data point
        chart.data[seriesId].push({ x: x, y: y });
        
        // Limit data points for performance
        if (chart.data[seriesId].length > chart.config.maxDataPoints) {
            chart.data[seriesId].shift();
        }
        
        // Get all X and Y values across all series for this chart
        let allX = [], allY = [];
        for (let sid in chart.data) {
            const seriesData = chart.data[sid];
            for (let i = 0; i < seriesData.length; i++) {
                allX.push(seriesData[i].x);
                allY.push(seriesData[i].y);
            }
        }
        
        // Update X domain if auto-scaling
        if (!chart.config.fixedXDomain && allX.length > 0) {
            const minX = d3.min(allX);
            const maxX = d3.max(allX);
            // Set domain with padding
            const xPadding = (maxX - minX) * 0.1;
            chart.xScale.domain([
                Math.max(0, minX - xPadding), 
                maxX + xPadding
            ]);
            
            chart.xAxis
                .transition()
                .duration(chart.config.transitionDuration)
                .call(d3.svg.axis().scale(chart.xScale).orient("bottom"));
        }
        
        // Update Y domain if auto-scaling
        if (!chart.config.fixedYDomain) {
            // Add padding to Y domain
            const minY = Math.floor(d3.min(allY) - 2);
            const maxY = Math.ceil(d3.max(allY) + 2);
            chart.yScale.domain([minY, maxY]);
            
            chart.yAxis
                .transition()
                .duration(chart.config.transitionDuration)
                .call(d3.svg.axis().scale(chart.yScale).orient("left"));
        }
        
        // Update all series paths
        this.redrawChartPaths(chartId);
    },
    
    /**
     * Redraw all paths in a chart (typically after domain changes)
     * @param {string} chartId - ID of the chart to redraw
     */
    redrawChartPaths: function(chartId) {
        const chart = this.charts[chartId];
        if (!chart) return;
        
        // Line generator function - use d3.svg.line() for D3 v3
        const line = d3.svg.line()
            .x(function(d) { return chart.xScale(d.x); })
            .y(function(d) { return chart.yScale(d.y); })
            .interpolate("monotone"); // Use interpolate instead of curve in D3 v3
        
        // Update each series path
        for (let seriesId in chart.series) {
            const series = chart.series[seriesId];
            series.path
                .datum(chart.data[seriesId])
                .transition()
                .duration(chart.config.transitionDuration)
                .attr("d", line);
        }
    },
    
    /**
     * Reset data for a specific chart or series
     * @param {string} chartId - ID of the chart to reset
     * @param {string} [seriesId] - Optional: specific series to reset
     */
    resetData: function(chartId, seriesId) {
        const chart = this.charts[chartId];
        if (!chart) return;
        
        if (seriesId && chart.data[seriesId]) {
            // Reset specific series
            chart.data[seriesId] = [];
        } else {
            // Reset all series in chart
            for (let id in chart.data) {
                chart.data[id] = [];
            }
        }
        
        // Redraw chart
        this.redrawChartPaths(chartId);
    }
};

// Helper function to initialize life expectancy chart
function initCharts() {

    const initialAge = parseFloat(document.getElementById('age').value) || 25;
    // Create life expectancy chart
    DataViz.createTimeSeriesChart('lifeExpectancy', 'graphs', {
        title: "Life Expectancy Trend",
        xAxisLabel: "Age (Years)",
        yAxisLabel: "Life Expectancy (Years)",
        yDomain: [60, 90],
        xDomain: [initialAge, initialAge + 20],
        width: 380,
        height: 240,
        fixedYDomain: true,
        showLegend: true
    });
    
    // Add life expectancy series
    DataViz.addSeries('lifeExpectancy', 'expectancy', {
        label: "Life Expectancy",
        color: "#BB2117",
        strokeWidth: 3
    });

    // Add upper bound series
    DataViz.addSeries('lifeExpectancy', 'upperBound', {
        label: "Upper Bound",
        color: "#5CB85C",  // Green color for upper bound
        strokeWidth: 1.5,  // Thinner line for bounds
        dashArray: "5,5"   // Dashed line for bounds
    });
    
    // Add lower bound series
    DataViz.addSeries('lifeExpectancy', 'lowerBound', {
        label: "Lower Bound",
        color: "#F0AD4E",  // Orange/amber color for lower bound
        strokeWidth: 1.5,  // Thinner line for bounds
        dashArray: "5,5"   // Dashed line for bounds
    });
}

// Function to update life expectancy chart
function updateLifeExpectancyChart(currentAge, lifeExpectancy) {
    // Add the current calculation of upper and lower bounds
    const baseLifeExpectancy = 83;
    const upperBound = baseLifeExpectancy + 7;  // Non-smokers upper bound (90)
    const lowerBound = Math.max(60, currentAge); // Minimum life expectancy
    
    // Update all three series
    DataViz.updateChart('lifeExpectancy', 'expectancy', currentAge, lifeExpectancy);
    DataViz.updateChart('lifeExpectancy', 'upperBound', currentAge, upperBound);
    DataViz.updateChart('lifeExpectancy', 'lowerBound', currentAge, lowerBound);
}

// Export functions to be used in main script
window.DataViz = DataViz;
window.initCharts = initCharts;
window.updateLifeExpectancyChart = updateLifeExpectancyChart;